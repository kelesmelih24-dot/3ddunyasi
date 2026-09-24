import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AccountNav from '@/components/AccountNav';
import { tl, tarih, DURUMLAR } from '@/lib/format';

export const metadata = { title: 'Siparişlerim' };

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orders } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  return (
    <div className="kap py-10">
      <h1 className="mb-6 text-3xl font-bold">Hesabım</h1>
      <AccountNav active="/hesabim" />
      {!orders?.length ? (
        <div className="kutu p-10 text-center"><p className="font-semibold">Henüz siparişiniz yok</p><Link href="/baski-urunleri" className="btn-ana mt-4">Alışverişe başla</Link></div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/hesabim/siparis/${o.id}`} className="kutu flex flex-wrap items-center gap-4 p-4 hover:border-lacivert-400">
                <div className="flex-1"><p className="font-semibold">{o.order_no}</p><p className="soluk text-sm">{tarih(o.created_at)}</p></div>
                <span className={`rounded px-2 py-1 text-xs font-semibold ${DURUMLAR[o.status].renk}`}>{DURUMLAR[o.status].ad}</span>
                <span className="font-bold">{tl(o.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
