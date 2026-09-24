import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { tl, tarih } from '@/lib/format';
import OrderAdmin from '@/components/admin/OrderAdmin';

export default async function Page({ params }) {
  const supabase = createClient();
  const { data: o } = await supabase.from('orders').select('*, order_items(*)').eq('id', params.id).single();
  if (!o) notFound();
  const a = o.shipping_address;
  return (
    <div className="space-y-6">
      <Link href="/admin/siparisler" className="soluk text-sm hover:underline">Siparişler</Link>
      <h1 className="text-3xl font-bold">{o.order_no}</h1>
      <p className="soluk -mt-4">{tarih(o.created_at)} · {o.email}</p>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="kutu divide-y divide-lacivert-100 text-sm dark:divide-lacivert-800">
            {o.order_items.map((i) => (
              <div key={i.id} className="flex justify-between gap-4 p-4">
                <div><b>{i.name}</b>{i.unit === 'paket' && ' (paket)'}{i.personalization && <p className="mt-1 rounded bg-nozul-50 px-2 py-1 text-nozul-700 dark:bg-nozul-700/20 dark:text-nozul-100">Yazı: <b>{i.personalization}</b></p>}</div>
                <span>{i.quantity} x {tl(i.unit_price)}</span>
              </div>
            ))}
            <div className="space-y-1 p-4">
              <div className="flex justify-between"><span>Ara toplam</span><span>{tl(o.subtotal)}</span></div>
              {o.discount > 0 && <div className="flex justify-between"><span>İndirim ({o.coupon_code})</span><span>-{tl(o.discount)}</span></div>}
              <div className="flex justify-between"><span>Kargo</span><span>{tl(o.shipping)}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Toplam</span><span>{tl(o.total)}</span></div>
            </div>
          </div>
          <div className="kutu p-4 text-sm leading-6">
            <p className="font-semibold">Teslimat adresi</p>
            <p>{a.full_name} · {a.phone}<br />{a.address}<br />{a.district} / {a.city} {a.zip}</p>
            {o.note && <p className="mt-3"><b>Müşteri notu:</b> {o.note}</p>}
          </div>
        </div>
        <OrderAdmin order={o} />
      </div>
    </div>
  );
}
