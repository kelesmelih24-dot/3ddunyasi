'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const KOLON = [['bekliyor', 'Sırada'], ['basiliyor', 'Basılıyor'], ['son_islem', 'Son işlem'], ['bitti', 'Bitti']];

export default function Page() {
  const supabase = createClient();
  const [isler, setIsler] = useState([]);
  const [yazicilar, setYazicilar] = useState([]);
  const [bekleyen, setBekleyen] = useState([]);
  const [yeniYazici, setYeniYazici] = useState('');
  const [baslik, setBaslik] = useState('');
  const load = async () => {
    const [a, b, c] = await Promise.all([
      supabase.from('print_jobs').select('*, order_items(personalization, quantity, orders(order_no))').order('sort').order('created_at'),
      supabase.from('printers').select('*').eq('is_active', true).order('sort'),
      supabase.from('order_items').select('id, name, quantity, personalization, orders!inner(order_no, status)').eq('orders.status', 'hazirlaniyor').neq('kind', 'hediye_ceki'),
    ]);
    const varOlan = new Set((a.data || []).map((j) => j.order_item_id));
    setIsler(a.data || []); setYazicilar(b.data || []); setBekleyen((c.data || []).filter((k) => !varOlan.has(k.id)));
  };
  useEffect(() => { load(); }, []);
  const guncelle = async (j, alanlar) => {
    const ek = alanlar.status === 'basiliyor' && !j.started_at ? { started_at: new Date().toISOString() } : alanlar.status === 'bitti' ? { finished_at: new Date().toISOString() } : {};
    await supabase.from('print_jobs').update({ ...alanlar, ...ek }).eq('id', j.id); load();
  };
  const kuyrugaAl = async (k) => { await supabase.from('print_jobs').insert({ order_item_id: k.id, title: `${k.quantity} × ${k.name}` }); load(); };
  const hepsiniAl = async () => { if (bekleyen.length) { await supabase.from('print_jobs').insert(bekleyen.map((k) => ({ order_item_id: k.id, title: `${k.quantity} × ${k.name}` }))); load(); } };
  const serbestIs = async (e) => { e.preventDefault(); if (baslik.trim()) { await supabase.from('print_jobs').insert({ title: baslik.trim() }); setBaslik(''); load(); } };
  const sil = async (j) => { if (confirm('İş kuyruktan kaldırılsın mı?')) { await supabase.from('print_jobs').delete().eq('id', j.id); load(); } };
  const yaziciEkle = async (e) => { e.preventDefault(); if (yeniYazici.trim()) { await supabase.from('printers').insert({ name: yeniYazici.trim(), sort: yazicilar.length + 1 }); setYeniYazici(''); load(); } };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Baskı kuyruğu</h1>
      {bekleyen.length > 0 && (
        <div className="rounded-2xl border-2 border-nozul-500 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">Hazırlanan siparişlerden kuyruğa alınmamış {bekleyen.length} kalem</p><button onClick={hepsiniAl} className="btn-ana py-2">Hepsini kuyruğa al</button></div>
          <ul className="mt-2 space-y-1 text-sm">{bekleyen.map((k) => <li key={k.id} className="flex items-center justify-between gap-2"><span>{k.orders.order_no} · {k.quantity} × {k.name}{k.personalization && <b> ({k.personalization})</b>}</span><button onClick={() => kuyrugaAl(k)} className="underline">Kuyruğa al</button></li>)}</ul>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={serbestIs} className="flex gap-2"><input value={baslik} onChange={(e) => setBaslik(e.target.value)} className="girdi" placeholder="Serbest iş (stok baskısı vb.)" aria-label="Serbest iş" /><button className="btn-cizgi">Ekle</button></form>
        <form onSubmit={yaziciEkle} className="flex gap-2"><input value={yeniYazici} onChange={(e) => setYeniYazici(e.target.value)} className="girdi" placeholder="Yeni yazıcı adı" aria-label="Yeni yazıcı" /><button className="btn-cizgi">Yazıcı ekle</button></form>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KOLON.map(([durum, ad], ki) => {
          const liste = isler.filter((j) => j.status === durum && (durum !== 'bitti' || Date.now() - new Date(j.finished_at || j.created_at) < 3 * 864e5));
          return (
            <section key={durum} className="rounded-2xl bg-krem p-3 dark:bg-lacivert-900">
              <h2 className="mb-3 flex items-center justify-between px-1 font-sans text-sm font-bold">{ad}<span className="soluk">{liste.length}</span></h2>
              <ul className="space-y-2">
                {liste.map((j) => (
                  <li key={j.id} className="rounded-xl bg-white p-3 text-sm shadow-sm dark:bg-lacivert-950">
                    <p className="font-semibold">{j.title}</p>
                    {j.order_items?.personalization && <p className="text-nozul-600">Yazı: <b>{j.order_items.personalization}</b></p>}
                    {j.order_items?.orders?.order_no && <p className="soluk text-xs">{j.order_items.orders.order_no}</p>}
                    <select value={j.printer_id || ''} onChange={(e) => guncelle(j, { printer_id: e.target.value || null })} className="girdi mt-2 py-1 text-xs" aria-label="Yazıcı">
                      <option value="">Yazıcı seçin</option>{yazicilar.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      {ki > 0 ? <button onClick={() => guncelle(j, { status: KOLON[ki - 1][0] })} className="underline">← Geri</button> : <button onClick={() => sil(j)} className="text-red-600 underline">Kaldır</button>}
                      {ki < KOLON.length - 1 && <button onClick={() => guncelle(j, { status: KOLON[ki + 1][0] })} className="rounded-full bg-nozul-500 px-3 py-1 font-bold text-white">{KOLON[ki + 1][1]} →</button>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="soluk text-xs">Biten işler 3 gün sonra listeden gizlenir. Yazıcı durumu: {yazicilar.map((y) => `${y.name}: ${isler.filter((j) => j.printer_id === y.id && j.status === 'basiliyor').length ? 'meşgul' : 'boşta'}`).join(' · ')}</p>
    </div>
  );
}
