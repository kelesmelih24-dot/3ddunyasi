'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { slugify, BOLUMLER } from '@/lib/format';

export default function Page() {
  const supabase = createClient();
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [section, setSection] = useState('baski');
  const [err, setErr] = useState('');
  const load = async () => setList((await supabase.from('categories').select('*').order('section').order('sort')).data || []);
  useEffect(() => { load(); }, []);
  async function ekle(e) {
    e.preventDefault();
    if (!name.trim()) return setErr('Kategori adını girin.');
    const sort = list.filter((c) => c.section === section).length + 1;
    const { error } = await supabase.from('categories').insert({ name: name.trim(), slug: slugify(name), section, sort });
    if (error) return setErr('Bu kategori zaten var.');
    setName(''); setErr(''); load();
  }
  async function yenidenAdlandir(c) {
    const n = prompt('Yeni kategori adı', c.name);
    if (n && n.trim()) { await supabase.from('categories').update({ name: n.trim() }).eq('id', c.id); load(); }
  }
  async function sil(c) {
    if (confirm(`"${c.name}" silinsin mi? Bu kategorideki ürünler kategorisiz kalır.`)) { await supabase.from('categories').delete().eq('id', c.id); load(); }
  }
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Kategoriler</h1>
      <form onSubmit={ekle} className="kutu flex flex-wrap items-end gap-3 p-5">
        <div><label className="etiket" htmlFor="b">Bölüm</label><select id="b" className="girdi" value={section} onChange={(e) => setSection(e.target.value)}>{Object.entries(BOLUMLER).map(([k, v]) => <option key={k} value={k}>{v.ad}</option>)}</select></div>
        <div className="flex-1"><label className="etiket" htmlFor="n">Kategori adı</label><input id="n" className="girdi" value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} /></div>
        <button className="btn-ana">Ekle</button>
        {err && <p className="hata w-full">{err}</p>}
      </form>
      {Object.entries(BOLUMLER).map(([k, v]) => (
        <section key={k}>
          <h2 className="mb-2 font-sans font-semibold">{v.ad}</h2>
          <ul className="kutu divide-y divide-lacivert-100 text-sm dark:divide-lacivert-800">
            {list.filter((c) => c.section === k).map((c) => (
              <li key={c.id} className="flex items-center justify-between p-3"><span>{c.name} <span className="soluk text-xs">/{c.slug}</span></span>
                <span><button onClick={() => yenidenAdlandir(c)} className="mr-3 underline">Adını değiştir</button><button onClick={() => sil(c)} className="text-red-600 underline">Sil</button></span></li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
