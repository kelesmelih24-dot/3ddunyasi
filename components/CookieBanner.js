'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { setShow(!localStorage.getItem('cerez-onay')); } catch {}
  }, []);
  if (!show) return null;
  const onayla = (v) => {
    try { localStorage.setItem('cerez-onay', v); } catch {}
    setShow(false);
  };
  return (
    <div role="dialog" aria-label="Çerez bildirimi" className="fixed inset-x-3 bottom-3 z-50 sm:left-auto sm:right-24 sm:max-w-md">
      <div className="kutu p-4 text-sm shadow-xl">
        <p className="leading-6">Sitemiz; oturumunuzu ve sepetinizi hatırlamak için zorunlu çerezler kullanır. Ayrıntılar için <Link href="/cerez-politikasi" className="underline">çerez politikamıza</Link> bakabilirsiniz.</p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => onayla('tum')} className="btn-koyu py-2">Kabul et</button>
          <button onClick={() => onayla('zorunlu')} className="btn-cizgi py-2">Sadece zorunlu</button>
        </div>
      </div>
    </div>
  );
}
