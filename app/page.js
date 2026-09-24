import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProductCard from '@/components/ProductCard';

const PANELLER = [
  {
    id: 'baski', href: '/baski-urunleri', img: '/panel/baski.svg', baslik: 'Baskı ürünleri',
    metin: 'Atölyemizde tasarlayıp bastığımız figür, dekorasyon, oyuncak ve kişiye özel ürünler.',
    cta: 'Ürünleri incele', etiketler: ['Figür', 'Dekorasyon', 'Anahtarlık', 'Yedek parça'],
  },
  {
    id: 'malzeme', href: '/malzemeler', img: '/panel/malzeme.svg', baslik: '3D baskı malzemeleri',
    metin: 'Projelerinizi tamamlamak için anahtarlık halkası, mıknatıs, ısıl insert, LED ve daha fazlası.',
    cta: 'Malzemelere göz at', etiketler: ['Halka', 'Mıknatıs', 'Insert', 'LED'],
  },
  {
    id: 'yazici', href: null, img: '/panel/yazici.svg', baslik: 'Yazıcı ve filament',
    metin: '3D yazıcı ve filament satışımız çok yakında başlıyor.', etiketler: ['Yazıcı', 'PLA', 'PETG'],
  },
];

function Panel({ p, i }) {
  const icerik = (
    <>
      <img src={p.img} alt="" className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ${p.href ? 'group-hover:scale-105' : 'opacity-50 grayscale'}`} />
      <div className="katman absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-lacivert-950 via-lacivert-950/60 to-transparent" />
      {!p.href && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="rotate-[-8deg] border-2 border-nozul-500 px-6 py-2 font-display text-4xl font-bold text-nozul-300 sm:text-5xl">Yakında</span>
        </div>
      )}
      <div className="relative mt-auto p-6 sm:p-8">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {p.etiketler.map((e) => <span key={e} className="rounded border border-white/20 px-2 py-0.5 text-xs text-lacivert-100">{e}</span>)}
        </div>
        <h2 className="text-3xl font-bold text-white sm:text-4xl">{p.baslik}</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-lacivert-100">{p.metin}</p>
        {p.href && <span className="btn-ana mt-5">{p.cta}</span>}
      </div>
    </>
  );
  const cls = 'baskida group relative flex min-h-[420px] flex-col overflow-hidden rounded-xl bg-lacivert-900 lg:min-h-0';
  const style = { animationDelay: `${i * 0.25}s` };
  return p.href ? (
    <Link href={p.href} className={cls} style={style}>{icerik}</Link>
  ) : (
    <div className={`${cls} cursor-default`} style={style} aria-label="Yazıcı ve filament bölümü yakında açılacak">{icerik}</div>
  );
}

export default async function Home() {
  const supabase = createClient();
  const { data: featured } = await supabase.from('products').select('*')
    .eq('is_featured', true).eq('is_active', true).neq('section', 'yazici').limit(8);

  return (
    <>
      <section className="kap pt-6">
        <h1 className="sr-only">3ddünyası: 3D baskı ürünleri, malzemeler, yazıcı ve filament</h1>
        <div className="grid gap-4 lg:h-[calc(100vh-7rem)] lg:max-h-[760px] lg:grid-cols-3">
          {PANELLER.map((p, i) => <Panel key={p.id} p={p} i={i} />)}
        </div>
      </section>

      {featured?.length > 0 && (
        <section className="kap mt-20">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold sm:text-3xl">Öne çıkanlar</h2>
            <Link href="/baski-urunleri" className="text-sm font-semibold text-nozul-600 hover:underline dark:text-nozul-300">Tüm ürünler</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      <section className="kap mt-20">
        <div className="katman grid items-center gap-6 rounded-xl bg-lacivert-800 p-8 text-white sm:p-12 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Aklınızdaki parçayı biz basalım</h2>
            <p className="mt-3 max-w-xl leading-7 text-lacivert-100">STL dosyanızı yükleyin ya da ürüne eklemek istediğiniz yazıyı iletin. İnceleyip size fiyat teklifi gönderelim.</p>
          </div>
          <Link href="/ozel-siparis" className="btn-ana">Özel sipariş talebi oluştur</Link>
        </div>
      </section>
    </>
  );
}
