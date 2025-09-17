import React from "react";
import CartItem from "./CartIem";
import CheckoutOptions from "./CheckoutOptions";
import "./styles.css";

const OrderBasket = ({
  cart,
  onRemove,
  onQuantityChange,
  onConfirmOrder,
  comment,
  setComment,
  onCashCheckout,
  onCancel,
}) => {
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  return (
    <div className="order-basket">
      <h3 className="basket-title">Your Order</h3>
      {cart.length === 0 ? (
        <p className="empty-cart">No items added.</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item, index) => (
              <CartItem
                key={index}
                item={item}
                onRemove={() => onRemove(index)}
                onQuantityChange={(delta) => onQuantityChange(index, delta)}
              />
            ))}
          </div>
          <div className="cart-footer">
            <h4 className="cart-total">Total: £{calculateTotal()}</h4>
            <CheckoutOptions
              comment={comment}
              setComment={setComment}
              onCashCheckout={onCashCheckout}
              onCancel={onCancel}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default OrderBasket;
