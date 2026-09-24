import { createClient } from '@/lib/supabase/server';
import { tl } from '@/lib/format';

export default async function Page() {
  const supabase = createClient();
  const [{ data: profiles }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('orders').select('user_id, total, status'),
  ]);
  const stats = {};
  (orders || []).filter((o) => o.status !== 'iptal').forEach((o) => {
    stats[o.user_id] ??= { n: 0, t: 0 };
    stats[o.user_id].n++; stats[o.user_id].t += Number(o.total);
  });
  return (
    <div>
      <h1 className="mb-5 text-3xl font-bold">Müşteriler</h1>
      <div className="kutu overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="soluk border-b border-lacivert-100 dark:border-lacivert-800"><tr><th className="p-3">Ad soyad</th><th className="p-3">E-posta</th><th className="p-3">Telefon</th><th className="p-3">Kayıt</th><th className="p-3">Sipariş</th><th className="p-3 text-right">Toplam harcama</th></tr></thead>
          <tbody className="divide-y divide-lacivert-100 dark:divide-lacivert-800">
            {(profiles || []).map((p) => (
              <tr key={p.id}>
                <td className="p-3 font-semibold">{p.full_name || '-'}{p.role === 'admin' && <span className="ml-2 rounded bg-nozul-100 px-1.5 text-xs text-nozul-700">admin</span>}</td>
                <td className="p-3">{p.email}</td><td className="p-3">{p.phone || '-'}</td>
                <td className="p-3">{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                <td className="p-3">{stats[p.id]?.n || 0}</td><td className="p-3 text-right">{tl(stats[p.id]?.t || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
