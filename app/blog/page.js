import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Blog', description: '3D baskı rehberleri, ipuçları, atölyeden haberler ve proje fikirleri.' };

export default async function Page() {
  const { data: yazilar } = await createClient().from('posts').select('title, slug, excerpt, cover, published_at').eq('is_published', true).order('published_at', { ascending: false });
  const [ilk, ...diger] = yazilar || [];
  return (
    <div className="kap py-12">
      <p className="ust-etiket">Blog</p>
      <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Katman katman öğrenelim</h1>
      <p className="soluk mt-3 max-w-xl leading-7">3D baskı rehberleri, malzeme karşılaştırmaları, atölyeden haberler ve proje fikirleri.</p>
      {!ilk ? <p className="kutu soluk mt-10 p-8 text-center">Yakında ilk yazılarımız burada olacak.</p> : (
        <>
          <Link href={`/blog/${ilk.slug}`} className="group mt-10 grid overflow-hidden rounded-[28px] bg-krem md:grid-cols-2 dark:bg-lacivert-900">
            <div className="aspect-[16/10] overflow-hidden bg-nozul-100 md:aspect-auto">{ilk.cover && <img src={ilk.cover} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}</div>
            <div className="p-8 sm:p-10"><p className="soluk text-sm">{new Date(ilk.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p><h2 className="mt-2 text-3xl font-semibold group-hover:text-nozul-600">{ilk.title}</h2><p className="soluk mt-3 leading-7">{ilk.excerpt}</p><span className="mt-5 inline-block font-semibold text-nozul-600">Devamını oku →</span></div>
          </Link>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {diger.map((y) => (
              <Link key={y.slug} href={`/blog/${y.slug}`} className="group zipla block">
                <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-krem dark:bg-lacivert-900">{y.cover && <img src={y.cover} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}</div>
                <p className="soluk mt-3 text-xs">{new Date(y.published_at).toLocaleDateString('tr-TR')}</p>
                <h2 className="mt-1 font-sans text-lg font-bold group-hover:text-nozul-600">{y.title}</h2>
                <p className="soluk mt-1 line-clamp-2 text-sm">{y.excerpt}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
