'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Page() {
  const [f, setF] = useState({ company: '', full_name: '', email: '', phone: '', quantity: '', details: '' });
  const [durum, setDurum] = useState('');
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setDurum(''); };
  async function gonder(e) {
    e.preventDefault();
    if (!f.company.trim() || !f.full_name.trim()) return setDurum('hata:Firma ve yetkili adını girin.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return setDurum('hata:Geçerli bir e-posta adresi girin.');
    if (f.details.trim().length < 10) return setDurum('hata:İhtiyacınızı biraz daha detaylı anlatın.');
    const { data, error } = await createClient().from('corporate_requests').insert(f).select('id').single();
    if (error) return setDurum('hata:Gönderilemedi, tekrar deneyin.');
    fetch('/api/kurumsal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: data.id }) });
    setDurum('tamam');
  }
  return (
    <div className="kap grid gap-12 py-12 lg:grid-cols-2">
      <div>
        <p className="ust-etiket">Kurumsal ve toplu sipariş</p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">Markanıza özel 3D baskı</h1>
        <p className="soluk mt-4 max-w-md leading-7">Logolu anahtarlıklar, etkinlik hediyeleri, maket ve prototipler, mağaza ekipmanları. Adet ve ihtiyacınızı yazın, size özel fiyat teklifimizi iletelim.</p>
        <ul className="mt-8 space-y-3 text-sm">
          {['Logolu promosyon ürünleri', 'Kurumsal hediye ve plaketler', 'Prototip ve ürün geliştirme', 'Toplu yedek parça üretimi'].map((x) => <li key={x} className="flex items-center gap-3"><span className="h-2.5 w-2.5 rotate-45 rounded-[3px] bg-nozul-500" />{x}</li>)}
        </ul>
      </div>
      {durum === 'tamam' ? (
        <div className="kutu h-fit p-8"><p className="text-lg font-semibold">Talebiniz bize ulaştı</p><p className="soluk mt-2">En kısa sürede {f.email} adresinden size dönüş yapacağız.</p></div>
      ) : (
        <form onSubmit={gonder} className="kutu h-fit space-y-4 p-6 sm:p-8" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="etiket" htmlFor="c">Firma adı</label><input id="c" className="girdi" value={f.company} onChange={set('company')} autoComplete="organization" /></div>
            <div><label className="etiket" htmlFor="n">Yetkili ad soyad</label><input id="n" className="girdi" value={f.full_name} onChange={set('full_name')} autoComplete="name" /></div>
            <div><label className="etiket" htmlFor="e">E-posta</label><input id="e" type="email" className="girdi" value={f.email} onChange={set('email')} autoComplete="email" /></div>
            <div><label className="etiket" htmlFor="p">Telefon</label><input id="p" className="girdi" value={f.phone} onChange={set('phone')} autoComplete="tel" /></div>
          </div>
          <div><label className="etiket" htmlFor="q">Tahmini adet</label><input id="q" className="girdi" value={f.quantity} onChange={set('quantity')} placeholder="Örnek: 500" /></div>
          <div><label className="etiket" htmlFor="d">İhtiyacınız</label><textarea id="d" rows={5} className="girdi" value={f.details} onChange={set('details')} placeholder="Ürün, ölçü, renk, logo, teslim tarihi…" /></div>
          {durum.startsWith('hata:') && <p className="hata">{durum.slice(5)}</p>}
          <button className="btn-ana w-full py-3">Teklif iste</button>
        </form>
      )}
    </div>
  );
}
