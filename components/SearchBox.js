'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tl } from '@/lib/format';

export default function SearchBox({ className = '', mobil = false }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [sonuc, setSonuc] = useState([]);
  const [acik, setAcik] = useState(false);
  const [secili, setSecili] = useState(-1);
  const [yukleniyor, setYukleniyor] = useState(false);
  const kutu = useRef(null);

  useEffect(() => {
    if (q.trim().length < 2) { setSonuc([]); return; }
    setYukleniyor(true);
    const t = setTimeout(async () => {
      try { setSonuc(await (await fetch(`/api/ara?q=${encodeURIComponent(q.trim())}`)).json()); } catch { setSonuc([]); }
      setYukleniyor(false); setSecili(-1);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const kapat = (e) => kutu.current && !kutu.current.contains(e.target) && setAcik(false);
    document.addEventListener('mousedown', kapat);
    return () => document.removeEventListener('mousedown', kapat);
  }, []);

  const git = (yol) => { setAcik(false); setQ(''); router.push(yol); };
  function tus(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSecili((s) => Math.min(sonuc.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSecili((s) => Math.max(-1, s - 1)); }
    else if (e.key === 'Escape') setAcik(false);
    else if (e.key === 'Enter') { e.preventDefault(); if (secili >= 0 && sonuc[secili]) git(`/urun/${sonuc[secili].slug}`); else if (q.trim()) git(`/ara?q=${encodeURIComponent(q.trim())}`); }
  }
  const goster = acik && q.trim().length >= 2;

  return (
    <div ref={kutu} className={`relative ${className}`} role="search">
      <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lacivert-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input value={q} onChange={(e) => { setQ(e.target.value); setAcik(true); }} onFocus={() => setAcik(true)} onKeyDown={tus}
        type="search" placeholder="Ürün ara" aria-label="Ürün ara" aria-expanded={goster} aria-controls="arama-sonuc" autoComplete="off"
        className={`girdi rounded-full py-2 pl-10 transition-all ${mobil ? 'w-full' : 'w-52 bg-lacivert-50 focus:w-72 focus:bg-white dark:bg-lacivert-900'}`} />
      {goster && (
        <div id="arama-sonuc" className={`kutu absolute z-50 mt-2 overflow-hidden p-1.5 shadow-2xl ${mobil ? 'left-0 right-0' : 'right-0 w-[22rem]'}`}>
          {yukleniyor && !sonuc.length && <p className="soluk px-3 py-3 text-sm">Aranıyor…</p>}
          {!yukleniyor && !sonuc.length && <p className="soluk px-3 py-3 text-sm">"{q}" için ürün bulunamadı.</p>}
          {sonuc.map((p, i) => (
            <button key={p.slug} onMouseEnter={() => setSecili(i)} onClick={() => git(`/urun/${p.slug}`)}
              className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left ${secili === i ? 'bg-nozul-50 dark:bg-nozul-700/20' : ''}`}>
              <img src={p.images?.[0] || '/ornek/yazici.svg'} alt="" className="h-11 w-11 rounded-lg bg-krem object-cover" />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{p.name}</span>
                <span className="soluk text-xs">{p.section === 'malzeme' ? 'Malzeme' : 'Baskı ürünü'}{p.is_for_sale === false ? ' · Satışa kapalı' : p.stock <= 0 ? ' · Stokta yok' : ''}</span></span>
              <span className="text-sm font-bold">{tl(p.sale_unit === 'paket' ? p.pack_price ?? p.price * p.pack_size : p.price)}</span>
            </button>
          ))}
          {sonuc.length > 0 && <button onClick={() => git(`/ara?q=${encodeURIComponent(q.trim())}`)} className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-nozul-600 hover:bg-lacivert-50 dark:text-nozul-300 dark:hover:bg-lacivert-800">Tüm sonuçları gör →</button>}
        </div>
      )}
    </div>
  );
}
