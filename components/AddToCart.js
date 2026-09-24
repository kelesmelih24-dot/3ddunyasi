'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { tl, birimFiyat } from '@/lib/format';

export default function AddToCart({ product }) {
  const { add } = useCart();
  const defaultUnit = product.sale_unit === 'paket' ? 'paket' : 'adet';
  const [unit, setUnit] = useState(defaultUnit);
  const [qty, setQty] = useState(1);
  const [pers, setPers] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const consume = unit === 'paket' ? product.pack_size : 1;
  const maxQty = Math.floor(product.stock / consume);
  const price = birimFiyat(product, unit);

  if (product.stock <= 0) return <p className="hata">Bu ürün şu anda stokta yok.</p>;

  function ekle() {
    setErr('');
    if (product.allow_personalization && !pers.trim()) return setErr('Ürüne eklenecek yazıyı girin.');
    if (qty > maxQty) return setErr(`En fazla ${maxQty} adet ekleyebilirsiniz.`);
    add({
      product_id: product.id, slug: product.slug, name: product.name, image: product.images?.[0],
      unit, pack_size: product.pack_size, price, quantity: qty, personalization: pers.trim() || null,
    });
    setMsg('Sepete eklendi');
    setTimeout(() => setMsg(''), 2500);
  }

  return (
    <div className="space-y-4">
      {product.sale_unit === 'ikisi' && (
        <fieldset>
          <legend className="etiket">Satın alma şekli</legend>
          <div className="grid grid-cols-2 gap-2">
            {[['adet', `Adet (${tl(product.price)})`], ['paket', `${product.pack_size}'li paket (${tl(product.pack_price)})`]].map(([v, l]) => (
              <label key={v} className={`cursor-pointer rounded-md border px-3 py-2.5 text-sm ${unit === v ? 'border-nozul-500 bg-nozul-50 dark:bg-nozul-700/20' : 'border-lacivert-200 dark:border-lacivert-600'}`}>
                <input type="radio" name="unit" value={v} checked={unit === v} onChange={() => { setUnit(v); setQty(1); }} className="sr-only" />{l}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {product.allow_personalization && (
        <div>
          <label htmlFor="pers" className="etiket">Ürüne yazılacak isim veya yazı</label>
          <input id="pers" maxLength={30} value={pers} onChange={(e) => { setPers(e.target.value); setErr(''); }} placeholder="Örnek: Zeynep" className="girdi" />
          <p className="soluk mt-1 text-xs">En fazla 30 karakter. Kişiye özel ürünlerde iade kabul edilmez.</p>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-md border border-lacivert-200 dark:border-lacivert-600">
          <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2.5" aria-label="Azalt">−</button>
          <input type="number" min={1} max={maxQty} value={qty} aria-label="Miktar"
            onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
            className="w-12 bg-transparent text-center text-sm [appearance:textfield]" />
          <button type="button" onClick={() => setQty(Math.min(maxQty, qty + 1))} className="px-3 py-2.5" aria-label="Artır">+</button>
        </div>
        <button onClick={ekle} className="btn-ana flex-1">Sepete ekle · {tl(price * qty)}</button>
      </div>
      {err && <p className="hata">{err}</p>}
      {msg && <p className="basari">{msg}. <Link href="/sepet" className="font-semibold underline">Sepete git</Link></p>}
      <p className="soluk text-xs">Stokta {product.stock} adet</p>
    </div>
  );
}
