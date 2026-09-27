import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { tl } from '@/lib/format';
import PurchaseEvent from '@/components/PurchaseEvent';

export const metadata = { title: 'Siparişiniz alındı' };

export default async function Success({ searchParams }) {
  const supabase = createClient();
  const { data: order } = await supabase.from('orders').select('*').eq('order_no', searchParams.no || '').maybeSingle();
  const settings = await getSettings();
  if (!order) return <div className="kap py-20 text-center"><h1 className="text-2xl font-bold">Sipariş bulunamadı</h1><Link href="/hesabim" className="btn-ana mt-6">Siparişlerime git</Link></div>;
  return (
    <div className="kap max-w-2xl py-16">
      <PurchaseEvent order={{ order_no: order.order_no, total: order.total }} />
      <div className="kutu p-8">
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Siparişiniz alındı</p>
        <h1 className="mt-1 text-3xl font-semibold">{order.order_no}</h1>
        <p className="soluk mt-2">Sipariş özetini {order.email} adresine gönderdik.</p>
        {order.payment_method === 'havale' && order.payment_status !== 'odendi' && (
          <div className="mt-6 rounded-lg bg-nozul-50 p-5 dark:bg-nozul-700/20">
            <h2 className="font-sans font-semibold">Ödemenizi bu hesaba yapın</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <div><dt className="inline soluk">Banka: </dt><dd className="inline">{settings.bank_name}</dd></div>
              <div><dt className="inline soluk">Alıcı: </dt><dd className="inline">{settings.account_holder}</dd></div>
              <div><dt className="inline soluk">IBAN: </dt><dd className="inline font-mono font-semibold">{settings.iban}</dd></div>
              <div><dt className="inline soluk">Tutar: </dt><dd className="inline font-semibold">{tl(order.total)}</dd></div>
              <div><dt className="inline soluk">Açıklama: </dt><dd className="inline font-semibold">{order.order_no}</dd></div>
            </dl>
            <p className="mt-3 text-sm">Ödemeniz hesabımıza geçtiğinde siparişiniz hazırlanmaya başlar.</p>
          </div>
        )}
        <div className="mt-8 flex gap-3">
          <Link href={`/hesabim/siparis/${order.id}`} className="btn-koyu">Siparişi görüntüle</Link>
          <Link href="/" className="btn-cizgi">Ana sayfa</Link>
        </div>
      </div>
    </div>
  );
}
