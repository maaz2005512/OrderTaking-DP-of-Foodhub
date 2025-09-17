// import { collectionGroup, onSnapshot, orderBy, query, where, limit as qlimit } from "firebase/firestore";
// import { useEffect, useMemo, useState } from "react";
// import { db } from "../firebase";

// export function useAdminOrders(ownerKey, { statusIn = null, limit = 200, todayOnly = false } = {}) {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!ownerKey) return;
//     setLoading(true);

//     const clauses = [where("username", "==", ownerKey)];
//     if (Array.isArray(statusIn) && statusIn.length) {
//       clauses.push(where("status", "in", statusIn));
//     }
//     if (todayOnly) {
//       const d = new Date(); d.setHours(0,0,0,0);
//       clauses.push(where("createdAtISO", ">=", d.toISOString()));
//     }

//     const q = query(collectionGroup(db, "orders"), ...clauses, orderBy("createdAt", "desc"), qlimit(limit));

//     const unsub = onSnapshot(q, (snap) => {
//       setOrders(snap.docs.map(d => ({ id: d.id, ...d.data(), __path: d.ref.path })));
//       setLoading(false);
//     }, (e) => { console.error(e); setOrders([]); setLoading(false); });

//     return () => unsub();
//   }, [ownerKey, limit, todayOnly, JSON.stringify(statusIn)]);

//   const byStatus = useMemo(() => {
//     const b = {};
//     for (const o of orders) {
//       const s = o.status || "Pending";
//       (b[s] ||= []).push(o);
//     }
//     return b;
//   }, [orders]);

//   return { orders, byStatus, loading };
// }

import { useEffect, useMemo, useState } from "react";
import { collectionGroup, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";

/** Safe epoch resolver */
function toEpoch(row) {
  if (row?.createdAt?.toMillis) return row.createdAt.toMillis();
  if (typeof row?.createdAt?.seconds === "number") return row.createdAt.seconds * 1000;
  const t = row?.createdAtISO ? Date.parse(row.createdAtISO) : NaN;
  return Number.isFinite(t) ? t : 0;
}

export function useAdminLiveOrders(adminUid) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(Boolean(adminUid));

  useEffect(() => {
    if (!adminUid) return;
    setLoading(true);

    // All orders for shops owned by this admin
    const q = query(
      collectionGroup(db, "orders"),
      where("shopOwnerUid", "==", adminUid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => toEpoch(b) - toEpoch(a));
        setOrders(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [adminUid]);

  // Today window (local)
  const start = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);
  const end = useMemo(() => start + 24 * 60 * 60 * 1000 - 1, [start]);

  const todayOrders = useMemo(
    () => orders.filter((o) => {
      const t = toEpoch(o);
      return t >= start && t <= end;
    }),
    [orders, start, end]
  );

  const metrics = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
    const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    return {
      totalOrders: orders.length,
      totalRevenue: revenue,
      todayOrders: todayOrders.length,
      todayRevenue,
      latest5: orders.slice(0, 5),
    };
  }, [orders, todayOrders]);

  return { loading, orders, todayOrders, metrics };
}

