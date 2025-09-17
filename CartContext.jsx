

// src/context/CartContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  // line shape:
  // {
  //   key, productId, name, image,
  //   size: { id, label, price },
  //   serve: "own" | "meal",
  //   toppings: [{ id, label, price, mode, isCrust? }],
  //   sauce: { id, label } | null,
  //   drink: { id, label } | null,
  //   unitPrice: number,
  //   qty: number
  // }

  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("cart_items_v2");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("cart_items_v2", JSON.stringify(items));
    } catch {}
  }, [items]);

  // -------- core helpers ----------
  const addToCart = useCallback((line) => {
    setItems((prev) => {
      // if same key already present, don't duplicate (builder will call replaceLine)
      if (prev.some((it) => it.key === line.key)) return prev;
      return [...prev, { ...line, qty: Number(line.qty || 1) }];
    });
  }, []);

  const replaceLine = useCallback((key, next) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...next, qty: Number(next.qty || 1) } : it)));
  }, []);

  const hasLineByKey = useCallback(
    (key) => items.some((it) => it.key === key),
    [items]
  );

  const removeLine = useCallback((key) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }, []);

  const incrementQty = useCallback((key) => {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, qty: Number(it.qty || 1) + 1 } : it))
    );
  }, []);

  const decrementQty = useCallback((key) => {
    setItems((prev) =>
      prev.map((it) =>
        it.key === key ? { ...it, qty: Math.max(1, Number(it.qty || 1) - 1) } : it
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.unitPrice || 0) * Number(it.qty || 1), 0),
    [items]
  );

  // --------- backward-compat (older API your UI was calling) ----------
  // id-based methods map to key-based lines (for manual/dummy items)
  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId && it.id !== productId));
  };
  const updateQuantity = (productId, newQty) => {
    if (newQty < 1) return;
    setItems((prev) =>
      prev.map((it) =>
        it.productId === productId || it.id === productId ? { ...it, qty: Number(newQty) } : it
      )
    );
  };

  const value = {
    items,
    subtotal,

    // new API (used by ProductBuilder)
    addToCart,
    replaceLine,
    hasLineByKey,
    removeLine,
    incrementQty,
    decrementQty,
    clearCart,

    // old API (used by old CheckoutPanel bits; still provided)
    removeFromCart,
    updateQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
