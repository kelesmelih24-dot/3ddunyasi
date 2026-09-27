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
        <li><b>Analiz ve reklam çerezleri (onayınıza bağlı):</b> Google Analytics ile ziyaret istatistiklerini, Google Ads ile reklamlarımızın etkinliğini ölçeriz. Bu çerezler yalnızca çerez bildiriminde "Tümünü kabul et" seçeneğini seçerseniz etkinleşir; "Sadece zorunlu" derseniz kullanılmaz.</li>
      </ul>
      <p>Tercihinizi değiştirmek için tarayıcınızdan sitemize ait çerezleri ve site verilerini silmeniz yeterlidir; bildirim yeniden gösterilir.</p>
      <h2>Çerezleri yönetme</h2>
      <p>Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezleri engellemeniz durumunda giriş yapamayabilirsiniz.</p>
    </LegalPage>
  );
}
