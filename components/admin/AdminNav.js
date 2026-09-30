'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

// r: hangi roller görebilir (admin her şeyi görür)
export const MENU = [
  ['Satış', [['/admin/bugun', 'Bugün', 'siparis'], ['/admin', 'Genel bakış', 'siparis'], ['/admin/siparisler', 'Siparişler', 'siparis'], ['/admin/baski-kuyrugu', 'Baskı kuyruğu', 'siparis'], ['/admin/ozel-talepler', 'Özel talepler', 'siparis'], ['/admin/iadeler', 'İade talepleri', 'siparis'], ['/admin/sorular', 'Ürün soruları', 'siparis']]],
  ['Atölye', [['/admin/filamentler', 'Filament envanteri', 'siparis'], ['/admin/yazicilar', 'Yazıcılar ve bakım', 'siparis'], ['/admin/tedarikciler', 'Tedarikçiler', 'siparis']]],
  ['Katalog', [['/admin/urunler', 'Ürünler ve stok', 'urun'], ['/admin/urunler/toplu', 'Excel ile toplu işlem', 'urun'], ['/admin/kategoriler', 'Kategoriler', 'urun'], ['/admin/galeri', 'Galeri', 'urun'], ['/admin/blog', 'Blog', 'urun']]],
  ['Pazarlama', [['/admin/kampanyalar', 'Kampanyalar', 'admin'], ['/admin/kuponlar', 'Kuponlar', 'admin'], ['/admin/hediye-cekleri', 'Hediye çekleri', 'admin'], ['/admin/bulten', 'Bülten aboneleri', 'admin'], ['/admin/kurumsal', 'Kurumsal talepler', 'admin']]],
  ['Yönetim', [['/admin/raporlar', 'Kâr ve raporlar', 'admin'], ['/admin/defter', 'Gider-gelir defteri', 'admin'], ['/admin/musteriler', 'Müşteriler ve ekip', 'admin'], ['/admin/yorumlar', 'Yorumlar', 'admin'], ['/admin/ayarlar', 'Mağaza ayarları', 'admin'], ['/admin/hatalar', 'Site hataları', 'admin']]],
];

export default function AdminNav({ rol }) {
  const yol = usePathname();
  const [acik, setAcik] = useState(false);
  const gorunen = MENU.map(([b, l]) => [b, l.filter(([, , r]) => rol === 'admin' || r === rol)]).filter(([, l]) => l.length);
  const aktif = gorunen.flatMap(([, l]) => l).filter(([h]) => yol === h || (h !== '/admin' && yol.startsWith(h))).sort((a, b) => b[0].length - a[0].length)[0];
  const liste = (
    <nav className="space-y-5" aria-label="Yönetim menüsü">
      {gorunen.map(([baslik, linkler]) => (
        <div key={baslik}>
          <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-etiket text-lacivert-400">{baslik}</p>
          {linkler.map(([h, t]) => (
            <Link key={h} href={h} onClick={() => setAcik(false)} className={`block rounded-xl px-3 py-2 text-sm ${aktif?.[0] === h ? 'bg-nozul-50 font-semibold text-nozul-700 dark:bg-nozul-700/20 dark:text-nozul-100' : 'hover:bg-lacivert-50 dark:hover:bg-lacivert-800'}`}>{t}</Link>
          ))}
        </div>
      ))}
    </nav>
  );
  return (
    <>
      <div className="lg:hidden">
        <button onClick={() => setAcik(!acik)} aria-expanded={acik} className="btn-cizgi w-full justify-between">
          <span>☰ {aktif?.[1] || 'Yönetim menüsü'}</span><span className="soluk text-xs">{rol === 'admin' ? 'Yönetici' : rol === 'siparis' ? 'Sipariş sorumlusu' : 'Ürün sorumlusu'}</span>
        </button>
        {acik && <div className="kutu mt-2 p-3">{liste}</div>}
      </div>
      <aside className="hidden lg:block">
        <p className="mb-4 px-3 font-display text-lg font-semibold">Yönetim</p>
        {liste}
      </aside>
    </>
  );
}
