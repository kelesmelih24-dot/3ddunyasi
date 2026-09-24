# 3ddünyası

Next.js 14 + Tailwind + Supabase ile yazılmış e-ticaret sitesi. GitHub'a yüklenip Vercel'de yayınlanır.

## Neler var

- Üç bölümlü açılış: baskı ürünleri, 3D baskı malzemeleri, yazıcı ve filament (yakında)
- Kategori, arama, sıralama ve stok filtresi
- Kişiselleştirilebilir ürünler (isim/yazı ekleme), adet ve paket satışı
- STL/3MF/OBJ yükleyerek özel sipariş talebi ve teklif süreci
- Zorunlu üyelik: e-posta/şifre ve Google ile giriş, şifre sıfırlama
- Sepet, kupon, belirli tutar üstü ücretsiz kargo, havale/EFT ve iyzico ile ödeme
- Sipariş takibi, favoriler, yorum ve puan (sadece teslim alınan ürünlere)
- E-postalar: sipariş onayı, kargoya verildi, size yeni sipariş ve yeni talep bildirimi
- Admin paneli: genel bakış ve satış grafiği, sipariş yönetimi, ürün/stok, kategoriler, kuponlar, özel talepler, müşteriler, yorumlar, mağaza ayarları
- KVKK, mesafeli satış, iade, çerez, hakkımızda ve iletişim sayfaları
- Açık/koyu tema (kullanıcı seçer), WhatsApp destek düğmesi, çerez bildirimi

Fiyat, stok ve kupon hesabı veritabanında (`place_order` fonksiyonu) yapılır; tarayıcıdan fiyat değiştirilemez.

---

## Kurulum (yaklaşık 45 dakika)

### 1. Supabase projesi

1. [supabase.com](https://supabase.com) → **New project**. Bölge olarak **Central EU (Frankfurt)** seçin.
2. Sol menü **SQL Editor** → **New query** → `supabase/schema.sql` dosyasının tamamını yapıştırın → **Run**.
3. Yeni bir sorgu açın, `supabase/seed.sql` dosyasını yapıştırıp **Run** (örnek ürünler ve `HOSGELDIN10` kuponu).
4. **Project Settings → API** sayfasından şu üç değeri not alın: Project URL, `anon` key, `service_role` key.

### 2. Kodu GitHub'a yükleme

```bash
cd 3ddunyasi
git init
git add .
git commit -m "3ddünyası ilk sürüm"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/3ddunyasi.git
git push -u origin main
```

(Önce GitHub'da boş bir `3ddunyasi` deposu oluşturun. `.env` dosyaları `.gitignore` sayesinde yüklenmez.)

### 3. Vercel'de yayınlama

1. [vercel.com](https://vercel.com) → **Add New → Project** → GitHub deponuzu seçin.
2. **Environment Variables** bölümüne `.env.example` içindeki değişkenleri girin. İlk etapta şu dördü yeterli:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL=https://3ddunyasi.com`
3. **Deploy**.
4. **Settings → Domains** → `3ddunyasi.com` ve `www.3ddunyasi.com` ekleyin. Vercel'in gösterdiği DNS kayıtlarını alan adını aldığınız firmanın panelinde girin.

### 4. Supabase giriş ayarları

**Authentication → URL Configuration**
- Site URL: `https://3ddunyasi.com`
- Redirect URLs: `https://3ddunyasi.com/**` ve yerel test için `http://localhost:3000/**`

**Google ile giriş**
1. [Google Cloud Console](https://console.cloud.google.com) → yeni proje → **APIs & Services → OAuth consent screen** (External) doldurun.
2. **Credentials → Create credentials → OAuth client ID → Web application**.
   Authorized redirect URI: `https://PROJE_KODUNUZ.supabase.co/auth/v1/callback`
3. Çıkan Client ID ve Secret'ı Supabase **Authentication → Providers → Google** içine girip açın.

**E-posta şablonları (isteğe bağlı):** Authentication → Email Templates bölümünden doğrulama e-postalarını Türkçeleştirin.

### 5. Kendinizi admin yapma

Sitede normal şekilde üye olun, sonra Supabase SQL Editor'da:

```sql
update public.profiles set role = 'admin' where email = 'sizin@epostaniz.com';
```

Sayfayı yenileyince hesap menüsünde **Yönetim paneli** görünür. İlk iş **Mağaza ayarları**ndan IBAN, WhatsApp, telefon ve kargo ücretlerini girin.

### 6. E-posta gönderimi (Resend)

1. [resend.com](https://resend.com) → hesap açın → **Domains** → `3ddunyasi.com` ekleyip DNS kayıtlarını girin.
2. API key oluşturun. Vercel'e `RESEND_API_KEY`, `EMAIL_FROM` ve `ADMIN_EMAIL` ekleyip yeniden deploy edin.

Anahtar girilmezse site çalışır, sadece e-posta gönderilmez.

### 7. iyzico (sözleşme sonrası)

1. Önce [sandbox-merchant.iyzipay.com](https://sandbox-merchant.iyzipay.com) üzerinden test anahtarları alın.
2. Vercel'e `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL=https://sandbox-api.iyzipay.com` ekleyin; ödeme sayfasında kart seçeneği kendiliğinden belirir.
3. Test kartı: `5528 7900 0000 0008`, son kullanma ileri bir tarih, CVC `123`.
4. Canlıya geçerken anahtarları canlı anahtarlarla ve adresi `https://api.iyzipay.com` ile değiştirin.

Anahtarlar boşken sadece havale/EFT seçeneği görünür.

---

## Bilgisayarınızda çalıştırma

```bash
npm install
cp .env.example .env.local   # değerleri doldurun
npm run dev                  # http://localhost:3000
```

## Sık yapılacak işler

- **Ürün eklemek:** Yönetim paneli → Ürünler ve stok → Yeni ürün ekle. Görselleri buradan yüklersiniz.
- **Havale ödemesini onaylamak:** Siparişler → sipariş → "Havale ödemesini onayla".
- **Kargoya vermek:** Siparişte kargo firması ve takip numarasını girip durumu "Kargoda" yapın; müşteriye e-posta gider.
- **Yazıcı ve filament bölümünü açmak:** `app/page.js` içinde üçüncü panelin `href: null` değerini bir sayfa yoluyla değiştirin ve `place_order` fonksiyonundaki `yazici` kontrolünü kaldırın.
- **Açılış görselleri:** `public/panel/` içindeki SVG'leri kendi fotoğraflarınızla (aynı adla veya `app/page.js`'de yolu değiştirerek) değiştirebilirsiniz.

## Önemli notlar

- **Yasal metinler şablondur.** `[Satıcı unvanı]` gibi alanları doldurun ve yayına almadan önce bir avukata veya mali müşavire kontrol ettirin.
- **Şirket ve fatura:** iyzico ve diğer ödeme kuruluşları sözleşme için şahıs veya limited şirket ister; düzenli satışta fatura kesme yükümlülüğü de doğar. Bir mali müşavirle görüşüp şirketinizi kurduğunuzda e-fatura entegrasyonu (ör. Paraşüt) sonradan eklenebilir.
- **`SUPABASE_SERVICE_ROLE_KEY`** tüm verilere erişir; yalnızca Vercel ortam değişkenlerinde tutun, kimseyle paylaşmayın.

## Klasör yapısı

```
app/                 sayfalar ve API uçları
  admin/             yönetim paneli
  api/               sipariş, iyzico dönüşü, takip, bildirimler
components/          arayüz bileşenleri
lib/                 Supabase bağlantıları, e-posta, iyzico, yardımcılar
public/              logo, açılış ve örnek ürün görselleri
supabase/            schema.sql ve seed.sql
```
