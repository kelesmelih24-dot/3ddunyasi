'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { tl } from '@/lib/format';

const BOS = { name: '', contact: '', phone: '', email: '', website: '', notes: '' };

export default function Page() {
  const db = createClient();
  const [list, setList] = useState([]);
  const [harcama, setHarcama] = useState({});
  const [f, setF] = useState(null);
  const load = async () => {
    const [a, b] = await Promise.all([db.from('suppliers').select('*').order('name'), db.from('ledger_entries').select('supplier_id, amount, entry_date').eq('kind', 'gider').not('supplier_id', 'is', null)]);
    setList(a.data || []);
    const h = {}; (b.data || []).forEach((e) => { h[e.supplier_id] ??= { t: 0, son: null }; h[e.supplier_id].t += Number(e.amount); if (!h[e.supplier_id].son || e.entry_date > h[e.supplier_id].son) h[e.supplier_id].son = e.entry_date; });
    setHarcama(h);
  };
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function kaydet(e) { e.preventDefault(); if (!f.name.trim()) return; const { id, created_at, ...row } = f; id ? await db.from('suppliers').update(row).eq('id', id) : await db.from('suppliers').insert(row); setF(null); load(); }
  async function sil(t) { if (confirm(`${t.name} silinsin mi?`)) { await db.from('suppliers').delete().eq('id', t.id); load(); } }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold">Tedarikçiler</h1><button onClick={() => setF({ ...BOS })} className="btn-ana">Yeni tedarikçi</button></div>
      {f && (
        <form onSubmit={kaydet} className="kutu grid gap-3 p-5 sm:grid-cols-3">
          {[['name', 'Firma adı'], ['contact', 'Yetkili'], ['phone', 'Telefon'], ['email', 'E-posta'], ['website', 'Web sitesi']].map(([k, ad]) => <div key={k}><label className="etiket">{ad}</label><input className="girdi" value={f[k] || ''} onChange={set(k)} /></div>)}
          <div className="sm:col-span-3"><label className="etiket">Notlar (ürünler, fiyatlar, teslim süresi)</label><textarea rows={2} className="girdi" value={f.notes || ''} onChange={set('notes')} /></div>
          <div className="flex gap-2"><button className="btn-ana">Kaydet</button><button type="button" onClick={() => setF(null)} className="btn-cizgi">Vazgeç</button></div>
        </form>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((t) => (
          <div key={t.id} className="kutu p-4 text-sm leading-6">
            <div className="flex justify-between gap-2"><b className="text-base">{t.name}</b><span className="soluk text-xs">{harcama[t.id] ? `${tl(harcama[t.id].t)} · son alım ${new Date(harcama[t.id].son).toLocaleDateString('tr-TR')}` : 'Alım kaydı yok'}</span></div>
            <p>{[t.contact, t.phone && <a key="p" href={`tel:${t.phone}`} className="underline">{t.phone}</a>, t.email && <a key="e" href={`mailto:${t.email}`} className="underline">{t.email}</a>].filter(Boolean).map((x, i) => <span key={i}>{i > 0 && ' · '}{x}</span>)}</p>
            {t.website && <a href={t.website.startsWith('http') ? t.website : `https://${t.website}`} target="_blank" rel="noreferrer" className="underline">{t.website}</a>}
            {t.notes && <p className="soluk mt-1">{t.notes}</p>}
            <div className="mt-2 flex gap-3 text-xs"><button onClick={() => setF(t)} className="underline">Düzenle</button><button onClick={() => sil(t)} className="text-red-600 underline">Sil</button></div>
          </div>
        ))}
      </div>
      {!list.length && <p className="kutu soluk p-6 text-center">Filament, parça ve ambalaj aldığınız firmaları ekleyin. Filament stok girişinde ve gider defterinde seçebilirsiniz.</p>}
    </div>
  );
}
