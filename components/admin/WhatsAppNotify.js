'use client';
import { useState } from 'react';

// Müşterinin WhatsApp'ını hazır mesajla açar; gönder tuşuna sen basarsın (ücretsiz, onay gerektirmez).
export function waNumara(tel) {
  let d = String(tel || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '9' + d; else if (d.length === 10 && d.startsWith('5')) d = '90' + d;
  return d.length >= 11 ? d : null;
}
const SITE = typeof window !== 'undefined' ? window.location.origin : '';

export function mesajlar(o) {
  const ad = (o.shipping_address?.full_name || '').split(' ')[0];
  const selam = `Merhaba${ad ? ' ' + ad : ''}, 3D Dünyası'ndan yazıyoruz.`;
  return {
    odeme: `${selam} ${o.order_no} numaralı siparişinizin ödemesi bize ulaştı, teşekkür ederiz! Siparişiniz hazırlanmaya başladı. 🧡`,
    basiliyor: `${selam} ${o.order_no} numaralı siparişiniz şu an atölyemizde basılıyor. Hazır olunca haber vereceğiz.`,
    kargo: `${selam} ${o.order_no} numaralı siparişiniz ${o.cargo_company || 'kargoya'} verildi.${o.tracking_no ? ` Takip numaranız: ${o.tracking_no}.` : ''} Sipariş durumunu buradan izleyebilirsiniz: ${SITE}/siparis-takip`,
    gelal: `${selam} ${o.order_no} numaralı siparişiniz hazır! Atölyemizden teslim alabilirsiniz. Gelmeden önce bu numaradan haber vermeniz yeterli.`,
    elden: `${selam} ${o.order_no} numaralı siparişiniz hazır. Elden teslimat için size uygun gün ve saati yazabilir misiniz?`,
    teslim: `${selam} Siparişinizi beğendiyseniz sitemizde birkaç kelimelik bir değerlendirme bırakırsanız çok seviniriz: ${SITE}/hesabim`,
  };
}
const ETIKET = { odeme: 'Ödeme alındı', basiliyor: 'Basılıyor', kargo: 'Kargoya verildi', gelal: 'Gel-al hazır', elden: 'Elden teslim günü', teslim: 'Yorum iste' };

export default function WhatsAppNotify({ order, kucuk = false }) {
  const [acik, setAcik] = useState(false);
  const no = waNumara(order.shipping_address?.phone);
  if (!no) return null;
  const m = mesajlar(order);
  const onerilen = order.status === 'kargoda' ? 'kargo' : order.status === 'teslim_edildi' ? 'teslim' : order.delivery_method === 'gel_al' ? 'gelal' : order.delivery_method === 'elden' ? 'elden' : 'odeme';
  const git = (k) => { window.open(`https://wa.me/${no}?text=${encodeURIComponent(m[k])}`, '_blank'); setAcik(false); };
  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setAcik(!acik)} className={`inline-flex items-center gap-1.5 rounded-full bg-[#25D366] font-semibold text-white ${kucuk ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 2 1.1 1 2 1.3 2.3 1.4.3.2.5.1.6 0l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" /></svg>
        WhatsApp'tan bildir
      </button>
      {acik && (
        <div className="kutu absolute left-0 z-30 mt-2 w-64 p-2 shadow-xl">
          {Object.keys(m).map((k) => (
            <button key={k} type="button" onClick={() => git(k)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-lacivert-50 dark:hover:bg-lacivert-800 ${k === onerilen ? 'font-semibold text-nozul-600' : ''}`}>
              {ETIKET[k]}{k === onerilen && ' (önerilen)'}
            </button>
          ))}
          <p className="soluk px-3 pb-1 pt-2 text-[11px]">WhatsApp mesajı hazır açılır, siz gönderirsiniz.</p>
        </div>
      )}
    </div>
  );
}
