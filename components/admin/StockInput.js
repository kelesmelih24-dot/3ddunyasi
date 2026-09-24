'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function StockInput({ id, initial }) {
  const [v, setV] = useState(initial);
  const [state, setState] = useState('');
  async function save() {
    if (Number(v) === initial && state !== 'saved') return;
    const { error } = await createClient().from('products').update({ stock: Math.max(0, Number(v) || 0) }).eq('id', id);
    setState(error ? 'err' : 'saved');
  }
  return (
    <div className="flex items-center gap-2">
      <input type="number" min={0} value={v} onChange={(e) => { setV(e.target.value); setState(''); }} onBlur={save}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} aria-label="Stok adedi"
        className={`girdi w-20 py-1 ${Number(v) < 5 ? 'border-red-300' : ''}`} />
      {state === 'saved' && <span className="text-xs text-emerald-600">Kaydedildi</span>}
      {state === 'err' && <span className="text-xs text-red-600">Hata</span>}
    </div>
  );
}
