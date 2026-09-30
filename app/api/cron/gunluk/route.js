import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sepetHatirlat } from '@/lib/sepetHatirlat';
import { telegram, esc } from '@/lib/telegram';

// Vercel her sabah çalıştırır: veritabanını uyanık tutar, sepet hatırlatır, Telegram'a günlük özet atar.
export async function GET(req) {
  if (process.env.CRON_SECRET && req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  const db = createAdminClient();
  const sonuc = {};
  try { sonuc.sepet = await sepetHatirlat(); } catch (e) { sonuc.sepetHata = String(e); }

  const [odeme, hazir, kuyruk, sorular, talepler, iadeler, filament, bakim, yazicilar, stok, ayar] = await Promise.all([
    db.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'odeme_bekleniyor'),
    db.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'hazirlaniyor'),
    db.from('print_jobs').select('id', { count: 'exact', head: true }).in('status', ['bekliyor', 'basiliyor']),
    db.from('product_questions').select('id', { count: 'exact', head: true }).is('answer', null),
    db.from('custom_requests').select('id', { count: 'exact', head: true }).eq('status', 'yeni'),
    db.from('return_requests').select('id', { count: 'exact', head: true }).eq('status', 'yeni'),
    db.from('filaments').select('material, color, remaining_g, low_threshold_g').eq('is_active', true),
    db.from('printer_maintenance').select('task, interval_hours, last_done_hours, printer_id'),
    db.from('printers').select('id, name, total_hours').eq('is_active', true),
    db.from('products').select('name, stock').eq('is_active', true).eq('is_for_sale', true).neq('section', 'yazici'),
    db.from('settings').select('low_stock_threshold').eq('id', 1).single(),
  ]);
  const azFilament = (filament.data || []).filter((f) => Number(f.remaining_g) <= Number(f.low_threshold_g));
  const saat = Object.fromEntries((yazicilar.data || []).map((y) => [y.id, y]));
  const bakimi = (bakim.data || []).filter((m) => saat[m.printer_id] && saat[m.printer_id].total_hours - m.last_done_hours >= m.interval_hours);
  const azStok = (stok.data || []).filter((p) => p.stock <= (ayar.data?.low_stock_threshold ?? 3));

  const satir = [
    odeme.count && `💳 Ödeme bekleyen: <b>${odeme.count}</b>`, hazir.count && `📦 Hazırlanacak sipariş: <b>${hazir.count}</b>`,
    kuyruk.count && `🖨 Kuyruktaki baskı: <b>${kuyruk.count}</b>`, talepler.count && `🧩 Yeni özel talep: <b>${talepler.count}</b>`,
    sorular.count && `❓ Yanıt bekleyen soru: <b>${sorular.count}</b>`, iadeler.count && `↩️ Yeni iade talebi: <b>${iadeler.count}</b>`,
    ...azFilament.map((f) => `🧵 Filament azaldı: ${esc(f.material)} ${esc(f.color)} (${Math.round(f.remaining_g)} g)`),
    ...bakimi.map((m) => `🔧 Bakım zamanı: ${esc(saat[m.printer_id].name)} · ${esc(m.task)}`),
    ...azStok.slice(0, 8).map((p) => `⚠️ Stok az: ${esc(p.name)} (${p.stock})`),
    sonuc.sepet && `🛒 ${sonuc.sepet} müşteriye sepet hatırlatması gönderildi`,
  ].filter(Boolean);
  if (satir.length) await telegram(`☀️ <b>Günaydın! Bugün 3D Dünyası'nda:</b>\n\n${satir.join('\n')}\n\n${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/bugun`);
  return NextResponse.json({ ok: true, ...sonuc, ozet: satir.length });
}
