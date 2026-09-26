'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const ALANLAR = [
  ['shipping_fee', 'Kargo ücreti (TL)', 'number'], ['free_shipping_limit', 'Ücretsiz kargo alt limiti (TL)', 'number'],
  ['bank_name', 'Banka adı'], ['account_holder', 'Hesap sahibi'], ['iban', 'IBAN'],
  ['whatsapp', 'WhatsApp numarası (905xxxxxxxxx)'], ['contact_phone', 'Telefon'], ['contact_email', 'İletişim e-postası'],
  ['address', 'Adres'], ['instagram', 'Instagram kullanıcı adı'],
];

export default function Page() {
  const supabase = createClient();
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState('');
  const [acilis, setAcilis] = useState('');
  useEffect(() => { supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => {
    setF(data);
    if (data?.launch_at) { const d = new Date(data.launch_at); setAcilis(new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16)); }
  }); }, []);
  async function kaydet(e) {
    e.preventDefault();
    const { id, updated_at, ...rest } = f;
    rest.launch_at = acilis ? new Date(acilis).toISOString() : null;
    const { error } = await supabase.from('settings').update({ ...rest, shipping_fee: Number(rest.shipping_fee), free_shipping_limit: Number(rest.free_shipping_limit), updated_at: new Date().toISOString() }).eq('id', 1);
    setMsg(error ? error.message : 'Ayarlar kaydedildi');
  }
  if (!f) return <p className="soluk">Yükleniyor…</p>;
  return (
    <form onSubmit={kaydet} className="max-w-2xl space-y-5">
      <h1 className="text-3xl font-semibold">Mağaza ayarları</h1>
      <div className="kutu grid gap-4 p-5 sm:grid-cols-2">
        {ALANLAR.map(([k, l, t]) => (
          <div key={k} className={k === 'iban' || k === 'address' ? 'sm:col-span-2' : ''}>
            <label htmlFor={k} className="etiket">{l}</label>
            <input id={k} type={t || 'text'} step="0.01" className="girdi" value={f[k] ?? ''} onChange={(e) => { setF({ ...f, [k]: e.target.value }); setMsg(''); }} />
          </div>
        ))}
      </div>
      <div className="kutu p-5">
        <label htmlFor="acilis" className="etiket">Açılış tarihi ve saati (ana sayfadaki geri sayım)</label>
        <input id="acilis" type="datetime-local" className="girdi max-w-xs" value={acilis} onChange={(e) => { setAcilis(e.target.value); setMsg(''); }} />
        <p className="soluk mt-2 text-xs">Boş bırakırsanız ana sayfada geri sayım yerine "Çok yakında" yazar. Tarih geçince bölüm kendiliğinden gizlenir.</p>
      </div>
      {msg && <p className={msg.includes('kaydedildi') ? 'basari' : 'hata'}>{msg}</p>}
      <button className="btn-ana">Ayarları kaydet</button>
    </form>
  );
}
