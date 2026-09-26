import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="kap grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="font-display text-[7rem] font-semibold leading-none text-nozul-500 sm:text-[10rem]" aria-hidden="true">404</p>
        <h1 className="mt-4 text-3xl font-semibold">Bu sayfa henüz basılmamış</h1>
        <p className="soluk mx-auto mt-3 max-w-md">Aradığınız sayfa taşınmış veya kaldırılmış olabilir.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn-ana">Ana sayfaya dön</Link>
          <Link href="/baski-urunleri" className="btn-cizgi">Ürünlere göz at</Link>
        </div>
      </div>
    </div>
  );
}
