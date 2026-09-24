'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function FavoriteButton({ productId, userId, initial }) {
  const [fav, setFav] = useState(initial);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function toggle() {
    if (!userId) return router.push('/giris');
    setBusy(true);
    const supabase = createClient();
    if (fav) await supabase.from('favorites').delete().eq('user_id', userId).eq('product_id', productId);
    else await supabase.from('favorites').insert({ user_id: userId, product_id: productId });
    setFav(!fav);
    setBusy(false);
  }
  return (
    <button onClick={toggle} disabled={busy} aria-pressed={fav} className="btn-cizgi">
      <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? '#EA6A12' : 'none'} stroke={fav ? '#EA6A12' : 'currentColor'} strokeWidth="2"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>
      {fav ? 'Favorilerde' : 'Favorilere ekle'}
    </button>
  );
}
