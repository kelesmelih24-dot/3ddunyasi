import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { telegram, esc } from '@/lib/telegram';
import { sendEmail } from '@/lib/email';

export async function POST(req) {
  const { id } = await req.json();
  const { data: k } = await createAdminClient().from('corporate_requests').select('*').eq('id', id).gt('created_at', new Date(Date.now() - 10 * 60e3).toISOString()).single();
  if (k) {
    const metin = `🏢 Kurumsal talep: ${k.company}\n${k.full_name} · ${k.email} · ${k.phone || '-'}\nAdet: ${k.quantity || '-'}\n${k.details}`;
    await Promise.all([
      telegram(`🏢 <b>Kurumsal talep</b>: ${esc(k.company)}\n${esc(k.full_name)} · ${esc(k.email)} · ${esc(k.phone || '-')}\nAdet: ${esc(k.quantity || '-')}\n${esc(k.details)}`),
      process.env.ADMIN_EMAIL && sendEmail({ to: process.env.ADMIN_EMAIL, subject: `Kurumsal talep: ${k.company}`, html: `<pre style="font-family:Arial">${esc(metin)}</pre>` }),
    ]);
  }
  return NextResponse.json({ ok: true });
}
