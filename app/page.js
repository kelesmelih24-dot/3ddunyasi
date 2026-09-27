import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import PanelMedia from '@/components/PanelMedia';
import Countdown from '@/components/Countdown';
import NewsletterForm from '@/components/NewsletterForm';

const PANELLER = [
  {
    no: '01', href: '/baski-urunleri', img: '/panel/baski.svg', video: '/video/baski.mp4', baslik: 'Baskı ürünleri',
    metin: 'Atölyemizde tasarlayıp bastığımız figür, dekorasyon, oyuncak ve size özel ürünler.',
    cta: 'Ürünleri incele', tema: 'bg-nozul-500 text-white', golge: 'from-nozul-600 via-nozul-600/70', rozet: 'Kişiye özel!',
  },
  {
    no: '02', href: '/malzemeler', img: '/panel/malzeme.svg', video: '/video/malzeme.mp4', baslik: 'Baskı malzemeleri',
    metin: 'Projelerinizi tamamlayan parçalar: anahtarlık halkası, mıknatıs, ısıl insert, LED ve fazlası.',
    cta: 'Malzemelere göz at', tema: 'bg-krem text-lacivert-800', golge: 'from-krem via-krem/80', rozet: 'Adet veya paket',
  },
  {
    no: '03', href: '/yazici-filament', yakinda: true, img: '/panel/yazici.svg', video: '/video/yazici.mp4', baslik: 'Yazıcı ve filament',
    metin: '3D yazıcı ve filament satışımız çok yakında. Ürünleri şimdiden inceleyin.', cta: 'Ön izleme', tema: 'bg-[#EFEDEA] text-lacivert-800', golge: 'from-[#EFEDEA] via-[#EFEDEA]/80',
  },
];

function Ok() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function Panel({ p, i }) {
  const acik = !!p.href;
  const yakinda = !!p.yakinda;
  const ic = (
    <>
      <PanelMedia video={p.video} img={p.img} soluk={yakinda} hover={acik} />
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t ${p.golge} to-transparent`} />
      {p.rozet && (
        <span className={`salla absolute right-5 top-5 rounded-full px-3.5 py-1.5 font-display text-xs font-semibold shadow-lg ${i === 0 ? 'bg-white text-nozul-600' : 'bg-nozul-500 text-white'}`}>{p.rozet}</span>
      )}
      {yakinda && (
        <div className="absolute inset-x-0 top-[24%] grid place-items-center">
          <span className="rotate-[-6deg] rounded-2xl border-[3px] border-nozul-500 bg-white/80 px-6 py-2 font-display text-3xl font-semibold uppercase text-nozul-500 backdrop-blur-sm sm:text-4xl">Yakında</span>
        </div>
      )}
      <div className="relative mt-auto p-7 sm:p-8">
        <p className={`font-display text-xs font-semibold tracking-etiket ${yakinda ? 'opacity-50' : ''}`}>{p.no}</p>
        <h2 className="mt-2 text-[1.75rem] font-semibold leading-[1.1] sm:text-[2rem]">{p.baslik}</h2>
        <p className={`mt-3 max-w-sm text-[15px] leading-6 ${i === 0 ? 'text-white/90' : 'soluk'}`}>{p.metin}</p>
        {acik && (
          <span className="mt-6 inline-flex items-center gap-3 text-sm font-bold">
            <span className={`grid h-12 w-12 place-items-center rounded-full transition-transform duration-300 group-hover:translate-x-1.5 group-hover:rotate-[-8deg] ${i === 0 ? 'bg-white text-nozul-600' : 'bg-nozul-500 text-white'}`}><Ok /></span>
            {p.cta}
          </span>
        )}
      </div>
    </>
  );
  const cls = `baskida group relative flex min-h-[560px] flex-col overflow-hidden rounded-[28px] ${p.tema} transition-[box-shadow,transform] duration-500 lg:min-h-0 ${acik ? 'hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(19,37,74,.45)]' : ''}`;
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

function sss(s) {
  const limit = Number(s.free_shipping_limit).toLocaleString('tr-TR');
  const ucret = Number(s.shipping_fee).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
  return [
    ['Siparişim ne zaman kargoya verilir?', 'Stokta olan ürünler hazırlanır hazırlanmaz kargoya verilir. Kişiye özel ürünler üretildikten sonra yola çıkar. Siparişinizin her aşamasını Sipariş takibi sayfasından ya da hesabınızdan izleyebilirsiniz.'],
    ['Kargo ücreti ne kadar?', `${limit} TL ve üzeri siparişlerde kargo ücretsiz. Bu tutarın altındaki siparişlerde kargo ücreti ${ucret} TL.`],
    ['Hangi ödeme yöntemlerini kabul ediyorsunuz?', 'Havale/EFT ile ödeme yapabilirsiniz; kredi ve banka kartıyla güvenli ödeme de çok yakında aktif olacak. Kart bilgileriniz sitemizde saklanmaz.'],
    ['Kendi tasarımımı bastırabilir miyim?', 'Evet. Özel sipariş sayfasından STL, 3MF, OBJ veya STEP dosyanızı yükleyin; inceleyip fiyat teklifimizi iletelim.'],
    ['Ürünlere isim veya yazı ekleyebilir miyim?', 'Ürün sayfasında "Kişiselleştirilebilir" etiketi olan ürünlere isim, tarih veya kısa bir yazı ekleyebilirsiniz.'],
    ['Kişiye özel ürünleri iade edebilir miyim?', 'Size özel hazırlanan ürünler yasal olarak cayma hakkı kapsamı dışındadır. Ancak ürün hasarlı veya hatalı ulaşırsa ücretsiz yeniden basıyor ya da ücret iadesi yapıyoruz.'],
    ['Hangi malzemelerle baskı yapıyorsunuz?', 'Ağırlıklı olarak PLA ve PETG kullanıyoruz. Dayanım, esneklik veya ısı gerektiren işlerde ürüne uygun malzemeyi birlikte seçiyoruz.'],
    ['Toplu veya kurumsal sipariş alıyor musunuz?', `Evet. Promosyon anahtarlıkları, kurumsal hediyeler ve toplu üretim için ${s.contact_phone || 'WhatsApp hattımızdan'} bize ulaşın.`],
  ];
}

export default async function Home() {
  const supabase = createClient();
  const settings = await getSettings();
  const [{ data: featured }, { data: cats }, { data: yorumlar }, { data: galeri }] = await Promise.all([
    supabase.from('products').select('*').eq('is_featured', true).eq('is_active', true).neq('section', 'yazici').limit(8),
    supabase.from('categories').select('name, slug, section').neq('section', 'yazici').order('sort'),
    supabase.from('reviews').select('id, rating, comment, author_name, created_at, products(name, slug)').eq('is_approved', true).gte('rating', 4).not('comment', 'is', null).order('created_at', { ascending: false }).limit(6),
    supabase.from('gallery_items').select('*').order('sort').order('created_at', { ascending: false }),
  ]);
  const serit = (cats || []).map((c) => c.name);
  const atolye = (galeri || []).filter((g) => g.kind === 'atolye').slice(0, 8);
  const insta = (galeri || []).filter((g) => g.kind === 'instagram').slice(0, 6);
  const acilis = settings.launch_at && new Date(settings.launch_at) > new Date() ? settings.launch_at : null;
  const sorular = sss(settings);
  const sssLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: sorular.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };

  return (
    <>
      <section className="kap pt-6 sm:pt-8">
        <h1 className="sr-only">3D Dünyası: 3D baskı ürünleri, baskı malzemeleri, yazıcı ve filament</h1>
        <div className="grid gap-4 lg:h-[calc(100vh-9.5rem)] lg:max-h-[720px] lg:min-h-[580px] lg:grid-cols-3">
          {PANELLER.map((p, i) => <Panel key={p.no} p={p} i={i} />)}
        </div>
      </section>

      {serit.length > 0 && (
        <div className="mt-10 -rotate-1 overflow-hidden bg-nozul-500 py-4 text-white shadow-[0_12px_30px_-18px_rgba(232,98,12,.8)]" aria-hidden="true">
          <div className="kayan flex w-max gap-10 whitespace-nowrap font-display text-lg font-semibold sm:text-2xl">
            {[...serit, ...serit].map((s, i) => (
              <span key={i} className="flex items-center gap-10">{s}<span className="inline-block h-3 w-3 rotate-45 rounded-[3px] bg-lacivert-800" /></span>
            ))}
          </div>
        </div>
      )}

      <section className="kap mt-24">
        <Reveal className="katman relative overflow-hidden rounded-[32px] bg-lacivert-800 px-6 py-12 text-white sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-nozul-500/25 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-etiket text-nozul-300">{acilis ? 'Geri sayım başladı' : 'Çok yakında'}</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{acilis ? 'Nozullar ısınıyor, açılışa az kaldı' : 'Nozullar ısınıyor, açılış çok yakın'}</h2>
              <p className="mt-4 max-w-md leading-7 text-white/75">E-postanızı bırakın; açılış gününü, ilk siparişe özel indirim kodunu ve yeni ürünleri ilk siz öğrenin.</p>
              <div className="mt-7 max-w-md"><NewsletterForm koyu /></div>
            </div>
            {acilis ? <Countdown hedef={acilis} /> : (
              <div className="grid place-items-center">
                <svg viewBox="0 0 132 104" className="w-48 opacity-90" aria-hidden="true"><path d="M10 30.5H47L28.5 51.5C44 50 53.5 60 53.5 72C53.5 86 42.5 95 29.5 95C20 95 12.5 91 8.5 84" fill="none" stroke="#fff" strokeWidth="12.5"/><path fillRule="evenodd" fill="#fff" d="M64 24H84A37 37 0 0 1 84 98H64ZM77 36.5H84A24.5 24.5 0 0 1 84 85.5H77Z"/><rect x="71" y="24" width="13" height="12.5" fill="#E8620C"/></svg>
              </div>
            )}
          </div>
        </Reveal>
      </section>

      <section className="kap mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {GUVENCE.map(([d, t, m], i) => (
          <Reveal key={t} delay={i * 80} className="zipla flex gap-4">
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
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl sm:leading-tight">Atölyemizden en sevilenler</h2>
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
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl sm:leading-tight">Dosyadan elinize, dört adımda</h2>
          </Reveal>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {SURECLER.map(([t, m], i) => (
              <Reveal as="li" key={t} delay={i * 110} className="zipla relative rounded-3xl bg-white p-6 shadow-[0_1px_0_#EDEAE5] dark:bg-lacivert-950">
                <span className="font-display text-5xl font-semibold text-nozul-500">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="soluk mt-2 leading-6">{m}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {atolye.length > 0 && (
        <section className="kap mt-24">
          <Reveal className="mb-10">
            <p className="ust-etiket">Atölyeden</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Perde arkası</h2>
          </Reveal>
          <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] md:grid-cols-4">
            {atolye.map((g, i) => (
              <Reveal key={g.id} delay={(i % 4) * 70} className={`group relative overflow-hidden rounded-3xl bg-krem ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                <img src={g.image_url} alt={g.caption || 'Atölyemizden bir kare'} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                {g.caption && <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-lacivert-800 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">{g.caption}</span>}
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {yorumlar?.length > 0 && (
        <section className="kap mt-24">
          <Reveal className="mb-10">
            <p className="ust-etiket">Müşterilerimiz ne diyor</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Gerçek siparişler, gerçek yorumlar</h2>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {yorumlar.map((r, i) => (
              <Reveal key={r.id} delay={(i % 3) * 90} className="zipla kutu flex flex-col p-6">
                <span className="text-lg tracking-widest text-nozul-500" aria-label={`5 üzerinden ${r.rating}`}>{'★'.repeat(r.rating)}</span>
                <p className="mt-3 flex-1 leading-7">“{r.comment}”</p>
                <p className="mt-5 text-sm font-bold">{r.author_name || 'Müşterimiz'}</p>
                {r.products && <Link href={`/urun/${r.products.slug}`} className="soluk text-xs hover:underline">{r.products.name}</Link>}
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="kap mt-24 grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <p className="ust-etiket">Sıkça sorulan sorular</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Aklınıza takılanlar</h2>
          <p className="soluk mt-4 max-w-sm leading-7">Cevabını bulamadığınız bir soru mu var? WhatsApp'tan yazın, hemen yanıtlayalım.</p>
          {settings.whatsapp && <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="btn-koyu mt-6">WhatsApp'tan sorun</a>}
        </Reveal>
        <div className="space-y-3">
          {sorular.map(([q, a], i) => (
            <Reveal key={q} delay={i * 40}>
              <details className="sss kutu group p-0">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 font-semibold">
                  {q}
                  <span className="sss-arti grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lacivert-50 text-lg leading-none transition-all duration-300 dark:bg-lacivert-800">+</span>
                </summary>
                <p className="sss-cevap soluk px-6 pb-6 leading-7">{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sssLd) }} />
      </section>

      {insta.length > 0 && (
        <section className="kap mt-24">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="ust-etiket">Instagram</p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">@{settings.instagram}</h2>
            </div>
            {settings.instagram && <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer" className="btn-cizgi">Bizi takip edin <Ok /></a>}
          </Reveal>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-6">
            {insta.map((g, i) => (
              <Reveal key={g.id} delay={i * 60}>
                <a href={g.link || `https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden rounded-2xl bg-krem">
                  <img src={g.image_url} alt={g.caption || 'Instagram gönderimiz'} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <span className="absolute inset-0 grid place-items-center bg-nozul-500/0 text-white opacity-0 transition-all group-hover:bg-nozul-500/60 group-hover:opacity-100">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="kap mt-24">
        <Reveal className="katman relative overflow-hidden rounded-[32px] bg-nozul-500 px-8 py-14 text-white sm:px-14 sm:py-16">
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-bold uppercase tracking-etiket text-white/80">Özel sipariş</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">Aklınızdaki parçayı biz basalım.</h2>
              <p className="mt-4 max-w-xl leading-7 text-white/90">STL dosyanızı yükleyin ya da ürüne eklemek istediğiniz yazıyı iletin. İnceleyip genellikle bir iş günü içinde fiyat teklifimizi gönderiyoruz.</p>
            </div>
            <Link href="/ozel-siparis" className="btn zipla bg-lacivert-800 px-7 py-3.5 text-white hover:bg-lacivert-900">Teklif iste <Ok /></Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
