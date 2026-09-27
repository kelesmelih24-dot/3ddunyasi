'use client';

// Verilen satırları Excel (.xlsx) dosyası olarak indirir
export default function ExcelExport({ satirlar, dosya = 'rapor', etiket = "Excel'e aktar" }) {
  async function indir() {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(satirlar);
    ws['!cols'] = Object.keys(satirlar[0] || {}).map((k) => ({ wch: Math.max(12, k.length + 2) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sayfa1');
    XLSX.writeFile(wb, `${dosya}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
  return <button type="button" onClick={indir} disabled={!satirlar?.length} className="btn-cizgi">⬇ {etiket}</button>;
}
