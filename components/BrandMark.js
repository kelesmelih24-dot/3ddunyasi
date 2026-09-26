// 3D Dünyası amblemi: "3" + katmanlardan oluşan dünya-D + baskı yapan nozul.
// animated: açılış introsunda katmanlar alttan üste basılır.
const KATMANLAR = [86, 78, 70, 62, 54, 46, 38];

export default function BrandMark({ id = 'm', className = '', inverse = false, animated = false, title }) {
  const ink = inverse ? '#FFFFFF' : '#13254A';
  const stripe = inverse ? '#8FA3CC' : '#4D6699';
  return (
    <svg viewBox="0 0 132 104" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <clipPath id={`${id}-ic`}><path d="M77 36.5H84A24.5 24.5 0 0 1 84 85.5H77Z" /></clipPath>
      </defs>
      <path className={animated ? 'intro-uc' : ''} d="M10 30.5H47L28.5 51.5C44 50 53.5 60 53.5 72C53.5 86 42.5 95 29.5 95C20 95 12.5 91 8.5 84" fill="none" stroke={ink} strokeWidth="12.5" pathLength="1" />
      <path className={animated ? 'intro-d' : ''} fillRule="evenodd" fill={ink} d="M64 24H84A37 37 0 0 1 84 98H64ZM77 36.5H84A24.5 24.5 0 0 1 84 85.5H77Z" />
      <g clipPath={`url(#${id}-ic)`} fill={stripe}>
        {KATMANLAR.map((y, i) => (
          <rect key={y} x="76" y={y} width="42" height="5" className={animated ? 'intro-katman' : ''} style={animated ? { animationDelay: `${0.35 + i * 0.09}s` } : undefined} />
        ))}
      </g>
      <rect x="71" y="24" width="13" height="12.5" fill="#E8620C" className={animated ? 'intro-sicak' : ''} />
      <g className={animated ? 'intro-nozul' : ''}>
        <rect x="73" y="3" width="22" height="6" rx="1.2" fill={ink} />
        <path d="M77 9H91L87.5 17H80.5Z" fill={ink} />
        <rect x="82" y="17" width="4" height="7" fill="#E8620C" />
      </g>
    </svg>
  );
}
