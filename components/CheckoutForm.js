'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, siparisKalemleri } from './CartProvider';
import { createClient } from '@/lib/supabase/client';
import { tl } from '@/lib/format';

const BOS_ADRES = { full_name: '', phone: '', city: '', district: '', address: '', zip: '' };

export default function CheckoutForm({ email, profile, adresler, info, iyzico, initialError }) {
  const { items, subtotal, clear, ready } = useCart();
  const router = useRouter();
  const varsayilan = adresler[0];
  const [adresSec, setAdresSec] = useState(varsayilan ? varsayilan.id : 'yeni');
  const [f, setF] = useState(varsayilan ? { ...varsayilan } : { ...BOS_ADRES, full_name: profile?.full_name || '', phone: profile?.phone || '' });
  const [kaydet, setKaydet] = useState(!adresler.length);
  const [baslik, setBaslik] = useState('Ev');
  const [not, setNot] = useState('');
  const [teslimat, setTeslimat] = useState('kargo');
  const [paket, setPaket] = useState(false);
  const [paketNot, setPaketNot] = useState('');
  const [puan, setPuan] = useState(false);
  const [kupon, setKupon] = useState(''); const [kuponUygula, setKuponUygula] = useState('');
  const [cek, setCek] = useState(''); const [cekUygula, setCekUygula] = useState('');
  const [payment, setPayment] = useState(iyzico ? 'iyzico' : 'havale');
  const [ozet, setOzet] = useState(null);
  const [ozetHata, setOzetHata] = useState('');
  const [accept, setAccept] = useState(false);
  const [err, setErr] = useState(initialError ? decodeURIComponent(initialError) : '');
  const [busy, setBusy] = useState(false);
  const ankara = f.city.trim().toLocaleLowerCase('tr-TR') === 'ankara';

  useEffect(() => { if (teslimat === 'elden' && !ankara) setTeslimat('kargo'); }, [ankara, teslimat]);
  const adresDegis = (id) => {
    setAdresSec(id);
    if (id === 'yeni') setF({ ...BOS_ADRES, full_name: profile?.full_name || '', phone: profile?.phone || '' });
    else setF({ ...adresler.find((a) => a.id === id) });
  };
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr(''); };

  // Tutarlar sunucudaki sipariş hesabıyla birebir aynı fonksiyondan gelir
  useEffect(() => {
    if (!ready || !items.length) return;
    const t = setTimeout(async () => {
      const { data, error } = await createClient().rpc('preview_order', {
        p_items: siparisKalemleri(items), p_address: { city: f.city }, p_coupon: kuponUygula || null,
        p_delivery: teslimat, p_gift_wrap: paket, p_use_points: puan, p_gift_code: cekUygula || null,
      });
      if (error || !data?.ok) { setOzetHata(data?.message || 'Tutar hesaplanamadı'); return; }
      setOzetHata(''); setOzet(data);
    }, 300);
    return () => clearTimeout(t);
  }, [items, ready, f.city, kuponUygula, teslimat, paket, puan, cekUygula]);

  const kuponHatasi = ozetHata && kuponUygula && /kupon/i.test(ozetHata);
  const cekHatasi = ozetHata && cekUygula && /çek/i.test(ozetHata);

  async function gonder(e) {
    e.preventDefault();
    setErr('');
    for (const [k, ad] of [['full_name', 'Ad soyad'], ['phone', 'Telefon'], ['city', 'İl'], ['district', 'İlçe'], ['address', 'Adres']])
      if (!String(f[k] || '').trim()) return setErr(`${ad} alanını doldurun.`);
    if (!/^[0-9 +()-]{10,}$/.test(f.phone)) return setErr('Geçerli bir telefon numarası girin.');
    if (ozetHata) return setErr(ozetHata);
    if (!accept) return setErr('Devam etmek için sözleşmeleri onaylayın.');
    setBusy(true);
    const adres = { full_name: f.full_name, phone: f.phone, city: f.city, district: f.district, address: f.address, zip: f.zip };
    if (adresSec === 'yeni' && kaydet) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('addresses').insert({ ...adres, user_id: user.id, title: baslik || 'Adresim', is_default: !adresler.length });
    }
    const res = await fetch('/api/siparis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: siparisKalemleri(items), address: adres, payment: ozet?.total === 0 ? 'havale' : payment, coupon: kuponUygula || null, note: not,
        delivery: teslimat, gift_wrap: paket, gift_note: paketNot, use_points: puan, gift_code: cekUygula || null }),
    });
    const data = await res.json();
    if (!res.ok) { setBusy(false); return setErr(data.error || 'Sipariş oluşturulamadı.'); }
    clear();
    if (data.paymentPageUrl) window.location.href = data.paymentPageUrl;
    else router.push(`/odeme/basarili?no=${data.order_no}`);
  }

  if (!ready) return <div className="kap py-16" />;
  if (!items.length) return (
    <div className="kap py-20 text-center">
      <h1 className="text-2xl font-semibold">Sepetiniz boş</h1>
      {err && <p className="hata mx-auto mt-4 max-w-md">{err}</p>}
      <Link href="/baski-urunleri" className="btn-ana mt-6">Alışverişe başla</Link>
    </div>
  );

  const Secenek = ({ ad, deger, secili, onSec, baslik, aciklama, ek, pasif }) => (
    <label className={`flex gap-3 rounded-2xl border p-4 ${pasif ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${secili ? 'border-nozul-500 bg-nozul-50 dark:bg-nozul-700/20' : 'border-lacivert-200 dark:border-lacivert-600'}`}>
      <input type="radio" name={ad} checked={secili} disabled={pasif} onChange={() => onSec(deger)} className="mt-1 accent-nozul-500" />
      <span className="flex-1"><b>{baslik}</b>{ek && <span className="float-right text-sm font-semibold">{ek}</span>}<br /><span className="soluk text-sm">{aciklama}</span></span>
    </label>
  );

  return (
    <form onSubmit={gonder} className="kap grid gap-8 py-10 lg:grid-cols-[1fr_380px]" noValidate>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Ödeme</h1>

        <section className="kutu space-y-4 p-6">
          <h2 className="font-sans text-lg font-semibold">Teslimat adresi</h2>
          {adresler.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {adresler.map((a) => (
                <button type="button" key={a.id} onClick={() => adresDegis(a.id)} className={`rounded-2xl border px-4 py-2 text-left text-sm ${adresSec === a.id ? 'border-nozul-500 bg-nozul-50 dark:bg-nozul-700/20' : 'border-lacivert-200 dark:border-lacivert-600'}`}>
                  <b>{a.title}</b><br /><span className="soluk">{a.district} / {a.city}</span>
                </button>
              ))}
              <button type="button" onClick={() => adresDegis('yeni')} className={`rounded-2xl border border-dashed px-4 py-2 text-sm ${adresSec === 'yeni' ? 'border-nozul-500' : 'border-lacivert-200 dark:border-lacivert-600'}`}>+ Yeni adres</button>
            </div>
          )}
          <p className="soluk text-sm">Sipariş bilgileri {email} adresine gönderilecek.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="etiket" htmlFor="ad">Ad soyad</label><input id="ad" className="girdi" value={f.full_name} onChange={set('full_name')} autoComplete="name" /></div>
            <div><label className="etiket" htmlFor="tel">Telefon</label><input id="tel" className="girdi" value={f.phone} onChange={set('phone')} placeholder="05xx xxx xx xx" autoComplete="tel" /></div>
            <div><label className="etiket" htmlFor="il">İl</label><input id="il" className="girdi" value={f.city} onChange={set('city')} autoComplete="address-level1" /></div>
            <div><label className="etiket" htmlFor="ilce">İlçe</label><input id="ilce" className="girdi" value={f.district} onChange={set('district')} autoComplete="address-level2" /></div>
          </div>
          <div><label className="etiket" htmlFor="adres">Açık adres</label><textarea id="adres" rows={3} className="girdi" value={f.address} onChange={set('address')} autoComplete="street-address" /></div>
          {adresSec === 'yeni' && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={kaydet} onChange={(e) => setKaydet(e.target.checked)} className="accent-nozul-500" /> Bu adresi kaydet</label>
              {kaydet && <input value={baslik} onChange={(e) => setBaslik(e.target.value)} className="girdi w-40 py-1.5" aria-label="Adres başlığı" placeholder="Ev, İş…" />}
            </div>
          )}
          <div><label className="etiket" htmlFor="not">Sipariş notu (isteğe bağlı)</label><textarea id="not" rows={2} className="girdi" value={not} onChange={(e) => setNot(e.target.value)} placeholder="Yedek parça siparişlerinde cihaz modelini yazabilirsiniz" /></div>
        </section>

        <section className="kutu space-y-3 p-6">
          <h2 className="font-sans text-lg font-semibold">Teslimat şekli</h2>
          <Secenek ad="teslimat" deger="kargo" secili={teslimat === 'kargo'} onSec={setTeslimat} baslik="Kargo ile gönderim" aciklama="Türkiye'nin her yerine" />
          <Secenek ad="teslimat" deger="elden" secili={teslimat === 'elden'} onSec={setTeslimat} baslik="Ankara içi elden teslim" ek={tl(info.local_delivery_fee)} pasif={!ankara}
            aciklama={ankara ? 'Adresinize elden getiriyoruz' : 'Sadece il "Ankara" olduğunda seçilebilir'} />
          <Secenek ad="teslimat" deger="gel_al" secili={teslimat === 'gel_al'} onSec={setTeslimat} baslik="Atölyeden gel-al" ek="Ücretsiz" aciklama={info.pickup_address} />
        </section>

        <section className="kutu space-y-3 p-6">
          <h2 className="font-sans text-lg font-semibold">Hediye mi?</h2>
          <label className="flex items-center gap-2"><input type="checkbox" checked={paket} onChange={(e) => setPaket(e.target.checked)} className="accent-nozul-500" /> Hediye paketi yapılsın <span className="soluk">(+{tl(info.gift_wrap_fee)})</span></label>
          {paket && <textarea rows={2} maxLength={200} value={paketNot} onChange={(e) => setPaketNot(e.target.value)} className="girdi" placeholder="Pakete eklenecek not kartı (isteğe bağlı)" aria-label="Hediye notu" />}
          <p className="soluk text-xs">Hediye paketli siparişlerde faturada fiyat bilgisi gizlenir.</p>
        </section>

        <section className="kutu space-y-3 p-6">
          <h2 className="font-sans text-lg font-semibold">Ödeme yöntemi</h2>
          {iyzico && <Secenek ad="pay" deger="iyzico" secili={payment === 'iyzico'} onSec={setPayment} baslik="Kredi / banka kartı" aciklama="iyzico güvenli ödeme sayfasına yönlendirilirsiniz." />}
          <Secenek ad="pay" deger="havale" secili={payment === 'havale'} onSec={setPayment} baslik="Havale / EFT" aciklama="Banka bilgilerimiz sipariş sonrası gösterilir ve e-posta ile gönderilir." />
        </section>
      </div>

      <aside className="kutu h-fit space-y-4 p-6 lg:sticky lg:top-24">
        <h2 className="font-sans text-lg font-semibold">Sipariş özeti</h2>
        <ul className="space-y-2 text-sm">
          {items.map((i, n) => <li key={n} className="flex justify-between gap-3"><span>{i.quantity} × {i.name}{i.unit === 'paket' ? ' (paket)' : ''}</span><span>{tl(i.price * i.quantity)}</span></li>)}
        </ul>

        {info.first_order && !kuponUygula && Number(info.first_order_pct) > 0 && (
          <p className="rounded-xl bg-nozul-50 px-3 py-2 text-sm font-semibold text-nozul-700 dark:bg-nozul-700/20 dark:text-nozul-100">🎉 İlk siparişinize özel %{Number(info.first_order_pct)} indirim uygulandı</p>
        )}

        <div className="flex gap-2">
          <input value={kupon} onChange={(e) => setKupon(e.target.value.toUpperCase())} placeholder="Kupon kodu" aria-label="Kupon kodu" className="girdi" />
          {kuponUygula ? <button type="button" onClick={() => { setKupon(''); setKuponUygula(''); }} className="btn-cizgi">Kaldır</button>
            : <button type="button" onClick={() => setKuponUygula(kupon.trim())} className="btn-cizgi">Uygula</button>}
        </div>
        {kuponUygula && <p className={kuponHatasi ? 'hata' : 'basari'}>{kuponHatasi ? ozetHata : 'Kupon uygulandı'}{info.first_order && !kuponHatasi ? ' (ilk sipariş indirimi yerine)' : ''}</p>}

        <div className="flex gap-2">
          <input value={cek} onChange={(e) => setCek(e.target.value.toUpperCase())} placeholder="Hediye çeki kodu" aria-label="Hediye çeki kodu" className="girdi" />
          {cekUygula ? <button type="button" onClick={() => { setCek(''); setCekUygula(''); }} className="btn-cizgi">Kaldır</button>
            : <button type="button" onClick={() => setCekUygula(cek.trim())} className="btn-cizgi">Kullan</button>}
        </div>
        {cekHatasi && <p className="hata">{ozetHata}</p>}

        {Number(info.points) > 0 && (
          <label className="flex items-center justify-between gap-2 rounded-xl bg-krem px-3 py-2.5 text-sm dark:bg-lacivert-800">
            <span><input type="checkbox" checked={puan} onChange={(e) => setPuan(e.target.checked)} className="mr-2 accent-nozul-500" />Puanlarımı kullan</span>
            <b>{Number(info.points).toLocaleString('tr-TR')} puan = {tl(info.points)}</b>
          </label>
        )}

        <div className="space-y-1.5 border-t border-lacivert-100 pt-4 text-sm dark:border-lacivert-800">
          {ozet ? <>
            <div className="flex justify-between"><span>Ara toplam</span><span>{tl(ozet.subtotal)}</span></div>
            {ozet.promo > 0 && <div className="flex justify-between text-emerald-700 dark:text-emerald-300"><span>Kampanya</span><span>-{tl(ozet.promo)}</span></div>}
            {ozet.first_order > 0 && <div className="flex justify-between text-emerald-700 dark:text-emerald-300"><span>İlk sipariş indirimi</span><span>-{tl(ozet.first_order)}</span></div>}
            {ozet.coupon > 0 && <div className="flex justify-between text-emerald-700 dark:text-emerald-300"><span>Kupon</span><span>-{tl(ozet.coupon)}</span></div>}
            <div className="flex justify-between"><span>{teslimat === 'kargo' ? 'Kargo' : teslimat === 'elden' ? 'Elden teslim' : 'Gel-al'}</span><span>{ozet.shipping > 0 ? tl(ozet.shipping) : 'Ücretsiz'}</span></div>
            {ozet.gift_wrap > 0 && <div className="flex justify-between"><span>Hediye paketi</span><span>{tl(ozet.gift_wrap)}</span></div>}
            {ozet.points > 0 && <div className="flex justify-between text-emerald-700 dark:text-emerald-300"><span>Puan</span><span>-{tl(ozet.points)}</span></div>}
            {ozet.gift_card > 0 && <div className="flex justify-between text-emerald-700 dark:text-emerald-300"><span>Hediye çeki</span><span>-{tl(ozet.gift_card)}</span></div>}
            <div className="flex justify-between pt-2 text-base font-bold"><span>Ödenecek</span><span>{tl(ozet.total)}</span></div>
            {Number(info.loyalty_pct) > 0 && <p className="soluk pt-1 text-xs">Teslimattan sonra yaklaşık <b>{Math.floor((ozet.total - ozet.shipping - ozet.gift_wrap) * info.loyalty_pct / 100)}</b> puan kazanacaksınız.</p>}
          </> : <p className="soluk">{ozetHata && !kuponHatasi && !cekHatasi ? ozetHata : `Hesaplanıyor… (ara toplam ${tl(subtotal)})`}</p>}
        </div>

        <label className="flex gap-2 text-sm leading-6">
          <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-1.5 accent-nozul-500" />
          <span><Link href="/mesafeli-satis-sozlesmesi" target="_blank" className="underline">Mesafeli satış sözleşmesini</Link> ve <Link href="/kvkk" target="_blank" className="underline">KVKK aydınlatma metnini</Link> okudum, onaylıyorum.</span>
        </label>
        {err && <p className="hata">{err}</p>}
        <button disabled={busy || !ozet} className="btn-ana w-full py-3">{busy ? 'Sipariş oluşturuluyor…' : ozet?.total === 0 ? 'Siparişi tamamla' : payment === 'iyzico' ? 'Ödemeye geç' : 'Siparişi tamamla'}</button>
      </aside>
    </form>
  );
}
