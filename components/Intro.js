'use client';
import { useEffect, useState } from 'react';
import BrandMark from './BrandMark';

// Oturum başına bir kez oynayan açılış animasyonu. Atlanacaksa <head> içindeki
// betik html'e "intro-yok" sınıfını ekler ve bu katman hiç görünmez.
export default function Intro() {
  const [bitti, setBitti] = useState(false);
  useEffect(() => {
    if (document.documentElement.classList.contains('intro-yok')) return setBitti(true);
    try { sessionStorage.setItem('intro', '1'); } catch {}
    const t = setTimeout(() => {
      setBitti(true);
      document.documentElement.classList.add('intro-yok');
    }, 2500);
    return () => clearTimeout(t);
  }, []);
  if (bitti) return null;
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-perde" />
      <div className="intro-icerik">
        <div className="flex items-end gap-2">
          <BrandMark id="intro" animated className="h-20 w-auto sm:h-28" />
          <p className="intro-yazi font-display text-5xl font-semibold leading-[0.9] tracking-tight text-lacivert-800 sm:text-7xl" style={{ marginBottom: '0.08em' }}>Dünyası</p>
        </div>
        <div className="intro-cizgi" />
      </div>
    </div>
  );
}
