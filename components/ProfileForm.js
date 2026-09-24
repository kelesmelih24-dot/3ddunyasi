'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ProfileForm({ userId, email, profile }) {
  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [msg, setMsg] = useState('');
  async function kaydet(e) {
    e.preventDefault();
    const { error } = await createClient().from('profiles').update({ full_name: name, phone }).eq('id', userId);
    setMsg(error ? 'Kaydedilemedi' : 'Bilgileriniz kaydedildi');
  }
  return (
    <form onSubmit={kaydet} className="max-w-md space-y-4">
      <div><label className="etiket">E-posta</label><input disabled value={email} className="girdi opacity-70" /></div>
      <div><label htmlFor="n" className="etiket">Ad soyad</label><input id="n" value={name} onChange={(e) => setName(e.target.value)} className="girdi" /></div>
      <div><label htmlFor="p" className="etiket">Telefon</label><input id="p" value={phone} onChange={(e) => setPhone(e.target.value)} className="girdi" /></div>
      {msg && <p className={msg.includes('kaydedildi') ? 'basari' : 'hata'}>{msg}</p>}
      <button className="btn-koyu">Değişiklikleri kaydet</button>
    </form>
  );
}
