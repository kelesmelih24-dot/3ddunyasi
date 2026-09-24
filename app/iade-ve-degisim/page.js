import LegalPage from '@/components/LegalPage';
import { getSettings } from '@/lib/settings';
export const metadata = { title: 'İade ve değişim' };
export default async function Page() {
  const s = await getSettings();
  return (
    <LegalPage title="İade ve değişim koşulları">
      <h2>İade süresi</h2>
      <p>Ürünü teslim aldığınız tarihten itibaren 14 gün içinde iade talebinde bulunabilirsiniz.</p>
      <h2>İade edilemeyen ürünler</h2>
      <ul>
        <li>İsim, yazı veya kişisel bilgi eklenerek hazırlanan ürünler</li>
        <li>Gönderdiğiniz 3D model dosyasına göre özel olarak basılan ürünler</li>
        <li>Ambalajı açılmış yapıştırıcı, boya gibi hijyen veya kullanım nedeniyle yeniden satılamayacak malzemeler</li>
      </ul>
      <h2>İade nasıl yapılır</h2>
      <p>Sipariş numaranızla birlikte {s.contact_email} adresine veya WhatsApp hattımıza yazın. Size iade kargo bilgilerini ileteceğiz. Ürünü kullanılmamış ve orijinal ambalajıyla göndermeniz gerekir.</p>
      <h2>Hasarlı veya hatalı ürün</h2>
      <p>Kargo sırasında zarar gören veya hatalı basılmış ürünler için teslimattan sonraki 3 gün içinde fotoğrafla birlikte bize ulaşın. Ürünü ücretsiz olarak yeniden basıp gönderiyoruz veya ücret iadesi yapıyoruz.</p>
      <h2>Ücret iadesi</h2>
      <p>Onaylanan iadelerde ödeme, ürün elimize ulaştıktan sonra 14 gün içinde kartla ödemelerde kartınıza, havale ödemelerinde bildirdiğiniz IBAN'a yapılır.</p>
    </LegalPage>
  );
}
