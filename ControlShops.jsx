// // src/admin/ControlShops.jsx
// import { useEffect, useState } from "react";
// import { db } from "../../firebase";
// import {
//   collection,
//   getDocs,
//   updateDoc,
//   doc,
//   query,
//   where,
// } from "firebase/firestore";
// import { Checkbox, Button, Table, message, Space } from "antd";
// import { useAuth } from "../../context/AuthContext";

// export default function ControlShops() {
//   const { currentUser } = useAuth(); // ✅ admin uid
//   const [users, setUsers] = useState([]);
//   const [shops, setShops] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [patching, setPatching] = useState(false);

//   useEffect(() => {
//     fetchUsersAndShops();
//   }, [currentUser?.uid]);

//   const fetchUsersAndShops = async () => {
//     if (!currentUser?.uid) return;
//     setLoading(true);
//     try {
//       const userSnap = await getDocs(
//         query(collection(db, "users"), where("role", "in", ["worker", "kitchen"])) // ✅ include kitchen
//         // query(collection(db, "users"), where("role", "==", "worker"))
//       );
//       const shopSnap = await getDocs(collection(db, "shops"));

//       const usersData = userSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
//       const shopsData = shopSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

//       setUsers(usersData);
//       setShops(shopsData);

//       // 🔧 AUTO-PATCH: set ownerUid on shops where missing
//       const toPatch = shopSnap.docs.filter((d) => {
//         const s = d.data() || {};
//         return !s.ownerUid || typeof s.ownerUid !== "string";
//       });
//       if (toPatch.length) {
//         setPatching(true);
//         await Promise.allSettled(
//           toPatch.map((d) =>
//             updateDoc(doc(db, "shops", d.id), { ownerUid: currentUser.uid })
//           )
//         );
//         setPatching(false);
//         // reload shops after patch
//         const shopSnap2 = await getDocs(collection(db, "shops"));
//         setShops(shopSnap2.docs.map((d) => ({ id: d.id, ...d.data() })));
//         message.success(`Fixed owner on ${toPatch.length} shop(s).`);
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       message.error("Failed to load users or shops.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleShopToggle = async (userId, shopId) => {
//     try {
//       const userRef = doc(db, "users", userId);
//       const user = users.find((u) => u.id === userId);
//       const currentShops = user.allowedShops || [];

//       const updatedShops = currentShops.includes(shopId)
//         ? currentShops.filter((id) => id !== shopId)
//         : [...currentShops, shopId];

//       // await updateDoc(userRef, { allowedShops: updatedShops });
//        await updateDoc(userRef, {
//    allowedShops: updatedShops,
//    brandOwnerUid: currentUser.uid, // ✅ future-proof mapping
// });

//       setUsers((prev) =>
//         prev.map((u) =>
//           u.id === userId ? { ...u, allowedShops: updatedShops } : u
//         )
//       );

//       message.success("Shop assignment updated");
//     } catch (err) {
//       console.error("Error updating shop assignment:", err);
//       message.error("Failed to update shop assignment");
//     }
//   };

//   const columns = [
//     { title: "Worker Name", dataIndex: "name", key: "name" },
//     {
//       title: (
//         <Space>
//           Assigned Shops
//           {patching && <span style={{ fontSize: 12, color: "#999" }}>(fixing owners...)</span>}
//         </Space>
//       ),
//       key: "shops",
//       render: (_, user) => (
//         <div>
//           {shops.map((shop) => (
//             <div key={shop.id}>
//               <Checkbox
//                 checked={user.allowedShops?.includes(shop.id)}
//                 onChange={() => handleShopToggle(user.id, shop.id)}
//               >
//                 {shop.name}
//                 {/* Optional: show which shops are owned by this admin */}
//                 {shop.ownerUid && shop.ownerUid !== currentUser?.uid && (
//                   <span style={{ color: "crimson", marginLeft: 6 }}>
//                     (other owner)
//                   </span>
//                 )}
//               </Checkbox>
//             </div>
//           ))}
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>Assign Shops to Workers</h2>
//       <Table
//         columns={columns}
//         dataSource={users}
//         rowKey="id"
//         loading={loading}
//         pagination={false}
//       />
//     </div>
//   );
// }


// src/pages/admin/ControlShops.jsx
// import React, { useEffect, useState } from "react";
// import { db } from "../../firebase";
// import { collection, getDocs } from "firebase/firestore";
// import { Card, Row, Col, Input, message } from "antd";
// import { useNavigate } from "react-router-dom";

// export default function ControlShops() {
//   const navigate = useNavigate();
//   const [shops, setShops] = useState([]);
//   const [filter, setFilter] = useState("");

//   useEffect(() => {
//     (async () => {
//       try {
//         const snap = await getDocs(collection(db, "shops"));
//         const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//         setShops(data);
//       } catch (e) {
//         console.error(e);
//         message.error("Failed to load shops");
//       }
//     })();
//   }, []);

//   const filtered = shops.filter((s) => {
//     const q = filter.trim().toLowerCase();
//     const name = String(s.name || "").toLowerCase();
//     const id = String(s.id || "").toLowerCase();
//     return !q || name.includes(q) || id.includes(q);
//   });

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>All Shops</h2>
//       <Input.Search
//         placeholder="Search shops…"
//         style={{ maxWidth: 360, marginBottom: 16 }}
//         allowClear
//         onChange={(e) => setFilter(e.target.value)}
//       />

//       <Row gutter={[16, 16]}>
//         {filtered.map((shop) => (
//           <Col key={shop.id} xs={24} sm={12} md={8} lg={6} xl={6}>
//             <Card
//               title={shop.name || shop.id}
//               hoverable
//               onClick={() => navigate(`/admin/shop/${shop.id}/menu`)}
//               extra={<span style={{ fontSize: 12, color: "#888" }}>{shop.id}</span>}
//             >
//               <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//                 <a
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     navigate(`/admin/shop/${shop.id}/menu`);
//                   }}
//                 >
//                   Open Menu
//                 </a>
//                 <span style={{ color: "#ddd" }}>|</span>
//                 <a
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     navigate(`/admin/shop/${shop.id}/checkout`);
//                   }}
//                 >
//                   Go to Checkout
//                 </a>
//               </div>
//             </Card>
//           </Col>
//         ))}
//       </Row>
//     </div>
//   );
// }


// src/pages/admin/ControlShops.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Card, Row, Col, Input, message, Empty, Tag } from "antd";
import { useNavigate } from "react-router-dom";

export default function ControlShops() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "shops"));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setShops(data);
      } catch (e) {
        console.error(e);
        message.error("Failed to load shops");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = shops.filter((s) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    const name = String(s.name || "").toLowerCase();
    const id = String(s.id || "").toLowerCase();
    const slug = String(s.slug || "").toLowerCase();
    return name.includes(q) || id.includes(q) || slug.includes(q);
  });

  const goToBridge = (shopId) => {
    // ✅ Bridge route: admin UI ke andar worker menu embed hota hai
    navigate(`/admin/shop/${shopId}/menu`);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>All Shops</h2>
        <Tag color="gold">Admin view → opens worker menu inside admin</Tag>
      </div>

      <Input.Search
        placeholder="Search shops by name / id / slug…"
        style={{ maxWidth: 420, marginBottom: 16 }}
        allowClear
        onChange={(e) => setFilter(e.target.value)}
        loading={loading}
      />

      {filtered.length === 0 && !loading ? (
        <Empty description="No shops found" />
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((shop) => (
            <Col key={shop.id} xs={24} sm={12} md={8} lg={6} xl={6}>
              <Card
                title={shop.name || shop.id}
                loading={loading}
                hoverable
                onClick={() => goToBridge(shop.id)}
                extra={
                  <span style={{ fontSize: 12, color: "#888" }}>
                    {shop.slug ? shop.slug : shop.id}
                  </span>
                }
              >
                {shop.address && (
                  <div style={{ marginBottom: 8, color: "#666", fontSize: 13 }}>
                    {shop.address}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a
                    onClick={(e) => {
                      e.stopPropagation();
                      goToBridge(shop.id);
                    }}
                  >
                    Open Menu
                  </a>
                  {/* agar checkout direct kholna ho to bridge ke andar hi open hoga,
                      lekin MemoryRouter default "/menu" se boot hota hai.
                      Direct checkout chahiye to AdminShopMenuBridge me initialEntries ko
                      `${baseWorkerPath}/checkout` karna hoga. */}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
