'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ProfileForm({ userId, email, profile }) {
  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [msg, setMsg] = useState('');
  async function hesapSil() {
    if (prompt('Hesabınız kalıcı olarak silinecek. Onaylamak için SİL yazın.') !== 'SİL') return;
    const r = await fetch('/api/hesap-sil', { method: 'POST' });
    if (!r.ok) return setMsg('Hesap silinemedi, lütfen bize ulaşın.');
    await createClient().auth.signOut();
    window.location.href = '/';
  }
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
      <div className="mt-10 rounded-2xl border border-red-200 p-5 dark:border-red-900">
        <p className="font-semibold text-red-700 dark:text-red-300">Hesabı sil</p>
        <p className="soluk mt-1 text-sm">Hesabınız, adresleriniz, favorileriniz ve puanlarınız kalıcı olarak silinir. Yasal zorunluluk nedeniyle geçmiş sipariş kayıtları, kişisel bağlantısı kaldırılarak saklanır.</p>
        <button type="button" onClick={hesapSil} className="btn mt-3 bg-red-600 text-white hover:bg-red-700">Hesabımı kalıcı olarak sil</button>
      </div>
    </form>
  );
}
