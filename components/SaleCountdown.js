'use client';
import { useEffect, useState } from 'react';

export default function SaleCountdown({ bitis, kucuk = false }) {
  const [kalan, setKalan] = useState(null);
  useEffect(() => {
    const t = () => setKalan(Math.max(0, new Date(bitis) - Date.now()));
    t(); const i = setInterval(t, 1000); return () => clearInterval(i);
  }, [bitis]);
  if (kalan === null || kalan <= 0) return null;
  const g = Math.floor(kalan / 864e5), s = Math.floor(kalan / 36e5) % 24, d = Math.floor(kalan / 6e4) % 60, sn = Math.floor(kalan / 1e3) % 60;
  const p = (n) => String(n).padStart(2, '0');
  if (kucuk) return <span className="rounded-full bg-lacivert-800 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white">⏱ {g > 0 ? `${g}g ${p(s)}s` : `${p(s)}:${p(d)}:${p(sn)}`}</span>;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-lacivert-800 px-4 py-3 text-white">
      <span className="text-sm font-semibold">İndirim bitimine</span>
      <span className="font-display text-lg font-semibold tabular-nums">{g > 0 && `${g} gün `}{p(s)}:{p(d)}:{p(sn)}</span>
    </div>
  );
}
