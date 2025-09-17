import React from "react";
import { Modal, Typography, Button, Divider } from "antd";

const { Title, Text } = Typography;

const ConfirmModal = ({ visible, onConfirm, onCancel, cartItems, totalAmount }) => {
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      centered
      title="Confirm Your Order"
    >
      {cartItems.length === 0 ? (
        <Text>No items in the order.</Text>
      ) : (
        <>
          {cartItems.map((item, idx) => (
            <div key={idx} style={{ marginBottom: "1rem" }}>
              <Title level={5}>
                {item.name} × {item.quantity}
              </Title>

              {item.selectedModifiers?.length > 0 && (
                <ul style={{ marginBottom: 6 }}>
                  {item.selectedModifiers.map((mod, i) => (
                    <li key={i}>
                      <Text type="secondary">{mod}</Text>
                    </li>
                  ))}
                </ul>
              )}

              <Text>£{(item.price * item.quantity).toFixed(2)}</Text>
            </div>
          ))}

          <Divider />

          <Title level={4}>Total: £{totalAmount.toFixed(2)}</Title>

          <Button type="primary" block onClick={onConfirm}>
            Confirm & Place Order
          </Button>
          <Button style={{ marginTop: 8 }} block onClick={onCancel}>
            Cancel
          </Button>
        </>
      )}
    </Modal>
  );
};

export default ConfirmModal;
