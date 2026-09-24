import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import CookieBanner from '@/components/CookieBanner';
import { CartProvider } from '@/components/CartProvider';
import { getUserAndProfile } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: '3ddünyası | 3D baskı ürünleri ve malzemeleri', template: '%s | 3ddünyası' },
  description: 'Atölyemizde bastığımız figür, dekorasyon ve kişiye özel ürünler; 3D baskı projeleriniz için anahtarlık halkası, mıknatıs, insert ve daha fazlası.',
  icons: { icon: '/favicon.svg' },
  openGraph: { siteName: '3ddünyası', locale: 'tr_TR', type: 'website' },
};

const temaScript = `try{var t=localStorage.getItem('tema');if(t==='koyu'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default async function RootLayout({ children }) {
  let user = null, profile = null;
  try { ({ user, profile } = await getUserAndProfile()); } catch {}
  const settings = await getSettings();
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <Header user={user} isAdmin={profile?.role === 'admin'} />
          <main className="flex-1">{children}</main>
          <Footer settings={settings} />
          <WhatsAppButton number={settings.whatsapp} />
          <CookieBanner />
        </CartProvider>
      </body>
    </html>
  );
}
