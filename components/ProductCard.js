import Link from 'next/link';
import { tl, efektifFiyat, indirimAktif } from '@/lib/format';
import SaleCountdown from './SaleCountdown';

export default function ProductCard({ p, rating }) {
  const img = p.images?.[0] || '/ornek/yazici.svg';
  const kapali = p.is_for_sale === false;
  const tukendi = !kapali && p.stock <= 0;
  const pasif = kapali || tukendi;
  const gosterFiyat = p.sale_unit === 'paket' ? p.pack_price ?? efektifFiyat(p) * p.pack_size : efektifFiyat(p);
  const indirim = indirimAktif(p);
  return (
    <Link href={`/urun/${p.slug}`} className="group block" aria-label={kapali ? `${p.name} (satışa kapalı)` : tukendi ? `${p.name} (stokta yok)` : undefined}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-krem dark:bg-lacivert-900">
        <img src={img} alt={p.name} loading="lazy" className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05] ${kapali ? 'opacity-40 grayscale' : tukendi ? 'opacity-70' : ''}`} />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {indirim && !pasif && <span className="rounded-full bg-nozul-500 px-2.5 py-1 text-[11px] font-bold text-white">%{Math.round((1 - p.price / p.compare_price) * 100)} indirim</span>}
          {indirim && p.sale_ends_at && !pasif && <SaleCountdown bitis={p.sale_ends_at} kucuk />}
          {Array.isArray(p.bundle_items) && p.bundle_items.length > 0 && <span className="rounded-full bg-lacivert-800 px-2.5 py-1 text-[11px] font-bold text-white">Set</span>}
          {p.allow_personalization && !pasif && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-lacivert-800 shadow-sm">Kişiselleştirilebilir</span>}
        </div>
        {tukendi && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-lacivert-800 shadow-md dark:bg-lacivert-950/90 dark:text-white">Stokta yok</span>
          </div>
        )}
        {kapali && (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 125" preserveAspectRatio="none">
              <path d="M12 15 88 110M88 15 12 110" stroke="#B91C1C" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 10 }} />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="-rotate-6 rounded-xl border-[3px] border-red-700 bg-white px-4 py-1.5 font-display text-base font-bold uppercase tracking-wide text-red-700 shadow-lg">Satışa kapalı</span>
            </div>
          </div>
        )}
        <span className="absolute bottom-3 right-3 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-white text-lacivert-800 opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
      <div className="mt-4">
        <h3 className="font-sans text-[15px] font-semibold leading-5 transition-colors group-hover:text-nozul-600 dark:group-hover:text-nozul-300">{p.name}</h3>
        {rating && <p className="soluk mt-1 text-xs"><span className="text-nozul-500">★</span> {rating.avg_rating} · {rating.review_count} değerlendirme</p>}
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className={`font-bold ${pasif ? "soluk" : ""}`}>{tl(gosterFiyat)}</span>
          {p.sale_unit === 'paket' && <span className="soluk text-xs">{p.pack_size}'li paket</span>}
          {indirim && <span className="soluk text-xs line-through">{tl(p.compare_price)}</span>}
        </div>
        {p.sale_unit === 'ikisi' && <p className="soluk text-xs">{p.pack_size}'li paket {tl(p.pack_price)}</p>}
      </div>
    </Link>
  );
}
