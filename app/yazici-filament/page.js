import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { tl } from '@/lib/format';
import NewsletterForm from '@/components/NewsletterForm';

export const metadata = { title: '3D yazıcı ve filament', description: '3D yazıcı ve filament satışımız çok yakında. PLA, PETG ve daha fazlası.' };

export default async function Page({ searchParams }) {
  const supabase = createClient();
  const { marka, kategori } = searchParams || {};
  const [{ data: kategoriler }, { data: tum }] = await Promise.all([
    supabase.from('categories').select('*').eq('section', 'yazici').order('sort'),
    supabase.from('products').select('*').eq('section', 'yazici').eq('is_active', true).order('name'),
  ]);
  const markalar = [...new Set((tum || []).map((p) => p.brand).filter(Boolean))];
  const aktifKat = kategoriler?.find((k) => k.slug === kategori);
  // Aynı gruptaki (ör. 250 g / 1 kg) ürünleri tek kartta göster
  const gruplar = {};
  for (const p of tum || []) {
    if (marka && p.brand !== marka) continue;
    if (aktifKat && p.category_id !== aktifKat.id) continue;
    const k = p.group_key || p.id;
    (gruplar[k] ??= []).push(p);
  }
  const kartlar = Object.values(gruplar);
  const renkler = (tum || []).filter((p) => p.color_hex).reduce((a, p) => (a.some((x) => x.color_hex === p.color_hex) ? a : [...a, p]), []);
  const link = (ek) => { const sp = new URLSearchParams({ ...(marka && { marka }), ...(kategori && { kategori }), ...ek }); [...sp.keys()].forEach((k) => !sp.get(k) && sp.delete(k)); return `/yazici-filament${sp.toString() ? '?' + sp : ''}`; };
  return (
    <div className="kap py-10">
      <div className="katman relative overflow-hidden rounded-[28px] bg-lacivert-800 px-6 py-12 text-white sm:px-12">
        <span className="salla absolute right-6 top-6 rounded-2xl border-[3px] border-nozul-500 bg-white px-4 py-1 font-display text-xl font-bold uppercase text-nozul-500">Yakında</span>
        <p className="text-xs font-bold uppercase tracking-etiket text-nozul-300">Yazıcı ve filament</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">Kendi atölyenizi kurun</h1>
        <p className="mt-4 max-w-xl leading-7 text-white/80">Atölyemizde kendi kullandığımız filamentleri ve yazıcıları çok yakında satışa açıyoruz. Ürünleri şimdiden inceleyin, açıldığında ilk siz haberdar olun.</p>
        <div className="mt-6 max-w-md"><NewsletterForm koyu /></div>
      </div>

      {renkler.length > 0 && (
        <div className="mt-10">
          <p className="ust-etiket">Renk kartelası</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {renkler.map((p) => (
              <Link key={p.color_hex} href={`/urun/${p.slug}`} className="group flex flex-col items-center gap-1.5" title={p.name}>
                <span className="h-12 w-12 rounded-full border-4 border-white shadow-md ring-1 ring-lacivert-100 transition-transform group-hover:scale-110" style={{ background: p.color_hex }} />
                <span className="soluk max-w-[5rem] truncate text-[11px]">{p.name.split(' - ').pop()}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-2 text-sm">
        <Link href={link({ kategori: '' })} className={!aktifKat ? 'btn-ana py-2' : 'btn-cizgi py-2'}>Tümü</Link>
        {kategoriler?.map((k) => <Link key={k.id} href={link({ kategori: k.slug })} className={aktifKat?.id === k.id ? 'btn-ana py-2' : 'btn-cizgi py-2'}>{k.name}</Link>)}
        {markalar.length > 1 && <span className="mx-2 w-px bg-lacivert-100 dark:bg-lacivert-800" />}
        {markalar.length > 1 && markalar.map((m) => <Link key={m} href={link({ marka: marka === m ? '' : m })} className={marka === m ? 'btn-koyu py-2' : 'btn-cizgi py-2'}>{m}</Link>)}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
        {kartlar.map((g) => { const p = g[0]; return (
          <Link key={p.id} href={`/urun/${p.slug}`} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-krem dark:bg-lacivert-900">
              <img src={p.images?.[0] || '/ornek/yazici.svg'} alt={p.name} loading="lazy" className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" />
              {p.color_hex && <span className="absolute bottom-3 left-3 h-8 w-8 rounded-full border-4 border-white shadow" style={{ background: p.color_hex }} />}
              <span className="absolute left-3 top-3 rounded-full bg-nozul-500 px-2.5 py-1 text-[11px] font-bold text-white">Yakında</span>
            </div>
            <h3 className="mt-4 font-sans text-[15px] font-semibold group-hover:text-nozul-600">{p.group_key ? p.name.replace(/\s*\d+\s*(k?g)\b/i, '').replace(/\s+-\s+/, ' - ') : p.name}</h3>
            {p.brand && <p className="soluk text-xs">{p.brand}</p>}
            {g.length > 1 && <p className="soluk mt-1 text-xs">{g.map((x) => x.variant_label).filter(Boolean).join(' · ')}</p>}
            {Number(p.price) > 0 && <p className="mt-1 text-sm"><span className="soluk">Beklenen fiyat:</span> <b>{tl(Math.min(...g.map((x) => Number(x.price))))}</b>{g.length > 1 && "'den başlayan"}</p>}
          </Link>
        ); })}
      </div>
      {!kartlar.length && <p className="kutu soluk mt-8 p-8 text-center">Bu filtrede ürün yok.</p>}
    </div>
  );
}
