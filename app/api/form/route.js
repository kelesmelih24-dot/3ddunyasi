import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { robotDegil } from '@/lib/turnstile';
import { telegram, esc } from '@/lib/telegram';
import { sendEmail } from '@/lib/email';

// Herkese açık formlar (bülten, stok bildirimi, kurumsal talep): bot koruması + sunucuda kayıt
const EPOSTA = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const sayac = new Map();

export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const simdi = Date.now(); const k = (sayac.get(ip) || []).filter((t) => simdi - t < 10 * 60e3);
  if (k.length >= 10) return NextResponse.json({ error: 'Çok fazla deneme yaptınız, biraz sonra tekrar deneyin.' }, { status: 429 });
  sayac.set(ip, [...k, simdi]);

  const { tur, veri = {}, token, tuzak } = await req.json();
  if (tuzak) return NextResponse.json({ ok: true }); // gizli alanı dolduran bot: sessizce yok say
  if (!(await robotDegil(token, ip))) return NextResponse.json({ error: 'Robot doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.' }, { status: 400 });
  const db = createAdminClient();
  const email = String(veri.email || '').trim().toLowerCase();
  if (!EPOSTA.test(email)) return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin.' }, { status: 400 });

  if (tur === 'bulten') {
    const { error } = await db.from('newsletter_subscribers').insert({ email });
    if (error && error.code !== '23505') return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 400 });
    return NextResponse.json({ ok: true, zatenVar: error?.code === '23505' });
  }
  if (tur === 'stok') {
    const { error } = await db.from('stock_alerts').insert({ product_id: veri.product_id, email });
    if (error && error.code !== '23505') return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (tur === 'kurumsal') {
    const r = { company: String(veri.company || '').slice(0, 200), full_name: String(veri.full_name || '').slice(0, 120), email,
      phone: String(veri.phone || '').slice(0, 40), quantity: String(veri.quantity || '').slice(0, 60), details: String(veri.details || '').slice(0, 3000) };
    if (!r.company.trim() || !r.full_name.trim() || r.details.trim().length < 10) return NextResponse.json({ error: 'Lütfen tüm alanları doldurun.' }, { status: 400 });
    const { error } = await db.from('corporate_requests').insert(r);
    if (error) return NextResponse.json({ error: 'Gönderilemedi.' }, { status: 400 });
    await Promise.all([
      telegram(`🏢 <b>Kurumsal talep</b>: ${esc(r.company)}\n${esc(r.full_name)} · ${esc(r.email)} · ${esc(r.phone || '-')}\nAdet: ${esc(r.quantity || '-')}\n${esc(r.details)}`),
      process.env.ADMIN_EMAIL && sendEmail({ to: process.env.ADMIN_EMAIL, subject: `Kurumsal talep: ${r.company}`, html: `<p><b>${esc(r.company)}</b><br>${esc(r.full_name)} · ${esc(r.email)} · ${esc(r.phone)}<br>Adet: ${esc(r.quantity)}</p><p>${esc(r.details)}</p>` }),
    ]);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Geçersiz form' }, { status: 400 });
}
