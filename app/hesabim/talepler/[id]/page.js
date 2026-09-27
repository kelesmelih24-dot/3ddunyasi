import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getUserAndProfile } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { tl } from '@/lib/format';
import QuoteAccept from '@/components/QuoteAccept';

export const metadata = { title: 'Teklifi onayla' };

export default async function Page({ params }) {
  const { supabase, user, profile } = await getUserAndProfile();
  const { data: t } = await supabase.from('custom_requests').select('*').eq('id', params.id).eq('user_id', user.id).single();
  if (!t) notFound();
  const s = await getSettings();
  const kargo = t.quote_price >= s.free_shipping_limit ? 0 : Number(s.shipping_fee);
  return (
    <div className="kap max-w-4xl py-10">
      <Link href="/hesabim/talepler" className="soluk text-sm hover:underline">Özel taleplerim</Link>
      <h1 className="mt-2 text-3xl font-semibold">Teklifimiz</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="kutu p-6 text-sm leading-7">
          <p><b>Talep:</b> {t.description}</p>
          <p><b>Seçimler:</b> {[t.material, t.color, t.infill && `%${t.infill} doluluk`, t.layer_height && `${String(t.layer_height).replace('.', ',')} mm katman`, t.dims, `${t.quantity} adet`].filter(Boolean).join(' · ')}</p>
          {t.personalization_text && <p><b>Yazı:</b> {t.personalization_text}</p>}
          {t.admin_note && <p className="mt-3 rounded-xl bg-krem p-3 dark:bg-lacivert-800"><b>Notumuz:</b> {t.admin_note}</p>}
        </div>
        <div className="rounded-3xl bg-lacivert-800 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-etiket text-nozul-300">Teklif</p>
          <p className="mt-2 font-display text-4xl font-semibold">{tl(t.quote_price)}</p>
          <p className="mt-2 text-sm text-white/70">Kargo: {kargo ? tl(kargo) : 'Ücretsiz'}</p>
          <p className="mt-1 font-semibold">Toplam: {tl(Number(t.quote_price) + kargo)}</p>
        </div>
      </div>
      {t.order_id ? (
        <p className="basari mt-8">Bu teklif siparişe dönüştürüldü. <Link href={`/hesabim/siparis/${t.order_id}`} className="font-semibold underline">Siparişi görüntüle</Link></p>
      ) : t.status !== 'teklif_verildi' ? (
        <p className="soluk mt-8">Bu talep için henüz onaylanabilir bir teklif yok.</p>
      ) : (
        <QuoteAccept id={t.id} profile={profile} />
      )}
    </div>
  );
}
