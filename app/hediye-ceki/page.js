'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { tl } from '@/lib/format';

const TUTARLAR = [250, 500, 750, 1000];

export default function Page() {
  const { add } = useCart();
  const [tutar, setTutar] = useState(500);
  const [ozel, setOzel] = useState('');
  const [f, setF] = useState({ recipient_name: '', recipient_email: '', message: '' });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const deger = ozel ? Number(ozel) : tutar;
  function ekle(e) {
    e.preventDefault();
    if (!(deger >= 50 && deger <= 10000)) return setErr('Tutar 50 ile 10.000 TL arasında olmalı.');
    if (f.recipient_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.recipient_email)) return setErr('Alıcının e-posta adresini kontrol edin.');
    add({ kind: 'hediye_ceki', name: `Hediye çeki (${deger} TL)`, amount: deger, price: deger, quantity: 1, ...f });
    setOk(true); setErr('');
  }
  return (
    <div className="kap grid gap-12 py-12 lg:grid-cols-2">
      <div>
        <p className="ust-etiket">Hediye çeki</p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">Ne alacağınızı bilemediğinizde</h1>
        <p className="soluk mt-4 max-w-md leading-7">Sevdiklerinize dilediği baskıyı ya da malzemeyi seçme özgürlüğü verin. Ödemeniz onaylanınca çek kodu alıcıya e-postayla gönderilir, bir yıl boyunca parça parça kullanılabilir.</p>
        <div className="relative mt-10 aspect-[1.6] max-w-md overflow-hidden rounded-[28px] bg-nozul-500 p-8 text-white shadow-[0_30px_60px_-30px_rgba(232,98,12,.8)]">
          <div className="katman absolute inset-0" />
          <p className="relative font-display text-lg font-semibold">3D Dünyası</p>
          <p className="relative mt-6 font-display text-5xl font-semibold">{tl(deger || 0)}</p>
          <p className="relative mt-4 text-sm text-white/85">{f.recipient_name ? `${f.recipient_name} için` : 'Hediye çeki'}</p>
          <span className="absolute bottom-6 right-8 text-5xl" aria-hidden="true">🎁</span>
        </div>
      </div>
      <form onSubmit={ekle} className="kutu h-fit space-y-5 p-6 sm:p-8" noValidate>
        <fieldset>
          <legend className="etiket">Tutar</legend>
          <div className="flex flex-wrap gap-2">
            {TUTARLAR.map((t) => <button type="button" key={t} onClick={() => { setTutar(t); setOzel(''); }} aria-pressed={!ozel && tutar === t} className={`rounded-full border px-4 py-2 text-sm font-bold ${!ozel && tutar === t ? 'border-nozul-500 bg-nozul-500 text-white' : 'border-lacivert-200 dark:border-lacivert-600'}`}>{t} TL</button>)}
            <input type="number" min={50} max={10000} value={ozel} onChange={(e) => setOzel(e.target.value)} placeholder="Farklı tutar" aria-label="Farklı tutar" className="girdi w-36 rounded-full py-2" />
          </div>
        </fieldset>
        <div><label className="etiket" htmlFor="ra">Alıcının adı (isteğe bağlı)</label><input id="ra" className="girdi" value={f.recipient_name} onChange={(e) => setF({ ...f, recipient_name: e.target.value })} /></div>
        <div><label className="etiket" htmlFor="re">Alıcının e-postası (boş bırakırsanız kod size gelir)</label><input id="re" type="email" className="girdi" value={f.recipient_email} onChange={(e) => setF({ ...f, recipient_email: e.target.value })} /></div>
        <div><label className="etiket" htmlFor="rm">Mesajınız (isteğe bağlı)</label><textarea id="rm" rows={3} maxLength={200} className="girdi" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="İyi ki doğdun!" /></div>
        {err && <p className="hata">{err}</p>}
        {ok ? <p className="basari">Hediye çeki sepete eklendi. <Link href="/sepet" className="font-semibold underline">Sepete git</Link></p> : <button className="btn-ana w-full py-3">Sepete ekle · {tl(deger || 0)}</button>}
      </form>
    </div>
  );
}
