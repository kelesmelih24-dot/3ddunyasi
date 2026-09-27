'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { tarih, tl, IADE_DURUM } from '@/lib/format';

function Iade({ r, onSaved }) {
  const supabase = createClient();
  const [status, setStatus] = useState(r.status);
  const [note, setNote] = useState(r.admin_note || '');
  async function kaydet() { await supabase.from('return_requests').update({ status, admin_note: note }).eq('id', r.id); onSaved(); }
  return (
    <li className="kutu space-y-3 p-5 text-sm">
      <div className="flex flex-wrap justify-between gap-2"><a href={`/admin/siparisler/${r.order_id}`} className="font-semibold underline">{r.orders?.order_no}</a><span className="soluk">{tarih(r.created_at)}</span></div>
      <p><b>{r.reason}</b> · {r.orders?.email} · {tl(r.orders?.total)}</p>
      <p className="leading-6">{r.details}</p>
      {r.iban && <p>IBAN: <span className="font-mono">{r.iban}</span></p>}
      <div className="grid gap-2 sm:grid-cols-[200px_1fr_auto]">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="girdi" aria-label="Durum">{Object.entries(IADE_DURUM).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="girdi" placeholder="Müşterinin göreceği not" aria-label="Not" />
        <button onClick={kaydet} className="btn-koyu">Kaydet</button>
      </div>
      <p className="soluk text-xs">İade onaylanıp ürün geri gelince sipariş sayfasından siparişi iptal ederek stok ve puanları geri alabilirsiniz; para iadesini bankanızdan yapın.</p>
    </li>
  );
}

export default function Page() {
  const supabase = createClient();
  const [list, setList] = useState(null);
  const load = async () => setList((await supabase.from('return_requests').select('*, orders(order_no, email, total)').order('created_at', { ascending: false })).data || []);
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h1 className="mb-5 text-3xl font-semibold">İade talepleri</h1>
      {list === null ? <p className="soluk">Yükleniyor…</p> : !list.length ? <p className="kutu soluk p-6">İade talebi yok.</p> : <ul className="space-y-4">{list.map((r) => <Iade key={r.id} r={r} onSaved={load} />)}</ul>}
    </div>
  );
}
