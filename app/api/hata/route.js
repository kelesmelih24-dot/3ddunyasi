import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { telegram, esc } from '@/lib/telegram';

// Tarayıcıdaki hataları kaydeder; aynı hata tekrarlanırsa sayacı artırır, ilk kez görülünce Telegram'a haber verir.
const son = new Map();
export async function POST(req) {
  try {
    const { message, url, stack } = await req.json();
    const m = String(message || '').slice(0, 500), u = String(url || '').split('?')[0].slice(0, 300);
    if (!m || /ResizeObserver|Script error|extension|chrome-extension|Loading chunk/i.test(m + stack)) return NextResponse.json({ ok: true });
    const anahtar = m + u; if (Date.now() - (son.get(anahtar) || 0) < 60e3) return NextResponse.json({ ok: true });
    son.set(anahtar, Date.now());
    const db = createAdminClient();
    const { data: eski } = await db.from('error_logs').select('id, count').eq('message', m).eq('url', u).maybeSingle();
    if (eski) await db.from('error_logs').update({ count: eski.count + 1, last_seen: new Date().toISOString() }).eq('id', eski.id);
    else {
      await db.from('error_logs').insert({ message: m, url: u, stack: String(stack || '').slice(0, 3000), user_agent: (req.headers.get('user-agent') || '').slice(0, 300) });
      await telegram(`🐞 <b>Sitede yeni hata</b>\n${esc(u)}\n<code>${esc(m.slice(0, 300))}</code>\n\n${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/hatalar`);
    }
  } catch {}
  return NextResponse.json({ ok: true });
}
