'use client';
import { useEffect } from 'react';
import { satinAlmaOlayi } from './Analytics';

export default function PurchaseEvent({ order }) {
  useEffect(() => {
    const k = `olay-${order.order_no}`;
    try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch {}
    const t = setTimeout(() => satinAlmaOlayi(order), 800);
    return () => clearTimeout(t);
  }, [order.order_no]);
  return null;
}
