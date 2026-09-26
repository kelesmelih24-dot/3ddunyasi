'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Page() {
  const supabase = createClient();
  const [list, setList] = useState([]);
  const load = async () => setList((await supabase.from('reviews').select('*, products(name)').order('created_at', { ascending: false })).data || []);
  useEffect(() => { load(); }, []);
  const toggle = async (r) => { await supabase.from('reviews').update({ is_approved: !r.is_approved }).eq('id', r.id); load(); };
  const sil = async (r) => { if (confirm('Yorum silinsin mi?')) { await supabase.from('reviews').delete().eq('id', r.id); load(); } };
  return (
    <div>
      <h1 className="mb-5 text-3xl font-semibold">Yorumlar</h1>
      {!list.length && <p className="kutu soluk p-6">Henüz yorum yok.</p>}
      <ul className="space-y-3">
        {list.map((r) => (
          <li key={r.id} className={`kutu p-4 text-sm ${r.is_approved ? '' : 'opacity-60'}`}>
            <div className="flex flex-wrap justify-between gap-2"><b>{r.products?.name}</b><span className="text-nozul-500">{'★'.repeat(r.rating)}</span></div>
            <p className="soluk">{r.author_name || 'Müşteri'} · {new Date(r.created_at).toLocaleDateString('tr-TR')}</p>
            <p className="mt-2">{r.comment}</p>
            <div className="mt-3 flex gap-3"><button onClick={() => toggle(r)} className="underline">{r.is_approved ? 'Gizle' : 'Yayınla'}</button><button onClick={() => sil(r)} className="text-red-600 underline">Sil</button></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
