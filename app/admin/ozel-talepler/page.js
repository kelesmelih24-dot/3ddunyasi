'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { tarih, TALEP_DURUM } from '@/lib/format';

function Talep({ t, onSaved }) {
  const supabase = createClient();
  const [status, setStatus] = useState(t.status);
  const [price, setPrice] = useState(t.quote_price ?? '');
  const [note, setNote] = useState(t.admin_note || '');
  const [msg, setMsg] = useState('');
  async function indir() {
    const { data } = await supabase.storage.from('ozel-siparis').createSignedUrl(t.file_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }
  async function kaydet() {
    const { error } = await supabase.from('custom_requests').update({ status, quote_price: price === '' ? null : Number(price), admin_note: note }).eq('id', t.id);
    setMsg(error ? 'Hata' : 'Kaydedildi'); onSaved();
  }
  return (
    <li className="kutu space-y-3 p-5 text-sm">
      <div className="flex flex-wrap justify-between gap-2"><b>{t.full_name} · {t.kind === 'stl' ? 'STL baskı' : 'Yazılı ürün'} · {t.quantity} adet</b><span className="soluk">{tarih(t.created_at)}</span></div>
      <p className="soluk"><a href={`mailto:${t.email}`} className="underline">{t.email}</a>{t.phone && ` · ${t.phone}`}</p>
      <p className="leading-6">{t.description}</p>
      {t.personalization_text && <p className="rounded bg-nozul-50 px-2 py-1 dark:bg-nozul-700/20">Yazı: <b>{t.personalization_text}</b></p>}
      {t.file_path && <button onClick={indir} className="btn-cizgi py-1.5">Dosyayı indir ({t.file_path.split('-').slice(1).join('-')})</button>}
      <div className="grid gap-3 sm:grid-cols-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="girdi" aria-label="Durum">{Object.entries(TALEP_DURUM).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Teklif fiyatı (TL)" className="girdi" aria-label="Teklif fiyatı" />
        <button onClick={kaydet} className="btn-koyu">Kaydet</button>
      </div>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="girdi" placeholder="Müşterinin göreceği not (malzeme, süre vb.)" aria-label="Not" />
      {msg && <p className={msg === 'Kaydedildi' ? 'basari' : 'hata'}>{msg}</p>}
    </li>
  );
}

export default function Page() {
  const supabase = createClient();
  const [list, setList] = useState(null);
  const load = async () => setList((await supabase.from('custom_requests').select('*').order('created_at', { ascending: false })).data || []);
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h1 className="text-3xl font-semibold">Özel sipariş talepleri</h1>
      <p className="soluk mb-5 mt-1 text-sm">Teklif fiyatı ve notu müşteri Hesabım sayfasında görür. Teklifi ayrıca e-posta veya WhatsApp ile iletmenizi öneririz.</p>
      {list === null ? <p className="soluk">Yükleniyor…</p> : list.length === 0 ? <p className="kutu soluk p-6">Henüz talep yok.</p> : (
        <ul className="space-y-4">{list.map((t) => <Talep key={t.id} t={t} onSaved={load} />)}</ul>
      )}
    </div>
  );
}
