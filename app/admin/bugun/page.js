import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { tl, tarih, TESLIMAT } from '@/lib/format';
import WhatsAppNotify from '@/components/admin/WhatsAppNotify';

export const dynamic = 'force-dynamic';

function Kutu({ baslik, sayi, href, children, renk = '' }) {
  return (
    <section className={`kutu p-5 ${renk}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-sans font-semibold">{baslik} {sayi > 0 && <span className="ml-1 rounded-full bg-nozul-500 px-2 py-0.5 text-xs text-white">{sayi}</span>}</h2>
        {href && <Link href={href} className="text-sm underline">Tümü</Link>}
      </div>
      <div className="mt-3 space-y-2 text-sm">{children}</div>
    </section>
  );
}
const Bos = ({ m }) => <p className="soluk">{m}</p>;

export default async function Page() {
  const db = createClient();
  const [odeme, hazir, isler, sorular, talepler, iadeler, filament, bakim, yazicilar, ayar, urunler] = await Promise.all([
    db.from('orders').select('id, order_no, total, created_at, shipping_address').eq('status', 'odeme_bekleniyor').order('created_at'),
    db.from('orders').select('id, order_no, delivery_method, gift_wrap, shipping_address, email, cargo_company, tracking_no, status, total, order_items(id, name, quantity, personalization)').eq('status', 'hazirlaniyor').order('created_at'),
    db.from('print_jobs').select('id, title, status, order_item_id, printers(name)').in('status', ['bekliyor', 'basiliyor', 'son_islem']).order('created_at'),
    db.from('product_questions').select('id', { count: 'exact', head: true }).is('answer', null),
    db.from('custom_requests').select('id', { count: 'exact', head: true }).eq('status', 'yeni'),
    db.from('return_requests').select('id', { count: 'exact', head: true }).eq('status', 'yeni'),
    db.from('filaments').select('id, material, color, color_hex, remaining_g, low_threshold_g').eq('is_active', true),
    db.from('printer_maintenance').select('id, task, interval_hours, last_done_hours, printer_id'),
    db.from('printers').select('id, name, total_hours').eq('is_active', true),
    db.from('settings').select('low_stock_threshold').eq('id', 1).single(),
    db.from('products').select('id, name, stock').eq('is_active', true).eq('is_for_sale', true).neq('section', 'yazici'),
  ]);
  const acikIs = new Set((isler.data || []).map((j) => j.order_item_id).filter(Boolean));
  const siparisler = hazir.data || [];
  const kargoyaHazir = siparisler.filter((o) => o.order_items.every((i) => !acikIs.has(i.id)));
  const basiliyor = siparisler.filter((o) => o.order_items.some((i) => acikIs.has(i.id)));
  const azFil = (filament.data || []).filter((f) => Number(f.remaining_g) <= Number(f.low_threshold_g));
  const saat = Object.fromEntries((yazicilar.data || []).map((y) => [y.id, y]));
  const bakimi = (bakim.data || []).filter((m) => saat[m.printer_id] && saat[m.printer_id].total_hours - m.last_done_hours >= m.interval_hours);
  const azStok = (urunler.data || []).filter((p) => p.stock <= (ayar.data?.low_stock_threshold ?? 3));
  const bugun = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      <div>
        <p className="ust-etiket">{bugun}</p>
        <h1 className="mt-1 text-3xl font-semibold">Bugün</h1>
      </div>

      {(azFil.length > 0 || bakimi.length > 0 || azStok.length > 0) && (
        <div className="rounded-2xl border-2 border-nozul-500 bg-nozul-50 p-4 text-sm dark:bg-nozul-700/10">
          <p className="font-semibold">Dikkat</p>
          <ul className="mt-2 space-y-1">
            {azFil.map((f) => <li key={f.id}>🧵 <Link href="/admin/filamentler" className="underline">{f.material} {f.color}</Link> azaldı: {Math.round(f.remaining_g)} g kaldı</li>)}
            {bakimi.map((m) => <li key={m.id}>🔧 <Link href="/admin/yazicilar" className="underline">{saat[m.printer_id].name}</Link>: {m.task} zamanı geldi</li>)}
            {azStok.map((p) => <li key={p.id}>⚠️ <Link href={`/admin/urunler/${p.id}`} className="underline">{p.name}</Link>: stokta {p.stock} adet</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Kutu baslik="1. Ödemesi kontrol edilecek" sayi={odeme.data?.length} href="/admin/siparisler?durum=odeme_bekleniyor">
          {!odeme.data?.length ? <Bos m="Bekleyen havale yok." /> : odeme.data.map((o) => (
            <Link key={o.id} href={`/admin/siparisler/${o.id}`} className="flex justify-between rounded-xl bg-krem px-3 py-2 dark:bg-lacivert-800">
              <span><b>{o.order_no}</b> · {o.shipping_address?.full_name}</span><span>{tl(o.total)}</span>
            </Link>
          ))}
          {odeme.data?.length > 0 && <p className="soluk text-xs">Bankanıza gelen havaleleri kontrol edip sipariş sayfasından "Ödemeyi onayla"ya basın.</p>}
        </Kutu>

        <Kutu baslik="2. Basılacaklar" sayi={isler.data?.length} href="/admin/baski-kuyrugu">
          {!isler.data?.length ? <Bos m="Kuyrukta baskı yok." /> : isler.data.map((j) => (
            <div key={j.id} className="flex justify-between gap-2 rounded-xl bg-krem px-3 py-2 dark:bg-lacivert-800">
              <span>{j.title}</span><span className="soluk shrink-0 text-xs">{j.status === 'basiliyor' ? `Basılıyor · ${j.printers?.name || ''}` : j.status === 'son_islem' ? 'Son işlem' : 'Sırada'}</span>
            </div>
          ))}
        </Kutu>

        <Kutu baslik="3. Paketlenip gönderilecek" sayi={kargoyaHazir.length} href="/admin/siparisler?durum=hazirlaniyor">
          {!kargoyaHazir.length ? <Bos m={basiliyor.length ? `${basiliyor.length} sipariş hâlâ baskıda.` : 'Gönderilecek sipariş yok.'} /> : kargoyaHazir.map((o) => (
            <div key={o.id} className="rounded-xl bg-krem px-3 py-2.5 dark:bg-lacivert-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/admin/siparisler/${o.id}`} className="font-semibold underline">{o.order_no}</Link>
                <span className="text-xs">{TESLIMAT[o.delivery_method]}{o.gift_wrap && ' · 🎁 hediye paketi'}</span>
              </div>
              <p className="soluk text-xs">{o.shipping_address?.full_name} · {o.order_items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/admin/siparisler/${o.id}/yazdir`} className="btn-cizgi py-1 text-xs">🖨 Etiket</Link>
                <WhatsAppNotify order={o} kucuk />
              </div>
            </div>
          ))}
        </Kutu>

        <Kutu baslik="4. Yanıt bekleyenler" sayi={(sorular.count || 0) + (talepler.count || 0) + (iadeler.count || 0)}>
          {[['Özel sipariş talebi', talepler.count, '/admin/ozel-talepler'], ['Ürün sorusu', sorular.count, '/admin/sorular'], ['İade talebi', iadeler.count, '/admin/iadeler']].map(([ad, n, h]) => (
            <Link key={h} href={h} className="flex justify-between rounded-xl bg-krem px-3 py-2 dark:bg-lacivert-800"><span>{ad}</span><b>{n || 0}</b></Link>
          ))}
        </Kutu>
      </div>
      <p className="soluk text-xs">Her sabah 08:00'de bu özetin kısa hali Telegram'a gönderilir (Telegram kuruluysa).</p>
    </div>
  );
}
