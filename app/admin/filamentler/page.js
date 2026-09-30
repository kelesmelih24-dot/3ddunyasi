'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { tl } from '@/lib/format';

const BOS = { material: 'PLA', color: '', color_hex: '#E8620C', brand: '', remaining_g: 1000, low_threshold_g: 250, cost_per_kg: '', supplier_id: '' };

function Filament({ f, tedarikciler, onSaved }) {
  const db = createClient();
  const [islem, setIslem] = useState(null);
  const [gram, setGram] = useState(1000);
  const [fiyat, setFiyat] = useState('');
  const [tedarikci, setTedarikci] = useState(f.supplier_id || '');
  const [giderYaz, setGiderYaz] = useState(true);
  const [hareket, setHareket] = useState(null);
  const oran = Math.min(100, (f.remaining_g / 1000) * 100);
  const az = Number(f.remaining_g) <= Number(f.low_threshold_g);
  async function kaydet() {
    const g = Number(gram); if (!(g > 0)) return;
    if (islem === 'ekle') {
      await db.from('filament_movements').insert({ filament_id: f.id, change_g: g, reason: 'Stok girişi' });
      if (giderYaz && Number(fiyat) > 0) await db.from('ledger_entries').insert({ kind: 'gider', category: 'Filament', amount: Number(fiyat), supplier_id: tedarikci || null, description: `${f.brand || ''} ${f.material} ${f.color} ${g} g`.trim() });
      if (Number(fiyat) > 0) await db.from('filaments').update({ cost_per_kg: +(Number(fiyat) / g * 1000).toFixed(2), supplier_id: tedarikci || null }).eq('id', f.id);
    } else await db.from('filament_movements').insert({ filament_id: f.id, change_g: -g, reason: islem === 'fire' ? 'Fire / hatalı baskı' : 'Elle kullanım' });
    setIslem(null); setFiyat(''); onSaved();
  }
  async function gecmis() { setHareket(hareket ? null : (await db.from('filament_movements').select('*').eq('filament_id', f.id).order('created_at', { ascending: false }).limit(15)).data || []); }
  return (
    <li className={`kutu p-4 ${f.is_active ? '' : 'opacity-50'}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="h-10 w-10 shrink-0 rounded-full border-4 border-white shadow ring-1 ring-lacivert-100" style={{ background: f.color_hex || '#ccc' }} />
        <div className="min-w-0 flex-1"><p className="font-semibold">{f.material} · {f.color}</p><p className="soluk text-xs">{f.brand || 'Marka yok'}{f.cost_per_kg && ` · ${tl(f.cost_per_kg)}/kg`}{f.suppliers?.name && ` · ${f.suppliers.name}`}</p></div>
        <div className="w-40">
          <div className="flex justify-between text-xs"><b className={az ? 'text-red-600' : ''}>{Math.round(f.remaining_g)} g</b><span className="soluk">uyarı: {Math.round(f.low_threshold_g)} g</span></div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-lacivert-100 dark:bg-lacivert-800"><div className={`h-full ${az ? 'bg-red-500' : 'bg-nozul-500'}`} style={{ width: `${oran}%` }} /></div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button onClick={() => { setIslem('ekle'); setGram(1000); }} className="btn-cizgi py-1">+ Makara ekle</button>
        <button onClick={() => { setIslem('kullan'); setGram(50); }} className="btn-cizgi py-1">− Kullanım düş</button>
        <button onClick={() => { setIslem('fire'); setGram(20); }} className="btn-cizgi py-1">− Fire</button>
        <button onClick={gecmis} className="underline">Geçmiş</button>
        <button onClick={async () => { await db.from('filaments').update({ is_active: !f.is_active }).eq('id', f.id); onSaved(); }} className="underline">{f.is_active ? 'Arşivle' : 'Geri al'}</button>
      </div>
      {islem && (
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-krem p-3 text-sm dark:bg-lacivert-800">
          <div><label className="etiket">Gram</label><input type="number" className="girdi w-28" value={gram} onChange={(e) => setGram(e.target.value)} /></div>
          {islem === 'ekle' && <>
            <div><label className="etiket">Ödenen tutar (TL)</label><input type="number" className="girdi w-32" value={fiyat} onChange={(e) => setFiyat(e.target.value)} /></div>
            <div><label className="etiket">Tedarikçi</label><select className="girdi w-40" value={tedarikci} onChange={(e) => setTedarikci(e.target.value)}><option value="">-</option>{tedarikciler.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <label className="flex items-center gap-1.5 pb-2 text-xs"><input type="checkbox" checked={giderYaz} onChange={(e) => setGiderYaz(e.target.checked)} className="accent-nozul-500" /> Deftere gider yaz</label>
          </>}
          <button onClick={kaydet} className="btn-ana py-2">Kaydet</button><button onClick={() => setIslem(null)} className="btn-cizgi py-2">Vazgeç</button>
        </div>
      )}
      {hareket && <ul className="mt-3 divide-y divide-lacivert-100 text-xs dark:divide-lacivert-800">{hareket.map((h) => <li key={h.id} className="flex justify-between py-1.5"><span>{h.reason}</span><span className={h.change_g > 0 ? 'text-emerald-600' : 'text-red-600'}>{h.change_g > 0 ? '+' : ''}{Math.round(h.change_g)} g · {new Date(h.created_at).toLocaleDateString('tr-TR')}</span></li>)}</ul>}
    </li>
  );
}

export default function Page() {
  const db = createClient();
  const [list, setList] = useState([]);
  const [tedarikciler, setTedarikciler] = useState([]);
  const [f, setF] = useState(null);
  const load = async () => {
    const [a, b] = await Promise.all([db.from('filaments').select('*, suppliers(name)').order('is_active', { ascending: false }).order('material').order('color'), db.from('suppliers').select('id, name').order('name')]);
    setList(a.data || []); setTedarikciler(b.data || []);
  };
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function ekle(e) {
    e.preventDefault(); if (!f.color.trim()) return;
    const { remaining_g, ...row } = f;
    const { data } = await db.from('filaments').insert({ ...row, remaining_g: 0, cost_per_kg: row.cost_per_kg || null, supplier_id: row.supplier_id || null, low_threshold_g: Number(row.low_threshold_g) }).select('id').single();
    if (data && Number(remaining_g) > 0) await db.from('filament_movements').insert({ filament_id: data.id, change_g: Number(remaining_g), reason: 'Açılış stoğu' });
    setF(null); load();
  }
  const toplam = list.filter((x) => x.is_active).reduce((s, x) => s + Number(x.remaining_g), 0);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-semibold">Filament envanteri</h1><p className="soluk mt-1 text-sm">Toplam {(toplam / 1000).toFixed(1)} kg. Baskı kuyruğunda iş "Bitti" olunca, ürünün filamenti ve gramı kadar otomatik düşer.</p></div>
        <button onClick={() => setF({ ...BOS })} className="btn-ana">Yeni filament</button>
      </div>
      {f && (
        <form onSubmit={ekle} className="kutu grid gap-3 p-5 sm:grid-cols-4">
          <div><label className="etiket">Malzeme</label><input className="girdi" value={f.material} onChange={set('material')} list="malzemeler" /><datalist id="malzemeler">{['PLA', 'PLA+', 'PETG', 'TPU', 'ABS', 'ASA', 'Silk PLA'].map((m) => <option key={m} value={m} />)}</datalist></div>
          <div><label className="etiket">Renk adı</label><input className="girdi" value={f.color} onChange={set('color')} placeholder="Turuncu" /></div>
          <div><label className="etiket">Renk</label><input type="color" className="h-11 w-full rounded-lg" value={f.color_hex} onChange={set('color_hex')} /></div>
          <div><label className="etiket">Marka</label><input className="girdi" value={f.brand} onChange={set('brand')} /></div>
          <div><label className="etiket">Elde olan (gram)</label><input type="number" className="girdi" value={f.remaining_g} onChange={set('remaining_g')} /></div>
          <div><label className="etiket">Uyarı sınırı (gram)</label><input type="number" className="girdi" value={f.low_threshold_g} onChange={set('low_threshold_g')} /></div>
          <div><label className="etiket">Kg fiyatı (TL)</label><input type="number" className="girdi" value={f.cost_per_kg} onChange={set('cost_per_kg')} /></div>
          <div><label className="etiket">Tedarikçi</label><select className="girdi" value={f.supplier_id} onChange={set('supplier_id')}><option value="">-</option>{tedarikciler.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div className="flex gap-2 sm:col-span-4"><button className="btn-ana">Ekle</button><button type="button" onClick={() => setF(null)} className="btn-cizgi">Vazgeç</button></div>
        </form>
      )}
      <ul className="grid gap-3 lg:grid-cols-2">{list.map((x) => <Filament key={x.id} f={x} tedarikciler={tedarikciler} onSaved={load} />)}</ul>
      {!list.length && <p className="kutu soluk p-6 text-center">Henüz filament eklenmedi. Elinizdeki makaraları ekleyin; ürün düzenleme sayfasından her ürünün hangi filamentle basıldığını seçin.</p>}
    </div>
  );
}
