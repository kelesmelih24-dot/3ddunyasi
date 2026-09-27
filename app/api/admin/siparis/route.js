import { NextResponse } from 'next/server';
import { getUserAndProfile } from '@/lib/supabase/server';
import { kargoLinki } from '@/lib/format';
import { sendEmail, kargoMaili, hediyeCekiMaili } from '@/lib/email';

export async function POST(req) {
  const { supabase, profile } = await getUserAndProfile();
  if (!['admin', 'siparis'].includes(profile?.role)) return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 });
  const { id, action, status, cargo_company, tracking_no } = await req.json();
  const { data: before } = await supabase.from('orders').select('*').eq('id', id).single();
  if (!before) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });

  if (action === 'odeme_onayla') {
    const { error } = await supabase.from('orders').update({ payment_status: 'odendi', status: 'hazirlaniyor' }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    // Ödeme onayıyla oluşan hediye çeklerini alıcılara (yoksa satın alana) gönder
    const { data: cekler } = await supabase.from('gift_cards').select('*').eq('order_id', id);
    const { data: alan } = await supabase.from('profiles').select('full_name').eq('id', before.user_id).maybeSingle();
    for (const g of cekler || []) await sendEmail({ to: g.recipient_email || before.email, subject: '3D Dünyası hediye çekiniz 🎁', html: hediyeCekiMaili(g, g.recipient_email ? alan?.full_name : null) });
    return NextResponse.json({ ok: true, cekler: cekler?.length || 0 });
  }

  if (status === 'iptal') {
    const { error } = await supabase.rpc('cancel_order', { p_order: id });
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
  }

  const { data: after, error } = await supabase.from('orders')
    .update({ status, cargo_company: cargo_company || null, tracking_no: tracking_no || null })
    .eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (status === 'kargoda' && (before.status !== 'kargoda' || before.tracking_no !== after.tracking_no))
    {
      const { data: ayar } = await supabase.from('settings').select('cargo_links').eq('id', 1).single();
      await sendEmail({ to: after.email, subject: `Siparişiniz kargoya verildi: ${after.order_no}`, html: kargoMaili(after, kargoLinki(ayar?.cargo_links, after.cargo_company, after.tracking_no)) });
    }
  return NextResponse.json({ ok: true });
}
