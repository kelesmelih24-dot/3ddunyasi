import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, adminOzelTalepMaili } from '@/lib/email';

export async function POST(req) {
  const { id } = await req.json();
  const supabase = createClient();
  const { data: talep } = await supabase.from('custom_requests').select('*').eq('id', id).single();
  if (talep && process.env.ADMIN_EMAIL)
    await sendEmail({ to: process.env.ADMIN_EMAIL, subject: 'Yeni özel sipariş talebi', html: adminOzelTalepMaili(talep) });
  return NextResponse.json({ ok: true });
}
