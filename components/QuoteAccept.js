'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function QuoteAccept({ id, profile }) {
  const router = useRouter();
  const [f, setF] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '', city: '', district: '', address: '', zip: '' });
  const [onay, setOnay] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr(''); };
  async function gonder(e) {
    e.preventDefault();
    for (const [k, ad] of [['full_name', 'Ad soyad'], ['phone', 'Telefon'], ['city', 'İl'], ['district', 'İlçe'], ['address', 'Adres']])
      if (!f[k].trim()) return setErr(`${ad} alanını doldurun.`);
    if (!onay) return setErr('Devam etmek için sözleşmeleri onaylayın.');
    setBusy(true);
    const r = await fetch('/api/teklif-onay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, address: f }) });
    const d = await r.json();
    if (!r.ok) { setBusy(false); return setErr(d.error || 'Sipariş oluşturulamadı.'); }
    router.push(`/odeme/basarili?no=${d.order_no}`);
  }
  return (
    <form onSubmit={gonder} className="kutu mt-8 space-y-4 p-6" noValidate>
      <h2 className="font-sans text-lg font-semibold">Teslimat adresi</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="etiket" htmlFor="ad">Ad soyad</label><input id="ad" className="girdi" value={f.full_name} onChange={set('full_name')} autoComplete="name" /></div>
        <div><label className="etiket" htmlFor="tel">Telefon</label><input id="tel" className="girdi" value={f.phone} onChange={set('phone')} autoComplete="tel" /></div>
        <div><label className="etiket" htmlFor="il">İl</label><input id="il" className="girdi" value={f.city} onChange={set('city')} /></div>
        <div><label className="etiket" htmlFor="ilce">İlçe</label><input id="ilce" className="girdi" value={f.district} onChange={set('district')} /></div>
      </div>
      <div><label className="etiket" htmlFor="adres">Açık adres</label><textarea id="adres" rows={3} className="girdi" value={f.address} onChange={set('address')} /></div>
      <p className="soluk text-sm">Ödeme: Havale/EFT. Banka bilgilerimiz siparişten sonra gösterilir.</p>
      <label className="flex gap-2 text-sm leading-6">
        <input type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} className="mt-1.5 accent-nozul-500" />
        <span><Link href="/mesafeli-satis-sozlesmesi" target="_blank" className="underline">Mesafeli satış sözleşmesini</Link> okudum. Kişiye özel üretilen bu ürünün cayma hakkı kapsamında olmadığını biliyorum.</span>
      </label>
      {err && <p className="hata">{err}</p>}
      <button disabled={busy} className="btn-ana py-3">{busy ? 'Sipariş oluşturuluyor…' : 'Teklifi onayla ve sipariş ver'}</button>
    </form>
  );
}
