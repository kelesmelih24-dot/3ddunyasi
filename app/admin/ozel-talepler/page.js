'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { tarih, tl, TALEP_DURUM } from '@/lib/format';
import ModelViewer from '@/components/ModelViewer';

function Talep({ t, onSaved }) {
  const supabase = createClient();
  const [status, setStatus] = useState(t.status);
  const [price, setPrice] = useState(t.quote_price ?? t.estimate_price ?? '');
  const [note, setNote] = useState(t.admin_note || '');
  const [msg, setMsg] = useState('');
  const [model, setModel] = useState(null);
  const uzanti = t.file_path?.split('.').pop().toLowerCase();

  async function dosyaUrl() {
    const { data } = await supabase.storage.from('ozel-siparis').createSignedUrl(t.file_path, 600);
    return data?.signedUrl;
  }
  async function indir() { const u = await dosyaUrl(); if (u) window.open(u, '_blank'); }
  async function onizle() { setModel(model ? null : await dosyaUrl()); }
  async function kaydet() {
    if (status === 'teklif_verildi' && !(Number(price) > 0)) return setMsg('Teklif vermek için fiyat girin.');
    const { error } = await supabase.from('custom_requests').update({ status, quote_price: price === '' ? null : Number(price), admin_note: note }).eq('id', t.id);
    if (error) return setMsg('Hata: ' + error.message);
    if (status === 'teklif_verildi' && t.status !== 'teklif_verildi') await fetch('/api/admin/teklif', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id }) });
    setMsg(status === 'teklif_verildi' && t.status !== 'teklif_verildi' ? 'Kaydedildi, müşteriye teklif e-postası gönderildi' : 'Kaydedildi');
    onSaved();
  }
  return (
    <li className="kutu space-y-3 p-5 text-sm">
      <div className="flex flex-wrap justify-between gap-2"><b>{t.full_name} · {t.kind === 'stl' ? 'Model baskı' : 'Yazılı ürün'} · {t.quantity} adet</b><span className="soluk">{tarih(t.created_at)}</span></div>
      <p className="soluk"><a href={`mailto:${t.email}`} className="underline">{t.email}</a>{t.phone && ` · ${t.phone}`}</p>
      <p className="leading-6">{t.description}</p>
      <div className="flex flex-wrap gap-2">
        {[t.material, t.color, t.infill && `%${t.infill} doluluk`, t.layer_height && `${t.layer_height} mm`, t.scale && t.scale !== 100 && `%${t.scale} ölçek`, t.dims, t.volume_cm3 && `${t.volume_cm3} cm³`].filter(Boolean).map((x) => (
          <span key={x} className="rounded-full bg-lacivert-50 px-2.5 py-1 text-xs font-semibold dark:bg-lacivert-800">{x}</span>
        ))}
        {t.estimate_price && <span className="rounded-full bg-nozul-50 px-2.5 py-1 text-xs font-bold text-nozul-700 dark:bg-nozul-700/20 dark:text-nozul-100">Sitenin tahmini: {tl(t.estimate_price)}</span>}
      </div>
      {t.personalization_text && <p className="rounded-lg bg-nozul-50 px-3 py-2 dark:bg-nozul-700/20">Yazı: <b>{t.personalization_text}</b></p>}
      {t.file_path && (
        <div className="flex flex-wrap gap-2">
          <button onClick={indir} className="btn-cizgi py-1.5">Dosyayı indir</button>
          {['stl', 'obj'].includes(uzanti) && <button onClick={onizle} className="btn-cizgi py-1.5">{model ? '3D önizlemeyi kapat' : '3D önizle'}</button>}
        </div>
      )}
      {model && <ModelViewer url={model} tur={uzanti} className="h-72" />}
      {t.order_id ? (
        <p className="basari">Müşteri teklifi onayladı ve sipariş oluştu. <a href={`/admin/siparisler/${t.order_id}`} className="font-semibold underline">Siparişe git</a></p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="girdi" aria-label="Durum">{Object.entries(TALEP_DURUM).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Teklif fiyatı (TL)" className="girdi" aria-label="Teklif fiyatı" />
            <button onClick={kaydet} className="btn-koyu">Kaydet</button>
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="girdi" placeholder="Müşterinin göreceği not (malzeme, süre vb.)" aria-label="Not" />
          <p className="soluk text-xs">Durumu "Teklif verildi" yapıp kaydettiğinizde müşteriye e-posta gider ve hesabında "Teklifi onayla" düğmesi çıkar.</p>
        </>
      )}
      {msg && <p className={msg.startsWith('Hata') || msg.startsWith('Teklif vermek') ? 'hata' : 'basari'}>{msg}</p>}
    </li>
  );
}

export default function Page() {
  const supabase = createClient();
  const [list, setList] = useState(null);
  const load = async () => setList((await supabase.from('custom_requests').select('*').order('created_at', { ascending: false })).data || []);
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h1 className="text-3xl font-semibold">Özel sipariş talepleri</h1>
      <p className="soluk mb-5 mt-1 text-sm">Sitenin tahmini fiyatı teklif kutusuna önceden yazılır; kontrol edip gerekirse değiştirin.</p>
      {list === null ? <p className="soluk">Yükleniyor…</p> : list.length === 0 ? <p className="kutu soluk p-6">Henüz talep yok.</p> : (
        <ul className="space-y-4">{list.map((t) => <Talep key={t.id} t={t} onSaved={load} />)}</ul>
      )}
    </div>
  );
}
