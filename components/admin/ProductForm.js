'use client';
import { useEffect, useState } from 'react';
import { gorselKucult } from '@/lib/gorsel';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { slugify, BOLUMLER } from '@/lib/format';

const BOS = { section: 'baski', category_id: '', name: '', slug: '', description: '', price: '', compare_price: '', stock: 0, images: [],
  sale_unit: 'adet', pack_size: 1, pack_price: '', allow_personalization: false, is_active: true, is_for_sale: true, is_featured: false, video_url: '', model_url: '', specs: [], preview_type: '', sale_ends_at: '', bundle_items: [], print_grams: '', print_hours: '', extra_cost: 0, cost_price: '', brand: '', color_hex: '', group_key: '', variant_label: '', filament_id: '' };

export default function ProductForm({ product, categories }) {
  const router = useRouter();
  const supabase = createClient();
  const [f, setF] = useState(product ? { ...BOS, ...product, category_id: product.category_id || '', compare_price: product.compare_price ?? '', pack_price: product.pack_price ?? '', video_url: product.video_url || '', model_url: product.model_url || '', specs: Array.isArray(product.specs) ? product.specs : [], preview_type: product.preview_type || '', sale_ends_at: product.sale_ends_at ? new Date(new Date(product.sale_ends_at) - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : '', bundle_items: Array.isArray(product.bundle_items) ? product.bundle_items : [], print_grams: product.print_grams ?? '', print_hours: product.print_hours ?? '', extra_cost: product.extra_cost ?? 0, cost_price: product.cost_price ?? '', brand: product.brand || '', color_hex: product.color_hex || '', group_key: product.group_key || '', variant_label: product.variant_label || '', filament_id: product.filament_id || '' } : BOS);
  const [filamentler, setFilamentler] = useState([]);
  useEffect(() => { supabase.from('filaments').select('id, material, color, cost_per_kg').eq('is_active', true).order('material').then(({ data }) => setFilamentler(data || [])); }, []);
  const [maliyetAyar, setMaliyetAyar] = useState({ filament_gram_cost: 0.8, printer_hour_cost: 12 });
  useEffect(() => { supabase.from('settings').select('filament_gram_cost, printer_hour_cost').eq('id', 1).single().then(({ data }) => data && setMaliyetAyar(data)); }, []);
  const hesapMaliyet = (Number(f.print_grams) || 0) * maliyetAyar.filament_gram_cost + (Number(f.print_hours) || 0) * maliyetAyar.printer_hour_cost + (Number(f.extra_cost) || 0);
  const [tumUrunler, setTumUrunler] = useState([]);
  useEffect(() => { supabase.from('products').select('id, name').neq('section', 'yazici').order('name').then(({ data }) => setTumUrunler((data || []).filter((u) => u.id !== product?.id))); }, []);
  const [medyaYukleniyor, setMedyaYukleniyor] = useState('');
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
    for (const ham of files) {
      const file = await gorselKucult(ham);
      if (file.size > 5 * 1024 * 1024) { setErr(`${file.name} 5 MB'tan büyük`); continue; }
      const path = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('urun-gorselleri').upload(path, file, { cacheControl: '31536000' });
      if (!error) urls.push(supabase.storage.from('urun-gorselleri').getPublicUrl(path).data.publicUrl);
    }
    setF((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    setUploading(false);
    e.target.value = '';
  }
  async function medyaYukle(e, alan) {
    const file = e.target.files?.[0];
    if (!file) return;
    const sinir = alan === 'video_url' ? 50 : 30;
    if (file.size > sinir * 1024 * 1024) return setErr(`Dosya en fazla ${sinir} MB olabilir.`);
    setMedyaYukleniyor(alan);
    const path = `${alan === 'video_url' ? 'video' : 'model'}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${file.name.split('.').pop().toLowerCase()}`;
    const { error } = await supabase.storage.from('urun-gorselleri').upload(path, file, { cacheControl: '31536000' });
    setMedyaYukleniyor('');
    if (error) return setErr('Yükleme başarısız: ' + error.message);
    setF((prev) => ({ ...prev, [alan]: supabase.storage.from('urun-gorselleri').getPublicUrl(path).data.publicUrl }));
    e.target.value = '';
  }
  const specGuncelle = (i, k, v) => setF({ ...f, specs: f.specs.map((s, n) => (n === i ? { ...s, [k]: v } : s)) });
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
      is_active: f.is_active, is_for_sale: f.is_for_sale !== false, is_featured: f.is_featured,
      video_url: f.video_url.trim() || null, model_url: f.model_url.trim() || null,
      specs: f.specs.filter((x) => x.ad?.trim() && x.deger?.trim()),
      sale_ends_at: f.sale_ends_at ? new Date(f.sale_ends_at).toISOString() : null,
      filament_id: f.filament_id || null,
      brand: f.brand.trim() || null, color_hex: f.color_hex || null, group_key: f.group_key.trim() || null, variant_label: f.variant_label.trim() || null,
      print_grams: f.print_grams === '' ? null : Number(f.print_grams), print_hours: f.print_hours === '' ? null : Number(f.print_hours),
      extra_cost: Number(f.extra_cost) || 0, cost_price: f.cost_price === '' ? (hesapMaliyet > 0 ? +hesapMaliyet.toFixed(2) : null) : Number(f.cost_price),
      bundle_items: f.bundle_items.filter((b) => b.product_id && Number(b.qty) > 0).map((b) => ({ product_id: b.product_id, qty: Number(b.qty) })), preview_type: f.allow_personalization && f.preview_type ? f.preview_type : null,
    };
    const { error } = product
      ? await supabase.from('products').update(row).eq('id', product.id)
      : await supabase.from('products').insert(row);
    setBusy(false);
    if (!error && product && product.stock <= 0 && row.stock > 0)
      await fetch('/api/admin/stok-bildir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id }) });
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
        <div><label className="etiket" htmlFor="se">İndirim bitişi (isteğe bağlı)</label><input id="se" type="datetime-local" className="girdi" value={f.sale_ends_at} onChange={set('sale_ends_at')} /><p className="soluk mt-1 text-xs">Eski fiyat girilirse sayaç çıkar, bitince eski fiyata döner.</p></div>
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

      {f.section === 'yazici' && (
        <section className="kutu grid gap-3 p-5 sm:grid-cols-2">
          <h2 className="font-sans font-semibold sm:col-span-2">Yazıcı / filament bilgileri</h2>
          <div><label className="etiket" htmlFor="br">Marka</label><input id="br" className="girdi" value={f.brand} onChange={set('brand')} /></div>
          <div><label className="etiket" htmlFor="ch">Filament rengi</label><div className="flex gap-2"><input id="ch" type="color" className="h-11 w-14 rounded-lg" value={f.color_hex || '#ffffff'} onChange={set('color_hex')} /><input className="girdi" value={f.color_hex} onChange={set('color_hex')} placeholder="#E8620C" aria-label="Renk kodu" /></div></div>
          <div><label className="etiket" htmlFor="gk">Grup anahtarı</label><input id="gk" className="girdi" value={f.group_key} onChange={set('group_key')} placeholder="pla-siyah" /><p className="soluk mt-1 text-xs">Aynı filamentin farklı makara ağırlıklarına aynı anahtarı verin.</p></div>
          <div><label className="etiket" htmlFor="vl">Seçenek etiketi</label><input id="vl" className="girdi" value={f.variant_label} onChange={set('variant_label')} placeholder="1 kg" /></div>
          <p className="soluk text-xs sm:col-span-2">Baskı sıcaklığı gibi teknik değerleri aşağıdaki "Teknik bilgiler tablosu"na ekleyin.</p>
        </section>
      )}

      <section className="kutu space-y-3 p-5">
        <h2 className="font-sans font-semibold">Maliyet ve kâr</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-4"><label className="etiket" htmlFor="fil">Basıldığı filament (baskı bitince stoktan düşer)</label><select id="fil" className="girdi" value={f.filament_id} onChange={set('filament_id')}><option value="">Seçilmedi</option>{filamentler.map((x) => <option key={x.id} value={x.id}>{x.material} · {x.color}</option>)}</select></div>
          <div><label className="etiket" htmlFor="pg">Filament (gram)</label><input id="pg" type="number" step="0.1" className="girdi" value={f.print_grams} onChange={set('print_grams')} /></div>
          <div><label className="etiket" htmlFor="ph">Baskı süresi (saat)</label><input id="ph" type="number" step="0.1" className="girdi" value={f.print_hours} onChange={set('print_hours')} /></div>
          <div><label className="etiket" htmlFor="ec">Ek maliyet (TL)</label><input id="ec" type="number" step="0.01" className="girdi" value={f.extra_cost} onChange={set('extra_cost')} /></div>
          <div><label className="etiket" htmlFor="cp2">Birim maliyet (TL)</label><input id="cp2" type="number" step="0.01" className="girdi" value={f.cost_price} onChange={set('cost_price')} placeholder={hesapMaliyet > 0 ? hesapMaliyet.toFixed(2) : 'Otomatik'} /></div>
        </div>
        {(() => { const m = f.cost_price === '' ? hesapMaliyet : Number(f.cost_price); const fiyat = Number(f.price) || 0; return m > 0 && fiyat > 0 && (
          <p className="text-sm">Birim maliyet <b>{m.toFixed(2)} TL</b> · Kâr <b className={fiyat - m > 0 ? 'text-emerald-600' : 'text-red-600'}>{(fiyat - m).toFixed(2)} TL</b> · Marj <b>%{Math.round((1 - m / fiyat) * 100)}</b></p>); })()}
        <p className="soluk text-xs">Birim maliyeti boş bırakırsanız: gram × {maliyetAyar.filament_gram_cost} TL + saat × {maliyetAyar.printer_hour_cost} TL + ek maliyet olarak hesaplanır (değerler Mağaza ayarlarında). Ek maliyet: halka, mıknatıs, ambalaj vb.</p>
      </section>

      <section className="kutu space-y-3 p-5">
        <h2 className="font-sans font-semibold">Set içeriği (set/paket ürünse)</h2>
        <p className="soluk text-xs">Bu ürün birden fazla ürünü içeren bir setse içeriğini ekleyin; ürün sayfasında "Sette neler var" olarak gösterilir.</p>
        {f.bundle_items.map((b, i) => (
          <div key={i} className="flex gap-2">
            <select className="girdi" value={b.product_id} onChange={(e) => setF({ ...f, bundle_items: f.bundle_items.map((x, n) => (n === i ? { ...x, product_id: e.target.value } : x)) })} aria-label="Setteki ürün">
              <option value="">Ürün seçin</option>{tumUrunler.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input type="number" min={1} className="girdi w-24" value={b.qty} onChange={(e) => setF({ ...f, bundle_items: f.bundle_items.map((x, n) => (n === i ? { ...x, qty: e.target.value } : x)) })} aria-label="Adet" />
            <button type="button" onClick={() => setF({ ...f, bundle_items: f.bundle_items.filter((_, n) => n !== i) })} className="btn-cizgi px-3 text-red-600" aria-label="Sil">×</button>
          </div>
        ))}
        <button type="button" onClick={() => setF({ ...f, bundle_items: [...f.bundle_items, { product_id: '', qty: 1 }] })} className="btn-cizgi py-1.5">+ Sete ürün ekle</button>
      </section>

      <section className="kutu space-y-4 p-5">
        <h2 className="font-sans font-semibold">Video ve 3D model</h2>
        <div>
          <label className="etiket" htmlFor="vid">Ürün videosu (YouTube linki veya MP4 yükleyin)</label>
          <input id="vid" className="girdi" value={f.video_url} onChange={set('video_url')} placeholder="https://youtube.com/... veya yüklenen dosya" />
          <input type="file" accept="video/mp4,video/webm" onChange={(e) => medyaYukle(e, 'video_url')} className="mt-2 block text-sm file:mr-3 file:rounded-full file:border-0 file:bg-lacivert-800 file:px-3 file:py-1.5 file:text-white" />
        </div>
        <div>
          <label className="etiket" htmlFor="mdl">3D model (STL veya GLB, müşteri ürün sayfasında döndürebilir)</label>
          <input id="mdl" className="girdi" value={f.model_url} onChange={set('model_url')} placeholder="Yüklenen dosyanın adresi burada görünür" />
          <input type="file" accept=".stl,.glb,.gltf,.obj" onChange={(e) => medyaYukle(e, 'model_url')} className="mt-2 block text-sm file:mr-3 file:rounded-full file:border-0 file:bg-lacivert-800 file:px-3 file:py-1.5 file:text-white" />
        </div>
        {medyaYukleniyor && <p className="soluk text-xs">Yükleniyor…</p>}
      </section>

      <section className="kutu space-y-3 p-5">
        <h2 className="font-sans font-semibold">Teknik bilgiler tablosu</h2>
        {f.specs.map((s, i) => (
          <div key={i} className="flex gap-2">
            <input className="girdi" value={s.ad || ''} onChange={(e) => specGuncelle(i, 'ad', e.target.value)} placeholder="Örnek: Ölçü" aria-label="Özellik adı" />
            <input className="girdi" value={s.deger || ''} onChange={(e) => specGuncelle(i, 'deger', e.target.value)} placeholder="Örnek: 12 × 8 × 18 cm" aria-label="Değer" />
            <button type="button" onClick={() => setF({ ...f, specs: f.specs.filter((_, n) => n !== i) })} className="btn-cizgi px-3 text-red-600" aria-label="Satırı sil">×</button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setF({ ...f, specs: [...f.specs, { ad: '', deger: '' }] })} className="btn-cizgi py-1.5">+ Satır ekle</button>
          {f.specs.length === 0 && <button type="button" onClick={() => setF({ ...f, specs: ['Ölçü', 'Ağırlık', 'Malzeme', 'Katman kalınlığı', 'Bakım'].map((ad) => ({ ad, deger: '' })) })} className="btn-cizgi py-1.5">Hazır şablonu ekle</button>}
        </div>
      </section>

      <section className="kutu space-y-3 p-5 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.allow_personalization} onChange={set('allow_personalization')} className="accent-nozul-500" /> Müşteri ürüne isim/yazı ekleyebilsin</label>
        {f.allow_personalization && (
          <div className="ml-6">
            <label className="etiket" htmlFor="pt">Canlı önizleme şekli</label>
            <select id="pt" className="girdi max-w-xs" value={f.preview_type} onChange={set('preview_type')}>
              <option value="">Önizleme yok</option><option value="isimlik">İsimlik anahtarlık</option><option value="plaka">Plaka</option><option value="etiket">Oval etiket</option>
            </select>
          </div>
        )}
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_featured} onChange={set('is_featured')} className="accent-nozul-500" /> Ana sayfada öne çıkar</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_active} onChange={set('is_active')} className="accent-nozul-500" /> Sitede yayında <span className="soluk">(kapalıysa ürün sitede hiç görünmez)</span></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_for_sale !== false} onChange={set('is_for_sale')} className="accent-nozul-500" /> Satışta <span className="soluk">(kapalıysa ürün görünür, incelenebilir ama satın alınamaz)</span></label>
      </section>

      {err && <p className="hata">{err}</p>}
      <div className="flex gap-3">
        <button disabled={busy || uploading} className="btn-ana">{product ? 'Değişiklikleri kaydet' : 'Ürünü ekle'}</button>
        {product && <button type="button" onClick={sil} className="btn-cizgi text-red-600">Ürünü sil</button>}
      </div>
    </form>
  );
}
