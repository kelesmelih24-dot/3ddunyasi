'use client';
import { useState } from 'react';
import ModelViewer from './ModelViewer';

// Ürün görselleri + (varsa) video ve 3D model
export default function Gallery({ images, alt, video, model }) {
  const ogeler = [
    ...images.map((src) => ({ tur: 'img', src })),
    ...(video ? [{ tur: 'video', src: video }] : []),
    ...(model ? [{ tur: '3d', src: model }] : []),
  ];
  const [i, setI] = useState(0);
  const o = ogeler[i];
  const yt = o.tur === 'video' && /youtu\.?be/.test(o.src) ? o.src.replace(/.*(?:v=|youtu\.be\/|shorts\/)([\w-]{11}).*/, '$1') : null;
  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-3xl bg-krem dark:bg-lacivert-900">
        {o.tur === 'img' && <img src={o.src} alt={alt} className="h-full w-full object-cover" />}
        {o.tur === 'video' && (yt
          ? <iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title={`${alt} videosu`} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          : <video src={o.src} controls playsInline className="h-full w-full object-cover" />)}
        {o.tur === '3d' && <ModelViewer url={o.src} className="h-full w-full" />}
      </div>
      {ogeler.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {ogeler.map((g, n) => (
            <button key={g.src + n} onClick={() => setI(n)} aria-label={g.tur === 'img' ? `Görsel ${n + 1}` : g.tur === 'video' ? 'Video' : '3D model'}
              className={`grid h-16 w-16 place-items-center overflow-hidden rounded-xl border-2 bg-krem text-xs font-bold dark:bg-lacivert-900 ${n === i ? 'border-nozul-500' : 'border-transparent'}`}>
              {g.tur === 'img' && <img src={g.src} alt="" className="h-full w-full object-cover" />}
              {g.tur === 'video' && <span className="flex flex-col items-center gap-0.5"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>Video</span>}
              {g.tur === '3d' && <span className="flex flex-col items-center gap-0.5 text-nozul-600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3 3 8l9 5 9-5-9-5zM3 8v8l9 5 9-5V8M12 13v8" /></svg>3D</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
