import { redirect } from 'next/navigation';
import { getUserAndProfile } from '@/lib/supabase/server';
import AdminNav from '@/components/admin/AdminNav';

export const metadata = { title: 'Yönetim paneli', robots: { index: false } };
const ROLLER = ['admin', 'siparis', 'urun'];

export default async function AdminLayout({ children }) {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect('/giris?sonra=/admin');
  if (!ROLLER.includes(profile?.role)) redirect('/');
  return (
    <div className="kap grid gap-6 py-6 lg:grid-cols-[220px_1fr] lg:gap-8 lg:py-8">
      <AdminNav rol={profile.role} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
