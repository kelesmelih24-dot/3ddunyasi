import Link from 'next/link';
import { getUserAndProfile } from '@/lib/supabase/server';
import CustomRequestForm from '@/components/CustomRequestForm';

export const metadata = { title: 'Özel sipariş', description: 'STL dosyanızı yükleyin veya kişiye özel yazılı ürün talep edin, size fiyat teklifi gönderelim.' };

export default async function Page() {
  const { user, profile } = await getUserAndProfile();
  return (
    <div className="kap grid gap-12 py-12 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="ust-etiket">Size özel üretim</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">Özel sipariş talebi</h1>
        <p className="soluk mt-4 max-w-md leading-7">Hazır bir 3D modeliniz varsa STL dosyasını yükleyin; bir ürüne isim, tarih veya logo eklemek istiyorsanız yazıyı iletin. Talebinizi inceleyip genellikle 1 iş günü içinde fiyat teklifimizi gönderiyoruz.</p>
        <ol className="mt-8 space-y-4 text-sm">
          {['Talebinizi dosya veya açıklamayla gönderin', 'Malzeme, süre ve fiyat teklifimizi e-posta ile alın', 'Onayladığınızda baskıya başlayıp kargoya verelim'].map((t, i) => (
            <li key={t} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-nozul-500 text-xs font-bold text-white">{i + 1}</span><span className="pt-1">{t}</span></li>
          ))}
        </ol>
      </div>
      {user ? <CustomRequestForm userId={user.id} email={user.email} name={profile?.full_name} phone={profile?.phone} /> : (
        <div className="kutu h-fit p-8 text-center">
          <p className="font-semibold">Talep oluşturmak için giriş yapın</p>
          <p className="soluk mt-1 text-sm">Teklifimizi ve talebinizin durumunu hesabınızdan takip edebilirsiniz.</p>
          <Link href="/giris?sonra=/ozel-siparis" className="btn-ana mt-5">Giriş yap</Link>
        </div>
      )}
    </div>
  );
}
