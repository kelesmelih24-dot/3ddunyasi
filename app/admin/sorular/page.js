'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { tarih } from '@/lib/format';

function Soru({ q, onSaved }) {
  const supabase = createClient();
  const [cevap, setCevap] = useState(q.answer || '');
  const [msg, setMsg] = useState('');
  async function kaydet() {
    if (cevap.trim().length < 2) return setMsg('Cevap yazın.');
    const { error } = await supabase.from('product_questions').update({ answer: cevap.trim(), answered_at: new Date().toISOString() }).eq('id', q.id);
    setMsg(error ? 'Hata' : 'Yayınlandı'); onSaved();
  }
  async function sil() { if (confirm('Soru silinsin mi?')) { await supabase.from('product_questions').delete().eq('id', q.id); onSaved(); } }
  return (
    <li className="kutu space-y-3 p-5 text-sm">
      <div className="flex flex-wrap justify-between gap-2"><a href={`/urun/${q.products?.slug}`} target="_blank" className="font-semibold underline">{q.products?.name}</a><span className="soluk">{tarih(q.created_at)}</span></div>
      <p className="text-base"><span className="text-nozul-500">S:</span> {q.question} <span className="soluk text-xs">— {q.author_name || 'Müşteri'}</span></p>
      <textarea rows={2} value={cevap} onChange={(e) => { setCevap(e.target.value); setMsg(''); }} className="girdi" placeholder="Cevabınız (ürün sayfasında herkese görünür)" aria-label="Cevap" />
      <div className="flex items-center gap-3">
        <button onClick={kaydet} className="btn-koyu py-2">{q.answer ? 'Cevabı güncelle' : 'Cevapla ve yayınla'}</button>
        <button onClick={sil} className="text-red-600 underline">Sil</button>
        {msg && <span className={msg === 'Yayınlandı' ? 'text-emerald-600' : 'text-red-600'}>{msg}</span>}
      </div>
    </li>
  );
}

export default function Page() {
  const supabase = createClient();
  const [list, setList] = useState(null);
  const [filtre, setFiltre] = useState('bekleyen');
  const load = async () => setList((await supabase.from('product_questions').select('*, products(name, slug)').order('created_at', { ascending: false })).data || []);
  useEffect(() => { load(); }, []);
  const goster = (list || []).filter((q) => (filtre === 'bekleyen' ? !q.answer : !!q.answer));
  return (
    <div>
      <h1 className="text-3xl font-semibold">Ürün soruları</h1>
      <div className="my-5 flex gap-2">
        {[['bekleyen', 'Yanıt bekleyenler'], ['cevapli', 'Yanıtlananlar']].map(([k, t]) => <button key={k} onClick={() => setFiltre(k)} className={filtre === k ? 'btn-ana py-2' : 'btn-cizgi py-2'}>{t}{k === 'bekleyen' && list ? ` (${list.filter((q) => !q.answer).length})` : ''}</button>)}
      </div>
      {list === null ? <p className="soluk">Yükleniyor…</p> : goster.length === 0 ? <p className="kutu soluk p-6">Burada soru yok.</p> : <ul className="space-y-4">{goster.map((q) => <Soru key={q.id} q={q} onSaved={load} />)}</ul>}
    </div>
  );
}
