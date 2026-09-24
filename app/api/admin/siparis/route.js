import { NextResponse } from 'next/server';
import { getUserAndProfile } from '@/lib/supabase/server';
import { sendEmail, kargoMaili } from '@/lib/email';

export async function POST(req) {
  const { supabase, profile } = await getUserAndProfile();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 });
  const { id, action, status, cargo_company, tracking_no } = await req.json();
  const { data: before } = await supabase.from('orders').select('*').eq('id', id).single();
  if (!before) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });

  if (action === 'odeme_onayla') {
    const { error } = await supabase.from('orders').update({ payment_status: 'odendi', status: 'hazirlaniyor' }).eq('id', id);
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
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
    await sendEmail({ to: after.email, subject: `Siparişiniz kargoya verildi: ${after.order_no}`, html: kargoMaili(after) });
  return NextResponse.json({ ok: true });
}
