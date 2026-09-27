'use client';
import Script from 'next/script';

// Google Analytics 4 + Google Ads, Consent Mode v2: onay verilene kadar çerez kullanılmaz.
const GA = process.env.NEXT_PUBLIC_GA_ID;
const ADS = process.env.NEXT_PUBLIC_GADS_ID;

export default function Analytics() {
  const id = GA || ADS;
  if (!id) return null;
  return (
    <>
      <Script id="gtag-onay" strategy="beforeInteractive">{`
        window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;
        var o='denied';try{if(localStorage.getItem('cerez-onay')==='tum')o='granted'}catch(e){}
        gtag('consent','default',{ad_storage:o,ad_user_data:o,ad_personalization:o,analytics_storage:o,wait_for_update:500});
        gtag('js',new Date());${GA ? `gtag('config','${GA}');` : ''}${ADS ? `gtag('config','${ADS}');` : ''}
      `}</Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
    </>
  );
}

export function onayGuncelle(kabul) {
  const d = kabul ? 'granted' : 'denied';
  window.gtag?.('consent', 'update', { ad_storage: d, ad_user_data: d, ad_personalization: d, analytics_storage: d });
}

// Satın alma dönüşümü (sipariş başarı sayfasında)
export function satinAlmaOlayi(order) {
  if (!window.gtag) return;
  const deger = Number(order.total);
  window.gtag('event', 'purchase', { transaction_id: order.order_no, value: deger, currency: 'TRY' });
  const etiket = process.env.NEXT_PUBLIC_GADS_PURCHASE_LABEL;
  if (ADS && etiket) window.gtag('event', 'conversion', { send_to: `${ADS}/${etiket}`, value: deger, currency: 'TRY', transaction_id: order.order_no });
}
