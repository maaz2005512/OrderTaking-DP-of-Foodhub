// import React, { useEffect, useState } from "react";
// import { Card, Table, Typography, message } from "antd";
// import { collection, query, where, getDocs } from "firebase/firestore";
// import { db } from "../../firebase";
// import { useAuth } from "../../context/AuthContext";
// import { useParams } from "react-router-dom";

// const { Title } = Typography;

// const WorkerReports = () => {
//   const { currentUser } = useAuth();
//   const { shopId } = useParams();
//   const [summary, setSummary] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const fetchOrders = async () => {
//     if (!shopId) {
//       message.warning("No shop selected.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const q = query(collection(db, "orders"), where("shopId", "==", shopId));
//       const snapshot = await getDocs(q);
//       const data = snapshot.docs.map((doc) => doc.data());

//       const grouped = {};
//       data.forEach((order) => {
//         const dateKey = order.createdAt?.toDate()?.toISOString().split("T")[0];
//         if (!grouped[dateKey]) {
//           grouped[dateKey] = {
//             date: dateKey,
//             totalOrders: 0,
//             totalRevenue: 0,
//           };
//         }
//         grouped[dateKey].totalOrders += 1;
//         grouped[dateKey].totalRevenue += order.totalAmount || 0;
//       });

//       setSummary(Object.values(grouped));
//     } catch (err) {
//       console.error("Error fetching reports:", err);
//       message.error("Failed to load reports.");
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchOrders();
//   }, [shopId]);

//   const columns = [
//     {
//       title: "Date",
//       dataIndex: "date",
//       key: "date",
//     },
//     {
//       title: "Total Orders",
//       dataIndex: "totalOrders",
//       key: "totalOrders",
//     },
//     {
//       title: "Total Revenue",
//       dataIndex: "totalRevenue",
//       key: "totalRevenue",
//       render: (value) => `£${value}`,
//     },
//   ];

//   return (
//     <div style={{ padding: "2rem" }}>
//       <Card>
//         <Title level={4}>Daily Order Summary</Title>
//         <Table
//           columns={columns}
//           dataSource={summary}
//           rowKey="date"
//           loading={loading}
//           pagination={{ pageSize: 5 }}
//           locale={{ emptyText: "No orders yet." }}
//         />
//       </Card>
//     </div>
//   );
// };

// export default WorkerReports;

// import React, { useEffect, useMemo, useState } from "react";
// import { Card, Table, Typography, message } from "antd";
// import { collection, onSnapshot, query } from "firebase/firestore";
// import { db } from "../../firebase";
// import { useAuth } from "../../context/AuthContext";
// import { useParams } from "react-router-dom";
// import { resolveOwnerKey } from "../../utils/resolveOwnerKey";

// const { Title } = Typography;

// const WorkerReports = () => {
//   const { currentUser } = useAuth();
//   const { shopId } = useParams();

//   const [ownerKey, setOwnerKey] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const allowed = (currentUser?.allowedShops || []);
//   const canSee = allowed.length === 0 || allowed.includes(shopId);

//   useEffect(() => {
//     (async () => {
//       if (!currentUser) return;
//       setOwnerKey(await resolveOwnerKey(currentUser));
//     })();
//   }, [currentUser]);

//   useEffect(() => {
//     if (!ownerKey || !shopId) return;
//     if (!canSee) {
//       setOrders([]);
//       message.warning("You are not allowed to view this shop.");
//       return;
//     }
//     setLoading(true);

//     const col = collection(db, "names", ownerKey, "shops", shopId, "orders");
//     const q = query(col);
//     const unsub = onSnapshot(q, (snap) => {
//       const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//       setOrders(list);
//       setLoading(false);
//     }, () => { setOrders([]); setLoading(false); });

//     return () => unsub();
//   }, [ownerKey, shopId, canSee]);

//   const summary = useMemo(() => {
//     const grouped = {};
//     for (const o of orders) {
//       const dateKey = (() => {
//         try { if (o.createdAt?.toDate) return o.createdAt.toDate().toISOString().split("T")[0]; } catch {}
//         return (o.createdAtISO || "").split("T")[0] || "";
//       })();
//       if (!dateKey) continue;
//       if (!grouped[dateKey]) grouped[dateKey] = { date: dateKey, totalOrders: 0, totalRevenue: 0 };
//       grouped[dateKey].totalOrders += 1;
//       grouped[dateKey].totalRevenue += Number(o.total || 0);
//     }
//     return Object.values(grouped).sort((a, b) => (a.date < b.date ? 1 : -1));
//   }, [orders]);

//   const columns = [
//     { title: "Date", dataIndex: "date", key: "date" },
//     { title: "Total Orders", dataIndex: "totalOrders", key: "totalOrders" },
//     { title: "Total Revenue", dataIndex: "totalRevenue", key: "totalRevenue", render: (v) => `£${Number(v || 0).toFixed(2)}` },
//   ];

//   return (
//     <div style={{ padding: "2rem" }}>
//       <Card>
//         <Title level={4}>Daily Order Summary</Title>
//         <Table
//           columns={columns}
//           dataSource={summary}
//           rowKey="date"
//           loading={loading}
//           pagination={{ pageSize: 10 }}
//           locale={{ emptyText: "No orders yet." }}
//         />
//       </Card>
//     </div>
//   );
// };

// export default WorkerReports;

import React, { useEffect, useMemo, useState } from "react";
import { Card, Table, Typography, message, Select, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { collectionGroup, onSnapshot, query, where, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { saveAs } from "file-saver";

const { Title } = Typography;
const { Option } = Select;

function toEpoch(row) {
  if (row?.createdAt?.toMillis) return row.createdAt.toMillis();
  if (typeof row?.createdAt?.seconds === "number") return row.createdAt.seconds * 1000;
  const t = row?.createdAtISO ? Date.parse(row.createdAtISO) : NaN;
  return Number.isFinite(t) ? t : 0;
}

const WorkerReports = () => {
  const { currentUser } = useAuth();

  const [ownerKey, setOwnerKey] = useState(null);
  const [orders, setOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  // FOR USER HAVING ONLY 1 SHOP
  // const [selectedShop, setSelectedShop] = useState("all");
  const [selectedShop, setSelectedShop] = useState(null);
  


  // Get allowed shops
  const allowedShops = currentUser?.allowedShops || [];

  useEffect(() => {
    if (!currentUser) return;

    let key = null;
    if (currentUser.role === "worker" || currentUser.role === "kitchen") {
      key = currentUser.brandOwnerUid;
    } else {
      key = currentUser.uid;
    }

    setOwnerKey(key);
  }, [currentUser]);

  // Fetch all orders for this admin's shops
  useEffect(() => {
    if (!ownerKey) return;
    setLoading(true);

    const q = query(collectionGroup(db, "orders"), where("shopOwnerUid", "==", ownerKey));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => toEpoch(b) - toEpoch(a));
      
      // Filter orders based on worker's allowed shops
      const filteredOrders = allowedShops.length === 0 
        ? list // If no restriction, show all
        : list.filter(order => allowedShops.includes(order.shopId));
      
      setOrders(filteredOrders);
      setLoading(false);
    }, (err) => {
      console.error("Worker Reports error:", err);
      setOrders([]);
      setLoading(false);
    });

    return () => unsub();
  }, [ownerKey, allowedShops]);

  // FOR USER HAVING ONLY 1 SHOP
  useEffect(() => {
  if (allowedShops.length === 1) {
    setSelectedShop(allowedShops[0]);
  } else {
    setSelectedShop("all");
  }
}, [allowedShops]);

  // Fetch shops list
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const snap = await getDocs(collection(db, "shops"));
        const allShops = [];
        snap.forEach((docu) => {
          allShops.push({ 
            id: docu.id, 
            name: docu.data()?.name || docu.id 
          });
        });

        // Filter shops based on worker's allowed shops
        const filteredShops = allowedShops.length === 0 
          ? allShops // If no restriction, show all
          : allShops.filter(shop => allowedShops.includes(shop.id));
        
        setShops(filteredShops);
      } catch (error) {
        console.error("Error fetching shops:", error);
      }
    };

    fetchShops();
  }, [allowedShops]);

  // Filter orders by selected shop
  const filteredOrders = useMemo(() => {
    return selectedShop === "all" ? orders : orders.filter((o) => o.shopId === selectedShop);
  }, [orders, selectedShop]);

  // Generate summary data
  const summary = useMemo(() => {
    const grouped = {};
    for (const o of filteredOrders) {
      const dateKey = (() => {
        try { 
          if (o.createdAt?.toDate) return o.createdAt.toDate().toISOString().split("T")[0]; 
        } catch {}
        return (o.createdAtISO || "").split("T")[0] || "";
      })();
      if (!dateKey) continue;
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = { 
          date: dateKey, 
          totalOrders: 0, 
          totalRevenue: 0,
          shopName: selectedShop === "all" ? "All Shops" : (shops.find(s => s.id === selectedShop)?.name || "Unknown")
        };
      }
      grouped[dateKey].totalOrders += 1;
      grouped[dateKey].totalRevenue += Number(o.total || 0);
    }
    return Object.values(grouped).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [filteredOrders, selectedShop, shops]);

  const handleShopFilter = (value) => setSelectedShop(value);

  const handleExportCSV = () => {
    if (summary.length === 0) {
      message.warning("No data to export");
      return;
    }

    const shopLabel = selectedShop === "all" 
      ? "all_allowed_shops" 
      : (shops.find(s => s.id === selectedShop)?.name || selectedShop);

    const headers = ["Date", "Shop Name", "Total Orders", "Revenue"];
    const rows = summary.map((row) => [
      row.date, 
      row.shopName, 
      row.totalOrders, 
      `£${row.totalRevenue.toFixed(2)}`
    ]);
    
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const fileName = `worker_reports_${shopLabel}_${new Date().toISOString().split("T")[0]}.csv`;
    saveAs(blob, fileName);
    message.success("Report exported successfully!");
  };

  const columns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { 
      title: "Shop Name", 
      key: "shopName", 
      render: (_, record) => selectedShop === "all" ? "All Shops" : (shops.find(s => s.id === selectedShop)?.name || "Unknown")
    },
    { title: "Total Orders", dataIndex: "totalOrders", key: "totalOrders" },
    { 
      title: "Total Revenue", 
      dataIndex: "totalRevenue", 
      key: "totalRevenue", 
      render: (v) => `£${Number(v || 0).toFixed(2)}` 
    },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <Card>
        <div style={{ 
          marginBottom: "1rem", 
          display: "flex", 
          justifyContent: "space-between", 
          flexWrap: "wrap", 
          gap: "1rem" 
        }}>
          <Title level={4}>Daily Order Reports</Title>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Select 
              placeholder="Select Shop" 
              style={{ width: 200 }} 
              value={selectedShop} 
              onChange={handleShopFilter}
            >
              <Option value="all">All Allowed Shops</Option>
              {shops.map((s) => (
                <Option key={s.id} value={s.id}>{s.name}</Option>
              ))}
            </Select>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleExportCSV} 
              disabled={summary.length === 0}
              type="primary"
            >
              Export CSV
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={summary}
          rowKey="date"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "No orders yet." }}
        />
      </Card>
    </div>
  );
};

export default WorkerReports;