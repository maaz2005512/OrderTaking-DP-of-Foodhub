// menu/components/CheckoutOptions.jsx
import React from "react";
import { Button, Space, Input } from "antd";
import "./styles.css";

const CheckoutOptions = ({ onCashCheckout, onCancel, comment, setComment }) => {
  return (
    <div className="checkout-options">
      <Space direction="vertical" style={{ width: "100%" }}>
        <Input.TextArea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add any comment for kitchen (optional)..."
          rows={2}
        />

        <div className="checkout-buttons">
          <Button type="primary" block onClick={onCashCheckout}>
            Cash
          </Button>
          <Button danger block onClick={onCancel}>
            Cancel Order
          </Button>
        </div>
      </Space>
    </div>
  );
};

export default CheckoutOptions;
