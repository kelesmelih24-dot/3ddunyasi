import LegalPage from '@/components/LegalPage';
import { getSettings } from '@/lib/settings';
export const metadata = { title: 'KVKK aydınlatma metni' };
export default async function Page() {
  const s = await getSettings();
  return (
    <LegalPage title="Kişisel verilerin korunması aydınlatma metni">
      <p>Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca veri sorumlusu sıfatıyla 3ddünyası tarafından, kişisel verilerinizin hangi amaçlarla ve nasıl işlendiği hakkında sizi bilgilendirmek için hazırlanmıştır.</p>
      <h2>Veri sorumlusu</h2>
      <p>[Satıcı unvanı / ad soyad], {s.address}. E-posta: {s.contact_email}</p>
      <h2>İşlenen kişisel veriler</h2>
      <ul>
        <li>Kimlik ve iletişim bilgileri: ad soyad, e-posta adresi, telefon numarası</li>
        <li>Teslimat bilgileri: teslimat adresi</li>
        <li>Müşteri işlem bilgileri: sipariş geçmişi, sepet ve favori bilgileri, yorumlar, özel sipariş talepleri ve yüklediğiniz dosyalar</li>
        <li>İşlem güvenliği bilgileri: IP adresi, oturum bilgileri</li>
      </ul>
      <p>Kart bilgileriniz sitemizde saklanmaz; ödemeler lisanslı ödeme kuruluşu iyzico altyapısında işlenir.</p>
      <h2>İşleme amaçları ve hukuki sebepler</h2>
      <p>Verileriniz; üyelik işlemlerinin yürütülmesi, siparişlerin alınması, hazırlanması ve teslim edilmesi, ödeme süreçleri, müşteri destek taleplerinin karşılanması, yasal yükümlülüklerin yerine getirilmesi amaçlarıyla KVKK 5. maddesinde yer alan sözleşmenin kurulması ve ifası, hukuki yükümlülük ve meşru menfaat hukuki sebeplerine dayanılarak işlenir.</p>
      <h2>Aktarım</h2>
      <p>Verileriniz yalnızca yukarıdaki amaçlarla sınırlı olarak kargo firmalarına, ödeme kuruluşuna, barındırma ve e-posta hizmeti sağlayıcılarına ve talep halinde yetkili kamu kurumlarına aktarılabilir. Altyapı hizmet sağlayıcılarımızın sunucuları yurt dışında bulunabilir; bu aktarım KVKK 9. madde kapsamında gerçekleştirilir.</p>
      <h2>Haklarınız</h2>
      <p>KVKK 11. madde kapsamında verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme, itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz. Başvurularınızı {s.contact_email} adresine iletebilirsiniz.</p>
    </LegalPage>
  );
}
