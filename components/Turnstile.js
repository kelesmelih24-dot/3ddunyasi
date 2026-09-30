'use client';
import { useEffect, useRef } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const turnstileAktif = !!SITE_KEY;

// Cloudflare Turnstile: çoğu kullanıcı için görünmez, gerekirse tek tık. Anahtar yoksa hiçbir şey göstermez.
export default function Turnstile({ onToken, className = '' }) {
  const kap = useRef(null);
  useEffect(() => {
    if (!SITE_KEY) return;
    let id, iptal = false;
    const ciz = () => {
      if (iptal || !kap.current || !window.turnstile) return;
      id = window.turnstile.render(kap.current, {
        sitekey: SITE_KEY, language: 'tr', theme: 'auto', size: 'flexible',
        callback: onToken, 'expired-callback': () => onToken(''), 'error-callback': () => onToken(''),
      });
    };
    if (window.turnstile) ciz();
    else {
      let s = document.getElementById('cf-turnstile');
      if (!s) { s = document.createElement('script'); s.id = 'cf-turnstile'; s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; document.head.appendChild(s); }
      s.addEventListener('load', ciz);
    }
    return () => { iptal = true; if (id && window.turnstile) window.turnstile.remove(id); };
  }, []);
  if (!SITE_KEY) return null;
  return <div ref={kap} className={className} />;
}
