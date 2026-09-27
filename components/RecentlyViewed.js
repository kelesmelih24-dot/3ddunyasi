'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tl } from '@/lib/format';

const KEY = '3dd-son-bakilan';

// Ürün sayfasında kaydeder (kaydet prop'u), istenen yerde son bakılanları listeler.
export default function RecentlyViewed({ kaydet, haric, baslik = 'Son baktığınız ürünler' }) {
  const [list, setList] = useState([]);
  useEffect(() => {
    let l = [];
    try { l = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch {}
    if (kaydet) {
      l = [kaydet, ...l.filter((p) => p.slug !== kaydet.slug)].slice(0, 12);
      try { localStorage.setItem(KEY, JSON.stringify(l)); } catch {}
    }
    setList(l.filter((p) => p.slug !== haric).slice(0, 6));
  }, [kaydet?.slug, haric]);
  if (!list.length) return null;
  return (
    <section>
      <h2 className="text-2xl font-semibold">{baslik}</h2>
      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {list.map((p) => (
          <Link key={p.slug} href={`/urun/${p.slug}`} className="zipla w-40 shrink-0">
            <div className="aspect-square overflow-hidden rounded-2xl bg-krem dark:bg-lacivert-900"><img src={p.image || '/ornek/yazici.svg'} alt="" loading="lazy" className="h-full w-full object-cover" /></div>
            <p className="mt-2 line-clamp-2 text-sm font-semibold">{p.name}</p>
            <p className="text-sm">{tl(p.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
