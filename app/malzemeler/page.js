import Catalog from '@/components/Catalog';
export const metadata = { title: '3D baskı malzemeleri' };
export default function Page({ searchParams }) {
  return <Catalog section="malzeme" basePath="/malzemeler" searchParams={searchParams}
    title="3D baskı malzemeleri" intro="Baskılarınızı tamamlamak için gereken parçalar. Birçok malzemeyi adet veya ekonomik paket olarak alabilirsiniz." />;
}
