export const tl = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(Number(n || 0));

export const tarih = (d) =>
  new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));

export const DURUMLAR = {
  odeme_bekleniyor: { ad: 'Ödeme bekleniyor', renk: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
  hazirlaniyor: { ad: 'Hazırlanıyor', renk: 'bg-lacivert-100 text-lacivert-800 dark:bg-lacivert-600/40 dark:text-lacivert-100' },
  kargoda: { ad: 'Kargoda', renk: 'bg-nozul-100 text-nozul-700 dark:bg-nozul-700/40 dark:text-nozul-100' },
  teslim_edildi: { ad: 'Teslim edildi', renk: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' },
  iptal: { ad: 'İptal edildi', renk: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' },
};

export const BOLUMLER = {
  baski: { ad: 'Baskı ürünleri', yol: '/baski-urunleri' },
  malzeme: { ad: 'Malzemeler', yol: '/malzemeler' },
  yazici: { ad: 'Yazıcı ve filament', yol: '/' },
};

export function slugify(s) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
  return s.replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => map[c]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function birimFiyat(product, unit) {
  if (unit === 'paket') return Number(product.pack_price ?? product.price * product.pack_size);
  return Number(product.price);
}

export const TALEP_DURUM = { yeni: 'İnceleniyor', teklif_verildi: 'Teklif verildi', onaylandi: 'Onaylandı', reddedildi: 'Reddedildi', tamamlandi: 'Tamamlandı' };
