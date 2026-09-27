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
  const [files, setFiles] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [buyuk, setBuyuk] = useState(null);
  const router = useRouter();
  const mine = reviews.find((r) => r.user_id === user?.id);
  const fotolu = reviews.flatMap((r) => r.images || []);

  async function gonder(e) {
    e.preventDefault();
    if (comment.trim().length < 5) return setErr('Yorumunuz en az 5 karakter olmalı.');
    if (files.length > 4) return setErr('En fazla 4 fotoğraf ekleyebilirsiniz.');
    setBusy(true);
    const supabase = createClient();
    const images = [];
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) { setBusy(false); return setErr(`${f.name} 5 MB'tan büyük.`); }
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${f.name.split('.').pop().toLowerCase()}`;
      const { error } = await supabase.storage.from('yorum-gorselleri').upload(path, f);
      if (!error) images.push(supabase.storage.from('yorum-gorselleri').getPublicUrl(path).data.publicUrl);
    }
    const { error } = await supabase.from('reviews').insert({ product_id: productId, user_id: user.id, rating, comment: comment.trim(), author_name: authorName, images });
    setBusy(false);
    if (error) return setErr('Yorum kaydedilemedi. Bu ürünü teslim almış olmanız gerekir.');
    setComment(''); setFiles([]);
    router.refresh();
  }

  const ort = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <section id="yorumlar" className="scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-semibold">Değerlendirmeler</h2>
        {ort && <p className="text-sm"><span className="font-display text-2xl font-semibold">{ort}</span> <span className="soluk">/ 5 · {reviews.length} değerlendirme</span></p>}
      </div>
      {fotolu.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {fotolu.map((src) => (
            <button key={src} onClick={() => setBuyuk(src)} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" aria-label="Müşteri fotoğrafını büyüt"><img src={src} alt="Müşteri fotoğrafı" loading="lazy" className="h-full w-full object-cover" /></button>
          ))}
        </div>
      )}
      {reviews.length === 0 && <p className="soluk mt-2">Bu ürün için henüz değerlendirme yok.</p>}
      <ul className="mt-4 divide-y divide-lacivert-100 dark:divide-lacivert-800">
        {reviews.map((r) => (
          <li key={r.id} className="py-5">
            <div className="flex flex-wrap items-center gap-3 text-sm"><Yildiz n={r.rating} /><span className="font-semibold">{r.author_name || 'Müşteri'}</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">Doğrulanmış alışveriş</span>
              <span className="soluk text-xs">{new Date(r.created_at).toLocaleDateString('tr-TR')}</span></div>
            {r.comment && <p className="mt-2 leading-7">{r.comment}</p>}
            {r.images?.length > 0 && (
              <div className="mt-3 flex gap-2">{r.images.map((src) => (
                <button key={src} onClick={() => setBuyuk(src)} className="h-16 w-16 overflow-hidden rounded-lg" aria-label="Fotoğrafı büyüt"><img src={src} alt="" className="h-full w-full object-cover" /></button>
              ))}</div>
            )}
          </li>
        ))}
      </ul>
      {user && canReview && !mine && (
        <form onSubmit={gonder} className="kutu mt-6 max-w-xl space-y-3 p-5">
          <h3 className="font-sans font-semibold">Ürünü değerlendirin</h3>
          <div className="flex gap-1" role="radiogroup" aria-label="Puan">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)} role="radio" aria-checked={rating === n} aria-label={`${n} yıldız`}
                className={`text-3xl transition-transform hover:scale-110 ${n <= rating ? 'text-nozul-500' : 'text-lacivert-200'}`}>★</button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => { setComment(e.target.value); setErr(''); }} rows={3} className="girdi" placeholder="Ürün hakkındaki görüşleriniz" aria-label="Yorumunuz" />
          <label className="block text-sm">
            <span className="etiket">Fotoğraf ekleyin (en fazla 4)</span>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...(e.target.files || [])].slice(0, 4))}
              className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-lacivert-800 file:px-4 file:py-2 file:font-semibold file:text-white" />
          </label>
          {err && <p className="hata">{err}</p>}
          <button disabled={busy} className="btn-koyu">{busy ? 'Gönderiliyor…' : 'Değerlendirmeyi gönder'}</button>
        </form>
      )}
      {user && !canReview && !mine && <p className="soluk mt-4 text-sm">Değerlendirme yapabilmek için bu ürünü satın alıp teslim almış olmanız gerekir.</p>}
      {buyuk && (
        <button onClick={() => setBuyuk(null)} className="fixed inset-0 z-[70] grid place-items-center bg-lacivert-950/80 p-6" aria-label="Kapat">
          <img src={buyuk} alt="Müşteri fotoğrafı" className="max-h-full max-w-full rounded-2xl" />
        </button>
      )}
    </section>
  );
}
