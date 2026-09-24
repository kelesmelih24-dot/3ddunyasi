import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="kap py-24 text-center">
      <h1 className="text-3xl font-bold">Bu sayfa bulunamadı</h1>
      <p className="soluk mt-3">Aradığınız sayfa taşınmış veya kaldırılmış olabilir.</p>
      <Link href="/" className="btn-ana mt-6">Ana sayfaya dön</Link>
    </div>
  );
}
