// // src/admin/OrderReceipt.jsx

// import React from 'react';
// import { Drawer, Button, Space } from 'antd';
// import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
// import { db } from '../../firebase'; // Firebase import
// import { doc, updateDoc } from 'firebase/firestore';

// const OrderReceipt = ({ order, onClose, visible }) => {

//   const handleDelete = (itemId) => {
//     const updatedItems = order.items.filter(item => item.id !== itemId);
//     updateOrderItems(order.id, updatedItems);
//   };

//   const handleEdit = (itemId, newData) => {
//     const updatedItems = order.items.map(item =>
//       item.id === itemId ? { ...item, ...newData } : item
//     );
//     updateOrderItems(order.id, updatedItems);
//   };

//   const updateOrderItems = async (orderId, updatedItems) => {
//     const orderRef = doc(db, 'orders', orderId);
//     await updateDoc(orderRef, { items: updatedItems });
//   };

//   return (
//     <Drawer
//       title={`Order Receipt: ${order.id}`}
//       visible={visible}
//       onClose={onClose}
//       width={720}
//     >
//       <div>
//         {order.items.map((item) => (
//           <div key={item.id}>
//             <Space direction="vertical" style={{ width: '100%' }}>
//               <div>{item.name} - £{item.price}</div>
//               {item.modifiers && item.modifiers.map(mod => (
//                 <div key={mod.id}>{mod.name} - £{mod.price}</div>
//               ))}
//               <Space>
//                 <Button
//                   icon={<EditOutlined />}
//                   onClick={() => handleEdit(item.id, { price: item.price + 1 })} // Example edit
//                 >
//                   Edit
//                 </Button>
//                 <Button
//                   icon={<DeleteOutlined />}
//                   onClick={() => handleDelete(item.id)}
//                 >
//                   Delete
//                 </Button>
//               </Space>
//             </Space>
//           </div>
//         ))}
//       </div>
//     </Drawer>
//   );
// };

// export default OrderReceipt;

// src/menu/components/OrderReceipt.jsx
import React from "react";

const OrderReceipt = ({ order }) => {
  if (!order) return null; // Add this check to prevent rendering if order is null

  return (
    <div>
      <h2>Order Details</h2>
      <p>Order ID: {order.id}</p>
      <p>Customer: {order.customerFirstName} {order.customerLastName}</p>
      <p>Items:</p>
      {/* Display items and other details */}
      {order.items?.map((item) => (
        <div key={item.id}>
          <p>{item.name}</p>
        </div>
      ))}
    </div>
  );
};

export default OrderReceipt;
