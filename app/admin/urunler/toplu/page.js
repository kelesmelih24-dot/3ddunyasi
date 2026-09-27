'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/format';

const SUTUNLAR = ['slug', 'ad', 'bolum', 'kategori', 'fiyat', 'eski_fiyat', 'stok', 'aciklama', 'satis_sekli', 'paket_adedi', 'paket_fiyati', 'kisisellestirme', 'yayinda', 'maliyet', 'gorsel_url'];
const evet = (v) => ['evet', 'e', '1', 'true', 'x', 'yes'].includes(String(v ?? '').trim().toLocaleLowerCase('tr'));

export default function Page() {
  const supabase = createClient();
  const [kategoriler, setKategoriler] = useState([]);
  const [satirlar, setSatirlar] = useState([]);
  const [hatalar, setHatalar] = useState([]);
  const [durum, setDurum] = useState('');
  useEffect(() => { supabase.from('categories').select('id, slug, name, section').then(({ data }) => setKategoriler(data || [])); }, []);

  async function sablonIndir(mevcut) {
    const XLSX = await import('xlsx');
    let rows = [{ slug: 'ornek-urun', ad: 'Örnek ürün', bolum: 'baski', kategori: 'anahtarlik', fiyat: 99.9, eski_fiyat: '', stok: 10, aciklama: 'Açıklama', satis_sekli: 'adet', paket_adedi: 1, paket_fiyati: '', kisisellestirme: 'hayır', yayinda: 'evet', maliyet: 25, gorsel_url: '' }];
    if (mevcut) {
      const { data } = await supabase.from('products').select('*, categories(slug)').order('name');
      rows = (data || []).map((p) => ({ slug: p.slug, ad: p.name, bolum: p.section, kategori: p.categories?.slug || '', fiyat: Number(p.price), eski_fiyat: p.compare_price ?? '', stok: p.stock, aciklama: p.description || '',
        satis_sekli: p.sale_unit, paket_adedi: p.pack_size, paket_fiyati: p.pack_price ?? '', kisisellestirme: p.allow_personalization ? 'evet' : 'hayır', yayinda: p.is_active ? 'evet' : 'hayır', maliyet: p.cost_price ?? '', gorsel_url: (p.images || []).join(' ') }));
    }
    const ws = XLSX.utils.json_to_sheet(rows, { header: SUTUNLAR });
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Urunler');
    XLSX.writeFile(wb, mevcut ? `urunler-${new Date().toISOString().slice(0, 10)}.xlsx` : 'urun-sablonu.xlsx');
  }

  async function dosyaOku(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const XLSX = await import('xlsx');
    const wb = XLSX.read(await file.arrayBuffer());
    const ham = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    const h = [], rows = [];
    ham.forEach((r, i) => {
      const n = i + 2;
      const ad = String(r.ad || '').trim();
      if (!ad) return h.push(`Satır ${n}: "ad" boş`);
      const bolum = String(r.bolum || 'baski').trim();
      if (!['baski', 'malzeme', 'yazici'].includes(bolum)) return h.push(`Satır ${n}: bolum baski / malzeme / yazici olmalı`);
      const fiyat = Number(String(r.fiyat).replace(',', '.'));
      if (!(fiyat >= 0)) return h.push(`Satır ${n}: fiyat hatalı`);
      const kat = kategoriler.find((k) => k.slug === String(r.kategori).trim() || k.name === String(r.kategori).trim());
      if (r.kategori && !kat) h.push(`Satır ${n}: "${r.kategori}" kategorisi bulunamadı (kategorisiz eklenecek)`);
      const sayi = (v) => (v === '' || v === null ? null : Number(String(v).replace(',', '.')));
      rows.push({
        slug: String(r.slug || '').trim() || slugify(ad), name: ad, section: bolum, category_id: kat?.id || null, price: fiyat,
        compare_price: sayi(r.eski_fiyat), stock: Math.max(0, parseInt(r.stok, 10) || 0), description: String(r.aciklama || ''),
        sale_unit: ['adet', 'paket', 'ikisi'].includes(r.satis_sekli) ? r.satis_sekli : 'adet', pack_size: Math.max(1, parseInt(r.paket_adedi, 10) || 1),
        pack_price: sayi(r.paket_fiyati), allow_personalization: evet(r.kisisellestirme), is_active: r.yayinda === '' ? true : evet(r.yayinda),
        cost_price: sayi(r.maliyet), ...(String(r.gorsel_url).trim() ? { images: String(r.gorsel_url).trim().split(/\s+/) } : {}),
      });
    });
    setSatirlar(rows); setHatalar(h); setDurum(''); e.target.value = '';
  }

  async function yukle() {
    setDurum('Yükleniyor…');
    const { error } = await supabase.from('products').upsert(satirlar, { onConflict: 'slug' });
    setDurum(error ? 'Hata: ' + error.message : `${satirlar.length} ürün eklendi / güncellendi.`);
    if (!error) setSatirlar([]);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Excel ile toplu ürün işlemi</h1>
      <div className="kutu space-y-3 p-5 text-sm leading-6">
        <p><b>1.</b> Şablonu ya da mevcut ürünlerinizi indirin. <b>2.</b> Excel'de düzenleyin (slug aynı kalırsa ürün güncellenir, yeni slug yeni ürün ekler). <b>3.</b> Dosyayı yükleyin, önizlemeyi kontrol edip onaylayın.</p>
        <p className="soluk">bolum: baski / malzeme / yazici · kategori: kategori adı veya slug · satis_sekli: adet / paket / ikisi · evet/hayır alanları: kisisellestirme, yayinda · gorsel_url: birden fazlaysa boşlukla ayırın</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => sablonIndir(false)} className="btn-cizgi">⬇ Boş şablon</button>
          <button onClick={() => sablonIndir(true)} className="btn-cizgi">⬇ Mevcut ürünleri indir</button>
          <label className="btn-ana cursor-pointer">⬆ Excel dosyası yükle<input type="file" accept=".xlsx,.xls,.csv" onChange={dosyaOku} className="sr-only" /></label>
        </div>
      </div>
      {hatalar.length > 0 && <ul className="hata list-disc space-y-1 pl-8">{hatalar.map((h) => <li key={h}>{h}</li>)}</ul>}
      {satirlar.length > 0 && (
        <div className="space-y-3">
          <div className="kutu max-h-96 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="soluk sticky top-0 bg-white dark:bg-lacivert-900"><tr>{['slug', 'Ad', 'Bölüm', 'Fiyat', 'Stok', 'Yayında'].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-lacivert-100 dark:divide-lacivert-800">{satirlar.map((r) => <tr key={r.slug}><td className="p-2 font-mono">{r.slug}</td><td className="p-2">{r.name}</td><td className="p-2">{r.section}</td><td className="p-2">{r.price}</td><td className="p-2">{r.stock}</td><td className="p-2">{r.is_active ? 'evet' : 'hayır'}</td></tr>)}</tbody>
            </table>
          </div>
          <button onClick={yukle} className="btn-ana">{satirlar.length} ürünü kaydet</button>
        </div>
      )}
      {durum && <p className={durum.startsWith('Hata') ? 'hata' : 'basari'}>{durum}</p>}
    </div>
  );
}
