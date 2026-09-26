import { createClient } from '@supabase/supabase-js';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap() {
  const sabit = ['', '/baski-urunleri', '/malzemeler', '/ozel-siparis', '/siparis-takip', '/hakkimizda', '/iletisim', '/kvkk', '/mesafeli-satis-sozlesmesi', '/iade-ve-degisim', '/cerez-politikasi']
    .map((p) => ({ url: `${SITE}${p}`, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.6 }));
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data } = await supabase.from('products').select('slug, created_at').eq('is_active', true).neq('section', 'yazici');
    return [...sabit, ...(data || []).map((p) => ({ url: `${SITE}/urun/${p.slug}`, lastModified: p.created_at, changeFrequency: 'weekly', priority: 0.8 }))];
  } catch {
    return sabit;
  }
}
