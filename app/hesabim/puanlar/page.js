import Link from 'next/link';
import { getUserAndProfile } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import AccountNav from '@/components/AccountNav';
import { tarih } from '@/lib/format';

export const metadata = { title: 'Puanlarım' };

export default async function Page() {
  const { supabase, user, profile } = await getUserAndProfile();
  const [{ data: hareket }, s] = await Promise.all([
    supabase.from('point_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    getSettings(),
  ]);
  return (
    <div className="kap py-10">
      <h1 className="mb-6 text-3xl font-semibold">Hesabım</h1>
      <AccountNav active="/hesabim/puanlar" />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="katman h-fit rounded-3xl bg-nozul-500 p-7 text-white">
          <p className="text-xs font-bold uppercase tracking-etiket text-white/80">Puan bakiyeniz</p>
          <p className="mt-2 font-display text-5xl font-semibold">{Number(profile?.points || 0).toLocaleString('tr-TR')}</p>
          <p className="mt-1 text-white/85">= {Number(profile?.points || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} indirim</p>
          <p className="mt-5 text-sm leading-6 text-white/85">Teslim edilen her siparişinizde ödediğiniz tutarın <b>%{Number(s.loyalty_pct || 0)}</b>'i puan olarak hesabınıza eklenir. 1 puan = 1 TL. Ödeme adımında "Puanlarımı kullan" ile harcayabilirsiniz.</p>
          <Link href="/baski-urunleri" className="btn mt-5 bg-white text-nozul-600 hover:bg-nozul-50">Alışverişe başla</Link>
        </div>
        <div>
          <h2 className="font-sans font-semibold">Puan hareketleri</h2>
          {!hareket?.length ? <p className="soluk mt-3">Henüz puan hareketi yok.</p> : (
            <ul className="kutu mt-3 divide-y divide-lacivert-100 text-sm dark:divide-lacivert-800">
              {hareket.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 p-4">
                  <span>{h.reason}<br /><span className="soluk text-xs">{tarih(h.created_at)}</span></span>
                  <b className={h.amount > 0 ? 'text-emerald-600' : 'text-red-600'}>{h.amount > 0 ? '+' : ''}{Number(h.amount).toLocaleString('tr-TR')}</b>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
