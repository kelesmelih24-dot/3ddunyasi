'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Page() {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();
  async function gonder(e) {
    e.preventDefault();
    if (pw.length < 8) return setErr('Şifre en az 8 karakter olmalı.');
    const { error } = await createClient().auth.updateUser({ password: pw });
    if (error) return setErr('Şifre güncellenemedi. Bağlantının süresi dolmuş olabilir.');
    router.push('/hesabim');
  }
  return (
    <form onSubmit={gonder} className="kap max-w-md space-y-4 py-14">
      <h1 className="text-3xl font-semibold">Yeni şifre belirleyin</h1>
      <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(''); }} className="girdi" placeholder="En az 8 karakter" aria-label="Yeni şifre" autoComplete="new-password" />
      {err && <p className="hata">{err}</p>}
      <button className="btn-ana w-full">Şifreyi kaydet</button>
    </form>
  );
}
