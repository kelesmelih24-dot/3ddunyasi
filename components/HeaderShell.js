'use client';
import { useEffect, useState } from 'react';

export default function HeaderShell({ children }) {
  const [golge, setGolge] = useState(false);
  useEffect(() => {
    const f = () => setGolge(window.scrollY > 8);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  return (
    <header className={`sticky top-0 z-40 bg-white/90 backdrop-blur-md transition-shadow duration-300 dark:bg-lacivert-950/90 ${golge ? 'shadow-[0_1px_0_#EDEAE5,0_8px_24px_-12px_rgba(19,37,74,.18)] dark:shadow-[0_1px_0_#13254A]' : 'shadow-[0_1px_0_#EDEAE5] dark:shadow-[0_1px_0_#13254A]'}`}>
      {children}
    </header>
  );
}
