import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, sepetHatirlatmaMaili } from '@/lib/email';

// Vercel her gün bir kez çağırır. 24 saattir dokunulmamış, dolu ve hatırlatılmamış sepetlere e-posta atar.
export async function sepetHatirlat() {
  const admin = createAdminClient();
  const { data: ayar } = await admin.from('settings').select('cart_reminder').eq('id', 1).single();
  if (ayar && !ayar.cart_reminder) return 0;
  const once = new Date(Date.now() - 24 * 36e5).toISOString();
  const cokEski = new Date(Date.now() - 7 * 864e5).toISOString();
  const { data: sepetler } = await admin.from('carts').select('user_id, items, updated_at').is('reminded_at', null).lt('updated_at', once).gt('updated_at', cokEski).limit(100);
  let gonderilen = 0;
  for (const s of sepetler || []) {
    const urunler = (s.items || []).filter((i) => i.kind !== 'hediye_ceki');
    if (!urunler.length) continue;
    const { count } = await admin.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', s.user_id).gt('created_at', s.updated_at);
    if (!count) {
      const { data: p } = await admin.from('profiles').select('email, full_name').eq('id', s.user_id).single();
      if (p?.email) { await sendEmail({ to: p.email, subject: 'Sepetinizde ürünler sizi bekliyor', html: sepetHatirlatmaMaili(p.full_name, urunler) }); gonderilen++; }
    }
    await admin.from('carts').update({ reminded_at: new Date().toISOString() }).eq('user_id', s.user_id);
  }
  return gonderilen;
}
