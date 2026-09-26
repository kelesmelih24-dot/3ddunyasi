'use client';
import { useEffect, useState } from 'react';

function kalan(hedef) {
  const ms = Math.max(0, new Date(hedef) - Date.now());
  return { ms, gun: Math.floor(ms / 864e5), saat: Math.floor(ms / 36e5) % 24, dakika: Math.floor(ms / 6e4) % 60, saniye: Math.floor(ms / 1e3) % 60 };
}

export default function Countdown({ hedef }) {
  const [k, setK] = useState(null);
  useEffect(() => {
    setK(kalan(hedef));
    const t = setInterval(() => setK(kalan(hedef)), 1000);
    return () => clearInterval(t);
  }, [hedef]);
  const kutular = [['gun', 'Gün'], ['saat', 'Saat'], ['dakika', 'Dakika'], ['saniye', 'Saniye']];
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" role="timer" aria-live="off">
      {kutular.map(([a, t]) => (
        <div key={a} className="rounded-2xl bg-white/10 px-2 py-4 text-center ring-1 ring-white/15 sm:py-5">
          <span key={k?.[a]} className="block font-display text-3xl font-semibold tabular-nums sm:text-5xl" style={{ animation: 'katman-bas .35s ease-out' }}>
            {k ? String(k[a]).padStart(2, '0') : '--'}
          </span>
          <span className="mt-1 block text-[11px] font-bold uppercase tracking-etiket text-white/70">{t}</span>
        </div>
      ))}
    </div>
  );
}
