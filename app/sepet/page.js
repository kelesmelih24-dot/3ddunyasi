'use client';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { tl } from '@/lib/format';

export default function CartPage() {
  const { items, update, remove, subtotal, key, ready } = useCart();
  if (!ready) return <div className="kap py-16" />;
  if (!items.length)
    return (
      <div className="kap py-20 text-center">
        <h1 className="text-3xl font-semibold">Sepetiniz boş</h1>
        <p className="soluk mt-2">Baskı ürünlerimize veya malzemelerimize göz atarak başlayabilirsiniz.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/baski-urunleri" className="btn-ana">Baskı ürünleri</Link>
          <Link href="/malzemeler" className="btn-cizgi">Malzemeler</Link>
        </div>
      </div>
    );
  return (
    <div className="kap py-10">
      <h1 className="text-3xl font-semibold">Sepetim</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="divide-y divide-lacivert-100 dark:divide-lacivert-800">
          {items.map((i) => {
            const k = key(i);
            return (
              <li key={k} className="flex gap-4 py-5">
                <Link href={`/urun/${i.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-lacivert-50 dark:bg-lacivert-900">
                  <img src={i.image || '/ornek/yazici.svg'} alt="" className="h-full w-full object-cover" />
                </Link>
                <div className="flex-1">
                  <Link href={`/urun/${i.slug}`} className="font-semibold hover:underline">{i.name}</Link>
                  <p className="soluk text-sm">{i.unit === 'paket' ? `${i.pack_size}'li paket` : 'Adet'} · {tl(i.price)}</p>
                  {i.personalization && <p className="text-sm">Yazı: <b>{i.personalization}</b></p>}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-md border border-lacivert-200 text-sm dark:border-lacivert-600">
                      <button onClick={() => update(k, i.quantity - 1)} className="px-2.5 py-1" aria-label="Azalt">−</button>
                      <span className="w-8 text-center">{i.quantity}</span>
                      <button onClick={() => update(k, i.quantity + 1)} className="px-2.5 py-1" aria-label="Artır">+</button>
                    </div>
                    <button onClick={() => remove(k)} className="text-sm text-red-600 hover:underline dark:text-red-300">Kaldır</button>
                  </div>
                </div>
                <p className="font-semibold">{tl(i.price * i.quantity)}</p>
              </li>
            );
          })}
        </ul>
        <aside className="kutu h-fit p-6">
          <div className="flex justify-between"><span>Ara toplam</span><b>{tl(subtotal)}</b></div>
          <p className="soluk mt-2 text-sm">Kargo ve kupon indirimi ödeme adımında hesaplanır.</p>
          <Link href="/odeme" className="btn-ana mt-5 w-full">Ödemeye geç</Link>
          <Link href="/baski-urunleri" className="mt-3 block text-center text-sm underline">Alışverişe devam et</Link>
        </aside>
      </div>
    </div>
  );
}
