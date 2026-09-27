import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// KVKK: kullanıcı kendi hesabını siler. Siparişler (yasal saklama) user_id'si boşaltılarak kalır.
export async function POST() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısınız' }, { status: 401 });
  const admin = createAdminClient();
  await admin.from('orders').update({ shipping_address: { silindi: true } }).eq('user_id', user.id).in('status', ['teslim_edildi', 'iptal']);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
