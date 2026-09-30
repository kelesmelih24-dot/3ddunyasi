'use client';
import { useEffect } from 'react';

export function hataBildir(message, stack) {
  try { navigator.sendBeacon?.('/api/hata', new Blob([JSON.stringify({ message, stack, url: location.href })], { type: 'application/json' })); } catch {}
}
export default function ErrorReporter() {
  useEffect(() => {
    const h1 = (e) => hataBildir(e.message, e.error?.stack);
    const h2 = (e) => hataBildir(String(e.reason?.message || e.reason), e.reason?.stack);
    window.addEventListener('error', h1); window.addEventListener('unhandledrejection', h2);
    return () => { window.removeEventListener('error', h1); window.removeEventListener('unhandledrejection', h2); };
  }, []);
  return null;
}
