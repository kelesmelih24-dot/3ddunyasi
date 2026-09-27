import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { markdown } from '@/lib/markdown';

async function getir(slug) {
  const { data } = await createClient().from('posts').select('*').eq('slug', slug).eq('is_published', true).single();
  return data;
}
export async function generateMetadata({ params }) {
  const y = await getir(params.slug);
  return y ? { title: y.title, description: y.excerpt, openGraph: { type: 'article', images: y.cover ? [y.cover] : undefined } } : {};
}
export default async function Page({ params }) {
  const y = await getir(params.slug);
  if (!y) notFound();
  const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: y.title, description: y.excerpt, image: y.cover, datePublished: y.published_at, dateModified: y.updated_at, author: { '@type': 'Organization', name: '3D Dünyası' } };
  return (
    <article className="kap max-w-3xl py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Link href="/blog" className="soluk text-sm hover:underline">← Blog</Link>
      <p className="soluk mt-6 text-sm">{new Date(y.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{y.title}</h1>
      {y.excerpt && <p className="soluk mt-4 text-lg leading-8">{y.excerpt}</p>}
      {y.cover && <img src={y.cover} alt="" className="mt-8 w-full rounded-[28px]" />}
      <div className="blog-yazi mt-10" dangerouslySetInnerHTML={{ __html: markdown(y.content) }} />
      <div className="mt-14 rounded-3xl bg-krem p-8 text-center dark:bg-lacivert-900">
        <p className="font-display text-xl font-semibold">Aklınızda bir proje mi var?</p>
        <p className="soluk mt-2">Modelinizi yükleyin, tahmini fiyatı hemen görün.</p>
        <Link href="/ozel-siparis" className="btn-ana mt-4">Özel sipariş</Link>
      </div>
    </article>
  );
}
