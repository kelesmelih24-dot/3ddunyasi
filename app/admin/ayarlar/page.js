'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const ALANLAR = [
  ['shipping_fee', 'Kargo ücreti (TL)', 'number'], ['free_shipping_limit', 'Ücretsiz kargo alt limiti (TL)', 'number'],
  ['bank_name', 'Banka adı'], ['account_holder', 'Hesap sahibi'], ['iban', 'IBAN'],
  ['whatsapp', 'WhatsApp numarası (905xxxxxxxxx)'], ['contact_phone', 'Telefon'], ['contact_email', 'İletişim e-postası'],
  ['address', 'Adres'], ['instagram', 'Instagram kullanıcı adı'],
  ['first_order_pct', 'İlk siparişe özel indirim (%)', 'number'], ['loyalty_pct', 'Puan kazanma oranı (% , 1 puan = 1 TL)', 'number'],
  ['gift_wrap_fee', 'Hediye paketi ücreti (TL)', 'number'], ['local_delivery_fee', 'Ankara içi elden teslim ücreti (TL)', 'number'],
  ['pickup_address', 'Gel-al adresi / açıklaması'],
  ['filament_gram_cost', 'Filament maliyeti (TL / gram)', 'number'], ['printer_hour_cost', 'Yazıcı saat maliyeti (elektrik, amortisman, TL)', 'number'],
  ['low_stock_threshold', 'Düşük stok uyarı sınırı (adet)', 'number'],
];
const SAYILAR = ['filament_gram_cost', 'printer_hour_cost', 'low_stock_threshold', 'shipping_fee', 'free_shipping_limit', 'first_order_pct', 'loyalty_pct', 'gift_wrap_fee', 'local_delivery_fee'];

export default function Page() {
  const supabase = createClient();
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState('');
  const [acilis, setAcilis] = useState('');
  useEffect(() => { supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => {
    setF(data);
    if (data?.launch_at) { const d = new Date(data.launch_at); setAcilis(new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16)); }
  }); }, []);
  async function kaydet(e) {
    e.preventDefault();
    const { id, updated_at, ...rest } = f;
    rest.launch_at = acilis ? new Date(acilis).toISOString() : null;
    SAYILAR.forEach((k) => { if (k in rest) rest[k] = Number(rest[k]) || 0; });
    const { error } = await supabase.from('settings').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', 1);
    setMsg(error ? error.message : 'Ayarlar kaydedildi');
  }
  if (!f) return <p className="soluk">Yükleniyor…</p>;
  return (
    <form onSubmit={kaydet} className="max-w-2xl space-y-5">
      <h1 className="text-3xl font-semibold">Mağaza ayarları</h1>
      <div className="kutu grid gap-4 p-5 sm:grid-cols-2">
        {ALANLAR.map(([k, l, t]) => (
          <div key={k} className={['iban', 'address', 'pickup_address'].includes(k) ? 'sm:col-span-2' : ''}>
            <label htmlFor={k} className="etiket">{l}</label>
            <input id={k} type={t || 'text'} step="0.01" className="girdi" value={f[k] ?? ''} onChange={(e) => { setF({ ...f, [k]: e.target.value }); setMsg(''); }} />
          </div>
        ))}
      </div>
      <div className="kutu p-5">
        <label htmlFor="acilis" className="etiket">Açılış tarihi ve saati (ana sayfadaki geri sayım)</label>
        <input id="acilis" type="datetime-local" className="girdi max-w-xs" value={acilis} onChange={(e) => { setAcilis(e.target.value); setMsg(''); }} />
        <p className="soluk mt-2 text-xs">Boş bırakırsanız ana sayfada geri sayım yerine "Çok yakında" yazar. Tarih geçince bölüm kendiliğinden gizlenir.</p>
      </div>
      <div className="kutu space-y-3 p-5">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.cart_reminder} onChange={(e) => setF({ ...f, cart_reminder: e.target.checked })} className="accent-nozul-500" /> Sepette ürün bırakan üyelere ertesi gün hatırlatma e-postası gönder</label>
        {f.cargo_links && (
          <div>
            <p className="etiket">Kargo takip bağlantıları</p>
            <p className="soluk mb-2 text-xs">{'{kod}'} yazan yere takip numarası gelir. Kargo firmanızın takip sayfasındaki bağlantıyla kontrol edip gerekirse düzeltin.</p>
            {Object.entries(f.cargo_links).map(([firma, link]) => (
              <div key={firma} className="mb-2 grid gap-2 sm:grid-cols-[160px_1fr]">
                <span className="self-center text-sm font-semibold">{firma}</span>
                <input className="girdi" value={link} onChange={(e) => setF({ ...f, cargo_links: { ...f.cargo_links, [firma]: e.target.value } })} aria-label={`${firma} takip bağlantısı`} />
              </div>
            ))}
          </div>
        )}
      </div>
      {f.pricing && (
        <div className="kutu space-y-4 p-5">
          <h2 className="font-sans font-semibold">Özel sipariş tahmini fiyat ayarları</h2>
          <p className="soluk text-xs">Formül: başlangıç ücreti + (gram × gram fiyatı × kalite çarpanı). Gram, model hacmi, yoğunluk ve doluluktan hesaplanır.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="etiket">Başlangıç ücreti (TL)</label><input type="number" className="girdi" value={f.pricing.baslangic} onChange={(e) => setF({ ...f, pricing: { ...f.pricing, baslangic: +e.target.value } })} /></div>
            <div><label className="etiket">En düşük fiyat (TL)</label><input type="number" className="girdi" value={f.pricing.min_fiyat} onChange={(e) => setF({ ...f, pricing: { ...f.pricing, min_fiyat: +e.target.value } })} /></div>
          </div>
          <div>
            <p className="etiket">Malzemeler</p>
            {f.pricing.malzemeler.map((m, i) => (
              <div key={i} className="mb-2 grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <input className="girdi" value={m.ad} aria-label="Malzeme adı" onChange={(e) => setF({ ...f, pricing: { ...f.pricing, malzemeler: f.pricing.malzemeler.map((x, n) => n === i ? { ...x, ad: e.target.value } : x) } })} />
                <input type="number" step="0.01" className="girdi" value={m.yogunluk} aria-label="Yoğunluk g/cm³" title="Yoğunluk g/cm³" onChange={(e) => setF({ ...f, pricing: { ...f.pricing, malzemeler: f.pricing.malzemeler.map((x, n) => n === i ? { ...x, yogunluk: +e.target.value } : x) } })} />
                <input type="number" step="0.01" className="girdi" value={m.gram_fiyat} aria-label="Gram fiyatı TL" title="Gram fiyatı (TL)" onChange={(e) => setF({ ...f, pricing: { ...f.pricing, malzemeler: f.pricing.malzemeler.map((x, n) => n === i ? { ...x, gram_fiyat: +e.target.value } : x) } })} />
                <button type="button" className="btn-cizgi px-3 text-red-600" aria-label="Sil" onClick={() => setF({ ...f, pricing: { ...f.pricing, malzemeler: f.pricing.malzemeler.filter((_, n) => n !== i) } })}>×</button>
              </div>
            ))}
            <p className="soluk text-xs">Sütunlar: ad · yoğunluk (g/cm³) · gram fiyatı (TL)</p>
            <button type="button" className="btn-cizgi mt-2 py-1.5" onClick={() => setF({ ...f, pricing: { ...f.pricing, malzemeler: [...f.pricing.malzemeler, { ad: 'Yeni', yogunluk: 1.2, gram_fiyat: 2 }] } })}>+ Malzeme ekle</button>
          </div>
          <div>
            <label className="etiket">Renkler (virgülle ayırın)</label>
            <input className="girdi" value={f.pricing.renkler.join(', ')} onChange={(e) => setF({ ...f, pricing: { ...f.pricing, renkler: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) } })} />
          </div>
          <div>
            <p className="etiket">Kalite seçenekleri</p>
            {f.pricing.kaliteler.map((k, i) => (
              <div key={i} className="mb-2 grid grid-cols-[2fr_1fr_1fr] gap-2">
                <input className="girdi" value={k.ad} aria-label="Kalite adı" onChange={(e) => setF({ ...f, pricing: { ...f.pricing, kaliteler: f.pricing.kaliteler.map((x, n) => n === i ? { ...x, ad: e.target.value } : x) } })} />
                <input type="number" step="0.01" className="girdi" value={k.katman} aria-label="Katman mm" title="Katman kalınlığı (mm)" onChange={(e) => setF({ ...f, pricing: { ...f.pricing, kaliteler: f.pricing.kaliteler.map((x, n) => n === i ? { ...x, katman: +e.target.value } : x) } })} />
                <input type="number" step="0.05" className="girdi" value={k.carpan} aria-label="Fiyat çarpanı" title="Fiyat çarpanı" onChange={(e) => setF({ ...f, pricing: { ...f.pricing, kaliteler: f.pricing.kaliteler.map((x, n) => n === i ? { ...x, carpan: +e.target.value } : x) } })} />
              </div>
            ))}
            <p className="soluk text-xs">Sütunlar: ad · katman (mm) · fiyat çarpanı</p>
          </div>
        </div>
      )}
      {msg && <p className={msg.includes('kaydedildi') ? 'basari' : 'hata'}>{msg}</p>}
      <button className="btn-ana">Ayarları kaydet</button>
    </form>
  );
}
