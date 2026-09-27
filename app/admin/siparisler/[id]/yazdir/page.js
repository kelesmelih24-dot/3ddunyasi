import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { tl, tarih, TESLIMAT } from '@/lib/format';
import PrintButton from '@/components/admin/PrintButton';

export default async function Page({ params }) {
  const supabase = createClient();
  const { data: o } = await supabase.from('orders').select('*, order_items(*)').eq('id', params.id).single();
  if (!o) notFound();
  const s = await getSettings();
  const a = o.shipping_address || {};
  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-black print:p-0">
      <style>{`@media print { header, footer, nav, aside, .yazdirma, [aria-label="Duyurular"], a[aria-label="WhatsApp ile destek alın"] { display: none !important; } body { background: #fff !important; } @page { margin: 12mm; } }`}</style>
      <div className="yazdirma mb-6 flex gap-2"><PrintButton /></div>

      <section className="rounded-lg border-2 border-black p-5">
        <p className="text-xs font-bold uppercase tracking-widest">Kargo etiketi · {TESLIMAT[o.delivery_method]}</p>
        <div className="mt-3 grid grid-cols-2 gap-6 text-sm">
          <div><p className="text-xs text-gray-600">GÖNDEREN</p><p className="font-bold">3D Dünyası</p><p>{s.address}</p><p>{s.contact_phone}</p></div>
          <div><p className="text-xs text-gray-600">ALICI</p><p className="text-lg font-bold">{a.full_name}</p><p>{a.address}</p><p className="font-bold">{a.district} / {a.city} {a.zip}</p><p>{a.phone}</p></div>
        </div>
        <p className="mt-4 font-mono text-2xl font-bold tracking-widest">{o.order_no}</p>
      </section>

      <section className="mt-8 break-before-page">
        <div className="flex items-end justify-between border-b-2 border-black pb-2">
          <div><p className="text-2xl font-bold">3D Dünyası</p><p className="text-sm">Sipariş fişi</p></div>
          <div className="text-right text-sm"><p className="font-mono font-bold">{o.order_no}</p><p>{tarih(o.created_at)}</p></div>
        </div>
        {o.gift_wrap && <p className="mt-3 rounded border-2 border-black p-2 text-sm font-bold">🎁 HEDİYE PAKETİ · Fiyatlar pakete konmayacak{o.gift_note && <> · Not kartı: "{o.gift_note}"</>}</p>}
        <table className="mt-4 w-full text-sm">
          <thead><tr className="border-b border-black text-left"><th className="py-1.5">Ürün</th><th className="py-1.5 text-center">Adet</th>{!o.gift_wrap && <th className="py-1.5 text-right">Tutar</th>}<th className="py-1.5 text-center">✓</th></tr></thead>
          <tbody>{o.order_items.map((i) => (
            <tr key={i.id} className="border-b border-gray-300 align-top"><td className="py-2">{i.name}{i.unit === 'paket' && ' (paket)'}{i.personalization && <div className="font-bold">Yazı: {i.personalization}</div>}</td>
              <td className="py-2 text-center text-lg font-bold">{i.quantity}</td>{!o.gift_wrap && <td className="py-2 text-right">{tl(i.unit_price * i.quantity)}</td>}<td className="py-2 text-center">☐</td></tr>
          ))}</tbody>
        </table>
        {!o.gift_wrap && <p className="mt-3 text-right text-sm">Toplam: <b>{tl(o.total)}</b></p>}
        {o.note && <p className="mt-4 text-sm"><b>Müşteri notu:</b> {o.note}</p>}
        <p className="mt-8 text-center text-xs text-gray-600">Bizi tercih ettiğiniz için teşekkürler! Sorularınız için: {s.contact_phone}</p>
      </section>
    </div>
  );
}
