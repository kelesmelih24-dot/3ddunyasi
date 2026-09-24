import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { tl, tarih, DURUMLAR } from '@/lib/format';

const ADIMLAR = ['odeme_bekleniyor', 'hazirlaniyor', 'kargoda', 'teslim_edildi'];

export default async function Page({ params }) {
  const supabase = createClient();
  const { data: o } = await supabase.from('orders').select('*, order_items(*)').eq('id', params.id).single();
  if (!o) notFound();
  const settings = await getSettings();
  const idx = ADIMLAR.indexOf(o.status);
  const a = o.shipping_address;
  return (
    <div className="kap max-w-3xl py-10">
      <Link href="/hesabim" className="soluk text-sm hover:underline">Siparişlerim</Link>
      <h1 className="mt-2 text-3xl font-bold">{o.order_no}</h1>
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

      {o.tracking_no && <div className="kutu mt-6 p-4 text-sm">Kargo: <b>{o.cargo_company}</b> · Takip no: <b className="font-mono">{o.tracking_no}</b></div>}
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
          {o.discount > 0 && <div className="flex justify-between"><span>İndirim ({o.coupon_code})</span><span>-{tl(o.discount)}</span></div>}
          <div className="flex justify-between"><span>Kargo</span><span>{o.shipping > 0 ? tl(o.shipping) : 'Ücretsiz'}</span></div>
          <div className="flex justify-between text-base font-bold"><span>Toplam</span><span>{tl(o.total)}</span></div>
        </div>
      </div>
      <div className="kutu mt-6 p-4 text-sm leading-6">
        <p className="font-semibold">Teslimat adresi</p>
        <p>{a.full_name} · {a.phone}<br />{a.address}<br />{a.district} / {a.city} {a.zip}</p>
      </div>
    </div>
  );
}
