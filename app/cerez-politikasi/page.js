import LegalPage from '@/components/LegalPage';
export const metadata = { title: 'Çerez politikası' };
export default function Page() {
  return (
    <LegalPage title="Çerez politikası">
      <p>Çerezler, ziyaret ettiğiniz internet sitesi tarafından tarayıcınıza kaydedilen küçük metin dosyalarıdır.</p>
      <h2>Kullandığımız çerezler</h2>
      <ul>
        <li><b>Zorunlu çerezler:</b> Oturumunuzun açık kalması ve güvenli giriş için kullanılır. Bu çerezler olmadan üyelik ve sipariş işlemleri çalışmaz.</li>
        <li><b>Tercih kayıtları:</b> Sepetinizdeki ürünler, açık/koyu tema seçiminiz ve çerez tercihiniz tarayıcınızın yerel depolama alanında saklanır.</li>
      </ul>
      <p>Sitemizde reklam veya üçüncü taraf takip çerezi kullanılmamaktadır. İleride analiz amaçlı çerez eklenirse bu sayfa güncellenecek ve onayınız alınacaktır.</p>
      <h2>Çerezleri yönetme</h2>
      <p>Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezleri engellemeniz durumunda giriş yapamayabilirsiniz.</p>
    </LegalPage>
  );
}
