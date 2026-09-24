'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from './CartProvider';
import { createClient } from '@/lib/supabase/client';
import { tl } from '@/lib/format';

export default function CheckoutForm({ email, profile, shippingFee, freeLimit, iyzico, initialError }) {
  const { items, subtotal, clear, ready } = useCart();
  const router = useRouter();
  const [f, setF] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '', city: '', district: '', address: '', zip: '', note: '' });
  const [payment, setPayment] = useState(iyzico ? 'iyzico' : 'havale');
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [accept, setAccept] = useState(false);
  const [err, setErr] = useState(initialError ? decodeURIComponent(initialError) : '');
  const [busy, setBusy] = useState(false);

  const afterDiscount = subtotal - discount;
  const shipping = afterDiscount >= freeLimit ? 0 : shippingFee;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function kuponUygula() {
    setCouponMsg('');
    if (!coupon.trim()) return;
    const { data, error } = await createClient().rpc('check_coupon', { p_code: coupon, p_subtotal: subtotal });
    if (error || !data?.ok) { setDiscount(0); return setCouponMsg(data?.message || 'Kupon kontrol edilemedi'); }
    setDiscount(Number(data.discount));
    setCouponMsg(`Kupon uygulandı: -${tl(data.discount)}`);
  }

  async function gonder(e) {
    e.preventDefault();
    setErr('');
    for (const [k, ad] of [['full_name', 'Ad soyad'], ['phone', 'Telefon'], ['city', 'İl'], ['district', 'İlçe'], ['address', 'Adres']])
      if (!f[k].trim()) return setErr(`${ad} alanını doldurun.`);
    if (!/^[0-9 +()-]{10,}$/.test(f.phone)) return setErr('Geçerli bir telefon numarası girin.');
    if (!accept) return setErr('Devam etmek için sözleşmeleri onaylayın.');
    setBusy(true);
    const res = await fetch('/api/siparis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, unit: i.unit, personalization: i.personalization })),
        address: { full_name: f.full_name, phone: f.phone, city: f.city, district: f.district, address: f.address, zip: f.zip },
        payment, coupon: discount > 0 ? coupon : null, note: f.note,
      }),
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
      <h1 className="text-2xl font-bold">Sepetiniz boş</h1>
      {err && <p className="hata mx-auto mt-4 max-w-md">{err}</p>}
      <Link href="/baski-urunleri" className="btn-ana mt-6">Alışverişe başla</Link>
    </div>
  );

  return (
    <form onSubmit={gonder} className="kap grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Ödeme</h1>
        <section className="kutu space-y-4 p-6">
          <h2 className="font-sans text-lg font-semibold">Teslimat adresi</h2>
          <p className="soluk text-sm">Sipariş bilgileri {email} adresine gönderilecek.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="etiket" htmlFor="ad">Ad soyad</label><input id="ad" className="girdi" value={f.full_name} onChange={set('full_name')} autoComplete="name" /></div>
            <div><label className="etiket" htmlFor="tel">Telefon</label><input id="tel" className="girdi" value={f.phone} onChange={set('phone')} placeholder="05xx xxx xx xx" autoComplete="tel" /></div>
            <div><label className="etiket" htmlFor="il">İl</label><input id="il" className="girdi" value={f.city} onChange={set('city')} autoComplete="address-level1" /></div>
            <div><label className="etiket" htmlFor="ilce">İlçe</label><input id="ilce" className="girdi" value={f.district} onChange={set('district')} autoComplete="address-level2" /></div>
          </div>
          <div><label className="etiket" htmlFor="adres">Açık adres</label><textarea id="adres" rows={3} className="girdi" value={f.address} onChange={set('address')} autoComplete="street-address" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="etiket" htmlFor="pk">Posta kodu (isteğe bağlı)</label><input id="pk" className="girdi" value={f.zip} onChange={set('zip')} autoComplete="postal-code" /></div>
          </div>
          <div><label className="etiket" htmlFor="not">Sipariş notu (isteğe bağlı)</label><textarea id="not" rows={2} className="girdi" value={f.note} onChange={set('note')} placeholder="Yedek parça siparişlerinde cihaz modelini yazabilirsiniz" /></div>
        </section>

        <section className="kutu space-y-3 p-6">
          <h2 className="font-sans text-lg font-semibold">Ödeme yöntemi</h2>
          {iyzico && (
            <label className={`flex cursor-pointer gap-3 rounded-md border p-4 ${payment === 'iyzico' ? 'border-nozul-500 bg-nozul-50 dark:bg-nozul-700/20' : 'border-lacivert-200 dark:border-lacivert-600'}`}>
              <input type="radio" name="pay" checked={payment === 'iyzico'} onChange={() => setPayment('iyzico')} className="accent-nozul-500" />
              <span><b>Kredi / banka kartı</b><br /><span className="soluk text-sm">iyzico güvenli ödeme sayfasına yönlendirilirsiniz.</span></span>
            </label>
          )}
          <label className={`flex cursor-pointer gap-3 rounded-md border p-4 ${payment === 'havale' ? 'border-nozul-500 bg-nozul-50 dark:bg-nozul-700/20' : 'border-lacivert-200 dark:border-lacivert-600'}`}>
            <input type="radio" name="pay" checked={payment === 'havale'} onChange={() => setPayment('havale')} className="accent-nozul-500" />
            <span><b>Havale / EFT</b><br /><span className="soluk text-sm">Banka bilgilerimiz sipariş sonrası gösterilir ve e-posta ile gönderilir. Ödemeniz ulaştığında siparişiniz hazırlanır.</span></span>
          </label>
        </section>
      </div>

      <aside className="kutu h-fit space-y-4 p-6 lg:sticky lg:top-24">
        <h2 className="font-sans text-lg font-semibold">Sipariş özeti</h2>
        <ul className="space-y-2 text-sm">
          {items.map((i, n) => (
            <li key={n} className="flex justify-between gap-3"><span>{i.quantity} x {i.name}{i.unit === 'paket' ? ' (paket)' : ''}</span><span>{tl(i.price * i.quantity)}</span></li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Kupon kodu" aria-label="Kupon kodu" className="girdi" />
          <button type="button" onClick={kuponUygula} className="btn-cizgi">Uygula</button>
        </div>
        {couponMsg && <p className={discount > 0 ? 'basari' : 'hata'}>{couponMsg}</p>}
        <div className="space-y-1.5 border-t border-lacivert-100 pt-4 text-sm dark:border-lacivert-800">
          <div className="flex justify-between"><span>Ara toplam</span><span>{tl(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-emerald-700 dark:text-emerald-300"><span>İndirim</span><span>-{tl(discount)}</span></div>}
          <div className="flex justify-between"><span>Kargo</span><span>{shipping ? tl(shipping) : 'Ücretsiz'}</span></div>
          {shipping > 0 && <p className="soluk text-xs">{tl(freeLimit - afterDiscount)} daha ekleyin, kargo ücretsiz olsun.</p>}
          <div className="flex justify-between pt-2 text-base font-bold"><span>Toplam</span><span>{tl(afterDiscount + shipping)}</span></div>
        </div>
        <label className="flex gap-2 text-sm leading-6">
          <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-1.5 accent-nozul-500" />
          <span><Link href="/mesafeli-satis-sozlesmesi" target="_blank" className="underline">Mesafeli satış sözleşmesini</Link> ve <Link href="/kvkk" target="_blank" className="underline">KVKK aydınlatma metnini</Link> okudum, onaylıyorum.</span>
        </label>
        {err && <p className="hata">{err}</p>}
        <button disabled={busy} className="btn-ana w-full">{busy ? 'Sipariş oluşturuluyor…' : payment === 'iyzico' ? 'Ödemeye geç' : 'Siparişi tamamla'}</button>
      </aside>
    </form>
  );
}
