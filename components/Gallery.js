'use client';
import { useState } from 'react';

export default function Gallery({ images, alt }) {
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-xl bg-lacivert-50 dark:bg-lacivert-900">
        <img src={images[i]} alt={alt} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((src, n) => (
            <button key={src} onClick={() => setI(n)} aria-label={`Görsel ${n + 1}`}
              className={`h-16 w-16 overflow-hidden rounded-md border-2 ${n === i ? 'border-nozul-500' : 'border-transparent'}`}>
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
