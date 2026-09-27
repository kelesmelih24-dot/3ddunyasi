'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCart } from './CartProvider';
import { birimFiyat } from '@/lib/format';

// Müşteri sipariş sayfası: tekrar sipariş, fatura indirme, iade talebi
export default function OrderActions({ order, items, iadeVar, iadeUygun }) {
  const router = useRouter();
  const { add } = useCart();
  const [mesaj, setMesaj] = useState('');
  const [iadeAcik, setIadeAcik] = useState(false);
  const [iade, setIade] = useState({ reason: 'Ürün hasarlı geldi', details: '', iban: '' });

  async function tekrar() {
    const ids = items.filter((i) => i.product_id && i.kind === 'urun').map((i) => i.product_id);
    if (!ids.length) return setMesaj('Bu siparişteki ürünler tekrar sepete eklenemiyor.');
    const { data: urunler } = await createClient().from('products').select('*').in('id', ids).eq('is_active', true);
    let eklenen = 0;
    for (const i of items) {
      const p = urunler?.find((u) => u.id === i.product_id);
      if (!p || p.stock <= 0) continue;
      add({ product_id: p.id, slug: p.slug, name: p.name, image: p.images?.[0], unit: i.unit, pack_size: p.pack_size, price: birimFiyat(p, i.unit), quantity: i.quantity, personalization: i.personalization });
      eklenen++;
    }
    if (!eklenen) return setMesaj('Bu siparişteki ürünler şu an stokta değil.');
    router.push('/sepet');
  }
  async function fatura() {
    const { data } = await createClient().storage.from('faturalar').createSignedUrl(order.invoice_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank'); else setMesaj('Fatura açılamadı.');
  }
  async function iadeGonder(e) {
    e.preventDefault();
    if (iade.details.trim().length < 10) return setMesaj('Lütfen iade nedenini biraz açıklayın.');
    const { data: { user } } = await createClient().auth.getUser();
    const { error } = await createClient().from('return_requests').insert({ order_id: order.id, user_id: user.id, ...iade });
    if (error) return setMesaj('İade talebi oluşturulamadı.');
    fetch('/api/bildirim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tur: 'iade', id: order.id }) });
    setIadeAcik(false); router.refresh();
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        <button onClick={tekrar} className="btn-koyu">Tekrar sipariş ver</button>
        {order.invoice_path && <button onClick={fatura} className="btn-cizgi">Faturayı indir</button>}
        {iadeUygun && !iadeVar && <button onClick={() => setIadeAcik(!iadeAcik)} className="btn-cizgi">İade talebi oluştur</button>}
      </div>
      {mesaj && <p className="hata">{mesaj}</p>}
      {iadeAcik && (
        <form onSubmit={iadeGonder} className="kutu space-y-3 p-5">
          <label className="etiket" htmlFor="ir">İade nedeni</label>
          <select id="ir" className="girdi" value={iade.reason} onChange={(e) => setIade({ ...iade, reason: e.target.value })}>
            {['Ürün hasarlı geldi', 'Yanlış ürün geldi', 'Ürün beklentimi karşılamadı', 'Baskı hatası var', 'Diğer'].map((r) => <option key={r}>{r}</option>)}
          </select>
          <textarea rows={3} className="girdi" value={iade.details} onChange={(e) => setIade({ ...iade, details: e.target.value })} placeholder="Hangi ürün, sorun nedir? Hasarlıysa fotoğrafları WhatsApp'tan iletebilirsiniz." aria-label="Açıklama" />
          <input className="girdi" value={iade.iban} onChange={(e) => setIade({ ...iade, iban: e.target.value })} placeholder="İade için IBAN (havale ödemelerinde)" aria-label="IBAN" />
          <p className="soluk text-xs">Kişiye özel üretilen ürünlerde sadece hasar veya baskı hatası durumunda iade yapılır.</p>
          <button className="btn-ana">Talebi gönder</button>
        </form>
      )}
    </div>
  );
}
