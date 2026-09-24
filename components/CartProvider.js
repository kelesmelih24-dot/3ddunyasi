'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const CartContext = createContext(null);
const KEY = '3ddunyasi-sepet';

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items, ready]);

  // Aynı ürün + birim + kişiselleştirme tek satırda birleşir
  const key = (i) => `${i.product_id}|${i.unit}|${i.personalization || ''}`;

  const add = useCallback((item) => {
    setItems((prev) => {
      const k = key(item);
      const found = prev.find((p) => key(p) === k);
      if (found) return prev.map((p) => (key(p) === k ? { ...p, quantity: p.quantity + item.quantity } : p));
      return [...prev, item];
    });
  }, []);
  const update = useCallback((k, quantity) =>
    setItems((prev) => prev.map((p) => (key(p) === k ? { ...p, quantity: Math.max(1, quantity) } : p))), []);
  const remove = useCallback((k) => setItems((prev) => prev.filter((p) => key(p) !== k)), []);
  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, update, remove, clear, count, subtotal, key, ready }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
