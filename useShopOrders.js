import { collection, onSnapshot, orderBy, query, where, limit as qlimit } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";

export function useShopOrders(ownerKey, shopId, { statusIn = null, limit = 100, todayOnly = true } = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerKey || !shopId) return;
    setLoading(true);

    const col = collection(db, "names", ownerKey, "shops", shopId, "orders");
    const clauses = [];
    if (Array.isArray(statusIn) && statusIn.length) {
      clauses.push(where("status", "in", statusIn));
    }
    if (todayOnly) {
      const d = new Date(); d.setHours(0,0,0,0);
      clauses.push(where("createdAtISO", ">=", d.toISOString()));
    }

    const q = query(col, ...clauses, orderBy("createdAt", "desc"), qlimit(limit));

    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (e) => { console.error(e); setOrders([]); setLoading(false); });

    return () => unsub();
  }, [ownerKey, shopId, limit, todayOnly, JSON.stringify(statusIn)]);

  const byStatus = useMemo(() => {
    const b = {};
    for (const o of orders) {
      const s = o.status || "Pending";
      (b[s] ||= []).push(o);
    }
    return b;
  }, [orders]);

  return { orders, byStatus, loading };
}
