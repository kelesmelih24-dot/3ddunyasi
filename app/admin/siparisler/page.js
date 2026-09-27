import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { tl, tarih, DURUMLAR, TESLIMAT } from '@/lib/format';
import ExcelExport from '@/components/admin/ExcelExport';

export default async function Page({ searchParams }) {
  const supabase = createClient();
  const durum = searchParams?.durum;
  let q = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
  if (durum === 'bekleyen') q = q.in('status', ['odeme_bekleniyor', 'hazirlaniyor']);
  else if (durum) q = q.eq('status', durum);
  if (searchParams?.q) q = q.or(`order_no.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`);
  const { data: orders } = await q;
  return (
    <div>
      <h1 className="text-3xl font-semibold">Siparişler</h1>
      <div className="my-5 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/siparisler" className={`rounded-md px-3 py-1.5 ${!durum ? 'bg-lacivert-800 text-white dark:bg-lacivert-100 dark:text-lacivert-900' : 'btn-cizgi py-1.5'}`}>Tümü</Link>
        {Object.entries(DURUMLAR).map(([k, v]) => (
          <Link key={k} href={`/admin/siparisler?durum=${k}`} className={`rounded-md px-3 py-1.5 ${durum === k ? 'bg-lacivert-800 text-white dark:bg-lacivert-100 dark:text-lacivert-900' : 'btn-cizgi py-1.5'}`}>{v.ad}</Link>
        ))}
        <form className="ml-auto"><input name="q" defaultValue={searchParams?.q} placeholder="Sipariş no veya e-posta" className="girdi py-1.5" /></form>
      </div>
      <div className="space-y-2 md:hidden">
        {(orders || []).map((o) => (
          <Link key={o.id} href={`/admin/siparisler/${o.id}`} className="kutu block p-4 text-sm">
            <div className="flex items-center justify-between"><b>{o.order_no}</b><b>{tl(o.total)}</b></div>
            <p className="soluk">{o.shipping_address?.full_name} · {tarih(o.created_at)}</p>
            <div className="mt-2 flex gap-2"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${DURUMLAR[o.status].renk}`}>{DURUMLAR[o.status].ad}</span>{o.gift_wrap && <span className="text-xs">🎁</span>}{o.delivery_method !== 'kargo' && <span className="text-xs">{TESLIMAT[o.delivery_method]}</span>}</div>
          </Link>
        ))}
      </div>
      <div className="kutu hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="soluk border-b border-lacivert-100 dark:border-lacivert-800"><tr><th className="p-3">Sipariş</th><th className="p-3">Müşteri</th><th className="p-3">Tarih</th><th className="p-3">Ödeme</th><th className="p-3">Durum</th><th className="p-3 text-right">Tutar</th></tr></thead>
          <tbody className="divide-y divide-lacivert-100 dark:divide-lacivert-800">
            {(orders || []).map((o) => (
              <tr key={o.id} className="hover:bg-lacivert-50 dark:hover:bg-lacivert-800">
                <td className="p-3"><Link href={`/admin/siparisler/${o.id}`} className="font-semibold underline">{o.order_no}</Link></td>
                <td className="p-3">{o.shipping_address?.full_name}<br /><span className="soluk text-xs">{o.email}</span></td>
                <td className="p-3 whitespace-nowrap">{tarih(o.created_at)}</td>
                <td className="p-3">{o.payment_method === 'havale' ? 'Havale' : 'Kart'}<br /><span className={`text-xs ${o.payment_status === 'odendi' ? 'text-emerald-600' : 'soluk'}`}>{o.payment_status}</span></td>
                <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${DURUMLAR[o.status].renk}`}>{DURUMLAR[o.status].ad}</span></td>
                <td className="p-3 text-right font-semibold">{tl(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders?.length && <p className="soluk p-6 text-center">Bu filtrede sipariş yok.</p>}
      </div>
    </div>
  );
}
