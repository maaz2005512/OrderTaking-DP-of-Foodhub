// src/pages/admin/Dashboard.jsx

// import React, { useEffect, useState } from "react";
// import { Card, Col, Row, Typography, Spin } from "antd";
// import { db } from "../../firebase";
// import { collection, getDocs } from "firebase/firestore";

// const { Title, Text } = Typography;

// const AdminDashboard = () => {
//   const [stats, setStats] = useState({
//     totalUsers: 0,
//     totalOrders: 0,
//     totalShops: 0,
//   });
//   const [loading, setLoading] = useState(true);

//   const fetchStats = async () => {
//     setLoading(true);
//     const [userSnap, shopSnap, orderSnap] = await Promise.all([
//       getDocs(collection(db, "users")),
//       getDocs(collection(db, "shops")),
//       getDocs(collection(db, "orders")),
//     ]);

//     setStats({
//       totalUsers: userSnap.size,
//       totalShops: shopSnap.size,
//       totalOrders: orderSnap.size,
//     });

//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchStats();
//   }, []);

//   if (loading) {
//     return (
//       <div style={{ textAlign: "center", marginTop: "3rem" }}>
//         <Spin size="large" />
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: "2rem" }}>
//       <Title level={2}>Admin Dashboard</Title>
//       <Row gutter={24} style={{ marginTop: "2rem" }}>
//         <Col xs={24} sm={12} md={8}>
//           <Card>
//             <Title level={4}>Total Users</Title>
//             <Text>{stats.totalUsers}</Text>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={8}>
//           <Card>
//             <Title level={4}>Total Shops</Title>
//             <Text>{stats.totalShops}</Text>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={8}>
//           <Card>
//             <Title level={4}>Total Orders</Title>
//             <Text>{stats.totalOrders}</Text>
//           </Card>
//         </Col>
//       </Row>
//     </div>
//   );
// };

// export default AdminDashboard;

// src/pages/admin/Dashboard.jsx

import React, { useEffect, useState } from "react";
import { Card, Col, Row, Typography, Spin, List, Tag, Space } from "antd";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useAdminLiveOrders } from "../../hooks/useAdminLiveOrders";

const { Title, Text } = Typography;

const colorFor = (s) => {
  switch (s) {
    case "Pending": return "orange";
    case "Accepted": return "geekblue";
    case "Preparing": return "gold";
    case "OnTheWay": return "blue";
    case "Completed": return "green";
    case "Cancelled": return "red";
    default: return "default";
  }
};

const AdminDashboard = () => {
  const { currentUser } = useAuth();

  // --- keep your existing users/shops logic as-is ---
  const [stats, setStats] = useState({ totalUsers: 0, totalShops: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const [userSnap, shopSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "shops")),
    ]);

    setStats({
      totalUsers: userSnap.size,
      totalShops: shopSnap.size,
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // --- NEW: live orders via hook (realtime, scoped to this admin) ---
  const { loading: ordersLoading, metrics } = useAdminLiveOrders(currentUser?.uid);
  // metrics = { totalOrders, totalRevenue, todayOrders, todayRevenue, latest5 }

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <Title level={2}>Admin Dashboard</Title>

      {/* Top KPIs (users/shops from your old logic, orders now live) */}
      <Row gutter={24} style={{ marginTop: "2rem" }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Title level={4}>Total Users</Title>
            <Text>{stats.totalUsers}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Title level={4}>Total Shops</Title>
            <Text>{stats.totalShops}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card loading={ordersLoading}>
            <Title level={4}>Total Orders</Title>
            <Text>{metrics.totalOrders}</Text>
          </Card>
        </Col>
      </Row>

      {/* Live Orders snapshot (today KPIs + latest 5) */}
      {/* <Row gutter={24} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Today">
            <Space size="large">
              <Text>Orders: <b>{metrics.todayOrders}</b></Text>
              <Text>Revenue: <b>£{Number(metrics.todayRevenue || 0).toFixed(2)}</b></Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Latest Orders" loading={ordersLoading}>
            <List
              dataSource={metrics.latest5}
              renderItem={(o) => (
                <List.Item>
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <span>
                      <Tag color={colorFor(o.status)}>{o.status}</Tag>
                      <Text style={{ marginLeft: 8 }}>
                        {(o.customerFirstName || "-") + " " + (o.customerLastName || "")}
                      </Text>
                    </span>
                    <Text strong>£{Number(o.total || 0).toFixed(2)}</Text>
                  </Space>
                </List.Item>
              )}
              locale={{ emptyText: "No live orders yet." }}
            />
          </Card>
        </Col>
      </Row> */}
    </div>
  );
};

export default AdminDashboard;

