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
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#13254A">
  <div style="background:#E8620C;padding:20px 24px;color:#fff;font-size:20px;font-weight:bold">3D Dünyası</div>
  <div style="padding:24px;border:1px solid #D5DEEE;border-top:0">
    <h2 style="margin:0 0 16px;font-size:18px">${baslik}</h2>${icerik}
    <p style="margin-top:24px;font-size:12px;color:#4D6699">Bu e-posta 3D Dünyası sipariş sisteminden otomatik gönderilmiştir.</p>
  </div>
</div>`;

const kalemTablosu = (items) => `
<table style="width:100%;border-collapse:collapse;font-size:14px">
${items.map((i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #EEF2F9">${i.name}${i.unit === 'paket' ? ' (paket)' : ''}${i.personalization ? `<br><small>Kişiselleştirme: ${i.personalization}</small>` : ''}</td><td style="text-align:right">${i.quantity} x ${tl(i.unit_price)}</td></tr>`).join('')}
</table>`;

export function siparisOnayMaili(order, items, settings) {
  const havale = order.payment_method === 'havale' && order.payment_status !== 'odendi'
    ? `<div style="background:#FFF5ED;padding:12px 16px;margin:16px 0;font-size:14px">
        <b>Havale/EFT bilgileri</b><br>${settings.bank_name}<br>${settings.account_holder}<br><b>${settings.iban}</b><br>
        Açıklama kısmına sipariş numaranızı (<b>${order.order_no}</b>) yazmayı unutmayın.</div>`
    : '';
  return cerceve(`Siparişiniz alındı: ${order.order_no}`, `
    <p>Teşekkür ederiz, siparişiniz bize ulaştı.</p>${havale}
    ${kalemTablosu(items)}
    <p style="text-align:right;font-size:14px">Ara toplam: ${tl(order.subtotal)}<br>
    ${order.discount > 0 ? `İndirimler: -${tl(order.discount)}<br>` : ''}${order.delivery_method === 'gel_al' ? 'Atölyeden gel-al' : order.delivery_method === 'elden' ? 'Elden teslim' : 'Kargo'}: ${order.shipping > 0 ? tl(order.shipping) : 'Ücretsiz'}<br>
    ${order.gift_wrap_fee > 0 ? `Hediye paketi: ${tl(order.gift_wrap_fee)}<br>` : ''}${order.points_used > 0 ? `Puan: -${tl(order.points_used)}<br>` : ''}${order.gift_card_amount > 0 ? `Hediye çeki: -${tl(order.gift_card_amount)}<br>` : ''}
    <b>Ödenecek: ${tl(order.total)}</b></p>
    <p><a href="${SITE}/hesabim/siparis/${order.id}" style="color:#EA6A12">Siparişinizi görüntüleyin</a></p>`);
}

export function kargoMaili(order, takipLinki) {
  return cerceve(`Siparişiniz kargoya verildi: ${order.order_no}`, `
    <p>Siparişiniz yola çıktı.</p>
    <p>Kargo firması: <b>${order.cargo_company || '-'}</b><br>Takip numarası: <b>${order.tracking_no || '-'}</b></p>
    <p><a href="${takipLinki || SITE + '/siparis-takip'}" style="display:inline-block;background:#E8620C;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Kargom nerede?</a></p>`);
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

export function teklifMaili(t) {
  return cerceve('Teklifiniz hazır', `
    <p>Merhaba ${t.full_name}, özel sipariş talebiniz için teklifimiz hazır.</p>
    <p style="font-size:22px;font-weight:bold;color:#E8620C">${tl(t.quote_price)}</p>
    ${t.admin_note ? `<p><b>Notumuz:</b> ${t.admin_note}</p>` : ''}
    <p>Teklifi onaylamak ve siparişe dönüştürmek için:</p>
    <p><a href="${SITE}/hesabim/talepler/${t.id}" style="display:inline-block;background:#E8620C;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Teklifi görüntüle</a></p>`);
}

export function hediyeCekiMaili(g, gonderen) {
  return cerceve('Size bir hediye çeki var 🎁', `
    <p>Merhaba ${g.recipient_name || ''}, ${gonderen ? `<b>${gonderen}</b> size` : 'size'} 3D Dünyası hediye çeki gönderdi.</p>
    ${g.message ? `<p style="background:#FFF5ED;padding:12px 16px;font-style:italic">"${g.message}"</p>` : ''}
    <p style="font-size:14px">Tutar: <b style="font-size:22px;color:#E8620C">${tl(g.initial_amount)}</b></p>
    <p style="font-size:14px">Kodunuz: <b style="font-family:monospace;font-size:20px;letter-spacing:2px">${g.code}</b></p>
    <p>Ödeme adımında "Hediye çeki kodu" alanına yazarak kullanabilirsiniz. Son kullanma: ${g.expires_at ? new Date(g.expires_at).toLocaleDateString('tr-TR') : '-'}</p>
    <p><a href="${SITE}" style="display:inline-block;background:#E8620C;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Alışverişe başla</a></p>`);
}

export function sepetHatirlatmaMaili(ad, items) {
  return cerceve('Sepetinizde ürünler sizi bekliyor', `
    <p>Merhaba ${ad || ''}, sepetinize eklediğiniz ürünleri unutmuş olabilirsiniz:</p>
    ${kalemTablosu(items.map((i) => ({ name: i.name, unit: i.unit, unit_price: i.price, quantity: i.quantity, personalization: i.personalization })))}
    <p><a href="${SITE}/sepet" style="display:inline-block;background:#E8620C;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Sepetime dön</a></p>
    <p style="font-size:12px;color:#6B7080">Stoklar sınırlı olduğundan ürünler sepetinizde ayrılmış değildir.</p>`);
}
