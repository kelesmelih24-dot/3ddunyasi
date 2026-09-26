'use client';
import Link from 'next/link';
import { useCart } from './CartProvider';

export default function CartButton() {
  const { count } = useCart();
  return (
    <Link href="/sepet" className="relative rounded-full p-2.5 hover:bg-lacivert-50 dark:hover:bg-lacivert-800" aria-label={`Sepet, ${count} ürün`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6 5 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-nozul-500 px-1 text-[11px] font-bold text-white">{count}</span>
      )}
    </Link>
  );
}
