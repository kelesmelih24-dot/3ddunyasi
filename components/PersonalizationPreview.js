// Kişiye özel ürünlerde müşterinin yazdığı metni ürün üzerinde canlı gösterir.
export default function PersonalizationPreview({ tur, metin }) {
  const yazi = (metin || '').trim() || 'İsminiz';
  const bos = !(metin || '').trim();
  const boyut = Math.max(18, Math.min(46, 460 / Math.max(4, yazi.length)));
  if (tur === 'plaka') {
    const p = yazi.toLocaleUpperCase('tr-TR');
    const pb = Math.max(18, Math.min(42, 400 / Math.max(5, p.length)));
    return (
      <svg viewBox="0 0 420 150" className="w-full" role="img" aria-label={`Önizleme: ${p}`}>
        <circle cx="46" cy="75" r="24" fill="none" stroke="#9aa0ab" strokeWidth="7" />
        <rect x="60" y="30" width="340" height="90" rx="10" fill="#fff" stroke="#13254A" strokeWidth="5" />
        <rect x="63" y="33" width="42" height="84" rx="6" fill="#1E4FA3" />
        <text x="84" y="104" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800" fontSize="20" fill="#fff">TR</text>
        <text x="252" y="75" dominantBaseline="central" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800" fontSize={pb} letterSpacing="2" fill={bos ? '#b9b4ab' : '#13254A'}>{p}</text>
      </svg>
    );
  }
  if (tur === 'etiket') {
    return (
      <svg viewBox="0 0 420 170" className="w-full" role="img" aria-label={`Önizleme: ${yazi}`}>
        <rect x="30" y="30" width="360" height="110" rx="55" fill="#13254A" />
        <rect x="40" y="40" width="340" height="90" rx="45" fill="#E8620C" />
        <text x="210" y="85" dominantBaseline="central" textAnchor="middle" fontFamily="Unbounded, sans-serif" fontWeight="600" fontSize={boyut} fill={bos ? '#ffd1b0' : '#fff'}>{yazi}</text>
      </svg>
    );
  }
  // isimlik anahtarlık (varsayılan)
  return (
    <svg viewBox="0 0 440 170" className="w-full" role="img" aria-label={`Önizleme: ${yazi}`}>
      <defs>
        <pattern id="katmanlar" width="6" height="4" patternUnits="userSpaceOnUse"><rect width="6" height="4" fill="#E8620C" /><rect y="3.2" width="6" height=".8" fill="#C95209" /></pattern>
      </defs>
      <circle cx="44" cy="85" r="26" fill="none" stroke="#9aa0ab" strokeWidth="7" />
      <path d="M70 55h330a30 30 0 0 1 30 30v0a30 30 0 0 1-30 30H70a30 30 0 0 1-30-30v0a30 30 0 0 1 30-30Z" fill="url(#katmanlar)" />
      <circle cx="72" cy="85" r="9" fill="#fff" />
      <text x="245" y="87" dominantBaseline="central" textAnchor="middle" fontFamily="Unbounded, sans-serif" fontWeight="700" fontSize={Math.min(boyut, 40)} fill={bos ? '#ffd1b0' : '#fff'} stroke="#9C3F07" strokeWidth="1" paintOrder="stroke">{yazi}</text>
    </svg>
  );
}
