import { getUserAndProfile } from '@/lib/supabase/server';
import AccountNav from '@/components/AccountNav';
import ProfileForm from '@/components/ProfileForm';

export const metadata = { title: 'Profil bilgilerim' };

export default async function Page() {
  const { user, profile } = await getUserAndProfile();
  return (
    <div className="kap py-10">
      <h1 className="mb-6 text-3xl font-bold">Hesabım</h1>
      <AccountNav active="/hesabim/profil" />
      <ProfileForm userId={user.id} email={user.email} profile={profile} />
    </div>
  );
}
