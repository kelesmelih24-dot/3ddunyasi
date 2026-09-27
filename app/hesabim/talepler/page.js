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
      <h1 className="mb-6 text-3xl font-semibold">Hesabım</h1>
      <AccountNav active="/hesabim/talepler" />
      {!data?.length ? (
        <div className="kutu p-10 text-center"><p className="font-semibold">Henüz özel sipariş talebiniz yok</p><Link href="/ozel-siparis" className="btn-ana mt-4">Talep oluştur</Link></div>
      ) : (
        <ul className="space-y-3">
          {data.map((t) => (
            <li key={t.id} className="kutu p-5 text-sm">
              <div className="flex flex-wrap justify-between gap-2"><b>{t.kind === 'stl' ? 'Model baskı talebi' : 'Kişiye özel yazı'}</b><span className="soluk">{tarih(t.created_at)}</span></div>
              <p className="mt-2">{t.description}</p>
              <p className="soluk mt-1">{[t.material, t.color, t.infill && `%${t.infill} doluluk`, t.dims, `${t.quantity} adet`].filter(Boolean).join(' · ')}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-lacivert-50 px-3 py-1 text-xs font-bold dark:bg-lacivert-800">{TALEP_DURUM[t.status]}</span>
                {t.estimate_price && !t.quote_price && <span className="soluk">Tahmini: {tl(t.estimate_price)}</span>}
                {t.quote_price && <span className="font-bold">Teklif: {tl(t.quote_price)}</span>}
                {t.status === 'teklif_verildi' && !t.order_id && <Link href={`/hesabim/talepler/${t.id}`} className="btn-ana ml-auto py-2">Teklifi onayla ve sipariş ver</Link>}
                {t.order_id && <Link href={`/hesabim/siparis/${t.order_id}`} className="btn-cizgi ml-auto py-2">Siparişi görüntüle</Link>}
              </div>
              {t.admin_note && <p className="soluk mt-2">Notumuz: {t.admin_note}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
