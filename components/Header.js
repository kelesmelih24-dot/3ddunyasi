import Link from 'next/link';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import CartButton from './CartButton';
import UserMenu from './UserMenu';

export default function Header({ user, isAdmin }) {
  return (
    <header className="sticky top-0 z-40 border-b border-lacivert-100 bg-white/95 backdrop-blur dark:border-lacivert-800 dark:bg-lacivert-950/95">
      <div className="kap flex h-16 items-center gap-4">
        <Link href="/" aria-label="3ddünyası ana sayfa"><Logo /></Link>
        <nav className="ml-6 hidden items-center gap-1 text-sm font-medium md:flex">
          <Link href="/baski-urunleri" className="rounded-md px-3 py-2 hover:bg-lacivert-50 dark:hover:bg-lacivert-800">Baskı ürünleri</Link>
          <Link href="/malzemeler" className="rounded-md px-3 py-2 hover:bg-lacivert-50 dark:hover:bg-lacivert-800">Malzemeler</Link>
          <Link href="/ozel-siparis" className="rounded-md px-3 py-2 hover:bg-lacivert-50 dark:hover:bg-lacivert-800">Özel sipariş</Link>
        </nav>
        <form action="/baski-urunleri" className="ml-auto hidden lg:block">
          <input name="q" type="search" placeholder="Ürün ara" aria-label="Ürün ara" className="girdi w-56 py-2" />
        </form>
        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          <ThemeToggle />
          <CartButton />
          <UserMenu user={user} isAdmin={isAdmin} />
        </div>
      </div>
      <nav className="kap flex gap-1 overflow-x-auto pb-2 text-sm font-medium md:hidden">
        <Link href="/baski-urunleri" className="whitespace-nowrap rounded-md px-3 py-1.5 bg-lacivert-50 dark:bg-lacivert-800">Baskı ürünleri</Link>
        <Link href="/malzemeler" className="whitespace-nowrap rounded-md px-3 py-1.5 bg-lacivert-50 dark:bg-lacivert-800">Malzemeler</Link>
        <Link href="/ozel-siparis" className="whitespace-nowrap rounded-md px-3 py-1.5 bg-lacivert-50 dark:bg-lacivert-800">Özel sipariş</Link>
      </nav>
    </header>
  );
}
