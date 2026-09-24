'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DURUMLAR } from '@/lib/format';

export default function OrderAdmin({ order }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [cargo, setCargo] = useState(order.cargo_company || '');
  const [tracking, setTracking] = useState(order.tracking_no || '');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(body) {
    setBusy(true); setMsg('');
    const r = await fetch('/api/admin/siparis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: order.id, ...body }) });
    const d = await r.json();
    setBusy(false);
    setMsg(r.ok ? 'Kaydedildi' : d.error);
    if (r.ok) router.refresh();
  }

  return (
    <aside className="kutu h-fit space-y-5 p-5">
      <div className="text-sm">
        <p>Ödeme: <b>{order.payment_method === 'havale' ? 'Havale/EFT' : 'Kredi kartı'}</b></p>
        <p>Ödeme durumu: <b>{order.payment_status}</b></p>
        {order.payment_ref && <p className="soluk break-all text-xs">Ref: {order.payment_ref}</p>}
      </div>
      {order.payment_method === 'havale' && order.payment_status === 'bekliyor' && order.status !== 'iptal' && (
        <button disabled={busy} onClick={() => send({ action: 'odeme_onayla' })} className="btn-ana w-full">Havale ödemesini onayla</button>
      )}
      <div>
        <label htmlFor="d" className="etiket">Sipariş durumu</label>
        <select id="d" value={status} onChange={(e) => setStatus(e.target.value)} className="girdi" disabled={order.status === 'iptal'}>
          {Object.entries(DURUMLAR).map(([k, v]) => <option key={k} value={k}>{v.ad}</option>)}
        </select>
      </div>
      <div><label htmlFor="k" className="etiket">Kargo firması</label>
        <input id="k" list="kargolar" value={cargo} onChange={(e) => setCargo(e.target.value)} className="girdi" />
        <datalist id="kargolar">{['Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo', 'PTT Kargo', 'Sürat Kargo', 'HepsiJet'].map((k) => <option key={k} value={k} />)}</datalist>
      </div>
      <div><label htmlFor="t" className="etiket">Takip numarası</label><input id="t" value={tracking} onChange={(e) => setTracking(e.target.value)} className="girdi font-mono" /></div>
      <p className="soluk text-xs">Durumu "Kargoda" yapıp kaydettiğinizde müşteriye takip numarasıyla e-posta gider. "İptal" stokları ve kupon kullanımını geri alır.</p>
      {msg && <p className={msg === 'Kaydedildi' ? 'basari' : 'hata'}>{msg}</p>}
      <button disabled={busy || order.status === 'iptal'} onClick={() => {
        if (status === 'iptal' && !confirm('Sipariş iptal edilsin mi? Bu işlem geri alınamaz.')) return;
        if (status === 'kargoda' && !tracking.trim()) return setMsg('Kargoya vermek için takip numarası girin.');
        send({ action: 'guncelle', status, cargo_company: cargo, tracking_no: tracking });
      }} className="btn-koyu w-full">Değişiklikleri kaydet</button>
    </aside>
  );
}
