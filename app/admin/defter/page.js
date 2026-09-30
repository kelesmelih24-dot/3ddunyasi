'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { tl } from '@/lib/format';
import ExcelExport from '@/components/admin/ExcelExport';

const KATEGORI = { gider: ['Filament', 'Yedek parça', 'Ambalaj', 'Kargo', 'Elektrik', 'Kira', 'Reklam', 'Yazılım / abonelik', 'Ekipman', 'Diğer'], gelir: ['Elden satış', 'Pazar/fuar satışı', 'Diğer'] };
const ayAdi = (a) => new Date(a + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

export default function Page() {
  const db = createClient();
  const [ay, setAy] = useState(new Date().toISOString().slice(0, 7));
  const [kayitlar, setKayitlar] = useState([]);
  const [siparis, setSiparis] = useState(0);
  const [tedarikciler, setTedarikciler] = useState([]);
  const [f, setF] = useState({ kind: 'gider', category: 'Filament', amount: '', entry_date: new Date().toISOString().slice(0, 10), description: '', supplier_id: '' });
  const [err, setErr] = useState('');
  const load = async () => {
    const bas = `${ay}-01`, son = new Date(new Date(bas).getFullYear(), new Date(bas).getMonth() + 1, 1).toISOString().slice(0, 10);
    const [a, b, c] = await Promise.all([
      db.from('ledger_entries').select('*, suppliers(name)').gte('entry_date', bas).lt('entry_date', son).order('entry_date', { ascending: false }),
      db.from('orders').select('total').eq('payment_status', 'odendi').neq('status', 'iptal').gte('created_at', bas).lt('created_at', son),
      db.from('suppliers').select('id, name').order('name'),
    ]);
    setKayitlar(a.data || []); setSiparis((b.data || []).reduce((s, o) => s + Number(o.total), 0)); setTedarikciler(c.data || []);
  };
  useEffect(() => { load(); }, [ay]);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value, ...(k === 'kind' && { category: KATEGORI[e.target.value][0] }) }); setErr(''); };
  async function ekle(e) {
    e.preventDefault();
    if (!(Number(f.amount) > 0)) return setErr('Tutar girin.');
    const { error } = await db.from('ledger_entries').insert({ ...f, amount: Number(f.amount), supplier_id: f.supplier_id || null });
    if (error) return setErr(error.message);
    setF({ ...f, amount: '', description: '' }); load();
  }
  async function sil(k) { if (confirm('Kayıt silinsin mi?')) { await db.from('ledger_entries').delete().eq('id', k.id); load(); } }
  const t = useMemo(() => {
    const gelir = kayitlar.filter((k) => k.kind === 'gelir').reduce((s, k) => s + Number(k.amount), 0);
    const gider = kayitlar.filter((k) => k.kind === 'gider').reduce((s, k) => s + Number(k.amount), 0);
    const kat = {}; kayitlar.filter((k) => k.kind === 'gider').forEach((k) => { kat[k.category] = (kat[k.category] || 0) + Number(k.amount); });
    return { gelir, gider, kat: Object.entries(kat).sort((a, b) => b[1] - a[1]) };
  }, [kayitlar]);
  const net = siparis + t.gelir - t.gider;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Gider-gelir defteri</h1>
        <div className="flex gap-2"><input type="month" value={ay} onChange={(e) => setAy(e.target.value)} className="girdi w-auto" aria-label="Ay" />
          <ExcelExport dosya={`defter-${ay}`} satirlar={kayitlar.map((k) => ({ Tarih: k.entry_date, Tür: k.kind, Kategori: k.category, Tutar: Number(k.amount), Açıklama: k.description || '', Tedarikçi: k.suppliers?.name || '' }))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Site satışları', siparis, 'Ödenmiş siparişlerden otomatik'], ['Diğer gelirler', t.gelir], ['Giderler', t.gider], ['Net', net]].map(([ad, v, alt]) => (
          <div key={ad} className="kutu p-4"><p className="soluk text-sm">{ad}</p><p className={`mt-1 font-display text-2xl font-semibold ${ad === 'Net' ? (v >= 0 ? 'text-emerald-600' : 'text-red-600') : ''}`}>{tl(v)}</p>{alt && <p className="soluk text-xs">{alt}</p>}</div>
        ))}
      </div>
      <form onSubmit={ekle} className="kutu grid gap-3 p-5 sm:grid-cols-6">
        <div><label className="etiket">Tür</label><select className="girdi" value={f.kind} onChange={set('kind')}><option value="gider">Gider</option><option value="gelir">Gelir</option></select></div>
        <div><label className="etiket">Kategori</label><select className="girdi" value={f.category} onChange={set('category')}>{KATEGORI[f.kind].map((k) => <option key={k}>{k}</option>)}</select></div>
        <div><label className="etiket">Tutar (TL)</label><input type="number" step="0.01" className="girdi" value={f.amount} onChange={set('amount')} /></div>
        <div><label className="etiket">Tarih</label><input type="date" className="girdi" value={f.entry_date} onChange={set('entry_date')} /></div>
        <div><label className="etiket">Tedarikçi</label><select className="girdi" value={f.supplier_id} onChange={set('supplier_id')}><option value="">-</option>{tedarikciler.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
        <div><label className="etiket">Açıklama</label><input className="girdi" value={f.description} onChange={set('description')} /></div>
        {err && <p className="hata sm:col-span-6">{err}</p>}
        <div className="sm:col-span-6"><button className="btn-ana">Kaydet</button></div>
      </form>
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="kutu overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="soluk border-b border-lacivert-100 dark:border-lacivert-800"><tr><th className="p-3">Tarih</th><th className="p-3">Kategori</th><th className="p-3">Açıklama</th><th className="p-3 text-right">Tutar</th><th /></tr></thead>
            <tbody className="divide-y divide-lacivert-100 dark:divide-lacivert-800">
              {kayitlar.map((k) => <tr key={k.id}><td className="p-3">{new Date(k.entry_date).toLocaleDateString('tr-TR')}</td><td className="p-3">{k.category}</td><td className="p-3">{k.description}{k.suppliers?.name && <span className="soluk"> · {k.suppliers.name}</span>}</td>
                <td className={`p-3 text-right font-semibold ${k.kind === 'gelir' ? 'text-emerald-600' : 'text-red-600'}`}>{k.kind === 'gelir' ? '+' : '−'}{tl(k.amount)}</td><td className="p-3"><button onClick={() => sil(k)} className="soluk text-xs underline">sil</button></td></tr>)}
            </tbody>
          </table>
          {!kayitlar.length && <p className="soluk p-6 text-center">{ayAdi(ay)} için kayıt yok.</p>}
        </div>
        <div className="kutu h-fit p-4 text-sm"><p className="font-semibold">Gider dağılımı</p>
          <ul className="mt-2 space-y-2">{t.kat.map(([k, v]) => <li key={k}><div className="flex justify-between"><span>{k}</span><b>{tl(v)}</b></div><div className="mt-1 h-1.5 rounded-full bg-lacivert-100 dark:bg-lacivert-800"><div className="h-full rounded-full bg-nozul-500" style={{ width: `${(v / t.gider) * 100}%` }} /></div></li>)}</ul>
          {!t.kat.length && <p className="soluk mt-2">Gider yok.</p>}
        </div>
      </div>
      <p className="soluk text-xs">Bu defter kendi takibiniz içindir; resmi muhasebe kaydı yerine geçmez. Excel'e aktarıp mali müşavirinize iletebilirsiniz.</p>
    </div>
  );
}
