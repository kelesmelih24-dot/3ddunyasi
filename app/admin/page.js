import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { tl, tarih, DURUMLAR } from '@/lib/format';

function Kart({ ad, deger, href }) {
  const ic = <><p className="soluk text-sm">{ad}</p><p className="mt-1 font-display text-2xl font-bold">{deger}</p></>;
  return href ? <Link href={href} className="kutu block p-4 hover:border-lacivert-400">{ic}</Link> : <div className="kutu p-4">{ic}</div>;
}

export default async function Dashboard() {
  const supabase = createClient();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const [{ data: orders }, { count: bekleyen }, { count: talepler }, { data: dusuk }, { count: musteri }, { data: kalemler }] = await Promise.all([
    supabase.from('orders').select('*').gte('created_at', since).order('created_at', { ascending: false }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['odeme_bekleniyor', 'hazirlaniyor']),
    supabase.from('custom_requests').select('*', { count: 'exact', head: true }).eq('status', 'yeni'),
    supabase.from('products').select('id, name, stock, section').neq('section', 'yazici').lt('stock', 5).order('stock'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('order_items').select('name, quantity, unit_price, orders!inner(created_at, payment_status)').gte('orders.created_at', since).eq('orders.payment_status', 'odendi'),
  ]);
  const odenen = (orders || []).filter((o) => o.payment_status === 'odendi');
  const ciro = odenen.reduce((s, o) => s + Number(o.total), 0);

  const gunler = [...Array(14)].map((_, i) => {
    const d = new Date(Date.now() - (13 - i) * 864e5);
    const k = d.toISOString().slice(0, 10);
    return { k, etiket: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }), t: odenen.filter((o) => o.created_at.slice(0, 10) === k).reduce((s, o) => s + Number(o.total), 0) };
  });
  const max = Math.max(1, ...gunler.map((g) => g.t));

  const urunler = {};
  (kalemler || []).forEach((k) => { urunler[k.name] = (urunler[k.name] || 0) + k.quantity * Number(k.unit_price); });
  const enCok = Object.entries(urunler).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Genel bakış</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kart ad="Son 30 gün ciro" deger={tl(ciro)} />
        <Kart ad="Son 30 gün sipariş" deger={orders?.length || 0} href="/admin/siparisler" />
        <Kart ad="İşlem bekleyen sipariş" deger={bekleyen || 0} href="/admin/siparisler?durum=bekleyen" />
        <Kart ad="Yeni özel talep" deger={talepler || 0} href="/admin/ozel-talepler" />
      </div>

      <section className="kutu p-5">
        <h2 className="font-sans font-semibold">Son 14 gün ödenmiş satışlar</h2>
        <div className="mt-4 flex h-40 items-end gap-1.5" role="img" aria-label="Günlük satış grafiği">
          {gunler.map((g) => (
            <div key={g.k} className="flex flex-1 flex-col items-center gap-1" title={`${g.etiket}: ${tl(g.t)}`}>
              <div className="w-full rounded-t bg-nozul-500" style={{ height: `${(g.t / max) * 100}%`, minHeight: g.t ? 4 : 1 }} />
              <span className="soluk hidden text-[10px] sm:block">{g.etiket}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="kutu p-5">
          <h2 className="font-sans font-semibold">En çok satanlar (30 gün)</h2>
          {enCok.length ? <ul className="mt-3 space-y-2 text-sm">{enCok.map(([n, t]) => <li key={n} className="flex justify-between"><span>{n}</span><b>{tl(t)}</b></li>)}</ul> : <p className="soluk mt-3 text-sm">Henüz ödenmiş sipariş yok.</p>}
        </section>
        <section className="kutu p-5">
          <h2 className="font-sans font-semibold">Stoğu azalan ürünler</h2>
          {dusuk?.length ? <ul className="mt-3 space-y-2 text-sm">{dusuk.map((p) => <li key={p.id} className="flex justify-between"><Link href={`/admin/urunler/${p.id}`} className="hover:underline">{p.name}</Link><b className={p.stock === 0 ? 'text-red-600' : ''}>{p.stock}</b></li>)}</ul> : <p className="soluk mt-3 text-sm">Tüm ürünlerde yeterli stok var.</p>}
        </section>
      </div>

      <section>
        <div className="mb-3 flex justify-between"><h2 className="font-sans font-semibold">Son siparişler</h2><span className="soluk text-sm">Toplam müşteri: {musteri}</span></div>
        <div className="kutu divide-y divide-lacivert-100 text-sm dark:divide-lacivert-800">
          {(orders || []).slice(0, 8).map((o) => (
            <Link key={o.id} href={`/admin/siparisler/${o.id}`} className="flex flex-wrap items-center gap-3 p-3 hover:bg-lacivert-50 dark:hover:bg-lacivert-800">
              <b className="w-32">{o.order_no}</b><span className="soluk flex-1">{tarih(o.created_at)}</span>
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${DURUMLAR[o.status].renk}`}>{DURUMLAR[o.status].ad}</span><b>{tl(o.total)}</b>
            </Link>
          ))}
          {!orders?.length && <p className="soluk p-4">Son 30 günde sipariş yok.</p>}
        </div>
      </section>
    </div>
  );
}
