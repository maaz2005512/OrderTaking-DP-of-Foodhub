// import React from "react";
// import { Card, Typography, Space } from "antd";
// import { Box } from "@mui/material";
// const { Title, Text } = Typography;

// const ShopCards = ({ shop, onClick }) => {
//   return (
//     <Card
//       hoverable
//       onClick={onClick}
//       style={{
//         width: 300,
//         margin: "1rem",
//         borderRadius: 10,
//         boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
//       }}
//       cover={
//         <img
//           alt={shop?.name}
//           src={shop?.image || "/placeholder.png"}
//           style={{ height: 180, objectFit: "contain", padding: "1rem" }}
//         />
//       }
//     >
//       <Space direction="vertical" size="small">
//         <Title level={4} style={{ marginBottom: 0 }}>
//           {shop.name}
//         </Title>
//         <Text strong>Address:</Text> <Text>{shop.address || "N/A"}</Text>
//         <Text strong>Email:</Text> <Text>{shop.email || "N/A"}</Text>
//       </Space>
//     </Card>
//   );
// };

// export default ShopCards;


// import React from "react";
// import { Card, Typography, Space } from "antd";
// import { Box } from "@mui/material";

// const { Title, Text } = Typography;

// const ShopCards = ({ shop, onClick }) => {
//   return (
//     <Card
//       hoverable
//       onClick={onClick}
//       style={{
//         width: 480,
//         borderRadius: 12,
//         boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
//         border: "1px solid #eee",
//         overflow: "hidden",
//         transition: "transform 0.3s",
//       }}
//       bodyStyle={{ padding: "1rem" }}
//       cover={
//         <Box
//           display="flex"
//           justifyContent="center"
//           alignItems="center"
//           sx={{
//             padding: "1rem",
//             height: 20,
//             backgroundColor: "#fafafa",
//           }}
//         >
//           <img
//             alt={shop?.name}
//             src={shop?.image || "/placeholder.png"}
//             style={{
//               maxHeight: "100%",
//               maxWidth: "100%",
//               objectFit: "contain",
//               borderRadius: 10,
//             }}
//           />
//         </Box>
//       }
//     >
//       <Space direction="vertical" size="small" style={{ width: "100%" }}>
//         <Title level={5} style={{ marginBottom: 0 }}>
//           {shop?.name}
//         </Title>
//         <Text type="secondary">{shop?.address || "No address available"}</Text>
//         {shop?.email && (
//           <Text style={{ fontSize: "0.85rem", color: "#555" }}>{shop.email}</Text>
//         )}
//       </Space>
//     </Card>
//   );
// };

// export default ShopCards;

import { Card } from 'antd';

const ShopCards = ({ shop, onClick, selected }) => {
  return (
    <Card
      onClick={onClick}
      hoverable
      style={{
        width: 320,
        height: 130,
        borderRadius: 16,
        border: selected ? "2px solid #38a169" : "1px solid #eee",
        display: 'flex',
        alignItems: 'center',
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      bodyStyle={{ padding: 0, width: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        {/* Left: Image */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 12,
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}
        >
          <img
            src={shop?.image || '/placeholder.png'}
            alt={shop?.name}
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }}

            onError={(e) => {
    e.target.onerror = null;
    e.target.src = '/images/shop1.png'; // fallback image
  }}
          />
        </div>

        {/* Right: Text */}
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{shop?.name}</div>
          <div style={{ fontSize: 14, color: '#888' }}>{shop?.address}</div>
          <div style={{ fontSize: 14, color: '#888' }}>{shop?.url}</div>
        </div>
      </div>
    </Card>
  );
};

export default ShopCards;



    