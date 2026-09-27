import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { tl, BOLUMLER } from '@/lib/format';
import AddToCart from '@/components/AddToCart';
import FavoriteButton from '@/components/FavoriteButton';
import Reviews from '@/components/Reviews';
import Questions from '@/components/Questions';
import Gallery from '@/components/Gallery';
import ProductCard from '@/components/ProductCard';
import RecentlyViewed from '@/components/RecentlyViewed';
import SaleCountdown from '@/components/SaleCountdown';
import { efektifFiyat, indirimAktif } from '@/lib/format';

export async function generateMetadata({ params }) {
  const supabase = createClient();
  const { data } = await supabase.from('products').select('name, description, images').eq('slug', params.slug).single();
  if (!data) return {};
  return { title: data.name, description: data.description?.slice(0, 160), openGraph: { images: data.images?.slice(0, 1) } };
}

export default async function ProductPage({ params }) {
  const supabase = createClient();
  const { data: p } = await supabase.from('products').select('*, categories(name, slug)').eq('slug', params.slug).single();
  if (!p) notFound();
  const yakinda = p.section === 'yazici';
  const { data: kardesler } = p.group_key ? await supabase.from('products').select('slug, variant_label, price').eq('group_key', p.group_key).eq('is_active', true).order('price') : { data: [] };

  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: reviews }, { data: sorular }, { data: benzer }, favRes, ordRes, profRes] = await Promise.all([
    supabase.from('reviews').select('*').eq('product_id', p.id).order('created_at', { ascending: false }),
    supabase.from('product_questions').select('*').eq('product_id', p.id).order('created_at', { ascending: false }),
    supabase.from('products').select('*').eq('is_active', true).eq('section', p.section).neq('id', p.id)
      .eq(p.category_id ? 'category_id' : 'section', p.category_id || p.section).limit(4),
    user ? supabase.from('favorites').select('product_id').eq('user_id', user.id).eq('product_id', p.id).maybeSingle() : { data: null },
    user ? supabase.from('order_items').select('id, orders!inner(user_id, status)').eq('product_id', p.id).eq('orders.user_id', user.id).eq('orders.status', 'teslim_edildi').limit(1) : { data: [] },
    user ? supabase.from('profiles').select('full_name').eq('id', user.id).single() : { data: null },
  ]);
  const simdi = new Date().toISOString();
  const setIds = (Array.isArray(p.bundle_items) ? p.bundle_items : []).map((b) => b.product_id);
  const [{ data: kampanyalar }, { data: setUrunleri }] = await Promise.all([
    supabase.from('promotions').select('*').eq('is_active', true).or(`product_id.eq.${p.id}${p.category_id ? `,category_id.eq.${p.category_id}` : ''}`),
    setIds.length ? supabase.from('products').select('id, name, slug, images').in('id', setIds) : { data: [] },
  ]);
  const kampanya = (kampanyalar || []).find((k) => (!k.starts_at || k.starts_at <= simdi) && (!k.ends_at || k.ends_at > simdi));
  const ort = reviews?.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const bolum = BOLUMLER[p.section];
  const fiyat = p.sale_unit === 'paket' ? p.pack_price ?? efektifFiyat(p) * p.pack_size : efektifFiyat(p);
  const specs = Array.isArray(p.specs) ? p.specs.filter((s) => s?.ad && s?.deger) : [];

  const SITE = process.env.NEXT_PUBLIC_SITE_URL || '';
  const urunLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description,
    image: (p.images || []).map((u) => (u.startsWith('http') ? u : `${SITE}${u}`)), brand: { '@type': 'Brand', name: '3D Dünyası' },
    offers: { '@type': 'Offer', priceCurrency: 'TRY', price: Number(fiyat).toFixed(2),
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: `${SITE}/urun/${p.slug}` },
    ...(ort && { aggregateRating: { '@type': 'AggregateRating', ratingValue: ort, reviewCount: reviews.length } }),
  };
  const sekmeler = [['#aciklama', 'Açıklama'], specs.length && ['#teknik', 'Teknik bilgiler'], ['#yorumlar', `Yorumlar (${reviews?.length || 0})`], ['#sorular', `Sorular (${(sorular || []).filter((q) => q.answer).length})`]].filter(Boolean);

  return (
    <div className="kap py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(urunLd) }} />
      <nav aria-label="Konum" className="soluk mb-6 text-sm">
        <Link href={yakinda ? '/yazici-filament' : bolum.yol} className="hover:underline">{bolum.ad}</Link>
        {p.categories && <> / <Link href={`${bolum.yol}?kategori=${p.categories.slug}`} className="hover:underline">{p.categories.name}</Link></>}
      </nav>
      <div className="grid gap-10 md:grid-cols-2 lg:gap-14">
        <Gallery images={p.images?.length ? p.images : ['/ornek/yazici.svg']} alt={p.name} video={p.video_url} model={p.model_url} />
        <div>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{p.name}</h1>
          {ort && <a href="#yorumlar" className="soluk mt-2 inline-block text-sm hover:underline"><span className="text-nozul-500">★</span> {ort} · {reviews.length} değerlendirme</a>}
          <div className="mt-4 flex items-baseline gap-3">
            {yakinda ? (Number(fiyat) > 0 ? <span className="font-display text-3xl font-semibold"><span className="soluk text-base font-normal">Beklenen fiyat </span>{tl(fiyat)}</span> : <span className="font-display text-2xl font-semibold text-nozul-600">Yakında</span>) : <span className="font-display text-3xl font-semibold">{tl(fiyat)}</span>}
            {p.sale_unit === 'paket' && <span className="soluk text-sm">{p.pack_size}'li paket</span>}
            {indirimAktif(p) && <span className="soluk line-through">{tl(p.compare_price)}</span>}
            {indirimAktif(p) && <span className="rounded-full bg-nozul-500 px-2.5 py-1 text-xs font-bold text-white">%{Math.round((1 - p.price / p.compare_price) * 100)} indirim</span>}
          </div>
          {indirimAktif(p) && p.sale_ends_at && <div className="mt-4"><SaleCountdown bitis={p.sale_ends_at} /></div>}
          {kampanya && <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-nozul-50 px-4 py-2 text-sm font-bold text-nozul-700 dark:bg-nozul-700/20 dark:text-nozul-100">🔥 {kampanya.buy_qty} al {kampanya.pay_qty} öde: {kampanya.name}</p>}
          {setUrunleri?.length > 0 && (
            <div className="mt-5 rounded-2xl bg-krem p-4 dark:bg-lacivert-900">
              <p className="ust-etiket mb-2">Sette neler var</p>
              <ul className="space-y-2">{p.bundle_items.map((b) => { const u = setUrunleri.find((x) => x.id === b.product_id); return u && (
                <li key={b.product_id}><Link href={`/urun/${u.slug}`} className="flex items-center gap-3 text-sm hover:underline"><img src={u.images?.[0] || '/ornek/yazici.svg'} alt="" className="h-10 w-10 rounded-lg object-cover" /><span><b>{b.qty} ×</b> {u.name}</span></Link></li>); })}</ul>
            </div>
          )}
          <p className="mt-5 line-clamp-4 whitespace-pre-line leading-7 text-lacivert-600 dark:text-lacivert-100">{p.description}</p>
          {kardesler?.length > 1 && (
            <div className="mt-6"><p className="etiket">Seçenek</p><div className="flex flex-wrap gap-2">{kardesler.map((k) => (
              <Link key={k.slug} href={`/urun/${k.slug}`} className={`rounded-full border px-4 py-2 text-sm font-semibold ${k.slug === p.slug ? 'border-nozul-500 bg-nozul-500 text-white' : 'border-lacivert-200 hover:border-lacivert-800 dark:border-lacivert-600'}`}>{k.variant_label}</Link>
            ))}</div></div>
          )}
          {p.color_hex && <p className="mt-4 flex items-center gap-2 text-sm"><span className="h-6 w-6 rounded-full border-2 border-white shadow ring-1 ring-lacivert-100" style={{ background: p.color_hex }} />Renk: <b>{p.name.split(' - ').pop()}</b>{p.brand && <span className="soluk">· {p.brand}</span>}</p>}
          <div className="mt-8">{yakinda ? (
            <div className="space-y-3">
              <p className="rounded-2xl bg-nozul-50 p-4 font-semibold text-nozul-700 dark:bg-nozul-700/20 dark:text-nozul-100">Bu ürün çok yakında satışta. Açıldığında size haber verelim.</p>
              <AddToCart product={{ ...p, stock: 0 }} email={user?.email} />
            </div>
          ) : <AddToCart product={p} email={user?.email} />}</div>
          <div className="mt-4"><FavoriteButton productId={p.id} userId={user?.id} initial={!!favRes.data} /></div>
          <ul className="soluk mt-8 space-y-1.5 border-t border-lacivert-100 pt-6 text-sm dark:border-lacivert-800">
            <li>Belirli tutarın üzerindeki siparişlerde kargo ücretsiz</li>
            <li>Havale/EFT ile güvenli ödeme</li>
            <li><Link href="/iade-ve-degisim" className="underline">İade ve değişim koşulları</Link></li>
          </ul>
        </div>
      </div>

      <nav className="sticky top-[72px] z-30 -mx-4 mt-14 flex gap-1 overflow-x-auto border-b border-lacivert-100 bg-white/95 px-4 backdrop-blur dark:border-lacivert-800 dark:bg-lacivert-950/95" aria-label="Ürün bölümleri">
        {sekmeler.map(([h, t]) => <a key={h} href={h} className="whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-semibold hover:border-nozul-500">{t}</a>)}
      </nav>

      <div className="mt-10 grid gap-16 lg:grid-cols-[1fr_380px]">
        <div className="space-y-16">
          <section id="aciklama" className="scroll-mt-32">
            <h2 className="text-2xl font-semibold">Açıklama</h2>
            <p className="mt-4 whitespace-pre-line leading-8 text-lacivert-600 dark:text-lacivert-100">{p.description}</p>
          </section>
          {specs.length > 0 && (
            <section id="teknik" className="scroll-mt-32">
              <h2 className="text-2xl font-semibold">Teknik bilgiler</h2>
              <dl className="mt-4 divide-y divide-lacivert-100 overflow-hidden rounded-2xl border border-lacivert-100 dark:divide-lacivert-800 dark:border-lacivert-800">
                {specs.map((s, i) => (
                  <div key={i} className={`grid grid-cols-[40%_1fr] gap-4 px-5 py-3 text-sm ${i % 2 ? '' : 'bg-krem dark:bg-lacivert-900'}`}>
                    <dt className="font-semibold">{s.ad}</dt><dd>{s.deger}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          <Reviews productId={p.id} reviews={reviews || []} user={user} canReview={(ordRes.data || []).length > 0} authorName={profRes.data?.full_name} />
          <Questions productId={p.id} productName={p.name} questions={sorular || []} user={user} authorName={profRes.data?.full_name} />
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-32 rounded-3xl bg-krem p-6 dark:bg-lacivert-900">
            <p className="ust-etiket">Aradığınızı bulamadınız mı?</p>
            <p className="mt-2 font-display text-xl font-semibold">Size özel basalım</p>
            <p className="soluk mt-2 text-sm leading-6">Kendi modelinizi yükleyin, anında tahmini fiyatı görün.</p>
            <Link href="/ozel-siparis" className="btn-ana mt-4">Özel sipariş</Link>
          </div>
        </aside>
      </div>

      {benzer?.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl font-semibold">Benzer ürünler</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">{benzer.map((b) => <ProductCard key={b.id} p={b} />)}</div>
        </section>
      )}
      <div className="mt-20">
        <RecentlyViewed kaydet={{ slug: p.slug, name: p.name, image: p.images?.[0], price: fiyat }} haric={p.slug} />
      </div>
    </div>
  );
}
