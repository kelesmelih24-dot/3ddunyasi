'use client';
import { useState } from 'react';
import Link from 'next/link';
import Turnstile from './Turnstile';

export default function NewsletterForm({ koyu = false }) {
  const [email, setEmail] = useState('');
  const [onay, setOnay] = useState(false);
  const [durum, setDurum] = useState({ t: '', m: '' });
  const [token, setToken] = useState('');
  async function gonder(e) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setDurum({ t: 'hata', m: 'Geçerli bir e-posta adresi girin.' });
    if (!onay) return setDurum({ t: 'hata', m: 'Devam etmek için onay kutusunu işaretleyin.' });
    setDurum({ t: 'bekle', m: '' });
    const r = await fetch('/api/form', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tur: 'bulten', veri: { email }, token, tuzak: e.target.elements.website?.value }) });
    const d = await r.json();
    const error = r.ok ? null : { message: d.error };
    if (error) return setDurum({ t: 'hata', m: error.message || 'Kaydedilemedi, lütfen tekrar deneyin.' });
    setEmail('');
    setDurum({ t: 'tamam', m: 'Harika! Açılışı ve kampanyaları ilk siz duyacaksınız.' });
  }
  const yazi = koyu ? 'text-white/75' : 'soluk';
  return (
    <form onSubmit={gonder} noValidate className="w-full">
      <div className={`flex gap-2 rounded-full p-1.5 ${koyu ? 'bg-white/10 ring-1 ring-white/20' : 'bg-lacivert-50 ring-1 ring-lacivert-100 dark:bg-lacivert-900 dark:ring-lacivert-800'}`}>
        <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setDurum({ t: '', m: '' }); }} placeholder="E-posta adresiniz" aria-label="E-posta adresiniz"
          className={`min-w-0 flex-1 bg-transparent px-4 text-sm focus:outline-none ${koyu ? 'text-white placeholder:text-white/60' : 'placeholder:text-lacivert-400'}`} />
        <button disabled={durum.t === 'bekle'} className="btn-ana shrink-0 px-5">{durum.t === 'bekle' ? 'Kaydediliyor' : 'Haber ver'}</button>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {onay && <Turnstile onToken={setToken} className="mt-3" />}
      <label className={`mt-3 flex items-start gap-2 text-xs leading-5 ${yazi}`}>
        <input type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} className="mt-0.5 accent-nozul-500" />
        <span>Kampanya ve duyuru e-postaları almayı kabul ediyorum. <Link href="/kvkk" className="underline">KVKK metni</Link></span>
      </label>
      {durum.m && <p className={`mt-2 text-sm font-semibold ${durum.t === 'hata' ? 'text-red-400' : koyu ? 'text-white' : 'text-emerald-700 dark:text-emerald-300'}`} role="status">{durum.m}</p>}
    </form>
  );
}
