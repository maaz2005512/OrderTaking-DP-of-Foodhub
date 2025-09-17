// menu/components/CartItem.jsx
import React from "react";
import { MinusCircleOutlined, PlusCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import "./styles.css";

const CartItem = ({ item, onRemove, onQuantityChange }) => {
  return (
    <div className="cart-item">
      <div className="cart-item-info">
        <h4>{item.name}</h4>
        {item.modifiers?.length > 0 && (
          <p className="modifiers">
            <strong>Modifiers:</strong> {item.modifiers.join(", ")}
          </p>
        )}
        <p>£{item.price} × {item.quantity}</p>
      </div>

      <div className="cart-item-actions">
        <PlusCircleOutlined onClick={() => onQuantityChange(1)} className="icon-btn" />
        <MinusCircleOutlined onClick={() => onQuantityChange(-1)} className="icon-btn" />
        <DeleteOutlined onClick={onRemove} className="icon-btn delete" />
      </div>
    </div>
  );
};

export default CartItem;
