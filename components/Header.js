import Link from 'next/link';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import CartButton from './CartButton';
import UserMenu from './UserMenu';
import HeaderShell from './HeaderShell';
import MobileMenu from './MobileMenu';
import SearchBox from './SearchBox';

const NAV = [['/baski-urunleri', 'Baskı ürünleri'], ['/malzemeler', 'Malzemeler'], ['/ozel-siparis', 'Özel sipariş'], ['/siparis-takip', 'Sipariş takibi']];

export default function Header({ user, isAdmin, phone }) {
  return (
    <HeaderShell>
      <div className="kap flex h-[72px] items-center gap-6">
        <Link href="/" aria-label="3D Dünyası ana sayfa" className="shrink-0"><Logo id="hdr" /></Link>
        <nav className="hidden items-center gap-1 text-[15px] font-semibold lg:flex" aria-label="Ana menü">
          {NAV.map(([h, t]) => (
            <Link key={h} href={h} className="group relative px-3 py-2">
              {t}
              <span className="absolute inset-x-3 -bottom-0.5 h-[3px] origin-left scale-x-0 rounded-full bg-nozul-500 transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <SearchBox className="mr-1 hidden md:block" />
          <span className="hidden lg:inline-flex"><ThemeToggle /></span>
          <CartButton />
          <span className="hidden sm:inline-flex"><UserMenu user={user} isAdmin={isAdmin} /></span>
          <MobileMenu links={NAV} user={user} isAdmin={isAdmin} phone={phone} />
        </div>
      </div>
    </HeaderShell>
  );
}
