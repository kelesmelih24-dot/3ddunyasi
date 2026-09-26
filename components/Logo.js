import BrandMark from './BrandMark';

// Logo kilidi: "3D" amblemi + "Dünyası" yazısı
export default function Logo({ className = '', inverse = false, id = 'logo', size = 'md' }) {
  const h = size === 'lg' ? 'h-24 sm:h-28' : 'h-10';
  const t = size === 'lg' ? 'text-5xl sm:text-6xl' : 'text-[1.6rem]';
  return (
    <span className={`inline-flex items-end gap-1.5 ${className}`}>
      <BrandMark id={id} inverse={inverse} className={`${h} w-auto`} title="3D" />
      <span className={`font-display font-semibold leading-[0.9] tracking-tight ${t} ${inverse ? 'text-white' : 'text-lacivert-800 dark:text-white'}`} style={{ marginBottom: '0.08em' }}>
        Dünyası
      </span>
    </span>
  );
}
