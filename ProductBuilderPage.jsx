import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase"; // 👈 adjust if your firebase file lives elsewhere
import ProductBuilder from "../../features/builder/ProductBuilder";
import { useCart } from "../../context/CartContext";

/**
 * ProductBuilderPage
 * - Shop-agnostic wrapper that:
 *   1) loads the shop's menu doc from Firestore
 *   2) finds the clicked item by :itemSlug
 *   3) renders the reusable ProductBuilder (Size → Serve → Modifiers → Sauces → Drink(if meal))
 *   4) adds the configured item to cart and navigates back to menu
 *
 * Route shape (add in your router):
 *   /dashboard/:shopId/menu/:categoryPath*
 * /:itemSlug/build
 */
export default function ProductBuilderPage() {
  const { shopId, itemSlug, "*": categoryPath = "" } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [menuDoc, setMenuDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---- Load menu for the shop ----
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "menus", shopId));
        if (!isMounted) return;
        setMenuDoc(snap.exists() ? snap.data() : null);
      } catch (e) {
        console.error("Failed to load menu:", e);
        setMenuDoc(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [shopId]);

  // ---- Find item by :itemSlug (search all categories' items) ----
  const item = useMemo(() => {
    if (!menuDoc?.menu) return null;

    // If you want to restrict by first segment of categoryPath, you can:
    // const firstKey = categoryPath?.split("/")?.[0];
    // const categories = firstKey && menuDoc.menu[firstKey] ? { [firstKey]: menuDoc.menu[firstKey] } : menuDoc.menu;

    const categories = menuDoc.menu;
    for (const catKey of Object.keys(categories)) {
      const items = categories[catKey]?.items || [];
      const found = items.find((it) => it.id === itemSlug);
      if (found) return found;
    }
    return null;
  }, [menuDoc, itemSlug, categoryPath]);

  // ---- Navigation helpers ----
  const goBackToCategory = () => {
    const suffix = categoryPath ? `/${categoryPath}` : "";
    navigate(`/dashboard/${shopId}/menu${suffix}`);
  };

  // ---- When user completes builder ----
  const handleContinue = (selections) => {
    // Base price from Size (single select)
    const chosenSize = (selections.size || [])[0];
    const basePrice = Number(chosenSize?.price || 0);

    // Sum every group's price except "size" and "serve"
    const totalExtras = Object.entries(selections).reduce((sum, [key, arr]) => {
      if (key === "size" || key === "serve") return sum;
      const add = (arr || []).reduce((s, x) => s + Number(x?.price || 0), 0);
      return sum + add;
    }, 0);

    const finalPrice = Number((basePrice + totalExtras).toFixed(2));

    addToCart({
      id: `${item.id}-${chosenSize?.label || "base"}`,
      name: `${item.name}${chosenSize?.label ? ` ${chosenSize.label}` : ""}`,
      price: finalPrice,
      meta: selections, // keep full breakdown for receipt/kitchen
    });

    // Per your flow: after Continue, go back to main menu (or category)
    navigate(`/dashboard/${shopId}/menu`);
  };

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (!item) return (
    <div style={{ padding: 16 }}>
      Item not found.{" "}
      <button className="back-btn" onClick={goBackToCategory}>Go Back</button>
    </div>
  );

  return (
    <div className="menu-page">
      {/* If you want FilterBar / breadcrumbs here, include them above the builder */}
      <ProductBuilder
        item={item}
        onBack={goBackToCategory}
        onContinue={handleContinue}
      />
    </div>
  );
}
