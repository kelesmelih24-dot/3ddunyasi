import CheckoutForm from '@/components/CheckoutForm';
import { getUserAndProfile } from '@/lib/supabase/server';
import { iyzicoAktif } from '@/lib/iyzico';

export const metadata = { title: 'Ödeme' };

export default async function CheckoutPage({ searchParams }) {
  const { supabase, user, profile } = await getUserAndProfile();
  const [{ data: adresler }, { data: info }] = await Promise.all([
    supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at'),
    supabase.rpc('checkout_info'),
  ]);
  return <CheckoutForm email={user?.email} profile={profile} adresler={adresler || []} info={info || {}} iyzico={iyzicoAktif()} initialError={searchParams?.hata} />;
}
