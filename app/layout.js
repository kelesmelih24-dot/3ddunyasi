import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import CookieBanner from '@/components/CookieBanner';
import Intro from '@/components/Intro';
import { CartProvider } from '@/components/CartProvider';
import { getUserAndProfile } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: '3D Dünyası | 3D baskı ürünleri ve malzemeleri', template: '%s | 3D Dünyası' },
  description: 'Atölyemizde bastığımız figür, dekorasyon ve kişiye özel ürünler; 3D baskı projeleriniz için anahtarlık halkası, mıknatıs, insert ve daha fazlası.',
  icons: { icon: '/favicon.svg' },
  openGraph: { siteName: '3D Dünyası', locale: 'tr_TR', type: 'website' },
};

const temaScript = `(function(){var h=document.documentElement;h.classList.add('js');try{var t=localStorage.getItem('tema');if(t==='koyu')h.classList.add('dark');if(sessionStorage.getItem('intro')||matchMedia('(prefers-reduced-motion: reduce)').matches)h.classList.add('intro-yok')}catch(e){h.classList.add('intro-yok')}})()`;

export default async function RootLayout({ children }) {
  let user = null, profile = null;
  try { ({ user, profile } = await getUserAndProfile()); } catch {}
  const settings = await getSettings();
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#E8620C" />
        <script dangerouslySetInnerHTML={{ __html: temaScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="flex min-h-screen flex-col">
        <Intro />
        <CartProvider>
          <div className="bg-lacivert-800 text-center text-xs font-medium text-white">
            <p className="kap py-2">{Number(settings.free_shipping_limit).toLocaleString("tr-TR")} TL ve üzeri siparişlerde kargo ücretsiz <span className="hidden sm:inline"><span className="mx-2 text-nozul-300">/</span> Tüm baskılar atölyemizde, siparişe özel üretilir</span></p>
          </div>
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
