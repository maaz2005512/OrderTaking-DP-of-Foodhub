// src/pages/admin/AdminShopMenuBridge.jsx
import React, { useEffect, useState } from "react";
import { MemoryRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

// Worker-side screens (UNCHANGED)
import GuestMenuPage from "../../menu/GuestMenuPage";
import CategoryNavigator from "../../menu/layouts/tastyspot/CategoryNavigator";
import ProductBuilder from "../../features/builder/ProductBuilder";
import CheckoutPage from "../dashboard/CheckoutPage";
import AddItemPage from "../../menu/AddItemPage";
import MenuEditorLayout from "../menuEditor/MenuEditorLayout";
import MenuEditorCategories from "../menuEditor/MenuEditorCategories";
import MenuEditorProducts from "../menuEditor/MenuEditorProducts";
import MenuEditorProductDetail from "../menuEditor/MenuEditorProductDetail";

function ShopHeader({ shopName }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderBottom: "1px solid #eee",
        background: "#fffef7",
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 16 }}>
        Viewing menu for: <span style={{ color: "#7a5b00" }}>{shopName}</span>
      </div>
      <div style={{ fontSize: 12, color: "#777" }}>(Admin view — worker UI embedded)</div>
    </div>
  );
}

export default function AdminShopMenuBridge() {
  const { shopId } = useParams();
  const [shopName, setShopName] = useState(shopId);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "shops", shopId));
        if (snap.exists()) setShopName(snap.data().name || shopId);
      } catch {
        /* ignore */
      }
    })();
  }, [shopId]);

  // Worker world ka base path
  const workerBase = `/dashboard/${shopId}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ShopHeader shopName={shopName} />

      <div style={{ flex: 1, minHeight: 0 }}>
        {/*
          IMPORTANT:
          - initialEntries ko direct worker menu pe set kiya
          - neeche catch-all "*" route rakha jo hamesha worker menu pe redirect kare
        */}
        <MemoryRouter initialEntries={[`${workerBase}/menu`]} initialIndex={0}>
          <Routes>
            {/* Worker namespace routes, unchanged components */}
            <Route path={`/dashboard/:shopId/menu`} element={<GuestMenuPage />} />
            <Route path={`/dashboard/:shopId/menu/*`} element={<CategoryNavigator />} />
            <Route path={`/dashboard/:shopId/menu/product/:productId`} element={<ProductBuilder />} />
            <Route path={`/dashboard/:shopId/checkout`} element={<CheckoutPage />} />
            <Route path={`/dashboard/:shopId/add-item-page`} element={<AddItemPage />} />

            {/* (Optional) menu editor inside bridge */}
            <Route path={`/dashboard/:shopId/menu-editor`} element={<MenuEditorLayout />}>
              <Route index element={<MenuEditorCategories />} />
              <Route path={`category/:catId`} element={<MenuEditorProducts />} />
              <Route path={`product/:productId`} element={<MenuEditorProductDetail />} />
            </Route>

            {/* ✅ Catch-all: agar kisi wajah se path mismatch ho to menu par redirect */}
            <Route path="*" element={<Navigate to={`${workerBase}/menu`} replace />} />
          </Routes>
        </MemoryRouter>
      </div>
    </div>
  );
}
