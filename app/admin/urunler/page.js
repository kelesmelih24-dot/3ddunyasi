import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { tl, BOLUMLER } from '@/lib/format';
import StockInput from '@/components/admin/StockInput';
import ProductRowActions from '@/components/admin/ProductRowActions';

export default async function Page({ searchParams }) {
  const supabase = createClient();
  let q = supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
  if (searchParams?.bolum) q = q.eq('section', searchParams.bolum);
  if (searchParams?.q) q = q.ilike('name', `%${searchParams.q}%`);
  const { data: products } = await q;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Ürünler ve stok</h1>
          <p className="soluk mt-1 text-sm">Stok her siparişte otomatik düşer, iptal edilen siparişte geri eklenir. Stok 0 olunca ürün "Stokta yok" görünür.</p>
        </div>
        <Link href="/admin/urunler/yeni" className="btn-ana">Yeni ürün ekle</Link>
      </div>
      <form className="my-5 flex flex-wrap gap-2">
        <select name="bolum" defaultValue={searchParams?.bolum || ''} className="girdi w-auto py-1.5">
          <option value="">Tüm bölümler</option>
          {Object.entries(BOLUMLER).map(([k, v]) => <option key={k} value={k}>{v.ad}</option>)}
        </select>
        <input name="q" defaultValue={searchParams?.q} placeholder="Ürün ara" className="girdi w-56 py-1.5" />
        <button className="btn-cizgi py-1.5">Filtrele</button>
      </form>
      <div className="kutu overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="soluk border-b border-lacivert-100 dark:border-lacivert-800"><tr><th className="p-3">Ürün</th><th className="p-3">Bölüm</th><th className="p-3">Fiyat</th><th className="p-3">Stok</th><th className="p-3">Görünürlük</th><th className="p-3">Satış</th></tr></thead>
          <tbody className="divide-y divide-lacivert-100 dark:divide-lacivert-800">
            {(products || []).map((p) => (
              <tr key={p.id}>
                <td className="p-3"><div className="flex items-center gap-3">
                  <img src={p.images?.[0] || '/ornek/yazici.svg'} alt="" className="h-10 w-10 rounded object-cover" />
                  <div><Link href={`/admin/urunler/${p.id}`} className="font-semibold underline">{p.name}</Link><p className="soluk text-xs">{p.categories?.name}</p></div>
                </div></td>
                <td className="p-3">{BOLUMLER[p.section].ad}</td>
                <td className="p-3 whitespace-nowrap">{tl(p.price)}{p.sale_unit !== 'adet' && <span className="soluk block text-xs">{p.pack_size}'li: {tl(p.pack_price)}</span>}</td>
                <td className="p-3"><StockInput id={p.id} initial={p.stock} /></td>
                <td className="p-3">{p.is_active ? <span className="text-emerald-600">Yayında</span> : <span className="soluk">Gizli</span>}</td>
                <td className="p-3"><ProductRowActions id={p.id} name={p.name} isForSale={p.is_for_sale} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
