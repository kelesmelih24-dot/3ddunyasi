import Link from 'next/link';
const L = [['/hesabim', 'Siparişlerim'], ['/hesabim/favoriler', 'Favorilerim'], ['/hesabim/talepler', 'Özel taleplerim'], ['/hesabim/profil', 'Profil bilgilerim']];
export default function AccountNav({ active }) {
  return (
    <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-lacivert-100 text-sm dark:border-lacivert-800">
      {L.map(([h, t]) => (
        <Link key={h} href={h} className={`whitespace-nowrap border-b-2 px-3 py-2.5 ${active === h ? 'border-nozul-500 font-semibold' : 'border-transparent soluk hover:text-lacivert-800 dark:hover:text-white'}`}>{t}</Link>
      ))}
    </nav>
  );
}
