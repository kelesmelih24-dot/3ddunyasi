import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AccountNav from '@/components/AccountNav';
import ProductCard from '@/components/ProductCard';

export const metadata = { title: 'Favorilerim' };

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from('favorites').select('products(*)').eq('user_id', user.id).order('created_at', { ascending: false });
  const products = (data || []).map((d) => d.products).filter(Boolean);
  return (
    <div className="kap py-10">
      <h1 className="mb-6 text-3xl font-bold">Hesabım</h1>
      <AccountNav active="/hesabim/favoriler" />
      {products.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : (
        <div className="kutu p-10 text-center"><p className="font-semibold">Favori listeniz boş</p><p className="soluk mt-1 text-sm">Beğendiğiniz ürünleri ürün sayfasındaki kalp düğmesiyle kaydedebilirsiniz.</p><Link href="/baski-urunleri" className="btn-ana mt-4">Ürünlere göz at</Link></div>
      )}
    </div>
  );
}
