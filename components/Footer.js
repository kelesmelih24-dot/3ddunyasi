import Link from 'next/link';
import Logo from './Logo';

export default function Footer({ settings }) {
  return (
    <footer className="mt-20 border-t border-lacivert-100 bg-white dark:border-lacivert-800 dark:bg-lacivert-900">
      <div className="kap grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="soluk mt-3 max-w-xs text-sm leading-6">Kendi atölyemizde tasarlayıp bastığımız ürünler ve 3D baskı projeleriniz için malzemeler.</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Alışveriş</h3>
          <ul className="soluk space-y-2 text-sm">
            <li><Link href="/baski-urunleri" className="hover:text-nozul-500">Baskı ürünleri</Link></li>
            <li><Link href="/malzemeler" className="hover:text-nozul-500">Malzemeler</Link></li>
            <li><Link href="/ozel-siparis" className="hover:text-nozul-500">Özel sipariş</Link></li>
            <li><Link href="/siparis-takip" className="hover:text-nozul-500">Sipariş takibi</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Kurumsal</h3>
          <ul className="soluk space-y-2 text-sm">
            <li><Link href="/hakkimizda" className="hover:text-nozul-500">Hakkımızda</Link></li>
            <li><Link href="/iletisim" className="hover:text-nozul-500">İletişim</Link></li>
            <li><Link href="/kvkk" className="hover:text-nozul-500">KVKK aydınlatma metni</Link></li>
            <li><Link href="/mesafeli-satis-sozlesmesi" className="hover:text-nozul-500">Mesafeli satış sözleşmesi</Link></li>
            <li><Link href="/iade-ve-degisim" className="hover:text-nozul-500">İade ve değişim</Link></li>
            <li><Link href="/cerez-politikasi" className="hover:text-nozul-500">Çerez politikası</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">İletişim</h3>
          <ul className="soluk space-y-2 text-sm">
            {settings.contact_email && <li><a href={`mailto:${settings.contact_email}`} className="hover:text-nozul-500">{settings.contact_email}</a></li>}
            {settings.contact_phone && <li>{settings.contact_phone}</li>}
            {settings.address && <li>{settings.address}</li>}
            {settings.instagram && <li><a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer" className="hover:text-nozul-500">Instagram: @{settings.instagram}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-lacivert-100 py-5 text-center text-xs soluk dark:border-lacivert-800">
        © {new Date().getFullYear()} 3ddünyası. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
