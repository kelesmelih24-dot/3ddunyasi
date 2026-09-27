import { NextResponse } from 'next/server';
import { getUserAndProfile } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || '';

// Stoğu 0'dan yukarı çıkan ürün için "haber ver" diyenlere e-posta gönderir
export async function POST(req) {
  const { supabase, profile } = await getUserAndProfile();
  if (!['admin', 'urun'].includes(profile?.role)) return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 });
  const { productId } = await req.json();
  const { data: p } = await supabase.from('products').select('name, slug, stock, images').eq('id', productId).single();
  if (!p || p.stock <= 0) return NextResponse.json({ gonderilen: 0 });
  const { data: liste } = await supabase.from('stock_alerts').select('id, email').eq('product_id', productId).is('notified_at', null);
  for (const a of liste || []) {
    await sendEmail({
      to: a.email, subject: `${p.name} yeniden stokta!`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#13254A"><div style="background:#E8620C;color:#fff;padding:18px 22px;font-weight:bold;font-size:18px">3D Dünyası</div><div style="padding:22px;border:1px solid #EDEAE5;border-top:0"><h2 style="margin-top:0">Beklediğiniz ürün geldi</h2><p><b>${p.name}</b> yeniden stokta. Stok sınırlı, kaçırmayın.</p><p><a href="${SITE}/urun/${p.slug}" style="display:inline-block;background:#E8620C;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Ürüne git</a></p></div></div>`,
    });
  }
  if (liste?.length) await supabase.from('stock_alerts').update({ notified_at: new Date().toISOString() }).in('id', liste.map((a) => a.id));
  return NextResponse.json({ gonderilen: liste?.length || 0 });
}
