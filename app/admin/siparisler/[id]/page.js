import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { tl, tarih, TESLIMAT } from '@/lib/format';
import WhatsAppNotify from '@/components/admin/WhatsAppNotify';
import OrderAdmin from '@/components/admin/OrderAdmin';

export default async function Page({ params }) {
  const supabase = createClient();
  const { data: o } = await supabase.from('orders').select('*, order_items(*)').eq('id', params.id).single();
  if (!o) notFound();
  const a = o.shipping_address;
  return (
    <div className="space-y-6">
      <Link href="/admin/siparisler" className="soluk text-sm hover:underline">Siparişler</Link>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold">{o.order_no}</h1><div className="flex flex-wrap gap-2"><WhatsAppNotify order={o} /><Link href={`/admin/siparisler/${o.id}/yazdir`} className="btn-cizgi">🖨 Etiket ve fiş yazdır</Link></div></div>
      <p className="soluk -mt-4">{tarih(o.created_at)} · {o.email}</p>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="kutu divide-y divide-lacivert-100 text-sm dark:divide-lacivert-800">
            {o.order_items.map((i) => (
              <div key={i.id} className="flex justify-between gap-4 p-4">
                <div><b>{i.name}</b>{i.unit === 'paket' && ' (paket)'}{i.kind === 'hediye_ceki' && <span className="soluk"> · Alıcı: {i.meta?.recipient_name || i.meta?.recipient_email || 'Satın alan'}</span>}{i.personalization && <p className="mt-1 rounded bg-nozul-50 px-2 py-1 text-nozul-700 dark:bg-nozul-700/20 dark:text-nozul-100">Yazı: <b>{i.personalization}</b></p>}</div>
                <span>{i.quantity} x {tl(i.unit_price)}</span>
              </div>
            ))}
            <div className="space-y-1 p-4">
              <div className="flex justify-between"><span>Ara toplam</span><span>{tl(o.subtotal)}</span></div>
              {o.coupon_code && <div className="flex justify-between"><span>Kupon ({o.coupon_code})</span><span>-{tl(o.discount - o.promo_discount - o.first_order_discount)}</span></div>}
              {o.promo_discount > 0 && <div className="flex justify-between"><span>Kampanya</span><span>-{tl(o.promo_discount)}</span></div>}
              {o.first_order_discount > 0 && <div className="flex justify-between"><span>İlk sipariş</span><span>-{tl(o.first_order_discount)}</span></div>}
              <div className="flex justify-between"><span>{TESLIMAT[o.delivery_method]}</span><span>{tl(o.shipping)}</span></div>
              {o.gift_wrap_fee > 0 && <div className="flex justify-between"><span>Hediye paketi</span><span>{tl(o.gift_wrap_fee)}</span></div>}
              {o.points_used > 0 && <div className="flex justify-between"><span>Puan</span><span>-{tl(o.points_used)}</span></div>}
              {o.gift_card_amount > 0 && <div className="flex justify-between"><span>Hediye çeki ({o.gift_card_code})</span><span>-{tl(o.gift_card_amount)}</span></div>}
              <div className="flex justify-between text-base font-bold"><span>Toplam</span><span>{tl(o.total)}</span></div>
            </div>
          </div>
          {(o.gift_wrap || o.delivery_method !== 'kargo') && (
            <div className="rounded-2xl border-2 border-nozul-500 p-4 text-sm leading-6">
              {o.delivery_method !== 'kargo' && <p>🚚 <b>{TESLIMAT[o.delivery_method]}</b></p>}
              {o.gift_wrap && <p>🎁 <b>Hediye paketi yapılacak</b>{o.gift_note && <> · Not kartı: "{o.gift_note}"</>} · Faturada fiyat gösterilmeyecek</p>}
            </div>
          )}
          <div className="kutu p-4 text-sm leading-6">
            <p className="font-semibold">Teslimat adresi</p>{o.user_id && <Link href={`/admin/musteriler/${o.user_id}`} className="float-right text-xs underline">Müşteri kartı</Link>}
            <p>{a.full_name} · {a.phone}<br />{a.address}<br />{a.district} / {a.city} {a.zip}</p>
            {o.note && <p className="mt-3"><b>Müşteri notu:</b> {o.note}</p>}
          </div>
        </div>
        <OrderAdmin order={o} />
      </div>
    </div>
  );
}
