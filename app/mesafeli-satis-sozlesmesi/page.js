import LegalPage from '@/components/LegalPage';
import { getSettings } from '@/lib/settings';
export const metadata = { title: 'Mesafeli satış sözleşmesi' };
export default async function Page() {
  const s = await getSettings();
  return (
    <LegalPage title="Mesafeli satış sözleşmesi">
      <h2>1. Taraflar</h2>
      <p><b>Satıcı:</b> [Satıcı unvanı / ad soyad], [Vergi dairesi ve numarası], {s.address}, {s.contact_phone}, {s.contact_email}</p>
      <p><b>Alıcı:</b> Sipariş sırasında bilgileri girilen üye.</p>
      <h2>2. Konu</h2>
      <p>Bu sözleşme, alıcının satıcıya ait 3ddunyasi.com.tr internet sitesinden elektronik ortamda sipariş verdiği ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler.</p>
      <h2>3. Ürün, fiyat ve ödeme</h2>
      <p>Ürünlerin türü, adedi, satış fiyatı, kargo ücreti ve ödeme şekli sipariş özetinde ve alıcıya gönderilen sipariş onay e-postasında belirtildiği gibidir. Fiyatlara KDV dahildir.</p>
      <h2>4. Teslimat</h2>
      <p>Ürünler, ödemenin onaylanmasından itibaren en geç 30 gün içinde alıcının belirttiği adrese kargo ile teslim edilir. Siparişe göre üretilen ürünlerde hazırlık süresi ürün sayfasında veya sipariş sonrası bildirilir.</p>
      <h2>5. Cayma hakkı</h2>
      <p>Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeden cayma hakkını kullanabilir. Cayma bildirimi {s.contact_email} adresine yapılır. İade edilen ürünün bedeli, ürünün satıcıya ulaşmasından itibaren 14 gün içinde alıcıya iade edilir.</p>
      <h2>6. Cayma hakkının istisnaları</h2>
      <p>Mesafeli Sözleşmeler Yönetmeliği 15. maddesi gereğince, alıcının istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan ürünlerde (isim veya yazı eklenmiş ürünler, alıcının gönderdiği dosyaya göre basılan ürünler) cayma hakkı kullanılamaz.</p>
      <h2>7. Uyuşmazlıklar</h2>
      <p>Bu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığınca ilan edilen parasal sınırlar dahilinde alıcının yerleşim yerindeki Tüketici Hakem Heyetleri, bu sınırları aşan durumlarda Tüketici Mahkemeleri yetkilidir.</p>
      <p>Alıcı, siparişi onaylayarak bu sözleşmenin tüm koşullarını kabul etmiş sayılır.</p>
    </LegalPage>
  );
}
