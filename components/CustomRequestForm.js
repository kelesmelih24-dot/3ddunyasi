'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { modelOlc, tahminiFiyat } from '@/lib/model3d';
import { tl } from '@/lib/format';
import ModelViewer from './ModelViewer';

const MAX = 50 * 1024 * 1024;
const RENK_KOD = { beyaz: '#F4F4F2', siyah: '#1E1E22', gri: '#8A8F98', kırmızı: '#D23B32', mavi: '#2F5DC8', turuncu: '#E8620C', yeşil: '#2E9A55', sarı: '#F2C230', mor: '#7B4BC9', pembe: '#E86FA4' };

export default function CustomRequestForm({ userId, email, name, phone, pricing }) {
  const [kind, setKind] = useState('stl');
  const [f, setF] = useState({ full_name: name || '', phone: phone || '', description: '', personalization_text: '', quantity: 1 });
  const [secim, setSecim] = useState({ malzeme: pricing.malzemeler[0]?.ad, renk: pricing.renkler[0], doluluk: 20, kalite: pricing.kaliteler[Math.min(1, pricing.kaliteler.length - 1)]?.ad, olcek: 100 });
  const [file, setFile] = useState(null);
  const [buf, setBuf] = useState(null);
  const [olcum, setOlcum] = useState(null);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr(''); };
  const setS = (k, v) => setSecim({ ...secim, [k]: v });
  const uzanti = file?.name.split('.').pop().toLowerCase();

  const tahmin = useMemo(() => olcum && tahminiFiyat({
    hacimCm3: olcum.hacimCm3, olcek: secim.olcek, dolulukYuzde: secim.doluluk, adet: Number(f.quantity) || 1,
    malzeme: pricing.malzemeler.find((m) => m.ad === secim.malzeme), kalite: pricing.kaliteler.find((k) => k.ad === secim.kalite),
  }, pricing), [olcum, secim, f.quantity, pricing]);

  async function dosyaSec(e) {
    const d = e.target.files?.[0];
    setErr(''); setOlcum(null); setBuf(null); setFile(d || null);
    if (!d) return;
    const u = d.name.split('.').pop().toLowerCase();
    if (!['stl', '3mf', 'obj', 'step', 'stp'].includes(u)) return setErr('Desteklenen dosya türleri: STL, 3MF, OBJ, STEP.');
    if (d.size > MAX) return setErr('Dosya en fazla 50 MB olabilir.');
    if (['stl', 'obj'].includes(u)) {
      try { const b = await d.arrayBuffer(); setBuf(b); setOlcum(modelOlc(b, u)); }
      catch { setErr('Model okunamadı; yine de gönderebilirsiniz, fiyatı biz hesaplarız.'); }
    }
  }

  async function gonder(e) {
    e.preventDefault();
    if (!f.full_name.trim()) return setErr('Adınızı girin.');
    if (f.description.trim().length < 10) return setErr('Talebinizi en az 10 karakterle açıklayın.');
    if (kind === 'stl' && !file) return setErr('Bir 3D model dosyası seçin.');
    if (kind === 'yazi' && !f.personalization_text.trim()) return setErr('Ürüne yazılacak metni girin.');
    setBusy(true);
    const supabase = createClient();
    let file_path = null;
    if (kind === 'stl' && file) {
      file_path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error } = await supabase.storage.from('ozel-siparis').upload(file_path, file);
      if (error) { setBusy(false); return setErr('Dosya yüklenemedi, tekrar deneyin.'); }
    }
    const kalite = pricing.kaliteler.find((k) => k.ad === secim.kalite);
    const { data, error } = await supabase.from('custom_requests').insert({
      user_id: userId, kind, email, full_name: f.full_name, phone: f.phone, description: f.description,
      personalization_text: kind === 'yazi' ? f.personalization_text : null, file_path, quantity: Number(f.quantity) || 1,
      material: secim.malzeme, color: secim.renk, infill: secim.doluluk, layer_height: kalite?.katman, scale: secim.olcek,
      volume_cm3: olcum ? +(olcum.hacimCm3 * (secim.olcek / 100) ** 3).toFixed(2) : null,
      dims: olcum ? olcum.olcu.map((x) => (x * secim.olcek / 100).toFixed(1)).join(' × ') + ' mm' : null,
      estimate_price: tahmin?.toplam ?? null,
    }).select('id').single();
    if (error) { setBusy(false); return setErr('Talep kaydedilemedi, tekrar deneyin.'); }
    fetch('/api/ozel-talep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: data.id }) });
    setDone(true);
  }

  if (done) return (
    <div className="kutu max-w-xl p-8">
      <p className="text-lg font-semibold">Talebiniz alındı 🎉</p>
      <p className="soluk mt-2">İnceleyip kesin teklifimizi hesabınıza göndereceğiz; {email} adresine de haber vereceğiz.</p>
      <Link href="/hesabim/talepler" className="btn-koyu mt-5">Taleplerime git</Link>
    </div>
  );

  const Secim = ({ ad, deger, secenekler, k }) => (
    <fieldset>
      <legend className="etiket">{ad}</legend>
      <div className="flex flex-wrap gap-2">
        {secenekler.map((s) => (
          <button type="button" key={s} onClick={() => setS(k, s)} aria-pressed={deger === s}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${deger === s ? 'border-nozul-500 bg-nozul-500 text-white' : 'border-lacivert-200 hover:border-lacivert-800 dark:border-lacivert-600'}`}>{s}</button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <form onSubmit={gonder} noValidate className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-2">
          {[['stl', 'Dosyamı bastırmak istiyorum', 'STL, OBJ, 3MF veya STEP'], ['yazi', 'Ürüne yazı eklensin', 'İsim, tarih, kısa mesaj']].map(([v, t, d]) => (
            <label key={v} className={`cursor-pointer rounded-2xl border p-4 ${kind === v ? 'border-nozul-500 bg-nozul-50 dark:bg-nozul-700/20' : 'border-lacivert-200 dark:border-lacivert-600'}`}>
              <input type="radio" name="kind" className="sr-only" checked={kind === v} onChange={() => { setKind(v); setErr(''); }} />
              <span className="block text-sm font-semibold">{t}</span><span className="soluk text-xs">{d}</span>
            </label>
          ))}
        </div>

        {kind === 'stl' ? (
          <>
            <label className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-colors ${file ? 'border-nozul-500 bg-nozul-50 dark:bg-nozul-700/10' : 'border-lacivert-200 hover:border-nozul-500 dark:border-lacivert-600'}`}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E8620C" strokeWidth="1.8" strokeLinecap="round"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
              <span className="mt-3 font-semibold">{file ? file.name : '3D model dosyanızı seçin'}</span>
              <span className="soluk mt-1 text-xs">STL ve OBJ'de anında fiyat · en fazla 50 MB</span>
              <input type="file" accept=".stl,.3mf,.obj,.step,.stp" onChange={dosyaSec} className="sr-only" />
            </label>
            {buf && <ModelViewer buffer={buf} tur={uzanti} renk={RENK_KOD[secim.renk?.toLocaleLowerCase('tr-TR')] || '#E8620C'} className="h-80" />}
            {olcum && <p className="soluk text-sm">Model: {olcum.olcu.map((x) => (x * secim.olcek / 100).toFixed(1)).join(' × ')} mm · {(olcum.hacimCm3 * (secim.olcek / 100) ** 3).toFixed(1)} cm³</p>}
          </>
        ) : (
          <div><label htmlFor="yazi" className="etiket">Ürüne yazılacak metin</label><input id="yazi" maxLength={60} className="girdi" value={f.personalization_text} onChange={set('personalization_text')} placeholder="Örnek: Mutlu yıllar Ayşe" /></div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="ad" className="etiket">Ad soyad</label><input id="ad" className="girdi" value={f.full_name} onChange={set('full_name')} /></div>
          <div><label htmlFor="tel" className="etiket">Telefon (isteğe bağlı)</label><input id="tel" className="girdi" value={f.phone} onChange={set('phone')} /></div>
        </div>
        <div><label htmlFor="acik" className="etiket">Açıklama</label><textarea id="acik" rows={4} className="girdi" value={f.description} onChange={set('description')} placeholder="Kullanım amacı, dayanım beklentisi, ek istekleriniz" /></div>
      </div>

      <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="kutu space-y-5 p-6">
          <Secim ad="Malzeme" k="malzeme" deger={secim.malzeme} secenekler={pricing.malzemeler.map((m) => m.ad)} />
          <Secim ad="Renk" k="renk" deger={secim.renk} secenekler={pricing.renkler} />
          <Secim ad="Kalite" k="kalite" deger={secim.kalite} secenekler={pricing.kaliteler.map((k) => k.ad)} />
          <div>
            <label htmlFor="doluluk" className="etiket">Doluluk oranı: <b>%{secim.doluluk}</b> <span className="soluk font-normal">(yüksek = daha sağlam, daha pahalı)</span></label>
            <input id="doluluk" type="range" min={10} max={100} step={5} value={secim.doluluk} onChange={(e) => setS('doluluk', +e.target.value)} className="w-full accent-nozul-500" />
          </div>
          {kind === 'stl' && (
            <div>
              <label htmlFor="olcek" className="etiket">Ölçek: <b>%{secim.olcek}</b></label>
              <input id="olcek" type="range" min={25} max={300} step={5} value={secim.olcek} onChange={(e) => setS('olcek', +e.target.value)} className="w-full accent-nozul-500" />
            </div>
          )}
          <div className="max-w-[140px]"><label htmlFor="adet" className="etiket">Adet</label><input id="adet" type="number" min={1} className="girdi" value={f.quantity} onChange={set('quantity')} /></div>
        </div>

        <div className="rounded-3xl bg-lacivert-800 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-etiket text-nozul-300">Tahmini fiyat</p>
          {tahmin ? (
            <>
              <p className="mt-2 font-display text-4xl font-semibold">{tl(tahmin.toplam)}</p>
              <p className="mt-1 text-sm text-white/70">Yaklaşık {tahmin.gram} g malzeme · adet başı {tl(tahmin.birim)}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-white/80">{kind === 'stl' ? 'STL veya OBJ dosyası yüklediğinizde tahmini fiyat burada görünür.' : 'Yazılı ürünlerde fiyatı teklifimizde iletiyoruz.'}</p>
          )}
          <p className="mt-3 text-xs leading-5 text-white/60">Tahmindir; kesin fiyat destek yapısı ve baskı süresine göre teklifimizde netleşir. Teklifi onaylamadan ödeme yapmazsınız.</p>
          {err && <p className="mt-4 rounded-lg bg-red-500/20 px-3 py-2 text-sm">{err}</p>}
          <button disabled={busy} className="btn-ana mt-5 w-full py-3">{busy ? 'Gönderiliyor…' : 'Kesin teklif iste'}</button>
        </div>
      </div>
    </form>
  );
}
