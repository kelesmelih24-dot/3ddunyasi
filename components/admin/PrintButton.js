'use client';
export default function PrintButton() {
  return <button onClick={() => window.print()} className="btn-ana">🖨 Yazdır (etiket + fiş)</button>;
}
