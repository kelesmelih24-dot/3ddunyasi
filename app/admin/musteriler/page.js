'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { tl } from '@/lib/format';

const ROL = { customer: 'Müşteri', admin: 'Yönetici (tam yetki)', siparis: 'Sipariş sorumlusu', urun: 'Ürün sorumlusu' };

export default function Page() {
  const supabase = createClient();
  const [profiller, setProfiller] = useState([]);
  const [siparisler, setSiparisler] = useState([]);
  const [ara, setAra] = useState('');
  const [msg, setMsg] = useState('');
  const load = async () => {
    const [a, b] = await Promise.all([supabase.from('profiles').select('*').order('created_at', { ascending: false }), supabase.from('orders').select('user_id, total, status')]);
    setProfiller(a.data || []); setSiparisler(b.data || []);
  };
  useEffect(() => { load(); }, []);
  const stats = {};
  siparisler.filter((o) => o.status !== 'iptal').forEach((o) => { stats[o.user_id] ??= { n: 0, t: 0 }; stats[o.user_id].n++; stats[o.user_id].t += Number(o.total); });
  async function rolDegis(p, rol) {
    if (!confirm(`${p.email} için yetki "${ROL[rol]}" olarak değiştirilsin mi?`)) return;
    const { error } = await supabase.from('profiles').update({ role: rol }).eq('id', p.id);
    setMsg(error ? 'Hata: ' + error.message : 'Yetki güncellendi'); load();
  }
  const ekip = profiller.filter((p) => p.role !== 'customer');
  const goster = profiller.filter((p) => !ara || `${p.full_name} ${p.email} ${p.phone}`.toLocaleLowerCase('tr').includes(ara.toLocaleLowerCase('tr')));
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Müşteriler ve ekip</h1>
      <section className="kutu p-5">
        <h2 className="font-sans font-semibold">Ekip ({ekip.length})</h2>
        <p className="soluk mt-1 text-sm">Çalışanınız önce sitede üye olsun, sonra aşağıdaki listeden yetkisini değiştirin. <b>Sipariş sorumlusu</b> siparişleri, baskı kuyruğunu, talepleri ve iadeleri; <b>ürün sorumlusu</b> ürünleri, kategorileri, galeriyi ve blogu yönetir. Ayarlar, kampanyalar ve raporlar sadece yöneticide.</p>
        <ul className="mt-3 space-y-1 text-sm">{ekip.map((p) => <li key={p.id}><b>{p.full_name || p.email}</b> · {ROL[p.role]}</li>)}</ul>
      </section>
      {msg && <p className={msg.startsWith('Hata') ? 'hata' : 'basari'}>{msg}</p>}
      <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="İsim, e-posta veya telefonla ara" aria-label="Müşteri ara" className="girdi max-w-md" />
      <div className="space-y-2 md:hidden">
        {goster.map((p) => (
          <div key={p.id} className="kutu p-4 text-sm">
            <a href={`/admin/musteriler/${p.id}`} className="font-semibold underline">{p.full_name || '-'}</a><p className="soluk">{p.email} · {p.phone || '-'}</p>
            <p className="mt-1">{stats[p.id]?.n || 0} sipariş · {tl(stats[p.id]?.t || 0)} · {Number(p.points || 0)} puan</p>
            <select value={p.role} onChange={(e) => rolDegis(p, e.target.value)} className="girdi mt-2 py-1.5" aria-label="Yetki">{Object.entries(ROL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </div>
        ))}
      </div>
      <div className="kutu hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="soluk border-b border-lacivert-100 dark:border-lacivert-800"><tr><th className="p-3">Ad soyad</th><th className="p-3">E-posta / telefon</th><th className="p-3">Kayıt</th><th className="p-3">Sipariş</th><th className="p-3">Harcama</th><th className="p-3">Puan</th><th className="p-3">Yetki</th></tr></thead>
          <tbody className="divide-y divide-lacivert-100 dark:divide-lacivert-800">
            {goster.map((p) => (
              <tr key={p.id}>
                <td className="p-3 font-semibold"><a href={`/admin/musteriler/${p.id}`} className="underline">{p.full_name || '-'}</a></td><td className="p-3">{p.email}<br /><span className="soluk">{p.phone || ''}</span></td>
                <td className="p-3">{new Date(p.created_at).toLocaleDateString('tr-TR')}</td><td className="p-3">{stats[p.id]?.n || 0}</td>
                <td className="p-3">{tl(stats[p.id]?.t || 0)}</td><td className="p-3">{Number(p.points || 0)}</td>
                <td className="p-3"><select value={p.role} onChange={(e) => rolDegis(p, e.target.value)} className="girdi py-1.5" aria-label="Yetki">{Object.entries(ROL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
