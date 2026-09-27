import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { tl } from '@/lib/format';
import ExcelExport from '@/components/admin/ExcelExport';

const ARALIK = { 7: 'Son 7 gün', 30: 'Son 30 gün', 90: 'Son 3 ay', 365: 'Son 1 yıl' };

export default async function Page({ searchParams }) {
  const gun = Number(searchParams?.gun) in ARALIK ? Number(searchParams.gun) : 30;
  const supabase = createClient();
  const since = new Date(Date.now() - gun * 864e5).toISOString();
  const { data: kalemler } = await supabase.from('order_items')
    .select('name, product_id, quantity, unit_price, unit_cost, kind, orders!inner(created_at, payment_status, status, discount, subtotal)')
    .gte('orders.created_at', since).eq('orders.payment_status', 'odendi').neq('orders.status', 'iptal');
  const urunler = {};
  let ciro = 0, maliyet = 0, maliyetsiz = 0;
  for (const k of kalemler || []) {
    if (k.kind === 'hediye_ceki') continue;
    const oran = k.orders.subtotal > 0 ? 1 - k.orders.discount / k.orders.subtotal : 1; // indirimi kalemlere dağıt
    const gelir = k.unit_price * k.quantity * oran;
    const m = k.unit_cost != null ? k.unit_cost * k.quantity : null;
    ciro += gelir; if (m != null) maliyet += m; else maliyetsiz += gelir;
    const u = (urunler[k.name] ??= { Ürün: k.name, Adet: 0, Ciro: 0, Maliyet: 0, Kâr: 0, maliyetEksik: false });
    u.Adet += k.quantity; u.Ciro += gelir; if (m != null) { u.Maliyet += m; u.Kâr += gelir - m; } else u.maliyetEksik = true;
  }
  const liste = Object.values(urunler).sort((a, b) => b.Kâr - a.Kâr);
  const kar = ciro - maliyetsiz - maliyet;
  const Kart = ({ ad, deger, alt }) => <div className="kutu p-4"><p className="soluk text-sm">{ad}</p><p className="mt-1 font-display text-2xl font-semibold">{deger}</p>{alt && <p className="soluk text-xs">{alt}</p>}</div>;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Kâr ve raporlar</h1>
        <ExcelExport dosya={`kar-raporu-${gun}gun`} satirlar={liste.map(({ maliyetEksik, ...r }) => ({ ...r, Ciro: +r.Ciro.toFixed(2), Maliyet: +r.Maliyet.toFixed(2), Kâr: +r.Kâr.toFixed(2), Not: maliyetEksik ? 'Maliyet girilmemiş' : '' }))} />
      </div>
      <div className="flex flex-wrap gap-2">{Object.entries(ARALIK).map(([g, t]) => <Link key={g} href={`/admin/raporlar?gun=${g}`} className={Number(g) === gun ? 'btn-ana py-2' : 'btn-cizgi py-2'}>{t}</Link>)}</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kart ad="Ciro (indirimler düşülmüş)" deger={tl(ciro)} />
        <Kart ad="Üretim maliyeti" deger={tl(maliyet)} />
        <Kart ad="Brüt kâr" deger={tl(kar)} alt={maliyetsiz > 0 ? `${tl(maliyetsiz)} ciro maliyetsiz ürünlerden, hesaba katılmadı` : null} />
        <Kart ad="Kâr marjı" deger={ciro - maliyetsiz > 0 ? `%${Math.round((kar / (ciro - maliyetsiz)) * 100)}` : '-'} />
      </div>
      <p className="soluk text-sm">Sadece ödemesi alınmış, iptal edilmemiş siparişler. Kargo ve hediye paketi gelir/gideri dahil değildir. Maliyetler sipariş anındaki ürün maliyetinden alınır.</p>
      <div className="kutu overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="soluk border-b border-lacivert-100 dark:border-lacivert-800"><tr><th className="p-3">Ürün</th><th className="p-3">Adet</th><th className="p-3">Ciro</th><th className="p-3">Maliyet</th><th className="p-3">Kâr</th></tr></thead>
          <tbody className="divide-y divide-lacivert-100 dark:divide-lacivert-800">
            {liste.map((r) => (
              <tr key={r.Ürün}><td className="p-3 font-semibold">{r.Ürün}</td><td className="p-3">{r.Adet}</td><td className="p-3">{tl(r.Ciro)}</td>
                <td className="p-3">{r.maliyetEksik && !r.Maliyet ? <span className="text-nozul-600">Maliyet girilmemiş</span> : tl(r.Maliyet)}</td>
                <td className={`p-3 font-bold ${r.Kâr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{r.maliyetEksik && !r.Maliyet ? '-' : tl(r.Kâr)}</td></tr>
            ))}
          </tbody>
        </table>
        {!liste.length && <p className="soluk p-6 text-center">Bu dönemde ödenmiş sipariş yok.</p>}
      </div>
    </div>
  );
}
