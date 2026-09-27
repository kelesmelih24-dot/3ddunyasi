import Link from 'next/link';
import Logo from './Logo';
import NewsletterForm from './NewsletterForm';

const GRUPLAR = [
  ['Alışveriş', [['/baski-urunleri', 'Baskı ürünleri'], ['/malzemeler', 'Malzemeler'], ['/ozel-siparis', 'Özel sipariş'], ['/hediye-ceki', 'Hediye çeki'], ['/siparis-takip', 'Sipariş takibi']]],
  ['Kurumsal', [['/blog', 'Blog'], ['/kurumsal', 'Kurumsal ve toplu sipariş'], ['/hakkimizda', 'Hakkımızda'], ['/iletisim', 'İletişim'], ['/iade-ve-degisim', 'İade ve değişim']]],
  ['Yasal', [['/kvkk', 'KVKK aydınlatma metni'], ['/mesafeli-satis-sozlesmesi', 'Mesafeli satış sözleşmesi'], ['/cerez-politikasi', 'Çerez politikası']]],
];

export default function Footer({ settings }) {
  return (
    <footer className="mt-28 bg-lacivert-800 text-white dark:bg-lacivert-900">
      <div className="h-1.5 bg-nozul-500" />
      <div className="border-b border-white/10">
        <div className="kap grid items-center gap-6 py-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Açılışı kaçırmayın</h2>
            <p className="mt-2 text-sm text-white/70">Yeni ürünler ve kampanyalardan ilk siz haberdar olun.</p>
          </div>
          <NewsletterForm koyu />
        </div>
      </div>
      <div className="kap grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <Logo inverse id="ftr" />
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/70">Kendi atölyemizde tasarlayıp bastığımız ürünler ve 3D baskı projeleriniz için özenle seçilmiş malzemeler.</p>
          <ul className="mt-6 space-y-1.5 text-sm text-white/80">
            {settings.contact_email && <li><a href={`mailto:${settings.contact_email}`} className="hover:text-nozul-300">{settings.contact_email}</a></li>}
            {settings.contact_phone && <li><a href={`tel:${settings.contact_phone.replace(/\s/g, '')}`} className="hover:text-nozul-300">{settings.contact_phone}</a></li>}
            {settings.address && <li>{settings.address}</li>}
          </ul>
          {settings.instagram && (
            <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer" aria-label="Instagram"
              className="mt-6 inline-grid h-11 w-11 place-items-center rounded-full border border-white/20 transition-colors hover:border-nozul-500 hover:bg-nozul-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
            </a>
          )}
        </div>
        <div className="grid gap-10 sm:grid-cols-3">
          {GRUPLAR.map(([b, l]) => (
            <div key={b}>
              <h3 className="font-sans text-xs font-bold uppercase tracking-etiket text-nozul-300">{b}</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-white/80">
                {l.map(([h, t]) => <li key={h}><Link href={h} className="transition-colors hover:text-white">{t}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="kap flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-white/60">
          <p>© {new Date().getFullYear()} 3D Dünyası. Tüm hakları saklıdır.</p>
          <p>
            Made by{' '}
            <a href="https://mksoftware.com.tr/" target="_blank" rel="noopener" className="font-bold text-white transition-colors hover:text-nozul-300">mksoftware</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
