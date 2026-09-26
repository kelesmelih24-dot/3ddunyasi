'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Page() {
  const supabase = createClient();
  const [list, setList] = useState(null);
  const load = async () => setList((await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false })).data || []);
  useEffect(() => { load(); }, []);
  function indir() {
    const csv = 'e-posta,kayit_tarihi\n' + list.map((a) => `${a.email},${new Date(a.created_at).toLocaleString('tr-TR')}`).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    Object.assign(document.createElement('a'), { href: url, download: 'bulten-aboneleri.csv' }).click();
    URL.revokeObjectURL(url);
  }
  async function sil(a) { if (confirm(`${a.email} listeden çıkarılsın mı?`)) { await supabase.from('newsletter_subscribers').delete().eq('id', a.id); load(); } }
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Bülten aboneleri</h1>
        {list?.length > 0 && <button onClick={indir} className="btn-ana">Excel/CSV olarak indir</button>}
      </div>
      <p className="soluk mb-5 mt-1 text-sm">{list ? `${list.length} abone` : 'Yükleniyor…'}. Toplu e-posta için listeyi indirip Resend, Mailchimp gibi bir servise aktarabilirsiniz.</p>
      <ul className="kutu divide-y divide-lacivert-100 text-sm dark:divide-lacivert-800">
        {(list || []).map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 p-3">
            <span>{a.email}</span>
            <span className="flex items-center gap-4"><span className="soluk text-xs">{new Date(a.created_at).toLocaleDateString('tr-TR')}</span><button onClick={() => sil(a)} className="text-red-600 underline">Sil</button></span>
          </li>
        ))}
        {list?.length === 0 && <li className="soluk p-6 text-center">Henüz abone yok.</li>}
      </ul>
    </div>
  );
}
