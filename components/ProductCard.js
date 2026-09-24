import Link from 'next/link';
import { tl } from '@/lib/format';

export default function ProductCard({ p, rating }) {
  const img = p.images?.[0] || '/ornek/yazici.svg';
  const tukendi = p.stock <= 0;
  return (
    <Link href={`/urun/${p.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-lacivert-50 dark:bg-lacivert-900">
        <img src={img} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        {p.compare_price > p.price && !tukendi && (
          <span className="absolute left-2 top-2 rounded bg-nozul-500 px-2 py-0.5 text-xs font-bold text-white">
            %{Math.round((1 - p.price / p.compare_price) * 100)} indirim
          </span>
        )}
        {tukendi && <span className="absolute left-2 top-2 rounded bg-lacivert-800 px-2 py-0.5 text-xs font-bold text-white">Tükendi</span>}
      </div>
      <div className="mt-3">
        <h3 className="font-sans text-sm font-semibold leading-5 group-hover:text-nozul-600 dark:group-hover:text-nozul-300">{p.name}</h3>
        {rating && <p className="soluk mt-0.5 text-xs">★ {rating.avg_rating} ({rating.review_count} değerlendirme)</p>}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-bold">{tl(p.price)}</span>
          {p.sale_unit !== 'paket' ? null : <span className="soluk text-xs">/ adet, {p.pack_size}'li paket</span>}
          {p.compare_price > p.price && <span className="soluk text-xs line-through">{tl(p.compare_price)}</span>}
        </div>
        {p.sale_unit === 'ikisi' && <p className="soluk text-xs">{p.pack_size}'li paket: {tl(p.pack_price)}</p>}
      </div>
    </Link>
  );
}
