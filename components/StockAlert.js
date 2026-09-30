'use client';
import { useState } from 'react';
import Turnstile from './Turnstile';

export default function StockAlert({ productId, email: varsayilan }) {
  const [email, setEmail] = useState(varsayilan || '');
  const [durum, setDurum] = useState('');
  const [token, setToken] = useState('');
  async function kaydet(e) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setDurum('hata:Geçerli bir e-posta adresi girin.');
    const r = await fetch('/api/form', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tur: 'stok', veri: { email, product_id: productId }, token, tuzak: e.target.elements.website?.value }) });
    if (!r.ok) return setDurum('hata:' + ((await r.json()).error || 'Kaydedilemedi, tekrar deneyin.'));
    setDurum('tamam');
  }
  if (durum === 'tamam') return <p className="basari">Tamam! Ürün stoğa girdiğinde {email} adresine haber vereceğiz.</p>;
  return (
    <form onSubmit={kaydet} className="rounded-2xl border border-lacivert-100 p-5 dark:border-lacivert-800">
      <p className="font-semibold">Bu ürün şu an satışta değil</p>
      <p className="soluk mt-1 text-sm">E-postanızı bırakın, stoğa girdiğinde ilk siz haberdar olun.</p>
      <div className="mt-3 flex gap-2">
        <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setDurum(''); }} placeholder="E-posta adresiniz" aria-label="E-posta adresiniz" className="girdi rounded-full" />
        <button className="btn-ana shrink-0">Haber ver</button>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {email && <Turnstile onToken={setToken} className="mt-3" />}
      {durum.startsWith('hata:') && <p className="hata mt-2">{durum.slice(5)}</p>}
    </form>
  );
}
