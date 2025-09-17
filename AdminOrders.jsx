// // src/admin/Orders.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import { Card, Tabs, Table, Tag, message, Button, Space, Popconfirm } from "antd";
// import { collectionGroup, onSnapshot, query, where, doc, getDoc } from "firebase/firestore";
// import { db } from "../../firebase";
// import { useAuth } from "../../context/AuthContext";
// import { updateOrderStatus, ORDER_STATUS } from "../../utils/updateOrder";

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

// function toEpoch(row) {
//   if (row?.createdAt?.toMillis) return row.createdAt.toMillis();
//   if (typeof row?.createdAt?.seconds === "number") return row.createdAt.seconds * 1000;
//   const t = row?.createdAtISO ? Date.parse(row.createdAtISO) : NaN;
//   return Number.isFinite(t) ? t : 0;
// }

// export default function AdminOrders() {
//   const { currentUser } = useAuth();
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("current");


//   useEffect(() => {
//     if (!currentUser?.uid) return;
//     setLoading(true);

//     // 🔑 show ALL orders for shops owned by this admin
//     const q = query(collectionGroup(db, "orders"), where("shopOwnerUid", "==", currentUser.uid));

//     const unsub = onSnapshot(
//       q,
//       (snap) => {
//         const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//         list.sort((a, b) => toEpoch(b) - toEpoch(a)); // client-side sort (no composite index needed)
//         setOrders(list);
//         setLoading(false);
//       },
//       (err) => {
//         console.error("AdminOrders live error:", err);
//         message.error("Failed to subscribe live orders.");
//         setLoading(false);
//       }
//     );
//     return () => unsub();
//   }, [currentUser?.uid]);

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
//     { title: "Customer", key: "customer", render: (_, r) => `${r.customerFirstName || ""} ${r.customerLastName || ""}`.trim() || "-" },
//     { title: "Phone", dataIndex: "customerPhone", key: "customerPhone", render: (v) => v || "-" },
//     { title: "Items", dataIndex: "items", key: "items", render: (items) => items?.map((i) => i?.name).filter(Boolean).join(", ") || "-", responsive: ["md"] },
//     { title: "Total", dataIndex: "total", key: "total", render: (amt) => `£${Number(amt || 0).toFixed(2)}` },
//     { title: "Status", dataIndex: "status", key: "status", render: (s) => <Tag color={colorFor(s)}>{s}</Tag> },
//     { title: "Created", key: "createdAt", render: (_, r) => (toEpoch(r) ? new Date(toEpoch(r)).toLocaleString() : "-") },

//     {
//       title: "Actions",
//       key: "actions",
//       render: (_, row) => (
//         <Space wrap>
//           {row.status === ORDER_STATUS.Pending && (
//             <Button size="small" type="primary"
//               onClick={() => updateOrderStatus({ ownerKey: row.ownerKey, shopId: row.shopId, orderId: row.id, to: ORDER_STATUS.Accepted })}
//             >
//               Accept
//             </Button>
//           )}
//           {row.status === ORDER_STATUS.Accepted && (
//             <Button size="small"
//               onClick={() => updateOrderStatus({ ownerKey: row.ownerKey, shopId: row.shopId, orderId: row.id, to: ORDER_STATUS.Preparing })}
//             >
//               Start Prep
//             </Button>
//           )}
//           {row.status === ORDER_STATUS.Preparing && (
//             <Button size="small"
//               onClick={() => updateOrderStatus({ ownerKey: row.ownerKey, shopId: row.shopId, orderId: row.id, to: ORDER_STATUS.OnTheWay })}
//             >
//               Out for Delivery
//             </Button>
//           )}
//           {row.status === ORDER_STATUS.OnTheWay && (
//             <Button size="small"
//               onClick={() => updateOrderStatus({ ownerKey: row.ownerKey, shopId: row.shopId, orderId: row.id, to: ORDER_STATUS.Completed })}
//             >
//               Complete
//             </Button>
//           )}
//           {row.status !== ORDER_STATUS.Completed && row.status !== ORDER_STATUS.Cancelled && (
//             <Popconfirm title="Cancel this order?"
//               onConfirm={() => updateOrderStatus({ ownerKey: row.ownerKey, shopId: row.shopId, orderId: row.id, to: ORDER_STATUS.Cancelled })}
//             >
//               <Button size="small" danger>Cancel</Button>
//             </Popconfirm>
//           )}

//         </Space>
//       ),
//     },
//   ];

//   const items = [
//     { key: "current", label: "Current", children: <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }}  
//     /> },

//     { key: "on_the_way", label: "On the Way", children: <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} 
//     /> },

//     { key: "completed", label: "Completed", children: <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} 
//     /> },
//   ];

//   return (
//     <div style={{ padding: "2rem" }}>
//       <Card title="Your Orders by Status">
//         <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
//       </Card>

      

//     </div>
//   );
// }


import React, { useEffect, useState, useMemo } from "react";
import { Card, Tabs, Table, Tag, message, Button, Space, Modal, Popconfirm } from "antd";
import { collectionGroup, collection, onSnapshot, query, where, doc, getDoc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { EditOutlined } from '@ant-design/icons';
import { addItemToOrder, editItemInOrder } from "../../../src/utils/updateOrder"; // Import new functions
 import { updateOrderStatus, ORDER_STATUS } from "../../utils/updateOrder";

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

function toEpoch(row) {
  if (row?.createdAt?.toMillis) return row.createdAt.toMillis();
  if (typeof row?.createdAt?.seconds === "number") return row.createdAt.seconds * 1000;
  const t = row?.createdAtISO ? Date.parse(row.createdAtISO) : NaN;
  return Number.isFinite(t) ? t : 0;
}

// Receipt slip generator (updated for layout)
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

export default function AdminOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
   const [shops, setShops] = useState([]);
  const [activeTab, setActiveTab] = useState("current");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
 const [editingItem, setEditingItem] = useState(null);


 // 🔹 fetch shops only once
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "shops"));
        const arr = [];
        snap.forEach((docu) => arr.push({ id: docu.id, name: docu.data()?.name || docu.id }));
        setShops(arr);
      } catch (err) {
        console.error("Error fetching shops:", err);
      }
    })();
  }, []);


  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoading(true);

    const q = query(collectionGroup(db, "orders"), where("shopOwnerUid", "==", currentUser.uid));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => toEpoch(b) - toEpoch(a));
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error("AdminOrders live error:", err);
        message.error("Failed to subscribe live orders.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [currentUser?.uid]);

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
      title: "Shop", 
      key: "shopName", 
      render: (_, row) => shops.find((s) => s.id === row.shopId)?.name || "-" 
    },
    { title: "Customer", key: "customer", render: (_, r) => `${r.customerFirstName || ""} ${r.customerLastName || ""}`.trim() || "-" },
    { title: "Phone", dataIndex: "customerPhone", key: "customerPhone", render: (v) => v || "-" },
    { title: "Items", dataIndex: "items", key: "items", render: (items) => items?.map((i) => i?.name).filter(Boolean).join(", ") || "-", responsive: ["md"] },
    { title: "Total", dataIndex: "total", key: "total", render: (amt) => `£${Number(amt || 0).toFixed(2)}` },
    { title: "Status", dataIndex: "status", key: "status", render: (s) => <Tag color={colorFor(s)}>{s}</Tag> },
    // { title: "Created", key: "createdAt", render: (_, r) => (r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleString() : "-") },
    {
  title: "Created",
  key: "createdAt",
  render: (_, r) => {
    try {
      if (r?.createdAt?.toDate) {
        return r.createdAt.toDate().toLocaleString();
      }
      if (typeof r?.createdAt?.seconds === "number") {
        return new Date(r.createdAt.seconds * 1000).toLocaleString();
      }
      if (r?.createdAtISO) {
        return new Date(r.createdAtISO).toLocaleString();
      }
    } catch (e) {
      console.error("Date render error:", e);
    }
    return "-";
  },
},


    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Space wrap>
           {row.status === ORDER_STATUS.Pending && (
            <Button size="small" type="primary"
              onClick={() => updateOrderStatus({ ownerKey: row.ownerKey, shopId: row.shopId, orderId: row.id, to: ORDER_STATUS.Accepted })}
            >
              Accept
            </Button>
          )}
          {row.status === ORDER_STATUS.Accepted && (
            <Button size="small"
              onClick={() => updateOrderStatus({ ownerKey: row.ownerKey, shopId: row.shopId, orderId: row.id, to: ORDER_STATUS.Preparing })}
            >
              Start Prep
            </Button>
          )}
          {row.status === ORDER_STATUS.Preparing && (
            <Button size="small"
              onClick={() => updateOrderStatus({ ownerKey: row.ownerKey, shopId: row.shopId, orderId: row.id, to: ORDER_STATUS.OnTheWay })}
            >
              Out for Delivery
            </Button>
          )}
          {row.status === ORDER_STATUS.OnTheWay && (
            <Button size="small"
              onClick={() => updateOrderStatus({ ownerKey: row.ownerKey, shopId: row.shopId, orderId: row.id, to: ORDER_STATUS.Completed })}
            >
              Complete
            </Button>
          )}
          {row.status !== ORDER_STATUS.Completed && row.status !== ORDER_STATUS.Cancelled && (
            <Popconfirm title="Cancel this order?"
              onConfirm={() => updateOrderStatus({ ownerKey: row.ownerKey, shopId: row.shopId, orderId: row.id, to: ORDER_STATUS.Cancelled })}
            >
              <Button size="small" danger>Cancel</Button>
            </Popconfirm>
          )}

          <Button size="small" onClick={() => setSelectedOrder(row)}>View Details</Button>
        </Space>
      ),
    },
  ];

  const items = [
    { key: "current", label: "Current", children: <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} /> },
    { key: "on_the_way", label: "On the Way", children: <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} /> },
    { key: "completed", label: "Completed", children: <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} /> },
  ];

  

// Handle closing of Order Details Modal and Edit Modal simultaneously
const handleOrderDetailsClose = () => {
  setSelectedOrder(null); // Close the Order Details Modal
  setEditModalVisible(false); // Close the Edit Modal when Order Details is closed
};

// Modal to show order details
const renderOrderDetails = (order) => {
  const slip = generateSlip(order); // Directly use the generateSlip logic

  return (
    <Modal
      title={`Order Details - ${order.id}`}
      open={Boolean(selectedOrder)}
      onCancel={handleOrderDetailsClose} // Handle closing both modals
      footer={null}
      width={600}
      style={{
        position: "relative",
        zIndex: 1050, // Add zIndex for the order details modal (lower than edit modal)
      }}
    >
      <div>
        <h3>Items:</h3>
        {order.items.map((item, index) => (
          <div key={index} style={{ marginBottom: 10 }}>
            {/* Main Category Item with Edit Icon */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{item.name} - {money(item.unitPrice)}</span>
              {/* Edit Icon for main category only */}
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => {
                  setEditingItem(item);
                  setEditModalVisible(true); // Open Edit Modal when pencil is clicked
                }}
                style={{ marginLeft: 10 }}
              />
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
        {/* Add New Item Button */}
        <Button type="primary" onClick={() => handleAddItem(order.id)}>Add New Item</Button>

        <h3>Customer Info:</h3>
        <p>{order.customerFirstName} {order.customerLastName}</p>
        <p>{order.customerPhone}</p>
        <p>{order.address}</p>
        <h3>Total: £{order.total}</h3>
      </div>
    </Modal>
  );
};
  
const handleAddItem = async (orderId) => {
  const newName = prompt("Enter item name");
  const newPrice = parseFloat(prompt("Enter item price"));

  const newToppings = []; // Example: populate this array by prompts or checkboxes
  const newSauce = prompt("Enter Sauce");
  const newDrink = prompt("Enter Drink");

  const newItem = {
    name: newName,
    unitPrice: newPrice,
    toppings: newToppings,  // Collect these from the user
    sauce: newSauce,
    drink: newDrink,
    qty: 1,
  };

  const orderRef = doc(db, "names", selectedOrder.ownerKey, "shops", selectedOrder.shopId, "orders", orderId); 

  // Fetch the order document to check if it exists
  const orderDoc = await getDoc(orderRef);

  if (!orderDoc.exists()) {
    message.error("Order not found.");
    return;
  }

  // Update the order with the new item
  const updatedOrder = {
    ...selectedOrder,
    items: [...selectedOrder.items, newItem],  // Add the new item to the list
  };

  // Recalculate the total
  const updatedTotal = updatedOrder.items.reduce((total, item) => {
    return total + (item.unitPrice * item.qty);
  }, 0);

  try {
    // Directly update the Firestore document with the new item
      await updateDoc(orderRef, { 
      items: updatedOrder.items,
      total: updatedTotal,
    });
    // await updateDoc(orderRef, { items: updatedOrder.items });
    message.success("New item added successfully!");
  } catch (error) {
    console.error("Error updating the order:", error);
    message.error("Failed to add the item.");
  }
};

const handleItemEdit = async (item, orderId) => {
  const newName = prompt(`Edit name for ${item.name}`, item.name);
  const newPrice = prompt(`Edit price for ${item.name}`, item.unitPrice);

  const newToppings = item.toppings.map(t => prompt(`Edit topping ${t.label}`, t.label));

  if (newName && newPrice && !isNaN(newPrice)) {
    const updatedItem = { 
      ...item, 
      name: newName, 
      unitPrice: parseFloat(newPrice), 
      toppings: newToppings  // Update toppings as well
    };

    const orderRef = doc(db, "names", selectedOrder.ownerKey, "shops", selectedOrder.shopId, "orders", orderId);

    // Fetch the order document to check if it exists
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      message.error("Order not found.");
      return;
    }

    const updatedOrder = {
      ...selectedOrder,
      items: selectedOrder.items.map((i) =>
        i.id === item.id ? updatedItem : i // Update the specific item
      ),
    };

    // Recalculate the total after update
    const updatedTotal = updatedOrder.items.reduce((total, item) => {
      return total + (item.unitPrice * item.qty);
    }, 0);

    try {
      // await updateDoc(orderRef, { items: updatedOrder.items });
      await updateDoc(orderRef, { 
        items: updatedOrder.items,
        total: updatedTotal,  // Update total price
      });
      message.success("Item updated successfully!");
    } catch (error) {
      message.error("Failed to update item.");
    }
  } else {
    message.error("Invalid data entered.");
  }
};

  // Handle edit order
  const handleEdit = async (order) => {
  const editedOrder = { ...order, total: order.total + 1 }; // Example: change total
  const orderRef = doc(db, "names", selectedOrder.ownerKey, "shops", selectedOrder.shopId, "orders", order.id);

  try {
    await updateDoc(orderRef, editedOrder);
    message.success("Order updated successfully!");
  } catch (error) {
    console.error("Error updating the order:", error);
    message.error("Failed to update the order.");
  }
};


  // Handle delete order
  const handleDelete = async (orderId) => {
  const orderRef = doc(db, "names", selectedOrder.ownerKey, "shops", selectedOrder.shopId, "orders", orderId);

  try {
    await deleteDoc(orderRef);
    message.success("Order deleted successfully!");
  } catch (error) {
    console.error("Error deleting the order:", error);
    message.error("Failed to delete the order.");
  }
};


  return (
    <div style={{ padding: "2rem" }}>
      <Card title="Your Orders by Status">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
      </Card>
<Modal
  title="EDIT ITEM"
  open={editModalVisible}
  onCancel={() => {
    setEditModalVisible(false);
    setEditingItem(null);
  }}
  footer={null}
  style={{
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 999,
  }}
  key={editingItem ? "edit-item-open" : "edit-item-close"} // Ensure re-render when switching modals
>
  {editingItem && (
    <div>
      <label>Name</label>
      <input
        style={{ width: "100%", marginBottom: 10 }}
        value={editingItem.name}
        onChange={(e) =>
          setEditingItem({ ...editingItem, name: e.target.value })
        }
      />

      <label>Price</label>
      <input
        type="number"
        style={{ width: "100%", marginBottom: 10 }}
        value={editingItem.unitPrice}
        onChange={(e) =>
          setEditingItem({ ...editingItem, unitPrice: parseFloat(e.target.value) })
        }
      />

      <label>Description</label>
      <input
        style={{ width: "100%", marginBottom: 10 }}
        value={editingItem.description || ""}
        onChange={(e) =>
          setEditingItem({ ...editingItem, description: e.target.value })
        }
      />

      <div style={{ marginBottom: 15 }}>
        <span style={{ marginRight: 10 }}>Out of Stock</span>
        <input
          type="checkbox"
          checked={!!editingItem.outOfStock}
          onChange={(e) =>
            setEditingItem({ ...editingItem, outOfStock: e.target.checked })
          }
        />
      </div>

      <Button
        danger
        block
        style={{ marginBottom: 10 }}
        onClick={async () => {
          const orderRef = doc(
            db,
            "names",
            selectedOrder.ownerKey,
            "shops",
            selectedOrder.shopId,
            "orders",
            selectedOrder.id
          );

          const updatedItems = selectedOrder.items.filter(
            (i) => i !== editingItem
          );

           // Recalculate total
    const updatedTotal = updatedItems.reduce((total, item) => {
      return total + item.unitPrice * item.qty;
    }, 0);

          await updateDoc(orderRef, { items: updatedItems, total: updatedTotal });
          message.success("Item deleted successfully!");
          setEditModalVisible(false);
        }}
      >
        DELETE ITEM
      </Button>

      <Button
        type="primary"
        block
        onClick={async () => {
          const orderRef = doc(
            db,
            "names",
            selectedOrder.ownerKey,
            "shops",
            selectedOrder.shopId,
            "orders",
            selectedOrder.id
          );

          const updatedItems = selectedOrder.items.map((i) =>
            i === editingItem ? editingItem : i
          );

           // Recalculate total
    const updatedTotal = updatedItems.reduce((total, item) => {
      return total + item.unitPrice * item.qty;
    }, 0);

          await updateDoc(orderRef, { items: updatedItems, total: updatedTotal });
          message.success("Item updated successfully!");
          setEditModalVisible(false);
        }}
      >
        UPDATE
      </Button>
    </div>
  )}
</Modal>


      {/* Render order details modal */}
      {selectedOrder && renderOrderDetails(selectedOrder)}
    </div>
  );
}

