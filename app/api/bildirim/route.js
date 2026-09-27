import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { telegram, esc } from '@/lib/telegram';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || '';

// Kullanıcı tarafından oluşturulan kayıtlar için yöneticiye bildirim (kayıt kullanıcının kendisine ait olmalı)
export async function POST(req) {
  const { tur, id } = await req.json();
  const supabase = createClient();
  if (tur === 'soru') {
    const { data: q } = await supabase.from('product_questions').select('question, author_name, products(name)').eq('id', id).single();
    if (q) await telegram(`❓ <b>Yeni ürün sorusu</b>\n${esc(q.products?.name)}\n\n"${esc(q.question)}"\n— ${esc(q.author_name || 'Müşteri')}\n\n${SITE}/admin/sorular`);
  }
  if (tur === 'iade') {
    const { data: o } = await supabase.from('orders').select('order_no, return_requests(reason, details)').eq('id', id).single();
    const r = o?.return_requests?.[0];
    if (r) await telegram(`↩️ <b>İade talebi</b> ${o.order_no}\n${esc(r.reason)}\n${esc(r.details)}\n\n${SITE}/admin/iadeler`);
  }
  return NextResponse.json({ ok: true });
}
