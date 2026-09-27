'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Ürün listesinde: satışa aç/kapat ve sil
export default function ProductRowActions({ id, name, isForSale }) {
  const router = useRouter();
  const [satista, setSatista] = useState(isForSale !== false);
  const [busy, setBusy] = useState(false);
  async function degistir() {
    setBusy(true);
    const { error } = await createClient().from('products').update({ is_for_sale: !satista }).eq('id', id);
    setBusy(false);
    if (!error) { setSatista(!satista); router.refresh(); } else alert('Değiştirilemedi: ' + error.message);
  }
  async function sil() {
    if (!confirm(`"${name}" kalıcı olarak silinsin mi?\n\nGeçmiş siparişlerde ürün adı ve fiyatı korunur. Sadece gizlemek istiyorsanız "Satışa kapat" veya ürün sayfasından "Sitede yayında" işaretini kaldırın.`)) return;
    setBusy(true);
    const { error } = await createClient().from('products').delete().eq('id', id);
    setBusy(false);
    if (error) alert('Silinemedi: ' + error.message); else router.refresh();
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={degistir} disabled={busy} className={`rounded-full px-3 py-1 text-xs font-bold ${satista ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200'}`}
        title={satista ? 'Tıklayınca satışa kapanır' : 'Tıklayınca satışa açılır'}>
        {satista ? '● Satışta' : '× Satışa kapalı'}
      </button>
      <button onClick={degistir} disabled={busy} className="text-xs underline">{satista ? 'Kapat' : 'Aç'}</button>
      <button onClick={sil} disabled={busy} className="text-xs text-red-600 underline">Sil</button>
    </div>
  );
}
