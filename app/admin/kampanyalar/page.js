'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const BOS = { name: '', buy_qty: 3, pay_qty: 2, hedef: 'kategori', product_id: '', category_id: '', starts_at: '', ends_at: '' };

export default function Page() {
  const supabase = createClient();
  const [list, setList] = useState([]);
  const [urunler, setUrunler] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [f, setF] = useState(BOS);
  const [err, setErr] = useState('');
  const load = async () => {
    const [a, b, c] = await Promise.all([
      supabase.from('promotions').select('*, products(name), categories(name)').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name').neq('section', 'yazici').order('name'),
      supabase.from('categories').select('id, name, section').neq('section', 'yazici').order('sort'),
    ]);
    setList(a.data || []); setUrunler(b.data || []); setKategoriler(c.data || []);
  };
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr(''); };
  async function ekle(e) {
    e.preventDefault();
    if (!f.name.trim()) return setErr('Kampanya adı girin.');
    if (!(+f.buy_qty > +f.pay_qty && +f.pay_qty >= 1)) return setErr('"Al" adedi "öde" adedinden büyük olmalı.');
    if (f.hedef === 'urun' ? !f.product_id : !f.category_id) return setErr('Kampanyanın geçerli olacağı ürünü veya kategoriyi seçin.');
    const { error } = await supabase.from('promotions').insert({
      name: f.name, buy_qty: +f.buy_qty, pay_qty: +f.pay_qty,
      product_id: f.hedef === 'urun' ? f.product_id : null, category_id: f.hedef === 'kategori' ? f.category_id : null,
      starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null, ends_at: f.ends_at ? new Date(f.ends_at).toISOString() : null,
    });
    if (error) return setErr(error.message);
    setF(BOS); load();
  }
  const toggle = async (k) => { await supabase.from('promotions').update({ is_active: !k.is_active }).eq('id', k.id); load(); };
  const sil = async (k) => { if (confirm('Kampanya silinsin mi?')) { await supabase.from('promotions').delete().eq('id', k.id); load(); } };
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Kampanyalar</h1>
      <div className="kutu p-5 text-sm leading-6">
        <p className="font-semibold">Diğer kampanya araçları</p>
        <ul className="soluk mt-1 list-disc pl-5">
          <li><b>Süreli indirim:</b> Ürün düzenle → "Eski fiyat" ve "İndirim bitişi" alanları. Bitince ürün kendiliğinden eski fiyatına döner.</li>
          <li><b>Set ürünler:</b> Ürün düzenle → "Set içeriği".</li>
          <li><b>İlk sipariş indirimi, puan oranı, hediye paketi ücreti:</b> Mağaza ayarları.</li>
          <li><b>Kupon ve hediye çeki:</b> Kuponlar ve Hediye çekleri sayfaları.</li>
        </ul>
      </div>
      <form onSubmit={ekle} className="kutu grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="font-sans font-semibold sm:col-span-2">Yeni "X al Y öde" kampanyası</h2>
        <div className="sm:col-span-2"><label className="etiket" htmlFor="n">Kampanya adı</label><input id="n" className="girdi" value={f.name} onChange={set('name')} placeholder="Anahtarlıklarda 3 al 2 öde" /></div>
        <div className="flex items-end gap-2">
          <div><label className="etiket" htmlFor="b">Al</label><input id="b" type="number" min={2} className="girdi w-24" value={f.buy_qty} onChange={set('buy_qty')} /></div>
          <div><label className="etiket" htmlFor="p">Öde</label><input id="p" type="number" min={1} className="girdi w-24" value={f.pay_qty} onChange={set('pay_qty')} /></div>
        </div>
        <div>
          <label className="etiket">Geçerli olduğu yer</label>
          <div className="flex gap-2">
            <select className="girdi w-36" value={f.hedef} onChange={set('hedef')} aria-label="Hedef türü"><option value="kategori">Kategori</option><option value="urun">Tek ürün</option></select>
            {f.hedef === 'kategori'
              ? <select className="girdi" value={f.category_id} onChange={set('category_id')} aria-label="Kategori"><option value="">Seçin</option>{kategoriler.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select>
              : <select className="girdi" value={f.product_id} onChange={set('product_id')} aria-label="Ürün"><option value="">Seçin</option>{urunler.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>}
          </div>
        </div>
        <div><label className="etiket" htmlFor="s">Başlangıç (isteğe bağlı)</label><input id="s" type="datetime-local" className="girdi" value={f.starts_at} onChange={set('starts_at')} /></div>
        <div><label className="etiket" htmlFor="e">Bitiş (isteğe bağlı)</label><input id="e" type="datetime-local" className="girdi" value={f.ends_at} onChange={set('ends_at')} /></div>
        {err && <p className="hata sm:col-span-2">{err}</p>}
        <div className="sm:col-span-2"><button className="btn-ana">Kampanyayı oluştur</button></div>
      </form>
      <ul className="space-y-3">
        {list.map((k) => (
          <li key={k.id} className={`kutu flex flex-wrap items-center gap-3 p-4 text-sm ${k.is_active ? '' : 'opacity-50'}`}>
            <span className="rounded-full bg-nozul-500 px-3 py-1 font-bold text-white">{k.buy_qty} al {k.pay_qty} öde</span>
            <b>{k.name}</b>
            <span className="soluk">{k.products?.name || k.categories?.name}{k.ends_at && ` · ${new Date(k.ends_at).toLocaleDateString('tr-TR')} tarihine kadar`}</span>
            <span className="ml-auto flex gap-3"><button onClick={() => toggle(k)} className="underline">{k.is_active ? 'Durdur' : 'Başlat'}</button><button onClick={() => sil(k)} className="text-red-600 underline">Sil</button></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
