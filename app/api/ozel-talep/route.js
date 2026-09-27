import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, adminOzelTalepMaili } from '@/lib/email';
import { telegram, esc } from '@/lib/telegram';
import { tl } from '@/lib/format';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || '';

export async function POST(req) {
  const { id } = await req.json();
  const supabase = createClient();
  const { data: t } = await supabase.from('custom_requests').select('*').eq('id', id).single();
  if (t) {
    await Promise.all([
      process.env.ADMIN_EMAIL && sendEmail({ to: process.env.ADMIN_EMAIL, subject: 'Yeni özel sipariş talebi', html: adminOzelTalepMaili(t) }),
      telegram(`🧩 <b>Yeni özel sipariş talebi</b>\n${esc(t.full_name)} · ${esc(t.email)}\n${esc(t.description)}\n${[t.material, t.color, t.infill && '%' + t.infill, t.dims, t.quantity + ' adet'].filter(Boolean).map(esc).join(' · ')}${t.estimate_price ? `\nTahmini: <b>${tl(t.estimate_price)}</b>` : ''}\n\n${SITE}/admin/ozel-talepler`),
    ]);
  }
  return NextResponse.json({ ok: true });
}
