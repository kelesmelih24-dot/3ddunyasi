import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { kargoLinki } from '@/lib/format';

export async function POST(req) {
  const { no, email } = await req.json();
  const { data } = await createAdminClient().from('orders')
    .select('order_no, status, total, cargo_company, tracking_no, delivery_method')
    .eq('order_no', String(no || '').trim().toUpperCase())
    .ilike('email', String(email || '').trim())
    .maybeSingle();
  if (!data) return NextResponse.json({ error: 'Bu bilgilerle eşleşen bir sipariş bulunamadı.' }, { status: 404 });
  const { data: ayar } = await createAdminClient().from('settings').select('cargo_links').eq('id', 1).single();
  return NextResponse.json({ ...data, takip: kargoLinki(ayar?.cargo_links, data.cargo_company, data.tracking_no) });
}
