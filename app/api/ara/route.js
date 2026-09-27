import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req) {
  const q = (new URL(req.url).searchParams.get('q') || '').trim().replace(/[%_,()]/g, ' ');
  if (q.length < 2) return NextResponse.json([]);
  const { data } = await createClient().from('products')
    .select('name, slug, images, price, pack_price, pack_size, sale_unit, section, stock')
    .eq('is_active', true).neq('section', 'yazici').or(`name.ilike.%${q}%,description.ilike.%${q}%`).limit(6);
  return NextResponse.json(data || [], { headers: { 'Cache-Control': 's-maxage=30' } });
}
