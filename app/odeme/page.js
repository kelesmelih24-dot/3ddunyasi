import CheckoutForm from '@/components/CheckoutForm';
import { getUserAndProfile } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { iyzicoAktif } from '@/lib/iyzico';

export const metadata = { title: 'Ödeme' };

export default async function CheckoutPage({ searchParams }) {
  const { user, profile } = await getUserAndProfile();
  const settings = await getSettings();
  return (
    <CheckoutForm
      email={user?.email}
      profile={profile}
      shippingFee={Number(settings.shipping_fee)}
      freeLimit={Number(settings.free_shipping_limit)}
      iyzico={iyzicoAktif()}
      initialError={searchParams?.hata}
    />
  );
}
