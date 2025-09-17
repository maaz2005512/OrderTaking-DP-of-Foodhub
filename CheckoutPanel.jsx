import React, { useState } from "react";
import { useCart } from "../../context/CartContext";
import {
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  CloseCircleFilled,
  EditOutlined,
} from "@ant-design/icons";
import "./styles.css";
import "../../pages/dashboard/checkout.css"
import { useNavigate, useParams, useLocation } from "react-router-dom";

const MEAL_UPCHARGE = 2.0; // same value as ProductBuilder


export default function CheckoutPanel() {

  const navigate = useNavigate();
  const { shopId } = useParams();
  const location = useLocation();

  // ✅ namespace-aware base
  const isAdmin = location.pathname.startsWith("/admin");
  const base = isAdmin ? `/admin/shop/${shopId}` : `/dashboard/${shopId}`;

  const {
    items,
    subtotal,
    clearCart,
    incrementQty,
    decrementQty,
    removeLine,
    replaceLine,
    addToCart,
  } = useCart();

  const [showDiscount, setShowDiscount] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [orderComments, setOrderComments] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState("item"); // 'item' | 'modifier'
  const [addName, setAddName] = useState("");
  const [addPrice, setAddPrice] = useState("");

  const openAddModal = () => {
    setAddType("item");
    setAddName("");
    setAddPrice("");
    setShowAdd(true);
  };

  const handleAddManual = () => {
    const priceNum = Number(addPrice || 0);
    if (!addName.trim()) { alert("Please enter a name."); return; }
    if (Number.isNaN(priceNum) || priceNum < 0) { alert("Enter a valid price (>=0)."); return; }

    if (addType === "item") {
      const key = `manual~${Date.now()}`;
      addToCart({
        key, productId: key, name: addName.trim(),
        unitPrice: priceNum, qty: 1,
        size: null, serve: "own", toppings: [], sauce: null, drink: null,
      });
      setShowAdd(false);
      return;
    }

    // addType === 'modifier' → attach to LAST line
    if (items.length === 0) { alert("No item in basket."); return; }
    const line = items[items.length - 1];
    const next = { ...line, toppings: Array.isArray(line.toppings) ? [...line.toppings] : [] };
    next.toppings.push({
      id: `manual-mod-${Date.now()}`, label: addName.trim(), price: priceNum, mode: "normal", isCrust: false,
    });
    const added = next.toppings.filter(t => t.mode !== "free").reduce((s, t) => s + (t.price || 0), 0);
    const base = Number(next.size?.price || 0);
    next.unitPrice = base + added;
    replaceLine(line.key, next);
    setShowAdd(false);
  };


  const total = Math.max(0, subtotal - subtotal * (Number(discount || 0) / 100));

  const removeModifier = (line, modId) => {
    const next = { ...line, toppings: (line.toppings || []).filter(t => t.id !== modId) };
    const added = (next.toppings || [])
      .filter(t => t.mode !== "free")
      .reduce((s, t) => s + (t.price || 0), 0);
    const base = Number(next.size?.price || 0);
    next.unitPrice = base + added;
    replaceLine(line.key, next);
  };



  const goToItemPage = (line, stepOverride) => {
    if (!line?.productId || String(line.productId).startsWith("manual~")) return;

    // fallback inference agar override na diya ho
    let openStepKey = stepOverride;
    if (!openStepKey) {
      const isMeal = String(line?.serve || "own") === "meal";
      const hasDrink = Array.isArray(line?.toppings) && line.toppings.some(m => String(m.id || "").startsWith("drink_"));
      const hasMealSauce = Array.isArray(line?.toppings) && line.toppings.some(m => /^mealSauce_/i.test(String(m.id || "")));
      const hasBaseSauce =
        !!line?.sauce ||
        (Array.isArray(line?.toppings) && line?.toppings?.some(
          m => String(m?.id || "").startsWith("sauce_") || /^sauce:\s*/i.test(String(m?.label || ""))
        ))
      const hasToppings =
        Array.isArray(line?.toppings) &&
        line.toppings.some(m => {
          const id = String(m.id || "");
          const lbl = String(m.label || "");
          if (id === "__meal_upcharge") return false;
          if (id.startsWith("drink_")) return false;
          if (id.startsWith("sauce_")) return false;
          if (/^mealSauce_/i.test(id)) return false;
          if (/^sauce:\s*/i.test(lbl)) return false;
          return true;
        });

      // priority: unmet > explicit groups
      if (isMeal && !hasDrink) openStepKey = "drinks";
      else if (isMeal && hasMealSauce) openStepKey = "mealSauces";
      else if (!isMeal && hasBaseSauce) openStepKey = "sauces";
      else if (hasToppings) openStepKey = "toppings";
      else openStepKey = "serve";
    }

    // navigate(`/dashboard/${shopId}/menu/product/${encodeURIComponent(line.productId)}`, {
    navigate(`${base}/menu/product/${encodeURIComponent(line.productId)}`, {
      state: {
        preselectedSize: line.size
          ? { id: line.size.id, label: line.size.label, price: line.size.price }
          : null,
        openStepKey,
        lineKey: line.key,
        fromCart: true,
      },
    });
  };

  const goToCheckout = () => {
    navigate(`${base}/checkout`);
  };





  return (
    <aside className="fh-panel">
      {/* Top row: Options / Checkout */}
      <div className="fh-row two">
        {/* <button className="fh-btn outline">OPTIONS</button> */}
        <button className="fh-btn solid"
          onClick={goToCheckout}
        >Send To Kitchen</button>
      </div>

      {/* Cash / Card */}
      <div className="fh-row two">
        <button className="fh-btn pay">CASH</button>
        <button className="fh-btn pay">CARD</button>
      </div>

      {/* Actions */}
      {/* <div className="fh-actions" onClick={openAddModal}> */}
      <div className="fh-actions">

        {/* <div className="fh-action"> */}
        <div className="fh-action" onClick={(e) => { e.stopPropagation(); openAddModal(); }}>

          <span className="fh-ico">≡</span>
          <div>Add Item</div>
        </div>
        <div className="fh-action" onClick={() => setShowDiscount(v => !v)}>
          <span className="fh-ico">⚙</span>
          <div>DISCOUNT</div>
        </div>
        <div className="fh-action" onClick={() => setShowComments(v => !v)}>
          <span className="fh-ico">💬</span>
          <div>COMMENTS</div>
        </div>
        <div className="fh-action danger"
          onClick={() => {
            clearCart();
            navigate(`${base}/menu`);
          }}
        //  onClick={clearCart}

        >
          <span className="fh-ico">✖</span>
          <div>CANCEL</div>
        </div>
      </div>

      {/* Total header */}
      <div className="fh-totalbar">
        <div className="fh-total-label">Total</div>
        <div className="fh-total-amt">£{total.toFixed(2)}</div>
      </div>

      {/* Discount + Order comments */}
      {showDiscount && (
        <div className="fh-discount">
          <label>Discount %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>
      )}
      {showComments && (
        <textarea
          className="fh-order-notes"
          placeholder="Order comments…"
          value={orderComments}
          onChange={(e) => setOrderComments(e.target.value)}
        />
      )}

      {/* Lines */}
      <div className="fh-lines">
        {items.map((it) => (
          // <div key={it.key} className="fh-linecard">


          <div
            key={it.key}
            className="fh-linecard"
            style={{ cursor: (!it?.productId || String(it.productId).startsWith("manual~")) ? "default" : "pointer" }}
            onClick={() => goToItemPage(it)}
          >




            {/* title row */}
            <div className="fh-linehead">
            <div className="fh-line-title">
  {it.name}
  {it.size?.label && (
    // agar label regular hai
    it.size.label.toLowerCase() === "regular"
      // regular sirf tab dikhao jab productId burgers category ka ho
      ? (String(it.productId || "").includes("burger") ? ` ${it.size.label}` : "")
      : ` ${it.size.label}`
  )}
</div>




              {/* <div className="fh-line-title">
                {it.name}
                {/* {it.size?.label ? `  ${it.size.label.replace(/"/g, '\"')}` : ""} */}
                 {/* {(it.size?.label && it.size.label.toLowerCase() !== "regular")
    ? ` ${it.size.label.replace(/"/g,'\"')}`
    : ""}
              </div> */} 
              <div className="fh-qtygrp">
                {/* <button className="fh-qtybtn" onClick={() => decrementQty(it.key)}> */}
                <button className="fh-qtybtn" onClick={(e) => { e.stopPropagation(); decrementQty(it.key); }}>

                  <MinusOutlined />
                </button>
                <div className="fh-qtyval">{it.qty || 1}</div>
                {/* <button className="fh-qtybtn" onClick={() => incrementQty(it.key)}> */}
                <button className="fh-qtybtn" onClick={(e) => { e.stopPropagation(); incrementQty(it.key); }}>

                  <PlusOutlined />
                </button>
                {/* ✅ Size price pill */}
                {it?.size && typeof it.size.price !== "undefined" && (
                  <span className="fh-sizeprice">£{Number(it.size.price).toFixed(2)}</span>
                )}

                {/* <button className="fh-trash" title="Remove line" onClick={() => removeLine(it.key)}> */}
                <button className="fh-trash" title="Remove line" onClick={(e) => { e.stopPropagation(); removeLine(it.key); }}>

                  <DeleteOutlined />
                </button>
              </div>
            </div>

            {/* quick links */}
            <div className="fh-quicklinks">
              {/* <button className="link">+ Modifier</button> */}
              <button className="link" onClick={(e) => { e.stopPropagation(); /* open modifier UI if any */ }}>
                + Modifier
              </button>

              {/* <button className="link" onClick={() => setShowComments(true)}>+ Comments</button> */}
              <button className="link" onClick={(e) => { e.stopPropagation(); setShowComments(true); }}>
                + Comments
              </button>

            </div>

            {/* modifiers */}
            {(it.toppings?.length > 0 || it.serve === "meal" || it.sauce || it.drink) && (
              <div className="fh-modlist">
                
           {/* ✅ Show "On its own" ONLY if marker present */}
                {it.toppings?.some(t => t.id === "__own_marker") && (
                  <div className="fh-modrow">
                    <button
                      className="fh-x"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeModifier(it, "__own_marker");
                      }}
                    >
                      <CloseCircleFilled />
                    </button>
                    <div className="fh-modtext">On Its Own</div>
                    <div className="fh-modright"></div>
                  </div>
                )}
                {/* {it.serve === "own" && (
                  <div className="fh-modrow">
                    <button className="fh-x"><CloseCircleFilled /></button>
                    <div className="fh-modtext">On Its Own</div>
                    <div className="fh-modright"></div>
                  </div>
                )} */}
                
                {it.serve === "meal" && it.toppings?.some(t => t.id === "__meal_upcharge") && (
  <div className="fh-modrow">
    <button
      className="fh-x"
      onClick={(e) => {
        e.stopPropagation();
        removeModifier(it, "__meal_upcharge");
      }}
    >
      <CloseCircleFilled />
    </button>
    <div
      className="fh-modtext"
      onClick={(e) => {
        e.stopPropagation();
        goToItemPage(it, "serve");
      }}
    >
      Make it a Meal
    </div>

    {/* <div className="fh-modright">£{MEAL_UPCHARGE.toFixed(2)}</div> */}
    <div className="fh-modright">
   <span className="fh-modprice">£{MEAL_UPCHARGE.toFixed(2)}</span>
 </div>
  </div>
)}

                {/* {it.toppings?.map((t) => ( */}
                {/* {it.toppings?.filter(t => t.id !== "__meal_upcharge").map((t) => ( */}
                {it.toppings
   ?.filter(t => t.id !== "__meal_upcharge" && t.id !== "__own_marker")
   .map((t) => (
                  
                  <div
                    key={`${it.key}-${t.id}`}
                    className="fh-modrow"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const id = String(t.id || "");
                      const lbl = String(t.label || "");
                      const stepKey =
                        id.startsWith("drinks_") ? "drinks" :
                          /^mealSauce_/i.test(id) ? "mealSauces" :
                            id.startsWith("sauce_") || /^sauce:\s*/i.test(lbl) ? "sauces" :
                              "toppings";
                      goToItemPage(it, stepKey);
                    }}

                  >

                    {/* <button className="fh-x" onClick={() => removeModifier(it, t.id)}> */}
                    <button className="fh-x" onClick={(e) => { e.stopPropagation(); removeModifier(it, t.id); }}>

                      <CloseCircleFilled />
                    </button>

                    <div className="fh-modtext">
                      {t.mode === "free" ? " (Free)" :
                        t.mode === "less" ? " (Less)" :
                          t.mode === "no" ? " (No)" :
                            t.mode === "onBurger" ? " (On Burger)" :
                              t.mode === "onChips" ? " (On Chips)" : ""}{" "}
                      {t.label}
                      {t.isCrust ? " (Crust)" : ""}
                    </div>


                    <div className="fh-modright">
                      {/* <EditOutlined style={{ opacity: 0.6 }} /> */}
                      <EditOutlined style={{ opacity: 0.6 }} onClick={(e) => e.stopPropagation()} />

                      <span className="fh-modprice">
                        {/* {t.mode === "free" ? "£0.00" : t.price ? `£${t.price.toFixed(2)}` : ""} */}
                        {(t.mode === "free" || t.mode === "no")
                          ? ""
                          : Number(t.price) > 0 ? `£${Number(t.price).toFixed(2)}` : ""}
                      </span>
                    </div>
                  </div>
                ))}

                {it.drink && (
                  // <div className="fh-modrow">
                  <div
                    className="fh-modrow"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => { e.stopPropagation(); goToItemPage(it, "drink"); }}

                  >

                    {/* <button className="fh-x" onClick={() => replaceLine(it.key, { ...it, drink: null })}> */}
                    <button className="fh-x" onClick={(e) => { e.stopPropagation(); replaceLine(it.key, { ...it, drink: null }); }}>

                      <CloseCircleFilled />
                    </button>
                    <div className="fh-modtext">1 X {it.drink.label}</div>
                    <div className="fh-modright"></div>
                  </div>
                )}
              </div>
            )}

            {/* line price */}
            <div className="fh-lineprice">£{Number(it.unitPrice || 0).toFixed(2)}</div>
          </div>
        ))}
      </div>
      {/* new add item modal */}

      {showAdd && (
        <div className="custom-modal">
          <div className="modal-content">
            <h3 style={{ marginTop: 0 }}>Add Manually</h3>

            <div style={{ display: "flex", gap: 12, margin: "8px 0 12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="radio" name="addType" value="item"
                  checked={addType === "item"} onChange={() => setAddType("item")} />
                Item
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="radio" name="addType" value="modifier"
                  checked={addType === "modifier"} onChange={() => setAddType("modifier")} />
                Modifier
              </label>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <label> Name
                <input
                  type="text" value={addName} onChange={(e) => setAddName(e.target.value)}
                  placeholder={addType === "item" ? "e.g. Garlic Bread" : "e.g. Extra Cheese"}
                  style={{ width: "100%", padding: "8px 10px", marginTop: 6 }}
                />
              </label>

              <label> Price
                <input
                  type="number" step="0.01" min="0" value={addPrice}
                  onChange={(e) => setAddPrice(e.target.value)}
                  placeholder="0.00" style={{ width: "100%", padding: "8px 10px", marginTop: 6 }}
                />
              </label>
            </div>

            {addType === "modifier" && (
              <p style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
                This modifier will be added to the <b>last item</b> in the basket.
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <button className="fh-btn outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="fh-btn solid" onClick={handleAddManual}>Add</button>
            </div>
          </div>
        </div>
      )}


    </aside>
  );
}


