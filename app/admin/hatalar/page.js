'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Page() {
  const db = createClient();
  const [list, setList] = useState(null);
  const [acik, setAcik] = useState(null);
  const load = async () => setList((await db.from('error_logs').select('*').order('last_seen', { ascending: false }).limit(100)).data || []);
  useEffect(() => { load(); }, []);
  async function temizle(id) { await (id ? db.from('error_logs').delete().eq('id', id) : db.from('error_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')); load(); }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-semibold">Site hataları</h1><p className="soluk mt-1 text-sm">Ziyaretçilerin tarayıcısında oluşan hatalar burada toplanır. Yeni bir hata ilk görüldüğünde Telegram'a bildirim gider. Tekrarlayan bir hata görürseniz bana ekran görüntüsünü atın.</p></div>{list?.length > 0 && <button onClick={() => confirm('Tüm kayıtlar silinsin mi?') && temizle()} className="btn-cizgi">Hepsini temizle</button>}</div>
      {list === null ? <p className="soluk">Yükleniyor…</p> : !list.length ? <p className="kutu p-6 text-center">🎉 Kayıtlı hata yok.</p> : (
        <ul className="space-y-2">{list.map((h) => (
          <li key={h.id} className="kutu p-4 text-sm">
            <div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-200">{h.count}×</span><code className="flex-1 break-all">{h.message}</code><span className="soluk text-xs">{new Date(h.last_seen).toLocaleString('tr-TR')}</span></div>
            <p className="soluk mt-1 break-all text-xs">{h.url}</p>
            <div className="mt-2 flex gap-3 text-xs"><button onClick={() => setAcik(acik === h.id ? null : h.id)} className="underline">Ayrıntı</button><button onClick={() => temizle(h.id)} className="underline">Çözüldü, sil</button></div>
            {acik === h.id && <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-krem p-3 text-[11px] dark:bg-lacivert-900">{h.stack || '-'}{'\n\n'}{h.user_agent}</pre>}
          </li>))}</ul>
      )}
    </div>
  );
}
