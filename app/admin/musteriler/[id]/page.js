import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUserAndProfile } from '@/lib/supabase/server';
import { tl, tarih, DURUMLAR } from '@/lib/format';
import CustomerNotes from '@/components/admin/CustomerNotes';

export default async function Page({ params }) {
  const { supabase: db, profile: ben } = await getUserAndProfile();
  const [{ data: p }, { data: siparisler }, { data: adresler }, { data: notlar }, { data: talepler }] = await Promise.all([
    db.from('profiles').select('*').eq('id', params.id).single(),
    db.from('orders').select('id, order_no, created_at, status, total, order_items(name, quantity)').eq('user_id', params.id).order('created_at', { ascending: false }),
    db.from('addresses').select('*').eq('user_id', params.id),
    db.from('customer_notes').select('*').eq('customer_id', params.id).order('created_at', { ascending: false }),
    db.from('custom_requests').select('id, description, status, created_at').eq('user_id', params.id).order('created_at', { ascending: false }).limit(5),
  ]);
  if (!p) notFound();
  const gecerli = (siparisler || []).filter((o) => o.status !== 'iptal');
  const toplam = gecerli.reduce((s, o) => s + Number(o.total), 0);
  const urunSayim = {}; gecerli.forEach((o) => o.order_items.forEach((i) => { urunSayim[i.name] = (urunSayim[i.name] || 0) + i.quantity; }));
  const favori = Object.entries(urunSayim).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const tel = p.phone || adresler?.[0]?.phone;
  return (
    <div className="space-y-5">
      <Link href="/admin/musteriler" className="soluk text-sm hover:underline">← Müşteriler</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-3xl font-semibold">{p.full_name || p.email}</h1><p className="soluk">{p.email}{tel && ` · ${tel}`} · Üye: {new Date(p.created_at).toLocaleDateString('tr-TR')}</p></div>
        <div className="flex gap-2">{tel && <a href={`https://wa.me/${tel.replace(/\D/g, '').replace(/^0/, '90')}`} target="_blank" rel="noreferrer" className="btn rounded-full bg-[#25D366] text-white">WhatsApp</a>}<a href={`mailto:${p.email}`} className="btn-cizgi">E-posta</a></div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Sipariş', gecerli.length], ['Toplam harcama', tl(toplam)], ['Ortalama sepet', gecerli.length ? tl(toplam / gecerli.length) : '-'], ['Puan', Number(p.points || 0)]].map(([a, v]) => <div key={a} className="kutu p-4"><p className="soluk text-sm">{a}</p><p className="mt-1 font-display text-2xl font-semibold">{v}</p></div>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="kutu p-5"><h2 className="font-sans font-semibold">Siparişler</h2>
            <ul className="mt-3 divide-y divide-lacivert-100 text-sm dark:divide-lacivert-800">
              {(siparisler || []).map((o) => <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5"><Link href={`/admin/siparisler/${o.id}`} className="font-semibold underline">{o.order_no}</Link><span className="soluk">{tarih(o.created_at)}</span><span className={`rounded px-2 py-0.5 text-xs font-semibold ${DURUMLAR[o.status].renk}`}>{DURUMLAR[o.status].ad}</span><b>{tl(o.total)}</b></li>)}
            </ul>{!siparisler?.length && <p className="soluk mt-2 text-sm">Sipariş yok.</p>}
          </section>
          {talepler?.length > 0 && <section className="kutu p-5"><h2 className="font-sans font-semibold">Özel talepler</h2><ul className="mt-2 space-y-1 text-sm">{talepler.map((t) => <li key={t.id}><Link href="/admin/ozel-talepler" className="underline">{t.description.slice(0, 80)}</Link> <span className="soluk">· {t.status}</span></li>)}</ul></section>}
        </div>
        <div className="space-y-5">
          <CustomerNotes customerId={p.id} notlar={notlar || []} yazar={ben?.full_name || 'Yönetici'} />
          {favori.length > 0 && <section className="kutu p-5 text-sm"><h2 className="font-sans font-semibold">En çok aldıkları</h2><ul className="mt-2 space-y-1">{favori.map(([n, a]) => <li key={n}>{a} × {n}</li>)}</ul></section>}
          {adresler?.length > 0 && <section className="kutu p-5 text-sm leading-6"><h2 className="font-sans font-semibold">Adresler</h2>{adresler.map((a) => <p key={a.id} className="mt-2"><b>{a.title}</b>: {a.address}, {a.district}/{a.city}</p>)}</section>}
        </div>
      </div>
    </div>
  );
}
