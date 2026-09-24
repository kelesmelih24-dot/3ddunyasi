'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { slugify, BOLUMLER } from '@/lib/format';

const BOS = { section: 'baski', category_id: '', name: '', slug: '', description: '', price: '', compare_price: '', stock: 0, images: [],
  sale_unit: 'adet', pack_size: 1, pack_price: '', allow_personalization: false, is_active: true, is_featured: false };

export default function ProductForm({ product, categories }) {
  const router = useRouter();
  const supabase = createClient();
  const [f, setF] = useState(product ? { ...BOS, ...product, category_id: product.category_id || '', compare_price: product.compare_price ?? '', pack_price: product.pack_price ?? '' } : BOS);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const cats = categories.filter((c) => c.section === f.section);

  async function upload(e) {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { setErr(`${file.name} 5 MB'tan büyük`); continue; }
      const path = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('urun-gorselleri').upload(path, file, { cacheControl: '31536000' });
      if (!error) urls.push(supabase.storage.from('urun-gorselleri').getPublicUrl(path).data.publicUrl);
    }
    setF((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    setUploading(false);
    e.target.value = '';
  }
  const move = (i, d) => { const a = [...f.images]; [a[i], a[i + d]] = [a[i + d], a[i]]; setF({ ...f, images: a }); };

  async function kaydet(e) {
    e.preventDefault();
    setErr('');
    if (!f.name.trim()) return setErr('Ürün adını girin.');
    if (f.price === '' || Number(f.price) < 0) return setErr('Geçerli bir fiyat girin.');
    if (f.sale_unit !== 'adet' && (Number(f.pack_size) < 2 || !f.pack_price)) return setErr('Paket satışı için paket adedi (en az 2) ve paket fiyatı girin.');
    setBusy(true);
    const row = {
      section: f.section, category_id: f.category_id || null, name: f.name.trim(), slug: f.slug.trim() || slugify(f.name),
      description: f.description, price: Number(f.price), compare_price: f.compare_price === '' ? null : Number(f.compare_price),
      stock: Math.max(0, Number(f.stock) || 0), images: f.images, sale_unit: f.sale_unit, pack_size: Number(f.pack_size) || 1,
      pack_price: f.pack_price === '' ? null : Number(f.pack_price), allow_personalization: f.allow_personalization,
      is_active: f.is_active, is_featured: f.is_featured,
    };
    const { error } = product
      ? await supabase.from('products').update(row).eq('id', product.id)
      : await supabase.from('products').insert(row);
    setBusy(false);
    if (error) return setErr(error.message.includes('slug') ? 'Bu bağlantı adı (slug) başka bir üründe kullanılıyor.' : error.message);
    router.push('/admin/urunler');
    router.refresh();
  }

  async function sil() {
    if (!confirm('Ürün silinsin mi? Geçmiş siparişlerde adı korunur.')) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) return setErr(error.message);
    router.push('/admin/urunler');
    router.refresh();
  }

  return (
    <form onSubmit={kaydet} className="max-w-3xl space-y-6">
      <Link href="/admin/urunler" className="soluk text-sm hover:underline">Ürünler</Link>
      <h1 className="text-3xl font-bold">{product ? 'Ürünü düzenle' : 'Yeni ürün'}</h1>

      <section className="kutu grid gap-4 p-5 sm:grid-cols-2">
        <div><label className="etiket" htmlFor="b">Bölüm</label>
          <select id="b" className="girdi" value={f.section} onChange={(e) => setF({ ...f, section: e.target.value, category_id: '' })}>
            {Object.entries(BOLUMLER).map(([k, v]) => <option key={k} value={k}>{v.ad}</option>)}
          </select></div>
        <div><label className="etiket" htmlFor="k">Kategori</label>
          <select id="k" className="girdi" value={f.category_id} onChange={set('category_id')}>
            <option value="">Kategori seçin</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
        <div className="sm:col-span-2"><label className="etiket" htmlFor="n">Ürün adı</label><input id="n" className="girdi" value={f.name} onChange={set('name')} /></div>
        <div className="sm:col-span-2"><label className="etiket" htmlFor="s">Bağlantı adı (boş bırakılırsa otomatik)</label><input id="s" className="girdi" value={f.slug} onChange={set('slug')} placeholder={slugify(f.name || 'urun-adi')} /></div>
        <div className="sm:col-span-2"><label className="etiket" htmlFor="a">Açıklama</label><textarea id="a" rows={5} className="girdi" value={f.description || ''} onChange={set('description')} /></div>
      </section>

      <section className="kutu grid gap-4 p-5 sm:grid-cols-3">
        <div><label className="etiket" htmlFor="p">Adet fiyatı (TL)</label><input id="p" type="number" step="0.01" min="0" className="girdi" value={f.price} onChange={set('price')} /></div>
        <div><label className="etiket" htmlFor="cp">Eski fiyat (indirim göstermek için)</label><input id="cp" type="number" step="0.01" min="0" className="girdi" value={f.compare_price} onChange={set('compare_price')} /></div>
        <div><label className="etiket" htmlFor="st">Stok (adet)</label><input id="st" type="number" min="0" className="girdi" value={f.stock} onChange={set('stock')} /></div>
        <div><label className="etiket" htmlFor="su">Satış şekli</label>
          <select id="su" className="girdi" value={f.sale_unit} onChange={set('sale_unit')}>
            <option value="adet">Sadece adet</option><option value="paket">Sadece paket</option><option value="ikisi">Adet ve paket</option>
          </select></div>
        {f.sale_unit !== 'adet' && <>
          <div><label className="etiket" htmlFor="ps">Paketteki adet</label><input id="ps" type="number" min="2" className="girdi" value={f.pack_size} onChange={set('pack_size')} /></div>
          <div><label className="etiket" htmlFor="pp">Paket fiyatı (TL)</label><input id="pp" type="number" step="0.01" min="0" className="girdi" value={f.pack_price} onChange={set('pack_price')} /></div>
        </>}
      </section>

      <section className="kutu space-y-3 p-5">
        <h2 className="font-sans font-semibold">Görseller</h2>
        <div className="flex flex-wrap gap-3">
          {f.images.map((src, i) => (
            <div key={src} className="w-28">
              <img src={src} alt="" className="h-28 w-28 rounded-md object-cover" />
              <div className="mt-1 flex justify-between text-xs">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Sola taşı">◀</button>
                <button type="button" onClick={() => setF({ ...f, images: f.images.filter((x) => x !== src) })} className="text-red-600">Kaldır</button>
                <button type="button" disabled={i === f.images.length - 1} onClick={() => move(i, 1)} aria-label="Sağa taşı">▶</button>
              </div>
            </div>
          ))}
        </div>
        <input type="file" accept="image/*" multiple onChange={upload} className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-lacivert-800 file:px-3 file:py-2 file:text-white" />
        <p className="soluk text-xs">{uploading ? 'Yükleniyor…' : 'İlk görsel kapak olarak kullanılır. Görsel başına en fazla 5 MB.'}</p>
      </section>

      <section className="kutu space-y-3 p-5 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.allow_personalization} onChange={set('allow_personalization')} className="accent-nozul-500" /> Müşteri ürüne isim/yazı ekleyebilsin</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_featured} onChange={set('is_featured')} className="accent-nozul-500" /> Ana sayfada öne çıkar</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_active} onChange={set('is_active')} className="accent-nozul-500" /> Sitede yayında</label>
      </section>

      {err && <p className="hata">{err}</p>}
      <div className="flex gap-3">
        <button disabled={busy || uploading} className="btn-ana">{product ? 'Değişiklikleri kaydet' : 'Ürünü ekle'}</button>
        {product && <button type="button" onClick={sil} className="btn-cizgi text-red-600">Ürünü sil</button>}
      </div>
    </form>
  );
}
