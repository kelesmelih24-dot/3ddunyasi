import LegalPage from '@/components/LegalPage';
export const metadata = { title: 'Hakkımızda' };
export default function Page() {
  return (
    <LegalPage title="Hakkımızda" updated="2026">
      <p>3ddünyası, 3D baskı teknolojisiyle ürettiğimiz tasarımları ve 3D baskı meraklılarının ihtiyaç duyduğu malzemeleri bir araya getiren bir çevrim içi mağazadır.</p>
      <p>Figürlerden ev dekorasyonuna, kişiye özel anahtarlıklardan kırılan ev eşyaları için yedek parçalara kadar tüm baskı ürünlerimizi kendi atölyemizde, her siparişi tek tek kontrol ederek hazırlıyoruz.</p>
      <p>Kendi projelerini basanlar için anahtarlık halkası, mıknatıs, ısıl insert, LED ve son işlem malzemelerini de adet veya paket halinde sunuyoruz. 3D yazıcı ve filament satışımız ise çok yakında başlıyor.</p>
      <p>[Bu metni kendi hikâyenizle güncelleyebilirsiniz: atölyenizin kuruluşu, kullandığınız yazıcılar, ekibiniz.]</p>
    </LegalPage>
  );
}
