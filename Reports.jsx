// import React, { useEffect, useState } from "react";
// import { Card, Typography, Table, DatePicker, Select, Button } from "antd";
// import { DownloadOutlined } from "@ant-design/icons";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "../../firebase";
// import { saveAs } from "file-saver"; // optionally use file-saver

// const { Title } = Typography;
// const { RangePicker } = DatePicker;
// const { Option } = Select;

// const Reports = () => {
//   const [orders, setOrders] = useState([]);
//   const [filteredOrders, setFilteredOrders] = useState([]);
//   const [shops, setShops] = useState([]);
//   const [selectedShop, setSelectedShop] = useState("all");

//   const fetchOrdersAndShops = async () => {
//     try {
//       const orderSnap = await getDocs(collection(db, "orders"));
//       const ordersData = orderSnap.docs.map((doc) => {
//         const data = doc.data();
//         return {
//           key: doc.id,
//           date: data.createdAt?.toDate().toISOString().split("T")[0] || "",
//           shopId: data.shopId || "",
//           totalAmount: data.totalAmount || 0,
//         };
//       });

//       const shopSnap = await getDocs(collection(db, "shops"));
//       const shopMap = {};
//       const shopList = [];
//       shopSnap.forEach((doc) => {
//         const data = doc.data();
//         shopMap[doc.id] = data.name;
//         shopList.push({ id: doc.id, name: data.name });
//       });

//       const enrichedOrders = ordersData.map((order) => ({
//         ...order,
//         shopName: shopMap[order.shopId] || "Unknown Shop",
//       }));

//       setOrders(enrichedOrders);
//       setFilteredOrders(enrichedOrders);
//       setShops(shopList);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     }
//   };

//   useEffect(() => {
//     fetchOrdersAndShops();
//   }, []);

//   const handleShopFilter = (value) => {
//     setSelectedShop(value);
//     if (value === "all") {
//       setFilteredOrders(orders);
//     } else {
//       const filtered = orders.filter((order) => order.shopId === value);
//       setFilteredOrders(filtered);
//     }
//   };

//   const handleExportCSV = () => {
//     if (filteredOrders.length === 0) return;

//     const headers = ["Date", "Shop Name", "Total Orders", "Revenue"];
//     const rows = filteredOrders.map((order) => [
//       order.date,
//       order.shopName,
//       1,
//       `£${order.totalAmount}`,
//     ]);

//     const csvContent = [headers, ...rows]
//       .map((row) => row.join(","))
//       .join("\n");

//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     const fileName = `order_reports_${new Date().toISOString().split("T")[0]}.csv`;
//     saveAs(blob, fileName); // you can also use a simple download link fallback if needed
//   };

//   const columns = [
//     {
//       title: "Date",
//       dataIndex: "date",
//       key: "date",
//     },
//     {
//       title: "Shop Name",
//       dataIndex: "shopName",
//       key: "shopName",
//     },
//     {
//       title: "Total Orders",
//       key: "totalOrders",
//       render: () => 1,
//     },
//     {
//       title: "Revenue",
//       key: "revenue",
//       render: (_, record) => `£${record.totalAmount}`,
//     },
//   ];

//   return (
//     <div style={{ padding: "2rem" }}>
//       <Card>
//         <div
//           style={{
//             marginBottom: "1rem",
//             display: "flex",
//             justifyContent: "space-between",
//             flexWrap: "wrap",
//             gap: "1rem",
//           }}
//         >
//           <Title level={4}>Order Reports</Title>
//           <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
//             <RangePicker disabled />
//             <Select
//               placeholder="Select Shop"
//               style={{ width: 180 }}
//               value={selectedShop}
//               onChange={handleShopFilter}
//             >
//               <Option value="all">All Shops</Option>
//               {shops.map((shop) => (
//                 <Option key={shop.id} value={shop.id}>
//                   {shop.name}
//                 </Option>
//               ))}
//             </Select>
//             <Button
//               icon={<DownloadOutlined />}
//               onClick={handleExportCSV}
//               disabled={filteredOrders.length === 0}
//             >
//               Export CSV
//             </Button>
//           </div>
//         </div>

//         <Table
//           columns={columns}
//           dataSource={filteredOrders}
//           locale={{ emptyText: "No orders yet. Add menus first!" }}
//           pagination={{ pageSize: 5 }}
//         />
//       </Card>
//     </div>
//   );
// };

// export default Reports;


// import React, { useEffect, useMemo, useState } from "react";
// import { Card, Typography, Table, DatePicker, Select, Button } from "antd";
// import { DownloadOutlined } from "@ant-design/icons";
// import { collection, collectionGroup, getDocs, onSnapshot, query, where , orderBy} from "firebase/firestore";
// import { db } from "../../firebase";
// import { saveAs } from "file-saver";
// import { useAuth } from "../../context/AuthContext";
// import { resolveOwnerKey } from "../../utils/resolveOwnerKey";

// const { Title } = Typography;
// const { RangePicker } = DatePicker;
// const { Option } = Select;

// const Reports = () => {
//   const { currentUser } = useAuth();
//   const [ownerKey, setOwnerKey] = useState(null);

//   const [orders, setOrders] = useState([]);
//   const [shops, setShops] = useState([]);
//   const [selectedShop, setSelectedShop] = useState("all");

//   useEffect(() => {
//     (async () => {
//       if (!currentUser) return;
//       setOwnerKey(await resolveOwnerKey(currentUser));
//     })();
//   }, [currentUser]);

//   // live orders (all shops for this owner)
//   useEffect(() => {
//     if (!ownerKey) return;

//     // const q = query(
//     //   collectionGroup(db, "orders"),
//     //   where("username", "==", ownerKey),
//     //   orderBy("createdAt", "desc")
//     // );
//     const q = query(
//   collectionGroup(db, "orders"),
//   where("ownerUid", "==", currentUser.uid),
//   orderBy("createdAt", "desc")
// );

//     const unsub = onSnapshot(q, (snap) => {
//       const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//       setOrders(list);
//     });
//     return () => unsub();
//   }, [ownerKey]);

//   // load shops (top-level, as in your previous code)
//   useEffect(() => {
//     (async () => {
//       const snap = await getDocs(collection(db, "shops"));
//       const arr = [];
//       snap.forEach((doc) => arr.push({ id: doc.id, name: doc.data()?.name || doc.id }));
//       setShops(arr);
//     })();
//   }, []);

//   const filteredOrders = useMemo(() => {
//     return selectedShop === "all" ? orders : orders.filter(o => o.shopId === selectedShop);
//   }, [orders, selectedShop]);

//   const tableData = filteredOrders.map((o) => ({
//     key: o.id,
//     date: (() => {
//       try { if (o.createdAt?.toDate) return o.createdAt.toDate().toISOString().split("T")[0]; } catch {}
//       return (o.createdAtISO || "").split("T")[0] || "";
//     })(),
//     shopId: o.shopId || "",
//     shopName: shops.find(s => s.id === o.shopId)?.name || "Unknown Shop",
//     totalAmount: Number(o.total || 0),
//   }));

//   const handleShopFilter = (value) => setSelectedShop(value);

//   const handleExportCSV = () => {
//     if (tableData.length === 0) return;
//     const headers = ["Date", "Shop Name", "Total Orders", "Revenue"];
//     const rows = tableData.map((row) => [row.date, row.shopName, 1, `£${row.totalAmount.toFixed(2)}`]);
//     const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     const fileName = `order_reports_${new Date().toISOString().split("T")[0]}.csv`;
//     saveAs(blob, fileName);
//   };

//   const columns = [
//     { title: "Date", dataIndex: "date", key: "date" },
//     { title: "Shop Name", dataIndex: "shopName", key: "shopName" },
//     { title: "Total Orders", key: "totalOrders", render: () => 1 },
//     { title: "Revenue", key: "revenue", render: (_, rec) => `£${rec.totalAmount.toFixed(2)}` },
//   ];

//   return (
//     <div style={{ padding: "2rem" }}>
//       <Card>
//         <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
//           <Title level={4}>Order Reports</Title>
//           <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
//             <RangePicker disabled />
//             <Select placeholder="Select Shop" style={{ width: 180 }} value={selectedShop} onChange={handleShopFilter}>
//               <Option value="all">All Shops</Option>
//               {shops.map((s) => (
//                 <Option key={s.id} value={s.id}>{s.name}</Option>
//               ))}
//             </Select>
//             <Button icon={<DownloadOutlined />} onClick={handleExportCSV} disabled={tableData.length === 0}>
//               Export CSV
//             </Button>
//           </div>
//         </div>

//         <Table
//           columns={columns}
//           dataSource={tableData}
//           locale={{ emptyText: "No orders yet. Add menus first!" }}
//           pagination={{ pageSize: 10 }}
//         />
//       </Card>
//     </div>
//   );
// };

// export default Reports;


// import React, { useEffect, useMemo, useState } from "react";
// import { Card, Typography, Table, DatePicker, Select, Button } from "antd";
// import { DownloadOutlined } from "@ant-design/icons";
// import { collection, collectionGroup, getDocs, onSnapshot, query, where } from "firebase/firestore";
// import { db } from "../../firebase";
// import { saveAs } from "file-saver";
// import { useAuth } from "../../context/AuthContext";
// import { resolveOwnerKey as fallbackResolve } from "../../utils/resolveOwnerKey";
// import { doc, getDoc } from "firebase/firestore";

// const { Title } = Typography;
// const { RangePicker } = DatePicker;
// const { Option } = Select;

// async function resolveOrgOwnerKey(authUser) {
//   if (authUser?.uid) {
//     try {
//       const us = await getDoc(doc(db, "users", authUser.uid));
//       if (us.exists()) {
//         const d = us.data();
//         if (d?.ownerKey) return d.ownerKey;
//       }
//     } catch {}
//   }
//   return await fallbackResolve(authUser);
// }

// const Reports = () => {
//   const { currentUser } = useAuth();
//   const [ownerKey, setOwnerKey] = useState(null);

//   const [orders, setOrders] = useState([]);
//   const [shops, setShops] = useState([]);
//   const [selectedShop, setSelectedShop] = useState("all");

//   useEffect(() => {
//     (async () => {
//       if (!currentUser) return;
//       setOwnerKey(await resolveOrgOwnerKey(currentUser));
//     })();
//   }, [currentUser]);

//   // live orders (all shops for this ownerKey)
//   useEffect(() => {
//     if (!ownerKey) return;

//     const q = query(
//       collectionGroup(db, "orders"),
//       where("ownerKey", "==", ownerKey)
//     );

//     const unsub = onSnapshot(q, (snap) => {
//       const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//       // client sort desc by createdAt/ISO
//       list.sort((a, b) => {
//         const ta = (a.createdAt?.seconds ?? (Date.parse(a.createdAtISO || 0) / 1000)) || 0;
//         const tb = (b.createdAt?.seconds ?? (Date.parse(b.createdAtISO || 0) / 1000)) || 0;

//         return tb - ta;
//       });
//       setOrders(list);
//     });
//     return () => unsub();
//   }, [ownerKey]);

//   // load shops (top-level) — adjust if your shops live under names/{ownerKey}
//   useEffect(() => {
//     (async () => {
//       // If your shops are actually under names/{ownerKey}/shops, then change to:
//       // const snap = await getDocs(collection(db, "names", ownerKey, "shops"));
//       const snap = await getDocs(collection(db, "shops"));
//       const arr = [];
//       snap.forEach((docu) => arr.push({ id: docu.id, name: docu.data()?.name || docu.id }));
//       setShops(arr);
//     })();
//   }, [ownerKey]);

//   const filteredOrders = useMemo(() => {
//     return selectedShop === "all" ? orders : orders.filter((o) => o.shopId === selectedShop);
//   }, [orders, selectedShop]);

//   const tableData = filteredOrders.map((o) => ({
//     key: o.id,
//     date: (() => {
//       try { if (o.createdAt?.toDate) return o.createdAt.toDate().toISOString().split("T")[0]; } catch {}
//       return (o.createdAtISO || "").split("T")[0] || "";
//     })(),
//     shopId: o.shopId || "",
//     shopName: shops.find((s) => s.id === o.shopId)?.name || "Unknown Shop",
//     totalAmount: Number(o.total || 0),
//   }));

//   const handleShopFilter = (value) => setSelectedShop(value);

//   const handleExportCSV = () => {
//     if (tableData.length === 0) return;
//     const headers = ["Date", "Shop Name", "Total Orders", "Revenue"];
//     const rows = tableData.map((row) => [row.date, row.shopName, 1, `£${row.totalAmount.toFixed(2)}`]);
//     const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     const fileName = `order_reports_${new Date().toISOString().split("T")[0]}.csv`;
//     saveAs(blob, fileName);
//   };

//   const columns = [
//     { title: "Date", dataIndex: "date", key: "date" },
//     { title: "Shop Name", dataIndex: "shopName", key: "shopName" },
//     { title: "Total Orders", key: "totalOrders", render: () => 1 },
//     { title: "Revenue", key: "revenue", render: (_, rec) => `£${rec.totalAmount.toFixed(2)}` },
//   ];

//   return (
//     <div style={{ padding: "2rem" }}>
//       <Card>
//         <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
//           <Title level={4}>Order Reports</Title>
//           <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
//             <RangePicker disabled />
//             <Select placeholder="Select Shop" style={{ width: 180 }} value={selectedShop} onChange={handleShopFilter}>
//               <Option value="all">All Shops</Option>
//               {shops.map((s) => (
//                 <Option key={s.id} value={s.id}>{s.name}</Option>
//               ))}
//             </Select>
//             <Button icon={<DownloadOutlined />} onClick={handleExportCSV} disabled={tableData.length === 0}>
//               Export CSV
//             </Button>
//           </div>
//         </div>

//         <Table
//           columns={columns}
//           dataSource={tableData}
//           locale={{ emptyText: "No orders yet. Add menus first!" }}
//           pagination={{ pageSize: 10 }}
//         />
//       </Card>
//     </div>
//   );
// };

// export default Reports;


// src/admin/Reports.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, Typography, Table, DatePicker, Select, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { collection, collectionGroup, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { saveAs } from "file-saver";
import { useAuth } from "../../context/AuthContext";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

function toEpoch(row) {
  if (row?.createdAt?.toMillis) return row.createdAt.toMillis();
  if (typeof row?.createdAt?.seconds === "number") return row.createdAt.seconds * 1000;
  const t = row?.createdAtISO ? Date.parse(row.createdAtISO) : NaN;
  return Number.isFinite(t) ? t : 0;
}

export default function Reports() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState("all");

  // 🔴 all orders for this admin's shops
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(collectionGroup(db, "orders"), where("shopOwnerUid", "==", currentUser.uid));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => toEpoch(b) - toEpoch(a));
      setOrders(list);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // shops list (adjust path if your shops actually live elsewhere)
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "shops"));
      const arr = [];
      snap.forEach((docu) => arr.push({ id: docu.id, name: docu.data()?.name || docu.id }));
      setShops(arr);
    })();
  }, []);

  const filteredOrders = useMemo(() => {
    return selectedShop === "all" ? orders : orders.filter((o) => o.shopId === selectedShop);
  }, [orders, selectedShop]);

  const tableData = filteredOrders.map((o) => ({
    key: o.id,
    date: (() => {
      const ms = toEpoch(o);
      return ms ? new Date(ms).toISOString().split("T")[0] : "";
    })(),
    shopId: o.shopId || "",
    shopName: shops.find((s) => s.id === o.shopId)?.name || "Unknown Shop",
    totalAmount: Number(o.total || 0),
  }));

  const handleShopFilter = (value) => setSelectedShop(value);

  const handleExportCSV = () => {
    if (tableData.length === 0) return;

    const shopLabel =
    selectedShop === "all"
      ? "all_shops"
      : (shops.find(s => s.id === selectedShop)?.name || selectedShop);

    const headers = ["Date", "Shop Name", "Total Orders", "Revenue"];
    const rows = tableData.map((row) => [row.date, row.shopName, 1, `£${row.totalAmount.toFixed(2)}`]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const fileName = `order_reports_${shopLabel}_${new Date().toISOString().split("T")[0]}.csv`;
    saveAs(blob, fileName);
  };

  const columns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Shop Name", dataIndex: "shopName", key: "shopName" },
    { title: "Total Orders", key: "totalOrders", render: () => 1 },
    { title: "Revenue", key: "revenue", render: (_, rec) => `£${rec.totalAmount.toFixed(2)}` },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <Card>
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <Title level={4}>Order Reports</Title>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <RangePicker disabled />
            <Select placeholder="Select Shop" style={{ width: 180 }} value={selectedShop} onChange={handleShopFilter}>
              <Option value="all">All Shops</Option>
              {shops.map((s) => (
                <Option key={s.id} value={s.id}>{s.name}</Option>
              ))}
            </Select>
            <Button icon={<DownloadOutlined />} onClick={handleExportCSV} disabled={tableData.length === 0}>
              Export CSV
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={tableData}
          locale={{ emptyText: "No orders yet." }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
