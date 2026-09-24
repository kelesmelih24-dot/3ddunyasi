'use client';
import { useState } from 'react';
import { tl, DURUMLAR } from '@/lib/format';

export default function Page() {
  const [no, setNo] = useState('');
  const [email, setEmail] = useState('');
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  async function sorgula(e) {
    e.preventDefault();
    setErr(''); setRes(null);
    if (!no.trim() || !email.trim()) return setErr('Sipariş numarası ve e-posta adresini girin.');
    const r = await fetch('/api/siparis-takip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ no, email }) });
    const d = await r.json();
    if (!r.ok) return setErr(d.error);
    setRes(d);
  }
  return (
    <div className="kap max-w-lg py-14">
      <h1 className="text-3xl font-bold">Sipariş takibi</h1>
      <p className="soluk mt-2">Sipariş numaranız onay e-postasında yer alır (örnek: 3DD-A1B2C3D4).</p>
      <form onSubmit={sorgula} className="mt-8 space-y-4">
        <div><label htmlFor="no" className="etiket">Sipariş numarası</label><input id="no" value={no} onChange={(e) => setNo(e.target.value.toUpperCase())} className="girdi" /></div>
        <div><label htmlFor="ep" className="etiket">Siparişte kullanılan e-posta</label><input id="ep" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="girdi" /></div>
        {err && <p className="hata">{err}</p>}
        <button className="btn-ana w-full">Siparişi sorgula</button>
      </form>
      {res && (
        <div className="kutu mt-8 space-y-2 p-5 text-sm">
          <p className="text-lg font-semibold">{res.order_no}</p>
          <p>Durum: <span className={`rounded px-2 py-0.5 text-xs font-semibold ${DURUMLAR[res.status].renk}`}>{DURUMLAR[res.status].ad}</span></p>
          <p>Tutar: <b>{tl(res.total)}</b></p>
          {res.tracking_no && <p>Kargo: <b>{res.cargo_company}</b> · Takip no: <b className="font-mono">{res.tracking_no}</b></p>}
        </div>
      )}
    </div>
  );
}
