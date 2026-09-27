import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSettings } from '@/lib/settings';
import { sendEmail, siparisOnayMaili, adminYeniSiparisMaili } from '@/lib/email';
import { iyzicoAktif, getIyzipay, promisify } from '@/lib/iyzico';
import { telegram, esc } from '@/lib/telegram';
import { tl } from '@/lib/format';

// Yöneticiye yeni sipariş ve azalan stok bildirimi
async function siparisBildir(order, items) {
  const liste = items.map((i) => `• ${i.quantity} × ${esc(i.name)}${i.personalization ? ` (<i>${esc(i.personalization)}</i>)` : ''}`).join('\n');
  await telegram(`🛒 <b>Yeni sipariş</b> ${order.order_no}\n${esc(order.shipping_address?.full_name)} · ${order.payment_method === 'havale' ? 'Havale bekleniyor' : 'Kart'}\n${liste}\nToplam: <b>${tl(order.total)}</b>\n\n${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/siparisler/${order.id}`);
  const ids = items.map((i) => i.product_id).filter(Boolean);
  if (!ids.length) return;
  const admin = createAdminClient();
  const { data: ayar } = await admin.from('settings').select('low_stock_threshold').eq('id', 1).single();
  const { data: az } = await admin.from('products').select('name, stock').in('id', ids).lte('stock', ayar?.low_stock_threshold ?? 3);
  if (az?.length) await telegram(`⚠️ <b>Stok azaldı</b>\n${az.map((p) => `• ${esc(p.name)}: ${p.stock} adet`).join('\n')}`);
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sipariş için giriş yapmalısınız.' }, { status: 401 });

  const body = await req.json();
  if (body.payment === 'iyzico' && !iyzicoAktif())
    return NextResponse.json({ error: 'Kartla ödeme şu anda kullanılamıyor.' }, { status: 400 });

  const { data: order, error } = await supabase.rpc('place_order', {
    p_items: body.items, p_address: body.address, p_payment: body.payment,
    p_coupon: body.coupon || null, p_note: body.note || null,
    p_delivery: body.delivery || 'kargo', p_gift_wrap: !!body.gift_wrap, p_gift_note: body.gift_note || null,
    p_use_points: !!body.use_points, p_gift_code: body.gift_code || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id);

  if (order.payment_method === 'havale' || Number(order.total) === 0) {
    const settings = await getSettings();
    await Promise.all([
      sendEmail({ to: order.email, subject: `Siparişiniz alındı: ${order.order_no}`, html: siparisOnayMaili(order, items, settings) }),
      process.env.ADMIN_EMAIL && sendEmail({ to: process.env.ADMIN_EMAIL, subject: `Yeni sipariş: ${order.order_no}`, html: adminYeniSiparisMaili(order, items) }),
      siparisBildir(order, items),
    ]);
    return NextResponse.json({ order_no: order.order_no });
  }

  // iyzico ödeme formu: indirim kalemlere dağıtılır, kargo ayrı kalem olur; toplam = sipariş tutarı
  try {
    const iyzipay = await getIyzipay();
    const a = order.shipping_address;
    const ratio = order.subtotal > 0 ? (order.subtotal - order.discount) / order.subtotal : 1;
    const basket = items.map((i) => ({
      id: i.id, name: i.name.slice(0, 100), category1: '3D baskı', itemType: 'PHYSICAL',
      price: Math.round(i.unit_price * i.quantity * ratio * 100) / 100,
    }));
    if (order.shipping > 0) basket.push({ id: 'kargo', name: 'Kargo', category1: 'Kargo', itemType: 'PHYSICAL', price: Number(order.shipping) });
    const sum = basket.reduce((s, b) => s + b.price, 0);
    basket[0].price = Math.round((basket[0].price + (Number(order.total) - sum)) * 100) / 100;
    const [ad, ...soyad] = a.full_name.trim().split(' ');
    const ip = (req.headers.get('x-forwarded-for') || '85.34.78.112').split(',')[0].trim();
    const addr = { contactName: a.full_name, city: a.city, country: 'Turkey', address: `${a.address} ${a.district}/${a.city}`, zipCode: a.zip || '' };

    const result = await promisify((cb) => iyzipay.checkoutFormInitialize.create({
      locale: 'tr', conversationId: order.id, price: basket.reduce((s, b) => s + b.price, 0).toFixed(2), paidPrice: Number(order.total).toFixed(2),
      currency: 'TRY', basketId: order.order_no, paymentGroup: 'PRODUCT',
      callbackUrl: `${SITE}/api/iyzico/callback?order=${order.id}`, enabledInstallments: [1, 2, 3, 6],
      buyer: {
        id: user.id, name: ad, surname: soyad.join(' ') || ad, gsmNumber: a.phone, email: order.email,
        identityNumber: '11111111111', registrationAddress: addr.address, ip, city: a.city, country: 'Turkey', zipCode: a.zip || '',
      },
      shippingAddress: addr, billingAddress: addr,
      basketItems: basket.map((b) => ({ ...b, price: b.price.toFixed(2) })),
    }, cb));

    if (result.status !== 'success') throw new Error(result.errorMessage || 'iyzico hatası');
    await createAdminClient().from('orders').update({ payment_ref: result.token }).eq('id', order.id);
    return NextResponse.json({ order_no: order.order_no, paymentPageUrl: result.paymentPageUrl });
  } catch (e) {
    await createAdminClient().rpc('cancel_order', { p_order: order.id });
    return NextResponse.json({ error: `Ödeme başlatılamadı: ${e.message}` }, { status: 400 });
  }
}
