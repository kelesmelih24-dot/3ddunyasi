'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { tarih } from '@/lib/format';

const DURUM = { yeni: 'Yeni', gorusuluyor: 'Görüşülüyor', teklif_verildi: 'Teklif verildi', kazanildi: 'Kazanıldı', kaybedildi: 'Kaybedildi' };

export default function Page() {
  const supabase = createClient();
  const [list, setList] = useState(null);
  const load = async () => setList((await supabase.from('corporate_requests').select('*').order('created_at', { ascending: false })).data || []);
  useEffect(() => { load(); }, []);
  const guncelle = async (k, alan, v) => { await supabase.from('corporate_requests').update({ [alan]: v }).eq('id', k.id); load(); };
  return (
    <div>
      <h1 className="mb-5 text-3xl font-semibold">Kurumsal talepler</h1>
      {list === null ? <p className="soluk">Yükleniyor…</p> : !list.length ? <p className="kutu soluk p-6">Henüz kurumsal talep yok.</p> : (
        <ul className="space-y-4">
          {list.map((k) => (
            <li key={k.id} className="kutu space-y-2 p-5 text-sm">
              <div className="flex flex-wrap justify-between gap-2"><b className="text-base">{k.company}</b><span className="soluk">{tarih(k.created_at)}</span></div>
              <p>{k.full_name} · <a href={`mailto:${k.email}`} className="underline">{k.email}</a>{k.phone && <> · <a href={`tel:${k.phone}`} className="underline">{k.phone}</a></>} · Adet: {k.quantity || '-'}</p>
              <p className="leading-6">{k.details}</p>
              <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
                <select value={k.status} onChange={(e) => guncelle(k, 'status', e.target.value)} className="girdi" aria-label="Durum">{Object.entries(DURUM).map(([a, b]) => <option key={a} value={a}>{b}</option>)}</select>
                <input defaultValue={k.admin_note || ''} onBlur={(e) => e.target.value !== (k.admin_note || '') && guncelle(k, 'admin_note', e.target.value)} className="girdi" placeholder="İç not (sadece siz görürsünüz)" aria-label="Not" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
