import Catalog from '@/components/Catalog';
export const metadata = { title: 'Baskı ürünleri' };
export default function Page({ searchParams }) {
  return <Catalog section="baski" basePath="/baski-urunleri" searchParams={searchParams}
    title="Baskı ürünleri" intro="Atölyemizde tasarlayıp bastığımız ürünler. Kişiselleştirilebilen ürünlerde isim veya kısa yazı ekleyebilirsiniz." />;
}
