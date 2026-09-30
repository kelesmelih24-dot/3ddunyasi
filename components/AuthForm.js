'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Turnstile, { turnstileAktif } from './Turnstile';

export default function AuthForm({ mode }) {
  const kayit = mode === 'kayit';
  const router = useRouter();
  const sp = useSearchParams();
  const sonra = sp.get('sonra') || '/';
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState(sp.get('hata') ? 'Giriş yapılamadı, tekrar deneyin.' : '');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState('');
  const [tsAnahtar, setTsAnahtar] = useState(0);
  const yenile = () => { setToken(''); setTsAnahtar((n) => n + 1); };
  const supabase = createClient();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  async function gonder(e) {
    e.preventDefault();
    setErr('');
    if (kayit && f.name.trim().length < 3) return setErr('Adınızı ve soyadınızı girin.');
    if (!/\S+@\S+\.\S+/.test(f.email)) return setErr('Geçerli bir e-posta adresi girin.');
    if (f.password.length < 8) return setErr('Şifre en az 8 karakter olmalı.');
    if (turnstileAktif && !token) return setErr('Lütfen robot doğrulamasının tamamlanmasını bekleyin.');
    setBusy(true);
    if (kayit) {
      const { data, error } = await supabase.auth.signUp({
        email: f.email, password: f.password,
        options: { captchaToken: token || undefined, data: { full_name: f.name.trim() }, emailRedirectTo: `${origin}/auth/callback?sonra=${sonra}` },
      });
      setBusy(false); yenile();
      if (error) return setErr(error.message.includes('registered') ? 'Bu e-posta ile zaten bir hesap var.' : error.message);
      if (!data.session) return setOk('Hesabınız oluşturuldu. E-postanıza gelen bağlantıya tıklayarak hesabınızı doğrulayın.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password, options: { captchaToken: token || undefined } });
      setBusy(false); yenile();
      if (error) return setErr('E-posta veya şifre hatalı.');
    }
    router.push(sonra);
    router.refresh();
  }

  async function google() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${origin}/auth/callback?sonra=${sonra}` } });
  }

  return (
    <div className="kap max-w-md py-14">
      <h1 className="text-3xl font-bold">{kayit ? 'Hesap oluştur' : 'Giriş yap'}</h1>
      <p className="soluk mt-2">{kayit ? 'Sipariş verebilmek ve siparişlerinizi takip edebilmek için üye olun.' : 'Hesabınıza giriş yaparak alışverişe devam edin.'}</p>
      <button onClick={google} className="btn-cizgi mt-8 w-full">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3A12 12 0 1 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.4-.4-3.5z"/></svg>
        Google ile devam et
      </button>
      <div className="soluk my-6 flex items-center gap-3 text-xs"><span className="h-px flex-1 bg-lacivert-100 dark:bg-lacivert-800" />veya e-posta ile<span className="h-px flex-1 bg-lacivert-100 dark:bg-lacivert-800" /></div>
      <form onSubmit={gonder} className="space-y-4" noValidate>
        {kayit && <div><label htmlFor="ad" className="etiket">Ad soyad</label><input id="ad" className="girdi" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></div>}
        <div><label htmlFor="ep" className="etiket">E-posta</label><input id="ep" type="email" className="girdi" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></div>
        <div>
          <div className="flex justify-between"><label htmlFor="sf" className="etiket">Şifre</label>
            {!kayit && <Link href="/sifremi-unuttum" className="text-sm underline">Şifremi unuttum</Link>}</div>
          <input id="sf" type="password" className="girdi" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete={kayit ? 'new-password' : 'current-password'} />
        </div>
        {kayit && <p className="soluk text-xs leading-5">Üye olarak <Link href="/kvkk" className="underline">KVKK aydınlatma metnini</Link> okuduğunuzu kabul etmiş olursunuz.</p>}
        <Turnstile key={tsAnahtar} onToken={setToken} />
        {err && <p className="hata">{err}</p>}
        {ok && <p className="basari">{ok}</p>}
        <button disabled={busy} className="btn-ana w-full">{busy ? 'Lütfen bekleyin…' : kayit ? 'Hesap oluştur' : 'Giriş yap'}</button>
      </form>
      <p className="soluk mt-6 text-center text-sm">
        {kayit ? <>Zaten hesabınız var mı? <Link href={`/giris?sonra=${sonra}`} className="font-semibold underline">Giriş yapın</Link></>
          : <>Hesabınız yok mu? <Link href={`/kayit?sonra=${sonra}`} className="font-semibold underline">Hesap oluşturun</Link></>}
      </p>
    </div>
  );
}
