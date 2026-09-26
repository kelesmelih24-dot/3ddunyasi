import Link from 'next/link';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import CartButton from './CartButton';
import UserMenu from './UserMenu';
import HeaderShell from './HeaderShell';

const NAV = [['/baski-urunleri', 'Baskı ürünleri'], ['/malzemeler', 'Malzemeler'], ['/ozel-siparis', 'Özel sipariş'], ['/siparis-takip', 'Sipariş takibi']];

export default function Header({ user, isAdmin }) {
  return (
    <HeaderShell>
      <div className="kap flex h-[72px] items-center gap-6">
        <Link href="/" aria-label="3D Dünyası ana sayfa" className="shrink-0"><Logo id="hdr" /></Link>
        <nav className="hidden items-center gap-1 text-[15px] font-semibold lg:flex" aria-label="Ana menü">
          {NAV.map(([h, t]) => (
            <Link key={h} href={h} className="group relative px-3 py-2">
              {t}
              <span className="absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded bg-nozul-500 transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <form action="/baski-urunleri" className="relative mr-1 hidden md:block" role="search">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lacivert-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input name="q" type="search" placeholder="Ürün ara" aria-label="Ürün ara" className="girdi w-52 rounded-full bg-lacivert-50 py-2 pl-10 focus:w-64 focus:bg-white dark:bg-lacivert-900" />
          </form>
          <span className="hidden sm:inline-flex"><ThemeToggle /></span>
          <CartButton />
          <UserMenu user={user} isAdmin={isAdmin} />
        </div>
      </div>
      <nav className="kap flex gap-2 overflow-x-auto pb-3 text-sm font-semibold lg:hidden" aria-label="Mobil menü">
        {NAV.map(([h, t]) => (
          <Link key={h} href={h} className="whitespace-nowrap rounded-full border border-lacivert-100 px-3.5 py-1.5 dark:border-lacivert-800">{t}</Link>
        ))}
      </nav>
    </HeaderShell>
  );
}
