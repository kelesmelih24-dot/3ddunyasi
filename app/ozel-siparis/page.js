import Link from 'next/link';
import { getUserAndProfile } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import CustomRequestForm from '@/components/CustomRequestForm';

export const metadata = { title: 'Özel sipariş', description: 'STL dosyanızı yükleyin, 3D önizleyin ve anında tahmini fiyatı görün. Size özel basalım.' };

export default async function Page() {
  const { user, profile } = await getUserAndProfile();
  const settings = await getSettings();
  return (
    <div className="kap py-12">
      <div className="max-w-2xl">
        <p className="ust-etiket">Size özel üretim</p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">Modelinizi yükleyin, fiyatını hemen görün</h1>
        <p className="soluk mt-4 leading-7">STL veya OBJ dosyanızı yükleyin; modeli 3D olarak inceleyin, malzeme, renk ve kaliteyi seçin, tahmini fiyatı anında görün. Kesin teklifimizi genellikle bir iş günü içinde hesabınıza gönderiyoruz, onaylarsanız tek tıkla siparişe dönüşür.</p>
      </div>
      <ol className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
        {['Modelinizi yükleyin ve seçimlerinizi yapın', 'Kesin teklifimiz hesabınıza gelsin', 'Teklifi onaylayın, basıp gönderelim'].map((t, i) => (
          <li key={t} className="flex items-center gap-3 rounded-2xl bg-krem p-4 dark:bg-lacivert-900"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-nozul-500 text-xs font-bold text-white">{i + 1}</span>{t}</li>
        ))}
      </ol>
      <div className="mt-10">
        {user ? <CustomRequestForm userId={user.id} email={user.email} name={profile?.full_name} phone={profile?.phone} pricing={settings.pricing} /> : (
          <div className="kutu max-w-xl p-8 text-center">
            <p className="font-semibold">Talep oluşturmak için giriş yapın</p>
            <p className="soluk mt-1 text-sm">Teklifimizi ve talebinizin durumunu hesabınızdan takip edebilirsiniz.</p>
            <Link href="/giris?sonra=/ozel-siparis" className="btn-ana mt-5">Giriş yap</Link>
          </div>
        )}
      </div>
    </div>
  );
}
