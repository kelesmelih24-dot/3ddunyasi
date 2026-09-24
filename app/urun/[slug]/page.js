import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { tl, BOLUMLER } from '@/lib/format';
import AddToCart from '@/components/AddToCart';
import FavoriteButton from '@/components/FavoriteButton';
import Reviews from '@/components/Reviews';
import Gallery from '@/components/Gallery';

export async function generateMetadata({ params }) {
  const supabase = createClient();
  const { data } = await supabase.from('products').select('name, description, images').eq('slug', params.slug).single();
  if (!data) return {};
  return { title: data.name, description: data.description?.slice(0, 160), openGraph: { images: data.images?.slice(0, 1) } };
}

export default async function ProductPage({ params }) {
  const supabase = createClient();
  const { data: p } = await supabase.from('products').select('*, categories(name, slug)').eq('slug', params.slug).single();
  if (!p || p.section === 'yazici') notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: reviews }, favRes, ordRes, profRes] = await Promise.all([
    supabase.from('reviews').select('*').eq('product_id', p.id).order('created_at', { ascending: false }),
    user ? supabase.from('favorites').select('product_id').eq('user_id', user.id).eq('product_id', p.id).maybeSingle() : { data: null },
    user ? supabase.from('order_items').select('id, orders!inner(user_id, status)').eq('product_id', p.id).eq('orders.user_id', user.id).eq('orders.status', 'teslim_edildi').limit(1) : { data: [] },
    user ? supabase.from('profiles').select('full_name').eq('id', user.id).single() : { data: null },
  ]);
  const ort = reviews?.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const bolum = BOLUMLER[p.section];

  return (
    <div className="kap py-8">
      <nav aria-label="Konum" className="soluk mb-6 text-sm">
        <Link href={bolum.yol} className="hover:underline">{bolum.ad}</Link>
        {p.categories && <> / <Link href={`${bolum.yol}?kategori=${p.categories.slug}`} className="hover:underline">{p.categories.name}</Link></>}
      </nav>
      <div className="grid gap-10 md:grid-cols-2">
        <Gallery images={p.images?.length ? p.images : ['/ornek/yazici.svg']} alt={p.name} />
        <div>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{p.name}</h1>
          {ort && <p className="soluk mt-2 text-sm">★ {ort} · {reviews.length} değerlendirme</p>}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold">{tl(p.sale_unit === 'paket' ? p.pack_price ?? p.price * p.pack_size : p.price)}</span>
            {p.sale_unit === 'paket' && <span className="soluk text-sm">{p.pack_size}'li paket</span>}
            {p.compare_price > p.price && <span className="soluk line-through">{tl(p.compare_price)}</span>}
          </div>
          <p className="mt-5 whitespace-pre-line leading-7 text-lacivert-600 dark:text-lacivert-100">{p.description}</p>
          <div className="mt-8"><AddToCart product={p} /></div>
          <div className="mt-4"><FavoriteButton productId={p.id} userId={user?.id} initial={!!favRes.data} /></div>
          <ul className="soluk mt-8 space-y-1.5 border-t border-lacivert-100 pt-6 text-sm dark:border-lacivert-800">
            <li>Belirli tutarın üzerindeki siparişlerde kargo ücretsiz</li>
            <li>Kredi kartı veya havale/EFT ile ödeme</li>
            <li><Link href="/iade-ve-degisim" className="underline">İade ve değişim koşulları</Link></li>
          </ul>
        </div>
      </div>
      <Reviews productId={p.id} reviews={reviews || []} user={user} canReview={(ordRes.data || []).length > 0} authorName={profRes.data?.full_name} />
    </div>
  );
}
