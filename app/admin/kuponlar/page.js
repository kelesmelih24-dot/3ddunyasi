'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { tl } from '@/lib/format';

const BOS = { code: '', type: 'yuzde', value: '', min_total: 0, usage_limit: '', expires_at: '' };

export default function Page() {
  const supabase = createClient();
  const [list, setList] = useState([]);
  const [f, setF] = useState(BOS);
  const [err, setErr] = useState('');
  const load = async () => setList((await supabase.from('coupons').select('*').order('created_at', { ascending: false })).data || []);
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr(''); };

  async function ekle(e) {
    e.preventDefault();
    if (!/^[A-Z0-9]{3,20}$/.test(f.code)) return setErr('Kod 3-20 karakter, sadece büyük harf ve rakam olmalı.');
    if (!(Number(f.value) > 0)) return setErr('İndirim değeri girin.');
    if (f.type === 'yuzde' && Number(f.value) > 100) return setErr('Yüzde indirim 100\'ü geçemez.');
    const { error } = await supabase.from('coupons').insert({
      code: f.code, type: f.type, value: Number(f.value), min_total: Number(f.min_total) || 0,
      usage_limit: f.usage_limit ? Number(f.usage_limit) : null, expires_at: f.expires_at ? new Date(f.expires_at + 'T23:59:59').toISOString() : null,
    });
    if (error) return setErr(error.message.includes('duplicate') ? 'Bu kod zaten var.' : error.message);
    setF(BOS); load();
  }
  const toggle = async (c) => { await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id); load(); };
  const sil = async (c) => { if (confirm(`${c.code} silinsin mi?`)) { await supabase.from('coupons').delete().eq('id', c.id); load(); } };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Kuponlar</h1>
      <form onSubmit={ekle} className="kutu grid gap-3 p-5 sm:grid-cols-3">
        <div><label className="etiket" htmlFor="c">Kupon kodu</label><input id="c" className="girdi" value={f.code} onChange={(e) => { setF({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '') }); setErr(''); }} placeholder="YAZ20" /></div>
        <div><label className="etiket" htmlFor="t">Tür</label><select id="t" className="girdi" value={f.type} onChange={set('type')}><option value="yuzde">Yüzde (%)</option><option value="tutar">Sabit tutar (TL)</option></select></div>
        <div><label className="etiket" htmlFor="v">Değer</label><input id="v" type="number" step="0.01" className="girdi" value={f.value} onChange={set('value')} /></div>
        <div><label className="etiket" htmlFor="m">En az sepet tutarı</label><input id="m" type="number" className="girdi" value={f.min_total} onChange={set('min_total')} /></div>
        <div><label className="etiket" htmlFor="u">Kullanım limiti (boş: sınırsız)</label><input id="u" type="number" className="girdi" value={f.usage_limit} onChange={set('usage_limit')} /></div>
        <div><label className="etiket" htmlFor="x">Son geçerlilik tarihi</label><input id="x" type="date" className="girdi" value={f.expires_at} onChange={set('expires_at')} /></div>
        {err && <p className="hata sm:col-span-3">{err}</p>}
        <div className="sm:col-span-3"><button className="btn-ana">Kupon oluştur</button></div>
      </form>
      <div className="kutu overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="soluk border-b border-lacivert-100 dark:border-lacivert-800"><tr><th className="p-3">Kod</th><th className="p-3">İndirim</th><th className="p-3">Koşul</th><th className="p-3">Kullanım</th><th className="p-3">Bitiş</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y divide-lacivert-100 dark:divide-lacivert-800">
            {list.map((c) => (
              <tr key={c.id} className={c.is_active ? '' : 'opacity-50'}>
                <td className="p-3 font-mono font-semibold">{c.code}</td>
                <td className="p-3">{c.type === 'yuzde' ? `%${c.value}` : tl(c.value)}</td>
                <td className="p-3">{c.min_total > 0 ? `${tl(c.min_total)} üzeri` : '-'}</td>
                <td className="p-3">{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
                <td className="p-3">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('tr-TR') : '-'}</td>
                <td className="p-3 whitespace-nowrap text-right">
                  <button onClick={() => toggle(c)} className="mr-3 underline">{c.is_active ? 'Pasifleştir' : 'Aktifleştir'}</button>
                  <button onClick={() => sil(c)} className="text-red-600 underline">Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
