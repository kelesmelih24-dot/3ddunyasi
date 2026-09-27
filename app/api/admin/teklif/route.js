import { NextResponse } from 'next/server';
import { getUserAndProfile } from '@/lib/supabase/server';
import { sendEmail, teklifMaili } from '@/lib/email';

// Yönetici teklif verdiğinde müşteriye e-posta
export async function POST(req) {
  const { supabase, profile } = await getUserAndProfile();
  if (!['admin', 'siparis'].includes(profile?.role)) return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 });
  const { id } = await req.json();
  const { data: t } = await supabase.from('custom_requests').select('*').eq('id', id).single();
  if (t?.status === 'teklif_verildi' && t.quote_price) await sendEmail({ to: t.email, subject: 'Özel sipariş teklifiniz hazır', html: teklifMaili(t) });
  return NextResponse.json({ ok: true });
}
