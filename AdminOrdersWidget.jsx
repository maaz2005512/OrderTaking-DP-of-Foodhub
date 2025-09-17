import React from "react";
import { Card, List, Tag, Typography, Space } from "antd";
import { useAuth } from "../../context/AuthContext";
import { useAdminLiveOrders } from "../../hooks/useAdminLiveOrders";

const { Text } = Typography;

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

export default function AdminOrdersWidget() {
  const { currentUser } = useAuth();
  const { loading, metrics } = useAdminLiveOrders(currentUser?.uid);

  return (
    <Card title="Live Orders" loading={loading}>
      <Space size="large" style={{ marginBottom: 12 }}>
        <Text>Today: <b>{metrics.todayOrders}</b></Text>
        <Text>Today Revenue: <b>£{metrics.todayRevenue.toFixed(2)}</b></Text>
        <Text>Total: <b>{metrics.totalOrders}</b></Text>
      </Space>

      <List
        dataSource={metrics.latest5}
        renderItem={(o) => (
          <List.Item>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <span>
                <Tag color={colorFor(o.status)}>{o.status}</Tag>
                <Text style={{ marginLeft: 8 }}>
                  {o.customerFirstName || "-"} {o.customerLastName || ""}
                </Text>
              </span>
              <Text strong>£{Number(o.total || 0).toFixed(2)}</Text>
            </Space>
          </List.Item>
        )}
        locale={{ emptyText: "No live orders yet." }}
      />
    </Card>
  );
}
