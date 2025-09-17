// import React, { useEffect, useMemo, useState } from "react";
// import { Card, Tabs, Table, Tag, message, Button, Space, Popconfirm } from "antd";
// import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
// import { db } from "../../firebase";
// import { useAuth } from "../../context/AuthContext";
// import { useParams } from "react-router-dom";
// // import { resolveOwnerKey } from "../../utils/resolveOwnerKey";
// import { updateOrderStatus, ORDER_STATUS } from "../../utils/updateOrder";

// const { TabPane } = Tabs;

// const STATUS = {
//   Pending: "Pending",
//   Accepted: "Accepted",
//   Preparing: "Preparing",
//   OnTheWay: "OnTheWay",
//   Completed: "Completed",
//   Cancelled: "Cancelled",
// };
// const colorFor = (s) => {
//   switch (s) {
//     case STATUS.Pending: return "orange";
//     case STATUS.Accepted: return "geekblue";
//     case STATUS.Preparing: return "gold";
//     case STATUS.OnTheWay: return "blue";
//     case STATUS.Completed: return "green";
//     case STATUS.Cancelled: return "red";
//     default: return "default";
//   }
// };

// const WorkerOrders = () => {
//   const { currentUser } = useAuth();
//   const { shopId } = useParams();

//   const [ownerKey, setOwnerKey] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("current");

//   // allowed shops check (from currentUser doc)
//   const allowed = (currentUser?.allowedShops || []);
//   const canSee = allowed.length === 0 || allowed.includes(shopId);

//   useEffect(() => {
//   if (!currentUser) return;

//   let key = null;
//   if (currentUser.role === "worker" || currentUser.role === "kitchen") {
//     key = currentUser.brandOwnerUid;   // ✅ brand/admin owner uid
//   } else {
//     key = currentUser.uid;             // ✅ admin apna uid
//   }

//   setOwnerKey(key);
// }, [currentUser]);

//   // useEffect(() => {
//   //   (async () => {
//   //     if (!currentUser) return;
//   //     setOwnerKey(await resolveOwnerKey(currentUser));
//   //   })();
//   // }, [currentUser]);

//   useEffect(() => {
//     if (!ownerKey || !shopId) return;
//     if (!canSee) {
//       setOrders([]);
//       message.warning("You are not allowed to view this shop.");
//       return;
//     }
//     setLoading(true);


//     const col = collection(db, "names", ownerKey, "shops", shopId, "orders");
//     const q = query(col, orderBy("createdAt", "desc"));

//     const unsub = onSnapshot(q, (snap) => {
//       // const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//       // setOrders(list);
//       const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//       setOrders(list);
      
//            setLoading(false);
//     }, (err) => {
//       console.error("WorkerOrders live error:", err);
//       setOrders([]);
//       setLoading(false);
//     });

//     return () => unsub();
//   }, [ownerKey, shopId, canSee]);

//   const currentStatuses = [STATUS.Pending, STATUS.Accepted, STATUS.Preparing];
//   const onTheWayStatuses = [STATUS.OnTheWay];
//   const completedStatuses = [STATUS.Completed];

//   const filtered = useMemo(() => {
//     const map = {
//       current: (o) => currentStatuses.includes(o.status),
//       on_the_way: (o) => onTheWayStatuses.includes(o.status),
//       completed: (o) => completedStatuses.includes(o.status),
//     };
//     return orders.filter(map[activeTab] || (() => true));
//   }, [orders, activeTab]);

//   const columns = [
//     {
//       title: "Customer",
//       key: "customer",
//       render: (_, row) => `${row.customerFirstName || ""} ${row.customerLastName || ""}`.trim() || "-",
//     },
//     { title: "Phone", dataIndex: "customerPhone", key: "customerPhone", render: (v) => v || "-" },
//     { title: "Items", dataIndex: "items", key: "items", render: (items) => items?.map((i) => i.name).join(", ") || "-" },
//     { title: "Total", dataIndex: "total", key: "total", render: (amt) => `£${Number(amt || 0).toFixed(2)}` },
//     { title: "Status", dataIndex: "status", key: "status", render: (s) => <Tag color={colorFor(s)}>{s}</Tag> },
//     {
//       title: "Created",
//       dataIndex: "createdAt",
//       key: "createdAt",
//       render: (ts, row) => {
//         try { if (ts?.toDate) return ts.toDate().toLocaleString(); } catch {}
//         return row.createdAtISO || "-";
//       },
//     },

//     // ✅ Actions column (status updates)
//     {
//       title: "Actions",
//       key: "actions",
//       render: (_, row) => (
//         <Space wrap>
//           {row.status === ORDER_STATUS.Pending   && (
//             <Button size="small" type="primary"
//               onClick={() => updateOrderStatus({ ownerKey, shopId, orderId: row.id, to: ORDER_STATUS.Accepted })}
//             >
//               Accept
//             </Button>
//           )}
//           {row.status === ORDER_STATUS.Accepted  && (
//             <Button size="small"
//               onClick={() => updateOrderStatus({ ownerKey, shopId, orderId: row.id, to: ORDER_STATUS.Preparing })}
//             >
//               Start Prep
//             </Button>
//           )}
//           {row.status === ORDER_STATUS.Preparing && (
//             <Button size="small"
//               onClick={() => updateOrderStatus({ ownerKey, shopId, orderId: row.id, to: ORDER_STATUS.OnTheWay })}
//             >
//               Out for Delivery
//             </Button>
//           )}
//           {row.status === ORDER_STATUS.OnTheWay  && (
//             <Button size="small"
//               onClick={() => updateOrderStatus({ ownerKey, shopId, orderId: row.id, to: ORDER_STATUS.Completed })}
//             >
//               Complete
//             </Button>
//           )}
//           {row.status !== ORDER_STATUS.Completed && row.status !== ORDER_STATUS.Cancelled && (
//             <Popconfirm title="Cancel this order?"
//               onConfirm={() => updateOrderStatus({ ownerKey, shopId, orderId: row.id, to: ORDER_STATUS.Cancelled })}
//             >
//               <Button size="small" danger>Cancel</Button>
//             </Popconfirm>
//           )}
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div style={{ padding: "2rem" }}>
//       <Card title={`Orders – ${shopId}`}>
//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <TabPane tab="Current" key="current">
//             <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
//           </TabPane>
//           <TabPane tab="On the Way" key="on_the_way">
//             <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
//           </TabPane>
//           <TabPane tab="Completed" key="completed">
//             <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
//           </TabPane>
//         </Tabs>
//       </Card>
//     </div>
//   );
// };

// export default WorkerOrders;

// import React, { useEffect, useMemo, useState } from "react";
// import { Card, Tabs, Table, Tag, message, Button, Space, Popconfirm } from "antd";
// import { collectionGroup, onSnapshot, orderBy, query, where, and } from "firebase/firestore";
// import { db } from "../../firebase";
// import { useAuth } from "../../context/AuthContext";
// import { useParams } from "react-router-dom";
// import { updateOrderStatus, ORDER_STATUS } from "../../utils/updateOrder";

// const { TabPane } = Tabs;

// const STATUS = {
//   Pending: "Pending",
//   Accepted: "Accepted",
//   Preparing: "Preparing",
//   OnTheWay: "OnTheWay",
//   Completed: "Completed",
//   Cancelled: "Cancelled",
// };

// const colorFor = (s) => {
//   switch (s) {
//     case STATUS.Pending: return "orange";
//     case STATUS.Accepted: return "geekblue";
//     case STATUS.Preparing: return "gold";
//     case STATUS.OnTheWay: return "blue";
//     case STATUS.Completed: return "green";
//     case STATUS.Cancelled: return "red";
//     default: return "default";
//   }
// };

// const WorkerOrders = () => {
//   const { currentUser } = useAuth();
//   const { shopId } = useParams();

//   const [ownerKey, setOwnerKey] = useState(null);
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("current");

//   // allowed shops check (from currentUser doc)
//   const allowed = (currentUser?.allowedShops || []);
//   const canSee = allowed.length === 0 || allowed.includes(shopId);

//   useEffect(() => {
//     if (!currentUser) return;

//     let key = null;
//     if (currentUser.role === "worker" || currentUser.role === "kitchen") {
//       key = currentUser.brandOwnerUid;   // ✅ brand/admin owner uid
//     } else {
//       key = currentUser.uid;             // ✅ admin apna uid
//     }

//     setOwnerKey(key);
//   }, [currentUser]);

//   useEffect(() => {
//     if (!ownerKey || !shopId) return;
//     if (!canSee) {
//       setOrders([]);
//       message.warning("You are not allowed to view this shop.");
//       return;
//     }
//     setLoading(true);

//     // ✅ FIXED: Use collectionGroup query like AdminOrders
//     // Query all orders where shopOwnerUid matches the admin and shopId matches
//     const q = query(
//       collectionGroup(db, "orders"),
//       and(
//         where("shopOwnerUid", "==", ownerKey),
//         where("shopId", "==", shopId)
//       ),
//       orderBy("createdAt", "desc")
//     );

//     const unsub = onSnapshot(q, (snap) => {
//       const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//       setOrders(list);
//       setLoading(false);
//     }, (err) => {
//       console.error("WorkerOrders live error:", err);
//       setOrders([]);
//       setLoading(false);
//     });

//     return () => unsub();
//   }, [ownerKey, shopId, canSee]);

//   const currentStatuses = [STATUS.Pending, STATUS.Accepted, STATUS.Preparing];
//   const onTheWayStatuses = [STATUS.OnTheWay];
//   const completedStatuses = [STATUS.Completed];

//   const filtered = useMemo(() => {
//     const map = {
//       current: (o) => currentStatuses.includes(o.status),
//       on_the_way: (o) => onTheWayStatuses.includes(o.status),
//       completed: (o) => completedStatuses.includes(o.status),
//     };
//     return orders.filter(map[activeTab] || (() => true));
//   }, [orders, activeTab]);

//   const columns = [
//     {
//       title: "Customer",
//       key: "customer",
//       render: (_, row) => `${row.customerFirstName || ""} ${row.customerLastName || ""}`.trim() || "-",
//     },
//     { title: "Phone", dataIndex: "customerPhone", key: "customerPhone", render: (v) => v || "-" },
//     { title: "Items", dataIndex: "items", key: "items", render: (items) => items?.map((i) => i.name).join(", ") || "-" },
//     { title: "Total", dataIndex: "total", key: "total", render: (amt) => `£${Number(amt || 0).toFixed(2)}` },
//     { title: "Status", dataIndex: "status", key: "status", render: (s) => <Tag color={colorFor(s)}>{s}</Tag> },
//     {
//       title: "Created",
//       dataIndex: "createdAt",
//       key: "createdAt",
//       render: (ts, row) => {
//         try { if (ts?.toDate) return ts.toDate().toLocaleString(); } catch {}
//         return row.createdAtISO || "-";
//       },
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (_, row) => (
//         <Space wrap>
//           {row.status === ORDER_STATUS.Pending && (
//             <Button size="small" type="primary"
//               onClick={() => updateOrderStatus({ 
//                 ownerKey: row.ownerKey, // Use the ownerKey from the order document
//                 shopId: row.shopId, 
//                 orderId: row.id, 
//                 to: ORDER_STATUS.Accepted 
//               })}
//             >
//               Accept
//             </Button>
//           )}
//           {row.status === ORDER_STATUS.Accepted && (
//             <Button size="small"
//               onClick={() => updateOrderStatus({ 
//                 ownerKey: row.ownerKey, 
//                 shopId: row.shopId, 
//                 orderId: row.id, 
//                 to: ORDER_STATUS.Preparing 
//               })}
//             >
//               Start Prep
//             </Button>
//           )}
//           {row.status === ORDER_STATUS.Preparing && (
//             <Button size="small"
//               onClick={() => updateOrderStatus({ 
//                 ownerKey: row.ownerKey, 
//                 shopId: row.shopId, 
//                 orderId: row.id, 
//                 to: ORDER_STATUS.OnTheWay 
//               })}
//             >
//               Out for Delivery
//             </Button>
//           )}
//           {row.status === ORDER_STATUS.OnTheWay && (
//             <Button size="small"
//               onClick={() => updateOrderStatus({ 
//                 ownerKey: row.ownerKey, 
//                 shopId: row.shopId, 
//                 orderId: row.id, 
//                 to: ORDER_STATUS.Completed 
//               })}
//             >
//               Complete
//             </Button>
//           )}
//           {row.status !== ORDER_STATUS.Completed && row.status !== ORDER_STATUS.Cancelled && (
//             <Popconfirm title="Cancel this order?"
//               onConfirm={() => updateOrderStatus({ 
//                 ownerKey: row.ownerKey, 
//                 shopId: row.shopId, 
//                 orderId: row.id, 
//                 to: ORDER_STATUS.Cancelled 
//               })}
//             >
//               <Button size="small" danger>Cancel</Button>
//             </Popconfirm>
//           )}
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div style={{ padding: "2rem" }}>
//       <Card title={`Orders – ${shopId}`}>
//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <TabPane tab="Current" key="current">
//             <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
//           </TabPane>
//           <TabPane tab="On the Way" key="on_the_way">
//             <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
//           </TabPane>
//           <TabPane tab="Completed" key="completed">
//             <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
//           </TabPane>
//         </Tabs>
//       </Card>
//     </div>
//   );
// };

// export default WorkerOrders;

import React, { useEffect, useMemo, useState } from "react";
import { Card, Tabs, Table, Tag, message, Button, Space, Popconfirm, Modal } from "antd";
import { collectionGroup, onSnapshot, orderBy, query, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useParams } from "react-router-dom";
import { updateOrderStatus, ORDER_STATUS } from "../../utils/updateOrder";

const { TabPane } = Tabs;

// Currency formatting helper
const POUND = "£";

function money(n) {
  const v = Number(n || 0).toFixed(2);
  return POUND + v;
}

const STATUS = {
  Pending: "Pending",
  Accepted: "Accepted",
  Preparing: "Preparing",
  OnTheWay: "OnTheWay",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const colorFor = (s) => {
  switch (s) {
    case STATUS.Pending: return "orange";
    case STATUS.Accepted: return "geekblue";
    case STATUS.Preparing: return "gold";
    case STATUS.OnTheWay: return "blue";
    case STATUS.Completed: return "green";
    case STATUS.Cancelled: return "red";
    default: return "default";
  }
};

// Receipt slip generator (copied from AdminOrders)
function generateSlip(order) {
  const lines = [];

  lines.push("***** NEW ORDER *****");
  lines.push(`Order ID: ${order.id}`);
  lines.push(`Type: ${order.orderType || "Delivery"}`);
  lines.push(`Payment: ${order.paymentMethod || "Not Paid"}`);
  lines.push("-".repeat(50));

  (order.items || []).forEach((it) => {
    const qty = it.qty || 1;
    const size = it.size?.label ? ` (${it.size.label})` : "";
    const name = `${qty}x ${it.name || ""}${size}`;
    lines.push(`${name} - ${money(it.unitPrice)}`);

    if (Array.isArray(it.toppings)) {
      it.toppings.forEach((t) => {
        const extra = t.price > 0 ? ` +${money(t.price)}` : "";
        lines.push(`  - ${t.label}${extra}`);
      });
    }
    if (it.sauce) lines.push(`  - Sauce: ${it.sauce.label}`);
    if (it.drink) lines.push(`  - Drink: ${it.drink.label}`);
  });

  lines.push("-".repeat(50));
  lines.push(`Subtotal: ${money(order.subtotal)}`);
  if (order.discountAmount > 0) lines.push(`Discount: -${money(order.discountAmount)}`);
  if (order.deliveryCharge > 0) lines.push(`Delivery: ${money(order.deliveryCharge)}`);
  if (order.serviceCharge > 0) lines.push(`Service: ${money(order.serviceCharge)}`);
  lines.push(`TOTAL: ${money(order.total)}`);
  lines.push(`Paid by: ${order.paymentMethod || "Not Paid"}`);
  lines.push("-".repeat(50));

  const fullName = [order.customerFirstName, order.customerLastName].filter(Boolean).join(" ");
  lines.push(`Customer: ${fullName}`);
  lines.push(`Phone: ${order.customerPhone || ""}`);
  if (order.address) lines.push(`Address: ${order.address}`);

  return lines.join("\n");
}

// Helper function to get admin UID from shops
async function findAdminUidFromShops(allowedShops) {
  if (!allowedShops || allowedShops.length === 0) return null;
  
  try {
    const shopRef = doc(db, "shops", allowedShops[0]);
    const shopSnap = await getDoc(shopRef);
    
    if (shopSnap.exists()) {
      const shopData = shopSnap.data();
      return shopData.ownerUid || shopData.adminUid || shopData.createdByUid || null;
    }
  } catch (error) {
    console.error("Error finding admin UID:", error);
  }
  return null;
}

// Auto-fix missing brandOwnerUid
async function autoFixBrandOwnerUid(currentUser) {
  if (!currentUser.uid) return null;
  
  console.log("Auto-fixing missing brandOwnerUid for:", currentUser.email);
  
  const adminUid = await findAdminUidFromShops(currentUser.allowedShops);
  
  if (adminUid) {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        brandOwnerUid: adminUid
      });
      
      console.log("Fixed brandOwnerUid:", adminUid);
      message.success("Account configuration updated!");
      
      return adminUid;
    } catch (error) {
      console.error("Error updating brandOwnerUid:", error);
      message.error("Failed to update account configuration");
    }
  } else {
    console.error("Could not determine admin UID");
    message.error("Could not determine admin. Please contact administrator.");
  }
  
  return null;
}

const WorkerOrders = () => {
  const { currentUser } = useAuth();
  const { shopId } = useParams();

  const [ownerKey, setOwnerKey] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("current");
  const [fixingAccount, setFixingAccount] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // allowed shops check (from currentUser doc)
  const allowed = (currentUser?.allowedShops || []);
  const canSee = allowed.length === 0 || allowed.includes(shopId);

  useEffect(() => {
    const setupOwnerKey = async () => {
      if (!currentUser) return;

      let key = null;
      
      if (currentUser.role === "worker" || currentUser.role === "kitchen") {
        key = currentUser.brandOwnerUid;
        
        if (!key) {
          console.log("Missing brandOwnerUid - attempting auto-fix...");
          setFixingAccount(true);
          key = await autoFixBrandOwnerUid(currentUser);
          setFixingAccount(false);
        }
      } else {
        key = currentUser.uid;
      }

      setOwnerKey(key);
    };

    setupOwnerKey();
  }, [currentUser]);

  useEffect(() => {
    if (!ownerKey || !shopId) return;
    if (!canSee) {
      setOrders([]);
      message.warning("You are not allowed to view this shop.");
      return;
    }
    
    setLoading(true);

    const timeoutId = setTimeout(() => {
      setLoading(false);
      message.error("Loading timeout. Please try refreshing.");
    }, 15000);

    const q = query(
      collectionGroup(db, "orders"),
      where("shopOwnerUid", "==", ownerKey),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      clearTimeout(timeoutId);
      
      const allOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const filteredByShop = allOrders.filter(order => order.shopId === shopId);
      
      setOrders(filteredByShop);
      setLoading(false);
    }, (err) => {
      clearTimeout(timeoutId);
      console.error("WorkerOrders live error:", err);
      
      if (err.code === 'permission-denied') {
        message.error("Access denied. Please contact administrator.");
      } else if (err.code === 'failed-precondition') {
        message.error("Database index required. Please contact administrator.");
      } else {
        message.error(`Query failed: ${err.message}`);
      }
      
      setOrders([]);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsub();
    };
  }, [ownerKey, shopId, canSee, currentUser]);

  const currentStatuses = [STATUS.Pending, STATUS.Accepted, STATUS.Preparing];
  const onTheWayStatuses = [STATUS.OnTheWay];
  const completedStatuses = [STATUS.Completed];

  const filtered = useMemo(() => {
    const map = {
      current: (o) => currentStatuses.includes(o.status),
      on_the_way: (o) => onTheWayStatuses.includes(o.status),
      completed: (o) => completedStatuses.includes(o.status),
    };
    return orders.filter(map[activeTab] || (() => true));
  }, [orders, activeTab]);

  const columns = [
    {
      title: "Customer",
      key: "customer",
      render: (_, row) => `${row.customerFirstName || ""} ${row.customerLastName || ""}`.trim() || "-",
    },
    { title: "Phone", dataIndex: "customerPhone", key: "customerPhone", render: (v) => v || "-" },
    { title: "Items", dataIndex: "items", key: "items", render: (items) => items?.map((i) => i.name).join(", ") || "-" },
    { title: "Total", dataIndex: "total", key: "total", render: (amt) => `£${Number(amt || 0).toFixed(2)}` },
    { title: "Status", dataIndex: "status", key: "status", render: (s) => <Tag color={colorFor(s)}>{s}</Tag> },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (ts, row) => {
        try { if (ts?.toDate) return ts.toDate().toLocaleString(); } catch {}
        return row.createdAtISO || "-";
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
          {row.status === ORDER_STATUS.Pending && (
            <Button size="small" type="primary"
              onClick={() => updateOrderStatus({ 
                ownerKey: row.ownerKey,
                shopId: row.shopId, 
                orderId: row.id, 
                to: ORDER_STATUS.Accepted 
              })}
            >
              Accept
            </Button>
          )}
          {row.status === ORDER_STATUS.Accepted && (
            <Button size="small"
              onClick={() => updateOrderStatus({ 
                ownerKey: row.ownerKey, 
                shopId: row.shopId, 
                orderId: row.id, 
                to: ORDER_STATUS.Preparing 
              })}
            >
              Start Prep
            </Button>
          )}
          {row.status === ORDER_STATUS.Preparing && (
            <Button size="small"
              onClick={() => updateOrderStatus({ 
                ownerKey: row.ownerKey, 
                shopId: row.shopId, 
                orderId: row.id, 
                to: ORDER_STATUS.OnTheWay 
              })}
            >
              Out for Delivery
            </Button>
          )}
          {row.status === ORDER_STATUS.OnTheWay && (
            <Button size="small"
              onClick={() => updateOrderStatus({ 
                ownerKey: row.ownerKey, 
                shopId: row.shopId, 
                orderId: row.id, 
                to: ORDER_STATUS.Completed 
              })}
            >
              Complete
            </Button>
          )}
          {row.status !== ORDER_STATUS.Completed && row.status !== ORDER_STATUS.Cancelled && (
            <Popconfirm title="Cancel this order?"
              onConfirm={() => updateOrderStatus({ 
                ownerKey: row.ownerKey, 
                shopId: row.shopId, 
                orderId: row.id, 
                to: ORDER_STATUS.Cancelled 
              })}
            >
              <Button size="small" danger>Cancel</Button>
            </Popconfirm>
          )}

          <Button size="small" onClick={() => setSelectedOrder(row)}>View Details</Button>
        </Space>
      ),
    },
  ];

  // Modal to show order details (copied from AdminOrders)
  const renderOrderDetails = (order) => {
    return (
      <Modal
        title={`Order Details - ${order.id}`}
        open={Boolean(selectedOrder)}
        onCancel={() => setSelectedOrder(null)}
        footer={null}
        width={600}
      >
        <div>
          <h3>Items:</h3>
          {order.items.map((item, index) => (
            <div key={index} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{item.name} - {money(item.unitPrice)}</span>
              </div>

              {/* Render modifiers and extras */}
              {item.toppings && item.toppings.map((t, idx) => (
                <div key={idx} style={{ paddingLeft: "20px" }}>
                  <span>- {t.label} {t.price > 0 ? ` +${money(t.price)}` : ""}</span>
                </div>
              ))}
              {item.sauce && (
                <div style={{ paddingLeft: "20px" }}>
                  <span>- Sauce: {item.sauce.label}</span>
                </div>
              )}
              {item.drink && (
                <div style={{ paddingLeft: "20px" }}>
                  <span>- Drink: {item.drink.label}</span>
                </div>
              )}
            </div>
          ))}

          <h3>Customer Info:</h3>
          <p>{order.customerFirstName} {order.customerLastName}</p>
          <p>{order.customerPhone}</p>
          <p>{order.address}</p>
          <h3>Total: £{order.total}</h3>
        </div>
      </Modal>
    );
  };

  if (fixingAccount) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <Card>
          <h3>Setting up your account...</h3>
          <p>Please wait while we configure your access.</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <Card title={`Orders – ${shopId}`}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Current" key="current">
            <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
          </TabPane>
          <TabPane tab="On the Way" key="on_the_way">
            <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
          </TabPane>
          <TabPane tab="Completed" key="completed">
            <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
          </TabPane>
        </Tabs>
      </Card>

      {/* Render order details modal */}
      {selectedOrder && renderOrderDetails(selectedOrder)}
    </div>
  );
};

export default WorkerOrders;