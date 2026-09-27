import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { tl, tarih, DURUMLAR, TESLIMAT, IADE_DURUM, kargoLinki } from '@/lib/format';
import OrderActions from '@/components/OrderActions';

const ADIMLAR = ['odeme_bekleniyor', 'hazirlaniyor', 'kargoda', 'teslim_edildi'];

export default async function Page({ params }) {
  const supabase = createClient();
  const { data: o } = await supabase.from('orders').select('*, order_items(*)').eq('id', params.id).single();
  if (!o) notFound();
  const settings = await getSettings();
  const { data: iadeler } = await supabase.from('return_requests').select('*').eq('order_id', o.id);
  const teslim = o.status === 'teslim_edildi';
  const iadeUygun = teslim && Date.now() - new Date(o.created_at) < 30 * 864e5;
  const takip = kargoLinki(settings.cargo_links, o.cargo_company, o.tracking_no);
  const idx = ADIMLAR.indexOf(o.status);
  const a = o.shipping_address;
  return (
    <div className="kap max-w-3xl py-10">
      <Link href="/hesabim" className="soluk text-sm hover:underline">Siparişlerim</Link>
      <h1 className="mt-2 text-3xl font-semibold">{o.order_no}</h1>
      <p className="soluk">{tarih(o.created_at)}</p>

      {o.status === 'iptal' ? <p className="hata mt-6">Bu sipariş iptal edildi.</p> : (
        <ol className="mt-8 grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">
          {ADIMLAR.map((s, n) => (
            <li key={s}>
              <div className={`h-1.5 rounded ${n <= idx ? 'bg-nozul-500' : 'bg-lacivert-100 dark:bg-lacivert-800'}`} />
              <p className={`mt-2 ${n <= idx ? 'font-semibold' : 'soluk'}`}>{DURUMLAR[s].ad}</p>
            </li>
          ))}
        </ol>
      )}

      {o.tracking_no && <div className="kutu mt-6 flex flex-wrap items-center gap-3 p-4 text-sm">Kargo: <b>{o.cargo_company}</b> · Takip no: <b className="font-mono">{o.tracking_no}</b>{takip && <a href={takip} target="_blank" rel="noreferrer" className="btn-ana ml-auto py-2">Kargom nerede?</a>}</div>}
      {o.delivery_method !== 'kargo' && <div className="kutu mt-6 p-4 text-sm">Teslimat: <b>{TESLIMAT[o.delivery_method]}</b>{o.delivery_method === 'gel_al' && <> · {settings.pickup_address}</>}</div>}
      {iadeler?.map((r) => <p key={r.id} className="kutu mt-4 p-4 text-sm">İade talebiniz: <b>{IADE_DURUM[r.status]}</b>{r.admin_note && <> · {r.admin_note}</>}</p>)}
      {o.payment_method === 'havale' && o.payment_status === 'bekliyor' && o.status !== 'iptal' && (
        <div className="mt-6 rounded-lg bg-nozul-50 p-4 text-sm dark:bg-nozul-700/20">
          Ödemenizi <b>{settings.bank_name}</b> / <b>{settings.account_holder}</b> / <b className="font-mono">{settings.iban}</b> hesabına, açıklamaya <b>{o.order_no}</b> yazarak yapabilirsiniz.
        </div>
      )}

      <div className="kutu mt-6 divide-y divide-lacivert-100 dark:divide-lacivert-800">
        {o.order_items.map((i) => (
          <div key={i.id} className="flex justify-between gap-4 p-4 text-sm">
            <div><p className="font-semibold">{i.name}{i.unit === 'paket' ? ' (paket)' : ''}</p>{i.personalization && <p className="soluk">Yazı: {i.personalization}</p>}</div>
            <p>{i.quantity} x {tl(i.unit_price)}</p>
          </div>
        ))}
        <div className="space-y-1 p-4 text-sm">
          <div className="flex justify-between"><span>Ara toplam</span><span>{tl(o.subtotal)}</span></div>
          {o.coupon_code && <div className="flex justify-between"><span>Kupon ({o.coupon_code})</span><span>-{tl(o.discount - o.promo_discount - o.first_order_discount)}</span></div>}
          {o.promo_discount > 0 && <div className="flex justify-between"><span>Kampanya</span><span>-{tl(o.promo_discount)}</span></div>}
          {o.first_order_discount > 0 && <div className="flex justify-between"><span>İlk sipariş indirimi</span><span>-{tl(o.first_order_discount)}</span></div>}
          <div className="flex justify-between"><span>{TESLIMAT[o.delivery_method] || 'Kargo'}</span><span>{o.shipping > 0 ? tl(o.shipping) : 'Ücretsiz'}</span></div>
          {o.gift_wrap_fee > 0 && <div className="flex justify-between"><span>Hediye paketi</span><span>{tl(o.gift_wrap_fee)}</span></div>}
          {o.points_used > 0 && <div className="flex justify-between"><span>Kullanılan puan</span><span>-{tl(o.points_used)}</span></div>}
          {o.gift_card_amount > 0 && <div className="flex justify-between"><span>Hediye çeki</span><span>-{tl(o.gift_card_amount)}</span></div>}
          {o.points_earned > 0 && <div className="flex justify-between text-emerald-600"><span>Kazanılan puan</span><span>+{o.points_earned}</span></div>}
          <div className="flex justify-between text-base font-bold"><span>Toplam</span><span>{tl(o.total)}</span></div>
        </div>
      </div>
      <OrderActions order={o} items={o.order_items} iadeVar={!!iadeler?.length} iadeUygun={iadeUygun} />
      <div className="kutu mt-6 p-4 text-sm leading-6">
        <p className="font-semibold">Teslimat adresi</p>
        <p>{a.full_name} · {a.phone}<br />{a.address}<br />{a.district} / {a.city} {a.zip}</p>
      </div>
    </div>
  );
}
