import LegalPage from '@/components/LegalPage';
import { getSettings } from '@/lib/settings';
export const metadata = { title: 'İletişim' };
export default async function Page() {
  const s = await getSettings();
  return (
    <LegalPage title="İletişim" updated="2026">
      <p>Sipariş, özel baskı talebi veya iş birliği için bize aşağıdaki kanallardan ulaşabilirsiniz. Hafta içi 09.00-18.00 arasında yanıt veriyoruz.</p>
      <ul>
        {s.contact_email && <li>E-posta: <a href={`mailto:${s.contact_email}`} className="underline">{s.contact_email}</a></li>}
        {s.contact_phone && <li>Telefon: {s.contact_phone}</li>}
        {s.whatsapp && <li>WhatsApp: <a href={`https://wa.me/${s.whatsapp}`} className="underline" target="_blank" rel="noreferrer">Mesaj gönderin</a></li>}
        {s.address && <li>Adres: {s.address}</li>}
      </ul>
    </LegalPage>
  );
}
