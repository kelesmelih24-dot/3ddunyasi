-- =====================================================================
-- Örnek veriler: schema.sql'den SONRA çalıştırın.
-- Görseller /public/ornek klasöründeki çizimlerdir, admin panelinden
-- gerçek fotoğraflarınızla değiştirebilirsiniz.
-- =====================================================================
insert into public.categories (section, name, slug, sort) values
 ('baski','Figür ve heykel','figur-heykel',1),
 ('baski','Ev dekorasyon','ev-dekorasyon',2),
 ('baski','Anahtarlık','anahtarlik',3),
 ('baski','Oyuncak','oyuncak',4),
 ('baski','Masaüstü düzenleyici','masaustu-duzenleyici',5),
 ('baski','Yedek parça','yedek-parca',6),
 ('malzeme','Anahtarlık halkası','anahtarlik-halkasi',1),
 ('malzeme','Mıknatıs','miknatis',2),
 ('malzeme','Vida, somun ve insert','vida-somun-insert',3),
 ('malzeme','LED ve elektronik','led-elektronik',4),
 ('malzeme','Boya ve zımpara','boya-zimpara',5),
 ('malzeme','Yapıştırıcı','yapistirici',6),
 ('yazici','3D yazıcılar','yazicilar',1),
 ('yazici','Filamentler','filamentler',2)
on conflict (slug) do nothing;

insert into public.products (section, category_id, name, slug, description, price, compare_price, stock, images, sale_unit, pack_size, pack_price, allow_personalization, is_featured)
select v.section, c.id, v.name, v.slug, v.description, v.price, v.compare_price, v.stock, array[v.image], v.sale_unit, v.pack_size, v.pack_price, v.pers, v.feat
from (values
 ('baski','figur-heykel','Geometrik aslan büstü','geometrik-aslan-bustu','Düşük poligon tasarımlı, 18 cm yüksekliğinde masaüstü büst. Mat PLA ile 0,16 mm katman kalınlığında basılır.',449.90,529.90,12,'/ornek/figur.svg','adet',1,null::numeric,false,true),
 ('baski','figur-heykel','Düşünen adam mini heykel','dusunen-adam-mini','Klasik heykelin 12 cm yüksekliğinde, taş dokulu filamentle basılmış yorumu.',289.90,null,8,'/ornek/figur.svg','adet',1,null,false,false),
 ('baski','ev-dekorasyon','Spiral vazo','spiral-vazo','Tek duvar tekniğiyle basılmış 22 cm spiral vazo. Kuru çiçek için uygundur, su tutmaz.',219.90,null,20,'/ornek/dekor.svg','adet',1,null,false,true),
 ('baski','ev-dekorasyon','Dalgalı saksı','dalgali-saksi','Drenaj delikli, altlıklı 12 cm saksı. Sukulent ve kaktüsler için.',189.90,null,15,'/ornek/dekor.svg','adet',1,null,false,false),
 ('baski','anahtarlik','İsimli anahtarlık','isimli-anahtarlik','İstediğiniz isim veya kısa yazıyla basılan çift renkli anahtarlık. Halka dahildir.',79.90,null,100,'/ornek/anahtarlik.svg','adet',1,null,true,true),
 ('baski','anahtarlik','Plaka anahtarlık','plaka-anahtarlik','Aracınızın plakasıyla basılan, gerçek plaka görünümlü anahtarlık.',99.90,null,100,'/ornek/anahtarlik.svg','adet',1,null,true,false),
 ('baski','oyuncak','Eklemli ejderha','eklemli-ejderha','Tek parça basılan, montaj gerektirmeyen hareketli ejderha. 30 cm uzunluk.',259.90,299.90,18,'/ornek/oyuncak.svg','adet',1,null,false,true),
 ('baski','oyuncak','Fidget küp','fidget-kup','Dönen katmanlı stres küpü. Masa başında oyalanmak için.',119.90,null,25,'/ornek/oyuncak.svg','adet',1,null,false,false),
 ('baski','masaustu-duzenleyici','Modüler kalemlik','moduler-kalemlik','Birbirine geçen üç bölmeli kalemlik. İsim eklenebilir.',169.90,null,30,'/ornek/masaustu.svg','adet',1,null,true,false),
 ('baski','masaustu-duzenleyici','Kulaklık standı','kulaklik-standi','Kaymaz tabanlı, kablo yuvalı kulaklık standı.',239.90,null,14,'/ornek/masaustu.svg','adet',1,null,false,false),
 ('baski','yedek-parca','Çamaşır makinesi kapak kolu','camasir-kapak-kolu','PETG ile basılmış dayanıklı yedek kapak kolu. Siparişte model bilgisini not olarak yazın.',149.90,null,10,'/ornek/yedek.svg','adet',1,null,false,false),
 ('baski','yedek-parca','Dolap menteşe takozu','dolap-mentese-takozu','Kırılan plastik menteşe takozlarının yerine, 4 adetlik set.',89.90,null,40,'/ornek/yedek.svg','adet',1,null,false,false),
 ('malzeme','anahtarlik-halkasi','Anahtarlık halkası 25 mm','anahtarlik-halkasi-25mm','Nikel kaplama çelik halka, zincirli. Anahtarlık üretimi için.',4.50,null,2000,'/ornek/halka.svg','ikisi',50,179.90,false,true),
 ('malzeme','anahtarlik-halkasi','Karabina anahtarlık kancası','karabina-kanca','Yaylı kilitli karabina kanca, 45 mm.',9.90,null,600,'/ornek/halka.svg','ikisi',20,169.90,false,false),
 ('malzeme','miknatis','Neodyum mıknatıs 6x3 mm','neodyum-6x3','N52 güçlü disk mıknatıs. Baskı içine gömmek için ideal.',3.90,null,3000,'/ornek/miknatis.svg','paket',50,149.90,false,true),
 ('malzeme','miknatis','Neodyum mıknatıs 10x2 mm','neodyum-10x2','İnce disk mıknatıs, buzdolabı süsleri ve kapaklar için.',4.90,null,2000,'/ornek/miknatis.svg','ikisi',25,99.90,false,false),
 ('malzeme','vida-somun-insert','M3 pirinç ısıl insert','m3-isil-insert','Havya ile baskıya gömülen M3 dişli pirinç insert.',2.50,null,5000,'/ornek/vida.svg','paket',100,199.90,false,true),
 ('malzeme','vida-somun-insert','M3 imbus vida seti','m3-imbus-vida-seti','6-8-10-12-16-20 mm uzunluklarda paslanmaz M3 vida ve somun seti.',249.90,null,60,'/ornek/vida.svg','adet',1,null,false,false),
 ('malzeme','led-elektronik','Sıcak beyaz LED şerit 1 m','led-serit-1m','5 V USB beslemeli, kesilebilir LED şerit. Lamba ve tabela projeleri için.',89.90,null,120,'/ornek/led.svg','adet',1,null,false,false),
 ('malzeme','led-elektronik','5 mm LED seti','5mm-led-seti','5 renkte 100 adet 5 mm LED ve direnç seti.',129.90,null,80,'/ornek/led.svg','adet',1,null,false,false),
 ('malzeme','boya-zimpara','Akrilik boya seti 12 renk','akrilik-boya-seti','Figür boyamaya uygun, su bazlı akrilik boya seti.',279.90,null,40,'/ornek/boya.svg','adet',1,null,false,false),
 ('malzeme','boya-zimpara','Zımpara seti 120-2000','zimpara-seti','Katman izlerini gidermek için 8 farklı kum numarası.',99.90,null,70,'/ornek/boya.svg','adet',1,null,false,false),
 ('malzeme','yapistirici','Siyanoakrilat hızlı yapıştırıcı','hizli-yapistirici','PLA, PETG ve ABS parçaları birleştirmek için 20 g hızlı yapıştırıcı.',69.90,null,150,'/ornek/yapistirici.svg','adet',1,null,false,false),
 ('yazici','yazicilar','FDM 3D yazıcı','fdm-3d-yazici','Çok yakında.',0,null,0,'/ornek/yazici.svg','adet',1,null,false,false)
) as v(section, cat, name, slug, description, price, compare_price, stock, image, sale_unit, pack_size, pack_price, pers, feat)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

insert into public.coupons (code, type, value, min_total, usage_limit)
values ('HOSGELDIN10','yuzde',10,200,500) on conflict (code) do nothing;
