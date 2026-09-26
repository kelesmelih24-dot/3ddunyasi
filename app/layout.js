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

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(SITE),
  title: { default: '3D Dünyası | 3D baskı ürünleri ve malzemeleri', template: '%s | 3D Dünyası' },
  description: 'Atölyemizde bastığımız figür, dekorasyon ve kişiye özel ürünler; 3D baskı projeleriniz için anahtarlık halkası, mıknatıs, insert ve daha fazlası.',
  icons: { icon: '/favicon.svg', apple: '/apple-icon.png' },
  openGraph: { siteName: '3D Dünyası', locale: 'tr_TR', type: 'website', images: [{ url: '/og.png', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
};

export const viewport = { themeColor: '#E8620C', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

// Tema ve intro kararı sayfa çizilmeden verilir (yanıp sönme olmaz). Intro günde bir kez oynar.
const basBetik = `(function(){var h=document.documentElement;h.classList.add('js');try{if(localStorage.getItem('tema')==='koyu')h.classList.add('dark');var g=new Date().toISOString().slice(0,10);if(localStorage.getItem('intro-gun')===g||matchMedia('(prefers-reduced-motion: reduce)').matches)h.classList.add('intro-yok')}catch(e){h.classList.add('intro-yok')}})()`;

export default async function RootLayout({ children }) {
  let user = null, profile = null;
  try { ({ user, profile } = await getUserAndProfile()); } catch {}
  const settings = await getSettings();

  const mesajlar = [
    `${Number(settings.free_shipping_limit).toLocaleString('tr-TR')} TL ve üzeri siparişlerde kargo ücretsiz`,
    'Tüm baskılar atölyemizde, siparişe özel üretilir',
    'İsim ve yazı ekletebileceğiniz kişiye özel ürünler',
    settings.contact_phone && `WhatsApp destek: ${settings.contact_phone}`,
    'STL dosyanızı yükleyin, size özel basalım',
  ].filter(Boolean);

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Store', name: '3D Dünyası', url: SITE, logo: `${SITE}/apple-icon.png`,
    telephone: settings.contact_phone, email: settings.contact_email,
    address: { '@type': 'PostalAddress', addressLocality: 'Ankara', addressCountry: 'TR' },
    sameAs: settings.instagram ? [`https://instagram.com/${settings.instagram}`] : [],
  };

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: basBetik }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Unbounded:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <a href="#icerik" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow">İçeriğe geç</a>
        <Intro />
        <CartProvider>
          <div className="overflow-hidden bg-lacivert-800 text-xs font-semibold text-white" aria-label="Duyurular">
            <div className="duyuru-kay flex w-max py-2.5">
              {[0, 1].map((k) => (
                <div key={k} className="flex shrink-0" aria-hidden={k === 1}>
                  {mesajlar.map((m) => (
                    <span key={m} className="flex items-center gap-8 pr-8 whitespace-nowrap">{m}<span className="h-1.5 w-1.5 rotate-45 bg-nozul-500" /></span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <Header user={user} isAdmin={profile?.role === "admin"} phone={settings.contact_phone} />
          <main id="icerik" className="flex-1">{children}</main>
          <Footer settings={settings} />
          <WhatsAppButton number={settings.whatsapp} />
          <CookieBanner />
        </CartProvider>
      </body>
    </html>
  );
}
