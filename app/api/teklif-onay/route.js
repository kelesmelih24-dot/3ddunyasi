import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { sendEmail, siparisOnayMaili, adminYeniSiparisMaili } from '@/lib/email';
import { telegram, esc } from '@/lib/telegram';
import { tl } from '@/lib/format';

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
  const { id, address } = await req.json();
  const { data: order, error } = await supabase.rpc('accept_quote', { p_request: id, p_address: address });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id);
  const settings = await getSettings();
  await Promise.all([
    sendEmail({ to: order.email, subject: `Siparişiniz alındı: ${order.order_no}`, html: siparisOnayMaili(order, items, settings) }),
    process.env.ADMIN_EMAIL && sendEmail({ to: process.env.ADMIN_EMAIL, subject: `Teklif onaylandı: ${order.order_no}`, html: adminYeniSiparisMaili(order, items) }),
    telegram(`✅ <b>Teklif onaylandı → sipariş</b>\n${order.order_no} · ${esc(address.full_name)}\nToplam: <b>${tl(order.total)}</b> (havale bekleniyor)`),
  ]);
  return NextResponse.json({ order_no: order.order_no });
}
