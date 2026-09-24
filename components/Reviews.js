'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function Yildiz({ n }) {
  return <span className="text-nozul-500" aria-label={`5 üzerinden ${n}`}>{'★'.repeat(n)}<span className="text-lacivert-200">{'★'.repeat(5 - n)}</span></span>;
}

export default function Reviews({ productId, reviews, user, canReview, authorName }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const mine = reviews.find((r) => r.user_id === user?.id);

  async function gonder(e) {
    e.preventDefault();
    if (comment.trim().length < 5) return setErr('Yorumunuz en az 5 karakter olmalı.');
    setBusy(true);
    const { error } = await createClient().from('reviews').insert({
      product_id: productId, user_id: user.id, rating, comment: comment.trim(), author_name: authorName,
    });
    setBusy(false);
    if (error) return setErr('Yorum kaydedilemedi. Bu ürünü teslim almış olmanız gerekir.');
    setComment('');
    router.refresh();
  }

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold">Değerlendirmeler</h2>
      {reviews.length === 0 && <p className="soluk mt-2">Bu ürün için henüz değerlendirme yok.</p>}
      <ul className="mt-4 divide-y divide-lacivert-100 dark:divide-lacivert-800">
        {reviews.map((r) => (
          <li key={r.id} className="py-4">
            <div className="flex items-center gap-3 text-sm"><Yildiz n={r.rating} /><span className="font-semibold">{r.author_name || 'Müşteri'}</span>
              <span className="soluk text-xs">{new Date(r.created_at).toLocaleDateString('tr-TR')}</span></div>
            {r.comment && <p className="mt-1.5 leading-7">{r.comment}</p>}
          </li>
        ))}
      </ul>
      {user && canReview && !mine && (
        <form onSubmit={gonder} className="kutu mt-6 max-w-xl space-y-3 p-5">
          <h3 className="font-sans font-semibold">Ürünü değerlendirin</h3>
          <div className="flex gap-1" role="radiogroup" aria-label="Puan">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)} role="radio" aria-checked={rating === n}
                className={`text-2xl ${n <= rating ? 'text-nozul-500' : 'text-lacivert-200'}`}>★</button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => { setComment(e.target.value); setErr(''); }} rows={3} className="girdi" placeholder="Ürün hakkındaki görüşleriniz" />
          {err && <p className="hata">{err}</p>}
          <button disabled={busy} className="btn-koyu">Değerlendirmeyi gönder</button>
        </form>
      )}
      {user && !canReview && !mine && <p className="soluk mt-4 text-sm">Değerlendirme yapabilmek için bu ürünü satın alıp teslim almış olmanız gerekir.</p>}
    </section>
  );
}
