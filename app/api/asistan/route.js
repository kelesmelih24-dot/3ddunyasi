import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
const sayac = new Map(); // basit hız sınırı (IP başına dakikada 8 mesaj)
let katalogOnbellek = { zaman: 0, metin: '' };

async function katalog() {
  if (Date.now() - katalogOnbellek.zaman < 5 * 60e3) return katalogOnbellek.metin;
  const db = createAdminClient();
  const [{ data: urunler }, { data: s }] = await Promise.all([
    db.from('products').select('name, slug, section, price, compare_price, sale_ends_at, stock, sale_unit, pack_size, pack_price, allow_personalization, description, categories(name)').eq('is_active', true).limit(200),
    db.from('settings').select('*').eq('id', 1).single(),
  ]);
  const satir = (p) => `- ${p.name} | /urun/${p.slug} | ${p.section === 'yazici' ? 'YAKINDA (henüz satışta değil)' : `${p.price} TL${p.sale_unit !== 'adet' ? `, ${p.pack_size}'li paket ${p.pack_price} TL` : ''}`} | ${p.section === 'yazici' ? '' : p.stock > 0 ? `stok: ${p.stock}` : 'TÜKENDİ'}${p.allow_personalization ? ' | isim/yazı eklenebilir' : ''} | ${p.categories?.name || ''} | ${(p.description || '').slice(0, 140)}`;
  const metin = `MAĞAZA BİLGİLERİ
- Kargo: ${s.shipping_fee} TL, ${s.free_shipping_limit} TL ve üzeri ücretsiz. Ankara içi elden teslim ${s.local_delivery_fee} TL, atölyeden gel-al ücretsiz.
- Ödeme: Havale/EFT (kart ile ödeme yakında). İlk siparişe %${s.first_order_pct} indirim. Teslim edilen siparişlerde %${s.loyalty_pct} puan (1 puan = 1 TL).
- Hediye paketi: ${s.gift_wrap_fee} TL. Hediye çeki: /hediye-ceki. Kurumsal/toplu sipariş: /kurumsal.
- Özel sipariş: /ozel-siparis sayfasında STL/OBJ yüklenir, anında tahmini fiyat görülür, kesin teklifi mağaza verir.
- İade: 14 gün; kişiye özel ürünlerde sadece hasar/baskı hatasında. Sipariş takibi: /siparis-takip.
- İletişim: WhatsApp ${s.contact_phone}, ${s.contact_email}. Konum: Ankara.
ÜRÜNLER (ad | bağlantı | fiyat | stok | not | kategori | açıklama)
${(urunler || []).map(satir).join('\n')}`;
  katalogOnbellek = { zaman: Date.now(), metin };
  return metin;
}

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'Asistan kapalı' }, { status: 503 });
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  const simdi = Date.now(); const kayit = (sayac.get(ip) || []).filter((t) => simdi - t < 60e3);
  if (kayit.length >= 8) return NextResponse.json({ error: 'Çok hızlı soru soruyorsunuz, lütfen biraz bekleyin.' }, { status: 429 });
  sayac.set(ip, [...kayit, simdi]);

  const { messages } = await req.json();
  const temiz = (Array.isArray(messages) ? messages : []).slice(-12)
    .filter((m) => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 800) }));
  if (!temiz.length || temiz[temiz.length - 1].role !== 'user') return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });

  const system = `Sen 3D Dünyası adlı Türk 3D baskı e-ticaret sitesinin yardımcı asistanısın. Sadece Türkçe, kısa (en fazla 4-5 cümle), sıcak ve net yanıt ver.
Kurallar:
- Yalnızca aşağıdaki mağaza bilgileri ve ürün listesine dayan. Listede olmayan ürün, fiyat, stok veya kampanya uydurma.
- Ürün önerirken bağlantıyı markdown olarak ver: [Ürün adı](/urun/slug).
- Bilmediğin veya mağazaya özel bir durumda (sipariş durumu, özel fiyat, şikâyet) kullanıcıyı WhatsApp'a veya /siparis-takip sayfasına yönlendir.
- Aradığı ürün yoksa /ozel-siparis ile özel bastırabileceğini söyle.
- 3D baskı hakkında genel sorulara (PLA/PETG farkı, dayanım, bakım) kısa ve doğru bilgi verebilirsin.
- Mağaza dışı konularda kibarca yalnızca mağaza konularında yardımcı olabileceğini söyle.

${await katalog()}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 500, system, messages: temiz }),
    });
    const d = await r.json();
    if (!r.ok) { console.error('Asistan hatası', d); return NextResponse.json({ error: 'Asistan şu an yanıt veremiyor.' }, { status: 502 }); }
    return NextResponse.json({ text: (d.content || []).map((c) => c.text || '').join('') });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Asistan şu an yanıt veremiyor.' }, { status: 502 });
  }
}
