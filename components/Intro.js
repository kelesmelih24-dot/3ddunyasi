'use client';
import { useEffect, useRef, useState } from 'react';
import { INTRO_PATH, INTRO_VIEWBOX } from '@/lib/introPath';

// Her alt yol ayrı çizilir (tarayıcılar kesik çizgi desenini her alt yolda baştan başlatır)
const PARCALAR = INTRO_PATH.split('M').filter(Boolean).map((d) => 'M' + d);

const CIZIM = 2600;      // yazının çizilme süresi (ms)
const SOGUMA = 550;      // turuncudan laciverte dönüş gecikmesi (ms)
const BEKLE = 350;       // yazı bitince bekleme
const ACILMA = 750;      // perdenin ikiye açılma süresi

// Web Audio ile sentezlenen hafif step motoru sesi (dosya gerekmez)
function motorSesi() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const osc = ctx.createOscillator(), osc2 = ctx.createOscillator();
  const filtre = ctx.createBiquadFilter(), kazanc = ctx.createGain();
  osc.type = 'sawtooth'; osc2.type = 'square';
  filtre.type = 'lowpass'; filtre.frequency.value = 900; filtre.Q.value = 4;
  kazanc.gain.value = 0;
  osc.connect(filtre); osc2.connect(filtre); filtre.connect(kazanc); kazanc.connect(ctx.destination);
  osc.start(); osc2.start();
  kazanc.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.08);
  return {
    hiz(v) { const f = 120 + v * 260; osc.frequency.setTargetAtTime(f, ctx.currentTime, 0.03); osc2.frequency.setTargetAtTime(f * 1.5, ctx.currentTime, 0.03); },
    dur() { kazanc.gain.setTargetAtTime(0, ctx.currentTime, 0.05); setTimeout(() => ctx.close(), 300); },
  };
}

export default function Intro() {
  const [durum, setDurum] = useState('gizli'); // gizli | ciziyor | aciliyor | bitti
  const [ses, setSes] = useState(false);
  const sicak = useRef([]), soguk = useRef([]), nozul = useRef(null), motor = useRef(null), raf = useRef(0);

  useEffect(() => {
    if (document.documentElement.classList.contains('intro-yok')) return setDurum('bitti');
    setDurum('ciziyor');
  }, []);

  useEffect(() => {
    if (durum !== 'ciziyor') return;
    const S = sicak.current, C = soguk.current, n = nozul.current;
    const boylar = S.map((p) => p.getTotalLength());
    const L = boylar.reduce((a, b) => a + b, 0);
    const baslar = boylar.map((_, i) => boylar.slice(0, i).reduce((a, b) => a + b, 0));
    [...S, ...C].forEach((p, i) => { const l = boylar[i % S.length]; p.style.strokeDasharray = `${l} ${l}`; p.style.strokeDashoffset = l; });
    // Toplam uzunlukta verilen noktaya kadar her parçayı sırayla çiz
    const ciz = (yollar, uzunluk) => yollar.forEach((p, i) => {
      p.style.strokeDashoffset = boylar[i] - Math.min(boylar[i], Math.max(0, uzunluk - baslar[i]));
    });
    const konum = (uzunluk) => {
      let i = baslar.findIndex((b, k) => uzunluk <= b + boylar[k]);
      if (i < 0) i = S.length - 1;
      return S[i].getPointAtLength(Math.max(0, uzunluk - baslar[i]));
    };
    const kolay = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
    let bas = null, onceki = null;
    const kare = (zaman) => {
      if (bas === null) bas = zaman;
      const t = zaman - bas;
      const ilerleme = kolay(Math.min(1, t / CIZIM));
      const soguma = kolay(Math.min(1, Math.max(0, (t - SOGUMA) / CIZIM)));
      ciz(S, L * ilerleme);
      ciz(C, L * soguma);
      const nokta = konum(L * ilerleme);
      n.setAttribute('transform', `translate(${nokta.x} ${nokta.y})`);
      if (motor.current && onceki) motor.current.hiz(Math.min(1, Math.hypot(nokta.x - onceki.x, nokta.y - onceki.y) / 6));
      onceki = nokta;
      if (t < CIZIM + SOGUMA + BEKLE) raf.current = requestAnimationFrame(kare);
      else bitir();
    };
    raf.current = requestAnimationFrame(kare);
    return () => cancelAnimationFrame(raf.current);
  }, [durum]);

  function bitir() {
    cancelAnimationFrame(raf.current);
    motor.current?.dur(); motor.current = null;
    setDurum('aciliyor');
    setTimeout(() => { setDurum('bitti'); document.documentElement.classList.add('intro-yok'); }, ACILMA);
  }

  function sesiDegistir() {
    if (ses) { motor.current?.dur(); motor.current = null; setSes(false); }
    else { motor.current = motorSesi(); setSes(true); }
  }

  if (durum === 'bitti' || durum === 'gizli') return durum === 'gizli' ? <div className="intro intro-bos" aria-hidden="true" /> : null;

  return (
    <div className={`intro ${durum === 'aciliyor' ? 'intro-acil' : ''}`} role="presentation">
      <div className="intro-yarim intro-sol" />
      <div className="intro-yarim intro-sag" />
      <div className="intro-sahne">
        <svg viewBox={INTRO_VIEWBOX} className="w-[min(86vw,760px)] overflow-visible" aria-label="3D Dünyası">
          {/* Önce sıcak (turuncu) çizgi, hemen arkasından üstüne soğuyan (lacivert) çizgi biner */}
          <g fill="none" stroke="#E8620C" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
            {PARCALAR.map((d, i) => <path key={i} ref={(el) => (sicak.current[i] = el)} d={d} style={{ strokeDashoffset: 9999, strokeDasharray: '9999 9999' }} />)}
          </g>
          <g fill="none" stroke="#13254A" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
            {PARCALAR.map((d, i) => <path key={i} ref={(el) => (soguk.current[i] = el)} d={d} style={{ strokeDashoffset: 9999, strokeDasharray: '9999 9999' }} />)}
          </g>
          <g ref={nozul} transform="translate(0 0)">
            <g transform="translate(-12 -13)">
              <rect x="-6" y="-26" width="36" height="6" rx="1.5" fill="#13254A" opacity=".18" />
              <rect x="0" y="-18" width="24" height="18" rx="3" fill="#13254A" />
              <rect x="3" y="-14" width="18" height="3" rx="1" fill="#E8620C" />
              <path d="M5 0h14l-4 9h-6Z" fill="#13254A" />
              <path d="M9.5 9h5l-1 4h-3Z" fill="#E8620C" />
            </g>
            <circle r="7" fill="#E8620C" opacity=".22" className="intro-parilti" />
          </g>
        </svg>
      </div>
      <div className="intro-kontrol">
        <button type="button" onClick={sesiDegistir} aria-pressed={ses} aria-label={ses ? 'Sesi kapat' : 'Yazıcı sesini aç'} className="intro-dugme">
          {ses ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5 6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6" /></svg>
          )}
        </button>
        <button type="button" onClick={bitir} className="intro-dugme px-4 font-semibold">Geç</button>
      </div>
    </div>
  );
}
