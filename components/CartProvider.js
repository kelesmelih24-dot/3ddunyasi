'use client';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const CartContext = createContext(null);
const KEY = '3ddunyasi-sepet';

// Sepet tarayıcıda tutulur; üye girişliyse sunucuya da yazılır (başka cihazda devam + terk edilen sepet hatırlatması)
export function CartProvider({ children, userId }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const zaman = useRef(null);

  useEffect(() => {
    let yerel = [];
    try { yerel = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch {}
    setItems(yerel);
    setReady(true);
    if (userId && !yerel.length) {
      createClient().from('carts').select('items').eq('user_id', userId).maybeSingle()
        .then(({ data }) => { if (data?.items?.length) setItems(data.items); });
    }
  }, [userId]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
    if (!userId) return;
    clearTimeout(zaman.current);
    zaman.current = setTimeout(() => {
      createClient().from('carts').upsert({ user_id: userId, items, updated_at: new Date().toISOString(), reminded_at: null });
    }, 1500);
  }, [items, ready, userId]);

  // Aynı ürün + birim + kişiselleştirme (hediye çekinde tutar + alıcı) tek satırda birleşir
  const key = (i) => (i.kind === 'hediye_ceki' ? `hc|${i.amount}|${i.recipient_email || ''}|${i.message || ''}` : `${i.product_id}|${i.unit}|${i.personalization || ''}`);

  const add = useCallback((item) => {
    setItems((prev) => {
      const k = key(item);
      const found = prev.find((p) => key(p) === k);
      if (found) return prev.map((p) => (key(p) === k ? { ...p, quantity: p.quantity + item.quantity } : p));
      return [...prev, item];
    });
  }, []);
  const update = useCallback((k, quantity) => setItems((prev) => prev.map((p) => (key(p) === k ? { ...p, quantity: Math.max(1, quantity) } : p))), []);
  const remove = useCallback((k) => setItems((prev) => prev.filter((p) => key(p) !== k)), []);
  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return <CartContext.Provider value={{ items, add, update, remove, clear, count, subtotal, key, ready }}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);

// Sunucuya gönderilecek sade liste
export const siparisKalemleri = (items) => items.map((i) => (i.kind === 'hediye_ceki'
  ? { kind: 'hediye_ceki', amount: i.amount, quantity: i.quantity, recipient_email: i.recipient_email, recipient_name: i.recipient_name, message: i.message }
  : { product_id: i.product_id, quantity: i.quantity, unit: i.unit, personalization: i.personalization }));
