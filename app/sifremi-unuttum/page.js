'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Page() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  async function gonder(e) {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) return setErr('Geçerli bir e-posta adresi girin.');
    await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?sonra=/sifre-yenile` });
    setMsg('Bu adrese kayıtlı bir hesap varsa şifre yenileme bağlantısı gönderdik.');
  }
  return (
    <form onSubmit={gonder} className="kap max-w-md space-y-4 py-14">
      <h1 className="text-3xl font-semibold">Şifremi unuttum</h1>
      <p className="soluk">E-posta adresinizi girin, şifrenizi yenilemeniz için bir bağlantı gönderelim.</p>
      <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} className="girdi" placeholder="ornek@eposta.com" aria-label="E-posta" />
      {err && <p className="hata">{err}</p>}
      {msg && <p className="basari">{msg}</p>}
      <button className="btn-ana w-full">Bağlantı gönder</button>
    </form>
  );
}
