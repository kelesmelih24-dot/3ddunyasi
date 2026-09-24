import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProductCard from './ProductCard';

const SIRALAR = { yeni: ['created_at', false], 'fiyat-artan': ['price', true], 'fiyat-azalan': ['price', false], ad: ['name', true] };

export default async function Catalog({ section, title, intro, basePath, searchParams }) {
  const supabase = createClient();
  const { kategori, q, sirala = 'yeni', stokta } = searchParams || {};

  const { data: categories } = await supabase.from('categories').select('*').eq('section', section).order('sort');
  const aktifKat = categories?.find((c) => c.slug === kategori);

  let query = supabase.from('products').select('*').eq('section', section).eq('is_active', true);
  if (aktifKat) query = query.eq('category_id', aktifKat.id);
  if (q) query = query.ilike('name', `%${q.replace(/[%_,()]/g, ' ')}%`);
  if (stokta === '1') query = query.gt('stock', 0);
  const [col, asc] = SIRALAR[sirala] || SIRALAR.yeni;
  const { data: products } = await query.order(col, { ascending: asc });

  const ids = (products || []).map((p) => p.id);
  const { data: ratings } = ids.length
    ? await supabase.from('product_ratings').select('*').in('product_id', ids)
    : { data: [] };
  const rMap = Object.fromEntries((ratings || []).map((r) => [r.product_id, r]));

  const link = (extra) => {
    const sp = new URLSearchParams({ ...(kategori && { kategori }), ...(q && { q }), ...(sirala !== 'yeni' && { sirala }), ...(stokta && { stokta }), ...extra });
    [...sp.keys()].forEach((k) => !sp.get(k) && sp.delete(k));
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="kap py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{aktifKat?.name || title}</h1>
      <p className="soluk mt-2 max-w-2xl leading-7">{intro}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <form action={basePath} className="space-y-3">
            {kategori && <input type="hidden" name="kategori" value={kategori} />}
            <label className="etiket" htmlFor="ara">Bu bölümde ara</label>
            <input id="ara" name="q" defaultValue={q} placeholder="Ürün adı" className="girdi" />
            <label className="etiket" htmlFor="sirala">Sıralama</label>
            <select id="sirala" name="sirala" defaultValue={sirala} className="girdi">
              <option value="yeni">En yeniler</option>
              <option value="fiyat-artan">Fiyat: düşükten yükseğe</option>
              <option value="fiyat-azalan">Fiyat: yüksekten düşüğe</option>
              <option value="ad">Ada göre</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="stokta" value="1" defaultChecked={stokta === '1'} className="accent-nozul-500" /> Sadece stoktakiler
            </label>
            <button className="btn-koyu w-full">Uygula</button>
          </form>
          <nav aria-label="Kategoriler">
            <h2 className="mb-2 font-sans text-sm font-semibold">Kategoriler</h2>
            <ul className="space-y-0.5 text-sm">
              <li><Link href={link({ kategori: '' })} className={`block rounded px-2 py-1.5 ${!aktifKat ? 'bg-lacivert-800 text-white dark:bg-lacivert-100 dark:text-lacivert-900' : 'hover:bg-lacivert-50 dark:hover:bg-lacivert-800'}`}>Tümü</Link></li>
              {categories?.map((c) => (
                <li key={c.id}><Link href={link({ kategori: c.slug })} className={`block rounded px-2 py-1.5 ${aktifKat?.id === c.id ? 'bg-lacivert-800 text-white dark:bg-lacivert-100 dark:text-lacivert-900' : 'hover:bg-lacivert-50 dark:hover:bg-lacivert-800'}`}>{c.name}</Link></li>
              ))}
            </ul>
          </nav>
        </aside>

        <section>
          <p className="soluk mb-4 text-sm">{products?.length || 0} ürün{q ? `, "${q}" araması` : ''}</p>
          {products?.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} p={p} rating={rMap[p.id]} />)}
            </div>
          ) : (
            <div className="kutu p-10 text-center">
              <p className="font-semibold">Bu filtrelerle eşleşen ürün yok</p>
              <p className="soluk mt-1 text-sm">Aramayı kısaltmayı veya kategoriyi değiştirmeyi deneyin.</p>
              <Link href={basePath} className="btn-cizgi mt-4">Filtreleri temizle</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
