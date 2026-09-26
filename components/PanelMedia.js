'use client';
import { useEffect, useRef, useState } from 'react';

// public/video/<ad>.mp4 varsa panelin arkasında sessiz, döngülü video oynar;
// yoksa çizim görünür. Hareket azaltma açıksa video oynatılmaz.
export default function PanelMedia({ video, img, soluk, hover }) {
  const [var_, setVar] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    fetch(video, { method: 'HEAD' }).then((r) => r.ok && setVar(true)).catch(() => {});
  }, [video]);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()));
    io.observe(v);
    return () => io.disconnect();
  }, [var_]);

  if (var_) return (
    <video ref={ref} muted loop playsInline preload="metadata" poster={img} aria-hidden="true"
      className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ${soluk ? 'opacity-40 grayscale' : ''} ${hover ? 'group-hover:scale-[1.04]' : ''}`}>
      <source src={video} type="video/mp4" />
    </video>
  );
  return (
    <img src={img} alt="" className={`absolute inset-x-0 top-0 h-[56%] w-full origin-top object-cover object-top transition-transform duration-700 ease-out [mask-image:linear-gradient(to_bottom,#000_88%,transparent)] lg:h-[60%] ${hover ? 'group-hover:scale-[1.04]' : ''}`} />
  );
}
