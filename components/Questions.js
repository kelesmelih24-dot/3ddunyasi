'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function Questions({ productId, productName, questions, user, authorName }) {
  const [soru, setSoru] = useState('');
  const [durum, setDurum] = useState('');
  async function gonder(e) {
    e.preventDefault();
    if (soru.trim().length < 5) return setDurum('hata:Sorunuz en az 5 karakter olmalı.');
    const { data, error } = await createClient().from('product_questions')
      .insert({ product_id: productId, user_id: user.id, author_name: authorName, question: soru.trim() }).select('id').single();
    if (error) return setDurum('hata:Soru gönderilemedi, tekrar deneyin.');
    fetch('/api/bildirim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tur: 'soru', id: data.id }) });
    setSoru(''); setDurum('tamam');
  }
  const cevapli = questions.filter((q) => q.answer);
  const bekleyen = questions.filter((q) => !q.answer && q.user_id === user?.id);
  return (
    <section id="sorular" className="scroll-mt-28">
      <h2 className="text-2xl font-semibold">Soru ve cevaplar</h2>
      {cevapli.length === 0 && <p className="soluk mt-2">Bu ürün hakkında henüz soru sorulmamış. İlk soran siz olun.</p>}
      <ul className="mt-4 space-y-4">
        {cevapli.map((q) => (
          <li key={q.id} className="kutu p-5">
            <p className="font-semibold"><span className="mr-2 text-nozul-500">S:</span>{q.question}</p>
            <p className="mt-2 leading-7"><span className="mr-2 font-semibold text-lacivert-800 dark:text-white">C:</span>{q.answer}</p>
            <p className="soluk mt-2 text-xs">{q.author_name || 'Müşteri'} sordu · 3D Dünyası yanıtladı</p>
          </li>
        ))}
        {bekleyen.map((q) => (
          <li key={q.id} className="rounded-2xl border border-dashed border-lacivert-200 p-5 text-sm dark:border-lacivert-600">
            <p className="font-semibold">{q.question}</p>
            <p className="soluk mt-1">Sorunuz yanıt bekliyor. Yanıtlandığında burada görünecek.</p>
          </li>
        ))}
      </ul>
      {user ? (
        <form onSubmit={gonder} className="mt-5 max-w-xl space-y-3">
          <label htmlFor="soru" className="etiket">{productName} hakkında sorunuz</label>
          <textarea id="soru" rows={3} maxLength={600} value={soru} onChange={(e) => { setSoru(e.target.value); setDurum(''); }} className="girdi" placeholder="Örnek: Bu ürün dış mekânda kullanılabilir mi?" />
          {durum.startsWith('hata:') && <p className="hata">{durum.slice(5)}</p>}
          {durum === 'tamam' && <p className="basari">Sorunuz bize ulaştı. Yanıtladığımızda burada yayınlanacak.</p>}
          <button className="btn-koyu">Soruyu gönder</button>
        </form>
      ) : (
        <p className="soluk mt-4 text-sm">Soru sormak için <Link href="/giris" className="font-semibold underline">giriş yapın</Link>.</p>
      )}
    </section>
  );
}
