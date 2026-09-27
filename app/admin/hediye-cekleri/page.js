'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { tl } from '@/lib/format';

export default function Page() {
  const supabase = createClient();
  const [list, setList] = useState([]);
  const [tutar, setTutar] = useState(250);
  const [not, setNot] = useState('');
  const load = async () => setList((await supabase.from('gift_cards').select('*, orders(order_no)').order('created_at', { ascending: false })).data || []);
  useEffect(() => { load(); }, []);
  async function olustur(e) {
    e.preventDefault();
    if (!(+tutar > 0)) return;
    const code = 'HC-' + Array.from(crypto.getRandomValues(new Uint8Array(5))).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    await supabase.from('gift_cards').insert({ code, initial_amount: +tutar, balance: +tutar, message: not || null });
    setNot(''); load();
  }
  const toggle = async (g) => { await supabase.from('gift_cards').update({ is_active: !g.is_active }).eq('id', g.id); load(); };
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Hediye çekleri</h1>
      <p className="soluk -mt-4 text-sm">Sitede satın alınan çekler, havale ödemesini onayladığınızda otomatik oluşur ve alıcıya e-postayla gider. Buradan elle de (çekiliş, telafi vb.) çek oluşturabilirsiniz.</p>
      <form onSubmit={olustur} className="kutu flex flex-wrap items-end gap-3 p-5">
        <div><label className="etiket" htmlFor="t">Tutar (TL)</label><input id="t" type="number" className="girdi w-32" value={tutar} onChange={(e) => setTutar(e.target.value)} /></div>
        <div className="flex-1"><label className="etiket" htmlFor="n">Not (isteğe bağlı)</label><input id="n" className="girdi" value={not} onChange={(e) => setNot(e.target.value)} placeholder="Instagram çekilişi" /></div>
        <button className="btn-ana">Çek oluştur</button>
      </form>
      <div className="kutu overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="soluk border-b border-lacivert-100 dark:border-lacivert-800"><tr><th className="p-3">Kod</th><th className="p-3">Tutar</th><th className="p-3">Kalan</th><th className="p-3">Alıcı / not</th><th className="p-3">Sipariş</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y divide-lacivert-100 dark:divide-lacivert-800">
            {list.map((g) => (
              <tr key={g.id} className={g.is_active ? '' : 'opacity-50'}>
                <td className="p-3 font-mono font-semibold">{g.code}</td><td className="p-3">{tl(g.initial_amount)}</td><td className="p-3 font-semibold">{tl(g.balance)}</td>
                <td className="p-3">{g.recipient_name || g.recipient_email || g.message || '-'}</td><td className="p-3">{g.orders?.order_no || 'Elle'}</td>
                <td className="p-3 text-right"><button onClick={() => toggle(g)} className="underline">{g.is_active ? 'Pasifleştir' : 'Aktifleştir'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <p className="soluk p-6 text-center">Henüz hediye çeki yok.</p>}
      </div>
    </div>
  );
}
