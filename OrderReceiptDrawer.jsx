import React, { useState, useEffect } from "react";
import { Drawer, Tag, Button, InputNumber, Input, Divider, Space, Popconfirm, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { ORDER_STATUS, updateOrderStatus } from "../../utils/updateOrder";

const { TextArea } = Input;

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

export default function OrderReceiptDrawer({ order, open, onClose, ownerKey, shopId }) {
  const [localOrder, setLocalOrder] = useState(null); // Initialize the localOrder state
  const [addName, setAddName] = useState("");        // Add Item Modal state
  const [addPrice, setAddPrice] = useState("");      // Add Item Modal state
  const [showAdd, setShowAdd] = useState(false);     // Add Item Modal visibility

  useEffect(() => {
    if (order) {
      setLocalOrder({ ...order }); // Set order data when the order prop changes
    }
  }, [order]);

  // Early return if localOrder is null
  if (!localOrder) return null;

  // Show Add Item Modal
  const handleAddItem = () => {
    setShowAdd(true);
  };

  // Handle adding an item manually
  const handleSaveItem = () => {
    const priceNum = Number(addPrice || 0);
    if (!addName.trim()) { alert("Please enter a name."); return; }
    if (Number.isNaN(priceNum) || priceNum < 0) { alert("Enter a valid price (>=0)."); return; }

    const newItem = {
      name: addName.trim(),
      price: priceNum,
      qty: 1,  // Default quantity
    };

    setLocalOrder((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setAddName("");  // Reset input fields
    setAddPrice("");
    setShowAdd(false); // Close the modal
  };

  const handleQtyChange = (idx, qty) => {
    const updated = { ...localOrder };
    updated.items[idx].qty = qty;

    // Recalculate total price
    updated.total = updated.items.reduce(
      (sum, it) => sum + (it.price * (it.qty || 1)),
      0
    );
    setLocalOrder(updated);
  };

  const handleDeleteItem = (idx) => {
    const updated = { ...localOrder };
    updated.items.splice(idx, 1);
    updated.total = updated.items.reduce((sum, it) => sum + (it.price * (it.qty || 1)), 0); // recalculate total after deleting item
    setLocalOrder(updated);
  };

  const handleSave = async () => {
  try {
    // Ensure localOrder and items exist
    if (!localOrder || !localOrder.items) {
      message.error("Order items are missing!");
      return;
    }

    const ref = doc(db, "names", ownerKey, "shops", shopId, "orders", localOrder.id);
    await updateDoc(ref, {
      items: localOrder.items,
      notes: localOrder.notes || "",
      total: localOrder.items.reduce((sum, it) => {
        const price = Number(it.price) || 0;
        return sum + (price * (it.qty || 1));
      }, 0),
      updatedAt: new Date(),
    });
    message.success("Order updated!");
    onClose();
  } catch (err) {
    console.error("Save error:", err);
    message.error("Failed to update order");
  }
};


  return (
    <Drawer
      title={`Order #${localOrder.id}`}
      placement="right"
      width={520}
      open={open}
      onClose={onClose}
    >
      <h3>Customer</h3>
      <Input
        value={localOrder.customerFirstName || ""}
        onChange={(e) => setLocalOrder({ ...localOrder, customerFirstName: e.target.value })}
      />
      <Input
        value={localOrder.customerPhone || ""}
        onChange={(e) => setLocalOrder({ ...localOrder, customerPhone: e.target.value })}
      />
      <Divider />

      <h3>Items</h3>
      {localOrder.items?.map((it, idx) => (
        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span>{it.name}</span>
          <InputNumber min={1} value={it.qty || 1} onChange={(val) => handleQtyChange(idx, val)} />
          <span>£{(it.price && !isNaN(it.price) ? (it.price * (it.qty || 1)) : 0).toFixed(2)}</span>
          <Popconfirm title="Remove item?" onConfirm={() => handleDeleteItem(idx)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ))}
      <Button onClick={handleAddItem}>Add Item</Button>
      <Divider />

      <h3>Summary</h3>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Subtotal</span>
        <span>£{localOrder.items.reduce((sum, it) => sum + (it.price * (it.qty || 1)), 0).toFixed(2)}</span>
      </div>
      <Divider />

      <h3>Status</h3>
      <Tag color={colorFor(localOrder.status)}>{localOrder.status}</Tag>
      <Space style={{ marginTop: 12 }}>
        {localOrder.status === ORDER_STATUS.Pending && (
          <Button onClick={() => updateOrderStatus({ ownerKey, shopId, orderId: localOrder.id, to: ORDER_STATUS.Accepted })}>Accept</Button>
        )}
        {localOrder.status === ORDER_STATUS.Accepted && (
          <Button onClick={() => updateOrderStatus({ ownerKey, shopId, orderId: localOrder.id, to: ORDER_STATUS.Preparing })}>Start Prep</Button>
        )}
        {localOrder.status === ORDER_STATUS.Preparing && (
          <Button onClick={() => updateOrderStatus({ ownerKey, shopId, orderId: localOrder.id, to: ORDER_STATUS.OnTheWay })}>Out for Delivery</Button>
        )}
        {localOrder.status === ORDER_STATUS.OnTheWay && (
          <Button onClick={() => updateOrderStatus({ ownerKey, shopId, orderId: localOrder.id, to: ORDER_STATUS.Completed })}>Complete</Button>
        )}
      </Space>
      <Divider />

      <h3>Notes</h3>
      <TextArea rows={3} value={localOrder.notes || ""} onChange={(e) => setLocalOrder({ ...localOrder, notes: e.target.value })} />

      <Button type="primary" block style={{ marginTop: 16 }} onClick={handleSave}>
        Save Changes
      </Button>

      {/* Add Item Modal */}
      {showAdd && (
        <div style={{ padding: "20px", background: "white" }}>
          <h3>Add Item</h3>
          <Input
            placeholder="Enter Item Name"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Enter Price"
            value={addPrice}
            onChange={(e) => setAddPrice(e.target.value)}
          />
          <Button onClick={handleSaveItem}>Add Item</Button>
          <Button onClick={() => setShowAdd(false)}>Cancel</Button>
        </div>
      )}
    </Drawer>
  );
}
