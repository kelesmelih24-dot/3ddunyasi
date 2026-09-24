import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getIyzipay, promisify } from '@/lib/iyzico';
import { getSettings } from '@/lib/settings';
import { sendEmail, siparisOnayMaili, adminYeniSiparisMaili } from '@/lib/email';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function POST(req) {
  const orderId = new URL(req.url).searchParams.get('order');
  const form = await req.formData();
  const token = form.get('token');
  const admin = createAdminClient();
  const { data: order } = await admin.from('orders').select('*').eq('id', orderId).single();
  if (!order || !token) return NextResponse.redirect(`${SITE}/odeme?hata=${encodeURIComponent('Sipariş bulunamadı')}`, 303);
  if (order.payment_status === 'odendi') return NextResponse.redirect(`${SITE}/odeme/basarili?no=${order.order_no}`, 303);

  try {
    const iyzipay = await getIyzipay();
    const r = await promisify((cb) => iyzipay.checkoutForm.retrieve({ locale: 'tr', conversationId: order.id, token }, cb));
    const ok = r.status === 'success' && r.paymentStatus === 'SUCCESS' && r.basketId === order.order_no
      && Math.abs(Number(r.paidPrice) - Number(order.total)) < 0.01;
    if (!ok) throw new Error(r.errorMessage || 'Ödeme onaylanmadı');

    const { data: updated } = await admin.from('orders')
      .update({ payment_status: 'odendi', status: 'hazirlaniyor', payment_ref: r.paymentId })
      .eq('id', order.id).select().single();
    const { data: items } = await admin.from('order_items').select('*').eq('order_id', order.id);
    const settings = await getSettings();
    await Promise.all([
      sendEmail({ to: order.email, subject: `Siparişiniz alındı: ${order.order_no}`, html: siparisOnayMaili(updated, items, settings) }),
      process.env.ADMIN_EMAIL && sendEmail({ to: process.env.ADMIN_EMAIL, subject: `Yeni sipariş: ${order.order_no}`, html: adminYeniSiparisMaili(updated, items) }),
    ]);
    return NextResponse.redirect(`${SITE}/odeme/basarili?no=${order.order_no}`, 303);
  } catch (e) {
    await admin.rpc('cancel_order', { p_order: order.id });
    return NextResponse.redirect(`${SITE}/odeme?hata=${encodeURIComponent('Ödeme tamamlanamadı: ' + e.message)}`, 303);
  }
}
