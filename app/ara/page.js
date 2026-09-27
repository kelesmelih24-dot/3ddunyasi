import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProductCard from '@/components/ProductCard';

export async function generateMetadata({ searchParams }) { return { title: `"${searchParams?.q || ''}" arama sonuçları`, robots: { index: false } }; }

export default async function Page({ searchParams }) {
  const q = (searchParams?.q || '').trim().replace(/[%_,()]/g, ' ');
  const { data } = q.length >= 2
    ? await createClient().from('products').select('*').eq('is_active', true).neq('section', 'yazici').or(`name.ilike.%${q}%,description.ilike.%${q}%`).limit(60)
    : { data: [] };
  return (
    <div className="kap py-10">
      <p className="ust-etiket">Arama</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">"{q}"</h1>
      <p className="soluk mt-2">{data?.length || 0} ürün bulundu</p>
      {data?.length ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">{data.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : (
        <div className="kutu mt-8 p-10 text-center">
          <p className="font-semibold">Aradığınızı bulamadık</p>
          <p className="soluk mt-1 text-sm">Farklı bir kelime deneyin ya da aradığınızı size özel basalım.</p>
          <Link href="/ozel-siparis" className="btn-ana mt-4">Özel sipariş ver</Link>
        </div>
      )}
    </div>
  );
}
