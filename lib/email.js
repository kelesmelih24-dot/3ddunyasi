import 'server-only';
import { tl } from '@/lib/format';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[e-posta atlandı, RESEND_API_KEY yok]', to, subject);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
    });
    if (!res.ok) console.error('Resend hatası', await res.text());
  } catch (e) {
    console.error('E-posta gönderilemedi', e);
  }
}

const cerceve = (baslik, icerik) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#14213D">
  <div style="background:#14213D;padding:20px 24px;color:#fff;font-size:20px;font-weight:bold">3ddünyası</div>
  <div style="padding:24px;border:1px solid #D5DEEE;border-top:0">
    <h2 style="margin:0 0 16px;font-size:18px">${baslik}</h2>${icerik}
    <p style="margin-top:24px;font-size:12px;color:#4D6699">Bu e-posta 3ddünyası sipariş sisteminden otomatik gönderilmiştir.</p>
  </div>
</div>`;

const kalemTablosu = (items) => `
<table style="width:100%;border-collapse:collapse;font-size:14px">
${items.map((i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #EEF2F9">${i.name}${i.unit === 'paket' ? ' (paket)' : ''}${i.personalization ? `<br><small>Kişiselleştirme: ${i.personalization}</small>` : ''}</td><td style="text-align:right">${i.quantity} x ${tl(i.unit_price)}</td></tr>`).join('')}
</table>`;

export function siparisOnayMaili(order, items, settings) {
  const havale = order.payment_method === 'havale'
    ? `<div style="background:#FFF3EA;padding:12px 16px;margin:16px 0;font-size:14px">
        <b>Havale/EFT bilgileri</b><br>${settings.bank_name}<br>${settings.account_holder}<br><b>${settings.iban}</b><br>
        Açıklama kısmına sipariş numaranızı (<b>${order.order_no}</b>) yazmayı unutmayın.</div>`
    : '';
  return cerceve(`Siparişiniz alındı: ${order.order_no}`, `
    <p>Teşekkür ederiz, siparişiniz bize ulaştı.</p>${havale}
    ${kalemTablosu(items)}
    <p style="text-align:right;font-size:14px">Ara toplam: ${tl(order.subtotal)}<br>
    ${order.discount > 0 ? `İndirim: -${tl(order.discount)}<br>` : ''}Kargo: ${order.shipping > 0 ? tl(order.shipping) : 'Ücretsiz'}<br>
    <b>Toplam: ${tl(order.total)}</b></p>
    <p><a href="${SITE}/hesabim/siparis/${order.id}" style="color:#EA6A12">Siparişinizi görüntüleyin</a></p>`);
}

export function kargoMaili(order) {
  return cerceve(`Siparişiniz kargoya verildi: ${order.order_no}`, `
    <p>Siparişiniz yola çıktı.</p>
    <p>Kargo firması: <b>${order.cargo_company || '-'}</b><br>Takip numarası: <b>${order.tracking_no || '-'}</b></p>
    <p><a href="${SITE}/siparis-takip" style="color:#EA6A12">Siparişinizi takip edin</a></p>`);
}

export function adminYeniSiparisMaili(order, items) {
  return cerceve(`Yeni sipariş: ${order.order_no}`, `
    <p>${order.email} yeni bir sipariş verdi. Ödeme: ${order.payment_method === 'havale' ? 'Havale/EFT' : 'Kredi kartı (iyzico)'}</p>
    ${kalemTablosu(items)}<p><b>Toplam: ${tl(order.total)}</b></p>
    <p><a href="${SITE}/admin/siparisler/${order.id}" style="color:#EA6A12">Admin panelinde aç</a></p>`);
}

export function adminOzelTalepMaili(talep) {
  return cerceve('Yeni özel sipariş talebi', `
    <p><b>${talep.full_name}</b> (${talep.email}) ${talep.kind === 'stl' ? 'bir STL dosyası yükledi' : 'kişiye özel yazı talep etti'}.</p>
    <p>${talep.description}</p>
    <p><a href="${SITE}/admin/ozel-talepler" style="color:#EA6A12">Talepleri görüntüle</a></p>`);
}
