import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserAndProfile } from '@/lib/supabase/server';

export const metadata = { title: 'Yönetim paneli', robots: { index: false } };

const MENU = [
  ['/admin', 'Genel bakış'], ['/admin/siparisler', 'Siparişler'], ['/admin/urunler', 'Ürünler ve stok'],
  ['/admin/kategoriler', 'Kategoriler'], ['/admin/kuponlar', 'Kuponlar'], ['/admin/ozel-talepler', 'Özel talepler'],
  ['/admin/musteriler', 'Müşteriler'], ['/admin/yorumlar', 'Yorumlar'], ['/admin/ayarlar', 'Mağaza ayarları'],
];

export default async function AdminLayout({ children }) {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect('/giris?sonra=/admin');
  if (profile?.role !== 'admin') redirect('/');
  return (
    <div className="kap grid gap-8 py-8 lg:grid-cols-[210px_1fr]">
      <aside>
        <p className="mb-3 font-display text-lg font-bold">Yönetim</p>
        <nav className="flex gap-1 overflow-x-auto text-sm lg:flex-col">
          {MENU.map(([h, t]) => (
            <Link key={h} href={h} className="whitespace-nowrap rounded-md px-3 py-2 hover:bg-lacivert-50 dark:hover:bg-lacivert-800">{t}</Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
