'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function MobileMenu({ links, user, isAdmin, phone }) {
  const [acik, setAcik] = useState(false);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  const yol = usePathname();
  useEffect(() => setAcik(false), [yol]);
  useEffect(() => {
    document.body.style.overflow = acik ? 'hidden' : '';
    const esc = (e) => e.key === 'Escape' && setAcik(false);
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc); };
  }, [acik]);

  return (
    <div className="lg:hidden">
      <button onClick={() => setAcik(true)} aria-label="Menüyü aç" aria-expanded={acik} className="grid h-11 w-11 place-items-center rounded-full hover:bg-lacivert-50 dark:hover:bg-lacivert-800">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
      </button>
      {hazir && createPortal(<div className={`fixed inset-0 z-[60] transition-opacity duration-300 ${acik ? 'opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={!acik}>
        <div className="absolute inset-0 bg-lacivert-900/40 backdrop-blur-sm" onClick={() => setAcik(false)} />
        <nav aria-label="Mobil menü"
          className={`absolute inset-y-0 right-0 flex w-[min(88vw,380px)] flex-col bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.76,0,.24,1)] dark:bg-lacivert-950 ${acik ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="ust-etiket">Menü</span>
            <button onClick={() => setAcik(false)} aria-label="Menüyü kapat" className="grid h-11 w-11 place-items-center rounded-full bg-lacivert-50 dark:bg-lacivert-800">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <form action="/baski-urunleri" className="px-5" role="search">
            <input name="q" type="search" placeholder="Ürün ara" aria-label="Ürün ara" className="girdi rounded-full" />
          </form>
          <ul className="mt-4 flex-1 overflow-y-auto px-3">
            {links.map(([h, t], i) => (
              <li key={h} className={`transition-all duration-500 ${acik ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'}`} style={{ transitionDelay: acik ? `${120 + i * 60}ms` : '0ms' }}>
                <Link href={h} className={`flex items-center justify-between rounded-2xl px-4 py-4 font-display text-xl font-semibold ${yol === h ? 'bg-nozul-50 text-nozul-600 dark:bg-nozul-700/20' : 'hover:bg-lacivert-50 dark:hover:bg-lacivert-800'}`}>
                  {t}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
                </Link>
              </li>
            ))}
            <li className="mt-4 border-t border-lacivert-100 px-4 pt-4 text-sm dark:border-lacivert-800">
              {user ? (
                <div className="grid gap-1">
                  <Link href="/hesabim" className="py-2 font-semibold">Siparişlerim</Link>
                  <Link href="/hesabim/favoriler" className="py-2 font-semibold">Favorilerim</Link>
                  {isAdmin && <Link href="/admin" className="py-2 font-semibold text-nozul-600">Yönetim paneli</Link>}
                </div>
              ) : (
                <Link href="/giris" className="btn-koyu w-full">Giriş yap veya üye ol</Link>
              )}
            </li>
          </ul>
          <div className="flex items-center justify-between border-t border-lacivert-100 px-5 py-4 text-sm dark:border-lacivert-800">
            {phone && <a href={`tel:${phone.replace(/\s/g, '')}`} className="font-semibold">{phone}</a>}
            <ThemeToggle />
          </div>
        </nav>
      </div>, document.body)}
    </div>
  );
}
