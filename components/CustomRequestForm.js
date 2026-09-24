'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const MAX = 50 * 1024 * 1024;

export default function CustomRequestForm({ userId, email, name, phone }) {
  const [kind, setKind] = useState('stl');
  const [f, setF] = useState({ full_name: name || '', phone: phone || '', description: '', personalization_text: '', quantity: 1 });
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr(''); };

  async function gonder(e) {
    e.preventDefault();
    if (!f.full_name.trim()) return setErr('Adınızı girin.');
    if (f.description.trim().length < 10) return setErr('Talebinizi en az 10 karakterle açıklayın.');
    if (kind === 'stl' && !file) return setErr('Bir STL, 3MF veya OBJ dosyası seçin.');
    if (kind === 'yazi' && !f.personalization_text.trim()) return setErr('Ürüne yazılacak metni girin.');
    if (file && !/\.(stl|3mf|obj|step|stp)$/i.test(file.name)) return setErr('Desteklenen dosya türleri: STL, 3MF, OBJ, STEP.');
    if (file && file.size > MAX) return setErr('Dosya en fazla 50 MB olabilir.');
    setBusy(true);
    const supabase = createClient();
    let file_path = null;
    if (kind === 'stl' && file) {
      file_path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error } = await supabase.storage.from('ozel-siparis').upload(file_path, file);
      if (error) { setBusy(false); return setErr('Dosya yüklenemedi, tekrar deneyin.'); }
    }
    const { data, error } = await supabase.from('custom_requests').insert({
      user_id: userId, kind, email, full_name: f.full_name, phone: f.phone, description: f.description,
      personalization_text: kind === 'yazi' ? f.personalization_text : null, file_path, quantity: Number(f.quantity) || 1,
    }).select('id').single();
    if (error) { setBusy(false); return setErr('Talep kaydedilemedi, tekrar deneyin.'); }
    fetch('/api/ozel-talep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: data.id }) });
    setDone(true);
  }

  if (done) return (
    <div className="kutu h-fit p-8">
      <p className="text-lg font-semibold">Talebiniz alındı</p>
      <p className="soluk mt-2">İnceleyip {email} adresine teklifimizi göndereceğiz. Durumunu Hesabım &gt; Özel taleplerim bölümünden takip edebilirsiniz.</p>
    </div>
  );

  return (
    <form onSubmit={gonder} className="kutu space-y-5 p-6 sm:p-8" noValidate>
      <fieldset>
        <legend className="etiket">Talep türü</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[['stl', 'Dosyamı bastırmak istiyorum', 'STL, 3MF, OBJ veya STEP'], ['yazi', 'Ürüne yazı eklensin', 'İsim, tarih, kısa mesaj']].map(([v, t, d]) => (
            <label key={v} className={`cursor-pointer rounded-md border p-3 ${kind === v ? 'border-nozul-500 bg-nozul-50 dark:bg-nozul-700/20' : 'border-lacivert-200 dark:border-lacivert-600'}`}>
              <input type="radio" name="kind" className="sr-only" checked={kind === v} onChange={() => { setKind(v); setErr(''); }} />
              <span className="block text-sm font-semibold">{t}</span><span className="soluk text-xs">{d}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="ad" className="etiket">Ad soyad</label><input id="ad" className="girdi" value={f.full_name} onChange={set('full_name')} /></div>
        <div><label htmlFor="tel" className="etiket">Telefon (isteğe bağlı)</label><input id="tel" className="girdi" value={f.phone} onChange={set('phone')} /></div>
      </div>
      {kind === 'stl' ? (
        <div>
          <label htmlFor="dosya" className="etiket">3D model dosyası</label>
          <input id="dosya" type="file" accept=".stl,.3mf,.obj,.step,.stp" onChange={(e) => { setFile(e.target.files?.[0] || null); setErr(''); }}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-lacivert-800 file:px-4 file:py-2 file:font-semibold file:text-white dark:file:bg-lacivert-100 dark:file:text-lacivert-900" />
          <p className="soluk mt-1 text-xs">En fazla 50 MB.</p>
        </div>
      ) : (
        <div><label htmlFor="yazi" className="etiket">Ürüne yazılacak metin</label><input id="yazi" maxLength={60} className="girdi" value={f.personalization_text} onChange={set('personalization_text')} placeholder="Örnek: Mutlu yıllar Ayşe" /></div>
      )}
      <div><label htmlFor="acik" className="etiket">Açıklama</label><textarea id="acik" rows={4} className="girdi" value={f.description} onChange={set('description')} placeholder="Ölçü, renk, malzeme tercihi ve kullanım amacı gibi detayları yazın" /></div>
      <div className="max-w-[140px]"><label htmlFor="adet" className="etiket">Adet</label><input id="adet" type="number" min={1} className="girdi" value={f.quantity} onChange={set('quantity')} /></div>
      {err && <p className="hata">{err}</p>}
      <button disabled={busy} className="btn-ana w-full">{busy ? 'Gönderiliyor…' : 'Teklif iste'}</button>
    </form>
  );
}
