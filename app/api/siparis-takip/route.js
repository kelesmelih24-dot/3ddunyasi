import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req) {
  const { no, email } = await req.json();
  const { data } = await createAdminClient().from('orders')
    .select('order_no, status, total, cargo_company, tracking_no')
    .eq('order_no', String(no || '').trim().toUpperCase())
    .ilike('email', String(email || '').trim())
    .maybeSingle();
  if (!data) return NextResponse.json({ error: 'Bu bilgilerle eşleşen bir sipariş bulunamadı.' }, { status: 404 });
  return NextResponse.json(data);
}
