// import React, { useState } from "react";
// import { Button, Modal, message, Typography } from "antd";
// import { ExclamationCircleOutlined } from "@ant-design/icons";
// import dayjs from "dayjs";

// const { Title, Text } = Typography;

// const ClearOrders = () => {
//   const [loading, setLoading] = useState(false);

//   const handleClearOrders = async () => {
//     Modal.confirm({
//       title: "Are you sure?",
//       icon: <ExclamationCircleOutlined />,
//       content: "This will permanently delete all today's orders.",
//       okText: "Yes, delete",
//       cancelText: "Cancel",
//       onOk: async () => {
//         try {
//           setLoading(true);

//           // 🔥 BACKEND NEEDED HERE
//           const res = await fetch("/api/admin/clear-today-orders", {
//             method: "POST",
//           });

//           const result = await res.json();
//           if (result.success) {
//             message.success("All today's orders deleted.");
//           } else {
//             throw new Error(result.message || "Failed to clear orders.");
//           }
//         } catch (err) {
//           console.error(err);
//           message.error("Something went wrong.");
//         } finally {
//           setLoading(false);
//         }
//       },
//     });
//   };

//   return (
//     <div style={{ padding: "2rem" }}>
//       <Title level={3}>Clear Today's Orders</Title>
//       <Text type="danger">
//         Clicking the button below will delete all orders created today ({dayjs().format("YYYY-MM-DD")}).
//       </Text>
//       <div style={{ marginTop: "2rem" }}>
//         <Button type="primary" danger onClick={handleClearOrders} loading={loading}>
//           Delete Today's Orders
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default ClearOrders;

// import React, { useState } from "react";
// import { Button, Modal, message, Typography } from "antd";
// import { ExclamationCircleOutlined } from "@ant-design/icons";
// import axios from "axios";
// import dayjs from "dayjs";

// const { Title, Text } = Typography;

// const ClearOrders = () => {
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);

//   const handleDelete = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.delete("http://localhost:5000/api/admin/clear-orders");
//       const result = res.data;

//       if (result.success) {
//         message.success(`✅ Deleted ${result.deletedCount} orders.`);
//       } else {
//         message.error("⚠️ Failed to delete orders: " + result.message);
//       }
//     } catch (err) {
//       console.error("❌ API Error:", err);
//       message.error("Something went wrong while clearing orders.");
//     } finally {
//       setLoading(false);
//       setModalVisible(false);
//     }
//   };

//   return (
//     <div style={{ padding: "2rem" }}>
//       <Title level={3}>Clear Today's Orders</Title>
//       <Text type="danger">
//         Clicking the button below will delete all orders created today ({dayjs().format("YYYY-MM-DD")}).
//       </Text>
//       <div style={{ marginTop: "2rem" }}>
//         <Button type="primary" danger onClick={() => setModalVisible(true)} loading={loading}>
//           Delete Today's Orders
//         </Button>
//       </div>

//       <Modal
//         title="Are you sure?"
//         open={modalVisible}
//         onOk={handleDelete}
//         onCancel={() => setModalVisible(false)}
//         okText="Yes, delete"
//         cancelText="Cancel"
//         confirmLoading={loading}
//       >
//         <p>This will permanently delete all today's orders.</p>
//       </Modal>
//     </div>
//   );
// };

// export default ClearOrders;

// src/pages/admin/ClearOrders.jsx  (replace file)

import React, { useState } from "react";
import { Button, Modal, message, Typography } from "antd";
import { db } from "../../firebase";
import {
  collectionGroup,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

const { Title, Text } = Typography;

// Safe epoch resolver
function toEpoch(row) {
  if (row?.createdAt?.toMillis) return row.createdAt.toMillis();
  if (typeof row?.createdAt?.seconds === "number") return row.createdAt.seconds * 1000;
  const t = row?.createdAtISO ? Date.parse(row.createdAtISO) : NaN;
  return Number.isFinite(t) ? t : 0;
}

export default function ClearOrders() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handleDelete = async () => {
  if (!currentUser?.uid) {
    message.error("Not logged in as admin.");
    return;
  }
  try {
    setLoading(true);

    // 🔒 Server-side day scope (fast & scalable)
    const day = dayjs().utc().format("YYYY-MM-DD");
    const qToday = query(
      collectionGroup(db, "orders"),
      where("shopOwnerUid", "==", currentUser.uid),
      where("createdAtDay", "==", day)   // ✅ only today's orders fetched
    );
    let snap = await getDocs(qToday);

    // (Optional) Backward-compat fallback for very old orders that don't have createdAtDay
    // Toggle this to true if you still want to catch legacy orders made BEFORE you added createdAtDay.
    const USE_COMPAT_FALLBACK = false;
    if (USE_COMPAT_FALLBACK && snap.empty) {
      // Fallback to previous approach (fetch all, then filter by timestamp locally)
      const qAll = query(collectionGroup(db, "orders"), where("shopOwnerUid", "==", currentUser.uid));
      const allSnap = await getDocs(qAll);

      const start = dayjs().startOf("day").valueOf();
      const end = dayjs().endOf("day").valueOf();

      const todays = allSnap.docs.filter((d) => {
        const data = d.data();
        const t =
          (data?.createdAt?.toMillis?.() ?? (typeof data?.createdAt?.seconds === "number" ? data.createdAt.seconds * 1000 : NaN)) ||
          (data?.createdAtISO ? Date.parse(data.createdAtISO) : NaN);
        return Number.isFinite(t) && t >= start && t <= end;
      });

      // Create a fake snapshot-like array with .ref to reuse batching logic
      snap = { docs: todays };
    }

    if (!snap.docs.length) {
      message.info("No orders to delete today.");
      return;
    }

    // Batch delete (<=500 per batch)
    let deleted = 0;
    for (let i = 0; i < snap.docs.length; i += 450) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 450).forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
      deleted += Math.min(450, snap.docs.length - i);
    }

    message.success(`✅ Deleted ${deleted} order${deleted > 1 ? "s" : ""} from today.`);
  } catch (err) {
    console.error("Delete error:", err);
    message.error("Something went wrong while clearing today's orders.");
  } finally {
    setLoading(false);
    setModalVisible(false);
  }
};


  // const handleDelete = async () => {
  //   if (!currentUser?.uid) {
  //     message.error("Not logged in as admin.");
  //     return;
  //   }
  //   try {
  //     setLoading(true);

  //     // 1) Fetch all orders for this admin (any shop), then filter today client-side
  //     const qAll = query(
  //       collectionGroup(db, "orders"),
  //       where("shopOwnerUid", "==", currentUser.uid)
  //     );
  //     const snap = await getDocs(qAll);

  //     // 2) Compute today's window (local time)
  //     const start = dayjs().startOf("day").valueOf();
  //     const end = dayjs().endOf("day").valueOf();

  //     const todays = snap.docs.filter((d) => {
  //       const t = toEpoch(d.data());
  //       return t >= start && t <= end;
  //     });

  //     if (!todays.length) {
  //       message.info("No orders to delete today.");
  //       return;
  //     }

  //     // 3) Batch delete (<=500 per batch)
  //     let deleted = 0;
  //     for (let i = 0; i < todays.length; i += 450) {
  //       const batch = writeBatch(db);
  //       todays.slice(i, i + 450).forEach((docSnap) => batch.delete(docSnap.ref));
  //       await batch.commit();
  //       deleted += Math.min(450, todays.length - i);
  //     }

  //     message.success(`✅ Deleted ${deleted} order${deleted > 1 ? "s" : ""} from today.`);
  //   } catch (err) {
  //     console.error("Delete error:", err);
  //     message.error("Something went wrong while clearing today's orders.");
  //   } finally {
  //     setLoading(false);
  //     setModalVisible(false);
  //   }
  // };

  return (
    <div style={{ padding: "2rem" }}>
      <Title level={3}>Clear Today's Orders</Title>
      <Text type="danger">
        Clicking the button below will delete all orders created today ({dayjs().format("YYYY-MM-DD")}).
      </Text>
      <div style={{ marginTop: "2rem" }}>
        <Button type="primary" danger onClick={() => setModalVisible(true)} loading={loading}>
          Delete Today's Orders
        </Button>
      </div>

      <Modal
        title="Are you sure?"
        open={modalVisible}
        onOk={handleDelete}
        onCancel={() => setModalVisible(false)}
        okText="Yes, delete"
        cancelText="Cancel"
        confirmLoading={loading}
      >
        <p>This will permanently delete all today's orders for your shops.</p>
      </Modal>
    </div>
  );
}

