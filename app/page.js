import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';

const PANELLER = [
  {
    no: '01', href: '/baski-urunleri', img: '/panel/baski.svg', baslik: 'Baskı ürünleri',
    metin: 'Atölyemizde tasarlayıp bastığımız figür, dekorasyon, oyuncak ve size özel ürünler.',
    cta: 'Ürünleri incele', tema: 'bg-nozul-500 text-white', alt: 'from-nozul-600/95 via-nozul-500/70',
    etiket: 'border-white/30 text-white/90',
  },
  {
    no: '02', href: '/malzemeler', img: '/panel/malzeme.svg', baslik: 'Baskı malzemeleri',
    metin: 'Projelerinizi tamamlayan parçalar: anahtarlık halkası, mıknatıs, ısıl insert, LED ve fazlası.',
    cta: 'Malzemelere göz at', tema: 'bg-krem text-lacivert-800', alt: 'from-krem via-krem/80',
    etiket: 'border-lacivert-200 text-lacivert-600',
  },
  {
    no: '03', href: null, img: '/panel/yazici.svg', baslik: 'Yazıcı ve filament',
    metin: '3D yazıcı ve filament satışımız çok yakında başlıyor.',
    tema: 'bg-[#EFEDEA] text-lacivert-800', alt: 'from-[#EFEDEA] via-[#EFEDEA]/80', etiket: 'border-lacivert-200 text-lacivert-400',
  },
];

function Ok() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function Panel({ p, i }) {
  const acik = !!p.href;
  const ic = (
    <>
      <img src={p.img} alt="" className={`absolute inset-x-0 top-0 h-[56%] w-full origin-top object-cover object-top transition-transform duration-700 ease-out lg:h-[60%] [mask-image:linear-gradient(to_bottom,#000_88%,transparent)] ${acik ? 'group-hover:scale-[1.04]' : ''}`} />
      {!acik && (
        <div className="absolute inset-x-0 top-[24%] grid place-items-center">
          <span className="rotate-[-6deg] rounded-md border-[3px] border-nozul-500 bg-white/70 px-6 py-1.5 font-display text-4xl font-bold uppercase tracking-wide text-nozul-500 backdrop-blur-sm sm:text-5xl">Yakında</span>
        </div>
      )}
      <div className="relative mt-auto p-7 sm:p-8">
        <p className={`font-display text-sm font-bold tracking-etiket ${acik ? '' : 'opacity-50'}`}>{p.no}</p>
        <h2 className="mt-2 text-[2rem] font-bold leading-[1.05] sm:text-[2.4rem]">{p.baslik}</h2>
        <p className={`mt-3 max-w-sm text-[15px] leading-6 ${i === 0 ? 'text-white/85' : 'soluk'}`}>{p.metin}</p>
        {acik && (
          <span className={`mt-6 inline-flex items-center gap-3 text-sm font-bold`}>
            <span className={`grid h-11 w-11 place-items-center rounded-full transition-all duration-300 group-hover:translate-x-1 ${i === 0 ? 'bg-white text-nozul-600' : 'bg-nozul-500 text-white'}`}><Ok /></span>
            {p.cta}
          </span>
        )}
      </div>
    </>
  );
  const cls = `baskida group relative flex min-h-[560px] flex-col overflow-hidden rounded-[28px] ${p.tema} lg:min-h-0 transition-shadow duration-500 ${acik ? 'hover:shadow-[0_30px_60px_-30px_rgba(19,37,74,.45)]' : ''}`;
  const style = { '--gecikme': `${i * 0.18}s` };
  return acik
    ? <Link href={p.href} className={cls} style={style}>{ic}</Link>
    : <div className={`${cls} cursor-default`} style={style} aria-label="Yazıcı ve filament bölümü yakında açılacak">{ic}</div>;
}

const GUVENCE = [
  ['M4 7h11v9H4zM15 10h3l2 3v3h-5', 'Hızlı kargo', 'Siparişleriniz özenle paketlenip hızla yola çıkar'],
  ['M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z', 'Güvenli ödeme', 'Kart bilgileriniz sitemizde saklanmaz'],
  ['M4 20h16M6 16h12M8 12h8M10 8h4', 'Atölyeden size', 'Her baskı tek tek kontrol edilip paketlenir'],
  ['M4 12a8 8 0 1 0 3-6.2M4 4v4h4', 'Kolay iade', '14 gün içinde iade hakkı (kişiye özel ürünler hariç)'],
];

const SURECLER = [
  ['Tasarım', 'Ürünü baskıya uygun hale getiriyor, ölçü ve dayanımı hesaplıyoruz.'],
  ['Baskı', 'Doğru malzeme ve katman kalınlığıyla atölyemizde basıyoruz.'],
  ['Son işlem', 'Destekleri temizliyor, zımparalıyor ve kalite kontrolünden geçiriyoruz.'],
  ['Kargo', 'Darbeye karşı korumalı paketleyip adresinize gönderiyoruz.'],
];

export default async function Home() {
  const supabase = createClient();
  const [{ data: featured }, { data: cats }] = await Promise.all([
    supabase.from('products').select('*').eq('is_featured', true).eq('is_active', true).neq('section', 'yazici').limit(8),
    supabase.from('categories').select('name, slug, section').neq('section', 'yazici').order('sort'),
  ]);
  const serit = (cats || []).map((c) => c.name);

  return (
    <>
      <section className="kap pt-6 sm:pt-8">
        <h1 className="sr-only">3D Dünyası: 3D baskı ürünleri, baskı malzemeleri, yazıcı ve filament</h1>
        <div className="grid gap-4 lg:h-[calc(100vh-9.5rem)] lg:max-h-[720px] lg:min-h-[560px] lg:grid-cols-3">
          {PANELLER.map((p, i) => <Panel key={p.no} p={p} i={i} />)}
        </div>
      </section>

      {serit.length > 0 && (
        <div className="mt-10 overflow-hidden border-y border-lacivert-100 py-4 dark:border-lacivert-800" aria-hidden="true">
          <div className="kayan flex w-max gap-10 whitespace-nowrap font-display text-xl font-semibold text-lacivert-800 dark:text-white sm:text-2xl">
            {[...serit, ...serit].map((s, i) => (
              <span key={i} className="flex items-center gap-10">{s}<span className="inline-block h-2.5 w-2.5 rotate-45 bg-nozul-500" /></span>
            ))}
          </div>
        </div>
      )}

      <section className="kap mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {GUVENCE.map(([d, t, m], i) => (
          <Reveal key={t} delay={i * 80} className="flex gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-nozul-50 text-nozul-600 dark:bg-nozul-700/20 dark:text-nozul-300">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
            </span>
            <span><span className="block font-bold">{t}</span><span className="soluk mt-0.5 block text-sm leading-5">{m}</span></span>
          </Reveal>
        ))}
      </section>

      {featured?.length > 0 && (
        <section className="kap mt-24">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="ust-etiket">Öne çıkanlar</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-[2.6rem] sm:leading-tight">Atölyemizden en sevilenler</h2>
            </div>
            <Link href="/baski-urunleri" className="btn-cizgi">Tüm ürünler <Ok /></Link>
          </Reveal>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {featured.map((p, i) => <Reveal key={p.id} delay={(i % 4) * 90}><ProductCard p={p} /></Reveal>)}
          </div>
        </section>
      )}

      <section className="mt-28 bg-krem py-20 dark:bg-lacivert-900">
        <div className="kap">
          <Reveal className="max-w-2xl">
            <p className="ust-etiket">Nasıl üretiyoruz</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-[2.6rem] sm:leading-tight">Dosyadan elinize, dört adımda</h2>
          </Reveal>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {SURECLER.map(([t, m], i) => (
              <Reveal as="li" key={t} delay={i * 110} className="relative border-t-2 border-lacivert-800 pt-6 dark:border-white">
                <span className="absolute -top-[5px] left-0 h-2 w-12 bg-nozul-500" />
                <span className="font-display text-5xl font-bold text-nozul-500">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-3 text-xl font-bold">{t}</h3>
                <p className="soluk mt-2 leading-6">{m}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="kap mt-24">
        <Reveal className="katman relative overflow-hidden rounded-[28px] bg-nozul-500 px-8 py-14 text-white sm:px-14 sm:py-16">
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-bold uppercase tracking-etiket text-white/80">Özel sipariş</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-[2.6rem]">Aklınızdaki parçayı biz basalım.</h2>
              <p className="mt-4 max-w-xl leading-7 text-white/85">STL dosyanızı yükleyin ya da ürüne eklemek istediğiniz yazıyı iletin. İnceleyip genellikle bir iş günü içinde fiyat teklifimizi gönderiyoruz.</p>
            </div>
            <Link href="/ozel-siparis" className="btn bg-lacivert-800 px-7 py-3.5 text-white hover:bg-lacivert-900">Teklif iste <Ok /></Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
