'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CustomerNotes({ customerId, notlar, yazar }) {
  const router = useRouter();
  const [not, setNot] = useState('');
  async function ekle(e) { e.preventDefault(); if (!not.trim()) return; await createClient().from('customer_notes').insert({ customer_id: customerId, note: not.trim(), author: yazar }); setNot(''); router.refresh(); }
  async function sil(id) { if (confirm('Not silinsin mi?')) { await createClient().from('customer_notes').delete().eq('id', id); router.refresh(); } }
  return (
    <section className="kutu p-5">
      <h2 className="font-sans font-semibold">Notlarınız</h2>
      <p className="soluk text-xs">Sadece ekip görür. Örnek: "Pastel renkleri seviyor", "Kargoyu iş yerine istiyor".</p>
      <form onSubmit={ekle} className="mt-3 flex gap-2"><input value={not} onChange={(e) => setNot(e.target.value)} className="girdi py-2" placeholder="Not ekle" aria-label="Not" /><button className="btn-ana py-2">Ekle</button></form>
      <ul className="mt-3 space-y-2 text-sm">{notlar.map((n) => <li key={n.id} className="rounded-xl bg-krem p-3 dark:bg-lacivert-800"><p>{n.note}</p><p className="soluk mt-1 flex justify-between text-xs"><span>{n.author} · {new Date(n.created_at).toLocaleDateString('tr-TR')}</span><button onClick={() => sil(n.id)} className="underline">sil</button></p></li>)}</ul>
    </section>
  );
}
