'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function UserMenu({ user, isAdmin }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  if (!user) return <Link href="/giris" className="btn-koyu ml-1 whitespace-nowrap px-4 py-2">Giriş yap</Link>;

  async function cikis() {
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  }
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Hesap menüsü"
        className="rounded-full p-2.5 hover:bg-lacivert-50 dark:hover:bg-lacivert-800">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
      </button>
      {open && (
        <div className="kutu absolute right-0 mt-2 w-52 p-1 text-sm shadow-lg">
          <Link href="/hesabim" className="block rounded px-3 py-2 hover:bg-lacivert-50 dark:hover:bg-lacivert-800">Siparişlerim</Link>
          <Link href="/hesabim/favoriler" className="block rounded px-3 py-2 hover:bg-lacivert-50 dark:hover:bg-lacivert-800">Favorilerim</Link>
          <Link href="/hesabim/talepler" className="block rounded px-3 py-2 hover:bg-lacivert-50 dark:hover:bg-lacivert-800">Özel taleplerim</Link>
          <Link href="/hesabim/profil" className="block rounded px-3 py-2 hover:bg-lacivert-50 dark:hover:bg-lacivert-800">Profil bilgilerim</Link>
          {isAdmin && <Link href="/admin" className="block rounded px-3 py-2 font-semibold text-nozul-600 hover:bg-lacivert-50 dark:hover:bg-lacivert-800">Yönetim paneli</Link>}
          <button onClick={cikis} className="block w-full rounded px-3 py-2 text-left hover:bg-lacivert-50 dark:hover:bg-lacivert-800">Çıkış yap</button>
        </div>
      )}
    </div>
  );
}
