'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Page() {
  const db = createClient();
  const [yazicilar, setYazicilar] = useState([]);
  const [yeni, setYeni] = useState({ name: '', model: '' });
  const [gorev, setGorev] = useState({});
  const load = async () => setYazicilar((await db.from('printers').select('*, printer_maintenance(*)').order('sort')).data || []);
  useEffect(() => { load(); }, []);
  async function ekle(e) { e.preventDefault(); if (!yeni.name.trim()) return; await db.from('printers').insert({ ...yeni, sort: yazicilar.length + 1 }); setYeni({ name: '', model: '' }); load(); }
  async function yapildi(y, m) { await db.from('printer_maintenance').update({ last_done_hours: y.total_hours, last_done_at: new Date().toISOString() }).eq('id', m.id); load(); }
  async function saatDuzelt(y) { const v = prompt(`${y.name} toplam baskı saati:`, y.total_hours); if (v !== null && !isNaN(+v)) { await db.from('printers').update({ total_hours: +v }).eq('id', y.id); load(); } }
  async function gorevEkle(y) { const g = gorev[y.id]; if (!g?.task || !(+g.interval > 0)) return; await db.from('printer_maintenance').insert({ printer_id: y.id, task: g.task, interval_hours: +g.interval, last_done_hours: y.total_hours }); setGorev({ ...gorev, [y.id]: {} }); load(); }
  async function gorevSil(m) { if (confirm(`"${m.task}" bakım kalemi silinsin mi?`)) { await db.from('printer_maintenance').delete().eq('id', m.id); load(); } }
  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-semibold">Yazıcılar ve bakım</h1><p className="soluk mt-1 text-sm">Baskı kuyruğunda biten her iş, yazıcının saat sayacına eklenir. Bakım zamanı gelince burada, "Bugün" sayfasında ve Telegram özetinde uyarı görürsünüz.</p></div>
      <form onSubmit={ekle} className="flex flex-wrap gap-2"><input className="girdi w-48" placeholder="Yazıcı adı" value={yeni.name} onChange={(e) => setYeni({ ...yeni, name: e.target.value })} aria-label="Yazıcı adı" /><input className="girdi w-48" placeholder="Model (ör. Bambu A1)" value={yeni.model} onChange={(e) => setYeni({ ...yeni, model: e.target.value })} aria-label="Model" /><button className="btn-ana">Yazıcı ekle</button></form>
      <div className="grid gap-4 lg:grid-cols-2">
        {yazicilar.map((y) => (
          <section key={y.id} className={`kutu p-5 ${y.is_active ? '' : 'opacity-50'}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h2 className="font-sans text-lg font-semibold">{y.name}</h2><p className="soluk text-xs">{y.model || 'Model girilmedi'}</p></div>
              <button onClick={() => saatDuzelt(y)} className="text-right"><span className="font-display text-2xl font-semibold">{Math.round(y.total_hours)}</span><span className="soluk text-xs"> saat</span><br /><span className="text-xs underline">düzelt</span></button>
            </div>
            <ul className="mt-4 space-y-3">
              {(y.printer_maintenance || []).map((m) => {
                const gecen = y.total_hours - m.last_done_hours; const oran = Math.min(100, (gecen / m.interval_hours) * 100); const zaman = gecen >= m.interval_hours;
                return (
                  <li key={m.id} className="text-sm">
                    <div className="flex items-center justify-between gap-2"><span className={zaman ? 'font-semibold text-red-600' : ''}>{zaman && '🔧 '}{m.task}</span><span className="soluk text-xs">{Math.round(gecen)} / {m.interval_hours} saat</span></div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lacivert-100 dark:bg-lacivert-800"><div className={`h-full ${zaman ? 'bg-red-500' : oran > 80 ? 'bg-nozul-500' : 'bg-emerald-500'}`} style={{ width: `${oran}%` }} /></div>
                    <div className="mt-1 flex gap-3 text-xs"><button onClick={() => yapildi(y, m)} className="font-semibold text-nozul-600 underline">Yapıldı</button>{m.last_done_at && <span className="soluk">son: {new Date(m.last_done_at).toLocaleDateString('tr-TR')}</span>}<button onClick={() => gorevSil(m)} className="soluk ml-auto underline">sil</button></div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex gap-2 text-sm">
              <input className="girdi py-1.5" placeholder="Yeni bakım kalemi" value={gorev[y.id]?.task || ''} onChange={(e) => setGorev({ ...gorev, [y.id]: { ...gorev[y.id], task: e.target.value } })} aria-label="Bakım kalemi" />
              <input type="number" className="girdi w-24 py-1.5" placeholder="saat" value={gorev[y.id]?.interval || ''} onChange={(e) => setGorev({ ...gorev, [y.id]: { ...gorev[y.id], interval: e.target.value } })} aria-label="Kaç saatte bir" />
              <button onClick={() => gorevEkle(y)} className="btn-cizgi py-1.5">Ekle</button>
            </div>
            <button onClick={async () => { await db.from('printers').update({ is_active: !y.is_active }).eq('id', y.id); load(); }} className="soluk mt-3 text-xs underline">{y.is_active ? 'Yazıcıyı devre dışı bırak' : 'Tekrar etkinleştir'}</button>
          </section>
        ))}
      </div>
    </div>
  );
}
