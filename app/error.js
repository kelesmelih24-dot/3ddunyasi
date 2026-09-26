'use client';
import Link from 'next/link';

export default function Error({ reset }) {
  return (
    <div className="kap grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="ust-etiket">Bir şeyler ters gitti</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Baskı yarıda kaldı</h1>
        <p className="soluk mx-auto mt-3 max-w-md">Sayfa yüklenirken beklenmedik bir hata oluştu. Tekrar denemek genellikle işe yarar.</p>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => reset()} className="btn-ana">Tekrar dene</button>
          <Link href="/" className="btn-cizgi">Ana sayfa</Link>
        </div>
      </div>
    </div>
  );
}
