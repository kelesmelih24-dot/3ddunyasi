import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AccountNav from '@/components/AccountNav';
import { tl, tarih, TALEP_DURUM } from '@/lib/format';

export const metadata = { title: 'Özel taleplerim' };

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from('custom_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  return (
    <div className="kap py-10">
      <h1 className="mb-6 text-3xl font-bold">Hesabım</h1>
      <AccountNav active="/hesabim/talepler" />
      {!data?.length ? (
        <div className="kutu p-10 text-center"><p className="font-semibold">Henüz özel sipariş talebiniz yok</p><Link href="/ozel-siparis" className="btn-ana mt-4">Talep oluştur</Link></div>
      ) : (
        <ul className="space-y-3">
          {data.map((t) => (
            <li key={t.id} className="kutu p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2"><b>{t.kind === 'stl' ? 'STL baskı talebi' : 'Kişiye özel yazı'}</b><span className="soluk">{tarih(t.created_at)}</span></div>
              <p className="mt-2">{t.description}</p>
              <p className="mt-2">Durum: <b>{TALEP_DURUM[t.status]}</b>{t.quote_price && <> · Teklif: <b>{tl(t.quote_price)}</b></>}</p>
              {t.admin_note && <p className="soluk mt-1">Notumuz: {t.admin_note}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
