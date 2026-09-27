'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import AccountNav from '@/components/AccountNav';

const BOS = { title: 'Ev', full_name: '', phone: '', city: '', district: '', address: '', zip: '' };

export default function Page() {
  const supabase = createClient();
  const [list, setList] = useState(null);
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const load = async () => setList((await supabase.from('addresses').select('*').order('is_default', { ascending: false }).order('created_at')).data || []);
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr(''); };
  async function kaydet(e) {
    e.preventDefault();
    for (const k of ['full_name', 'phone', 'city', 'district', 'address']) if (!String(f[k] || '').trim()) return setErr('Tüm zorunlu alanları doldurun.');
    const { data: { user } } = await supabase.auth.getUser();
    const { id, created_at, user_id, ...row } = f;
    const { error } = id ? await supabase.from('addresses').update(row).eq('id', id) : await supabase.from('addresses').insert({ ...row, user_id: user.id, is_default: !list.length });
    if (error) return setErr('Kaydedilemedi');
    setF(null); load();
  }
  async function varsayilan(a) {
    await supabase.from('addresses').update({ is_default: false }).neq('id', a.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', a.id); load();
  }
  async function sil(a) { if (confirm(`"${a.title}" adresi silinsin mi?`)) { await supabase.from('addresses').delete().eq('id', a.id); load(); } }
  return (
    <div className="kap py-10">
      <h1 className="mb-6 text-3xl font-semibold">Hesabım</h1>
      <AccountNav active="/hesabim/adresler" />
      {f ? (
        <form onSubmit={kaydet} className="kutu max-w-2xl space-y-4 p-6" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="etiket" htmlFor="t">Adres başlığı</label><input id="t" className="girdi" value={f.title} onChange={set('title')} placeholder="Ev, İş…" /></div>
            <div><label className="etiket" htmlFor="n">Ad soyad</label><input id="n" className="girdi" value={f.full_name} onChange={set('full_name')} /></div>
            <div><label className="etiket" htmlFor="p">Telefon</label><input id="p" className="girdi" value={f.phone} onChange={set('phone')} /></div>
            <div><label className="etiket" htmlFor="c">İl</label><input id="c" className="girdi" value={f.city} onChange={set('city')} /></div>
            <div><label className="etiket" htmlFor="d">İlçe</label><input id="d" className="girdi" value={f.district} onChange={set('district')} /></div>
            <div><label className="etiket" htmlFor="z">Posta kodu</label><input id="z" className="girdi" value={f.zip || ''} onChange={set('zip')} /></div>
          </div>
          <div><label className="etiket" htmlFor="a">Açık adres</label><textarea id="a" rows={3} className="girdi" value={f.address} onChange={set('address')} /></div>
          {err && <p className="hata">{err}</p>}
          <div className="flex gap-3"><button className="btn-ana">Kaydet</button><button type="button" onClick={() => setF(null)} className="btn-cizgi">Vazgeç</button></div>
        </form>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(list || []).map((a) => (
              <div key={a.id} className="kutu p-5 text-sm leading-6">
                <div className="flex items-center justify-between"><b className="text-base">{a.title}</b>{a.is_default && <span className="rounded-full bg-nozul-50 px-2 py-0.5 text-xs font-bold text-nozul-700 dark:bg-nozul-700/20 dark:text-nozul-100">Varsayılan</span>}</div>
                <p className="mt-2">{a.full_name} · {a.phone}<br />{a.address}<br />{a.district} / {a.city} {a.zip}</p>
                <div className="mt-3 flex gap-3 text-sm">
                  <button onClick={() => setF(a)} className="underline">Düzenle</button>
                  {!a.is_default && <button onClick={() => varsayilan(a)} className="underline">Varsayılan yap</button>}
                  <button onClick={() => sil(a)} className="text-red-600 underline">Sil</button>
                </div>
              </div>
            ))}
            <button onClick={() => setF({ ...BOS })} className="grid min-h-40 place-items-center rounded-2xl border-2 border-dashed border-lacivert-200 font-semibold hover:border-nozul-500 dark:border-lacivert-600">+ Yeni adres ekle</button>
          </div>
        </>
      )}
    </div>
  );
}
