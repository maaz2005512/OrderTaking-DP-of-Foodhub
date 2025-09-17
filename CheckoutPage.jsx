import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom"; // ⬅️ useLocation added
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  PercentageOutlined,
  MessageOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

import "./checkout.css";

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { createOrder } from "../../utils/createOrder";
import { resolveOwnerKey } from "../../utils/resolveOwnerKey";
import axios from "axios";
import debounce from "lodash.debounce";

const formatCurrency = (n) =>
  (Number.isFinite(n) ? n : 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// small helper for fields that can be string OR {label:...}
const asText = (v) => (typeof v === "string" ? v : (v?.label || ""));

export default function CheckoutPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // ⬅️
  const isAdmin = location.pathname.startsWith("/admin"); // ⬅️
  const base = isAdmin ? `/admin/shop/${shopId}` : `/dashboard/${shopId}`; // ⬅️

  // Cart (same as CheckoutPanel)
  const { items, subtotal, clearCart } = useCart();
  const isEmpty = !items || items.length === 0;

  // Auth
  const { currentUser, loading: authLoading, allowedShops } = useAuth();

  // Resolve ownerKey (username for Firestore path names/{ownerKey})
  const [ownerKey, setOwnerKey] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (authLoading) return; // wait for auth to settle
      if (!currentUser) { setOwnerLoading(false); return; }
      const key = await resolveOwnerKey(currentUser);
      if (!active) return;
      setOwnerKey(key || null);
      setOwnerLoading(false);
    })();
    return () => { active = false; };
  }, [currentUser, authLoading]);

  // Optional: ensure worker is allowed on this shop
  const shopAllowed =
    !Array.isArray(allowedShops) || allowedShops.length === 0
      ? true
      : allowedShops.includes(shopId);

  // Left column (customer/type)
  const [orderType, setOrderType] = useState("Delivery");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");

  const [query, setQuery] = useState("");
const [suggestions, setSuggestions] = useState([]);
const [loadingAddr, setLoadingAddr] = useState(false);
const [selectedPostcode, setSelectedPostcode] = useState(""); // ✅ naya state
const [doorNumber, setDoorNumber] = useState("");
const [addressType, setAddressType] = useState("House");
const [deliveryNote, setDeliveryNote] = useState("");

  // Right column (payment/discount/comments)
  const [paymentMethod, setPaymentMethod] = useState("Not Paid");
  const [discountType, setDiscountType] = useState("amount");
  const [discountValue, setDiscountValue] = useState(0);
  const [comments, setComments] = useState("");
  // 🔹 NEW STATES
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [placing, setPlacing] = useState(false);

  const discountAmount = useMemo(() => {
    const v = Number(discountValue) || 0;
    if (discountType === "percent") {
      const pct = Math.max(0, Math.min(100, v));
      return (subtotal * pct) / 100;
    }
    return Math.max(0, Math.min(subtotal, v));
  }, [discountType, discountValue, subtotal]);

  // const grandTotal = Math.max(0, subtotal - discountAmount);
  // 🔹 grandTotal with delivery + service
  const grandTotal = Math.max(
    0,
    subtotal - discountAmount + Number(deliveryCharge || 0) + Number(serviceCharge || 0)
  );


// const fetchAddresses = debounce(async (q) => {
//   if (!q || q.length < 3) {
//     setSuggestions([]);
//     return;
//   }
//   try {
//     setLoadingAddr(true);
//     const res = await axios.get(
//       `https://us1.locationiq.com/v1/autocomplete.php`,
//       {
//         params: {
//           key: "pk.d466ed1ea35a5168f3a0e5993f729153", // 👈 apni LocationIQ key daalna
//           q,
//           limit: 5,            // sirf 5 suggestions
//           countrycodes: "gb",  // UK restrict
//         },
//       }
//     );
//     setSuggestions(res.data || []);
//   } catch (err) {
//     console.error("Address lookup failed:", err.message);
//     setSuggestions([]);
//   } finally {
//     setLoadingAddr(false);
//   }
// }, 500); // 👈 500ms debounce
// 🔹 Step 1: fetch postcode suggestions
// 🔹 Step 1: Postcodes.io autocomplete (fast)
// 🔹 Step 1: Postcodes.io → autocomplete list of postcodes
const fetchAddresses = debounce(async (q) => {
  if (!q || q.length < 3) {
    setSuggestions([]);
    return;
  }

  try {
    setLoadingAddr(true);
    const res = await axios.get(`https://api.postcodes.io/postcodes`, {
      params: { q }
    });

    const postcodes = res.data?.result?.map((p) => p.postcode) || [];
    setSuggestions(postcodes);
  } catch (err) {
    console.error("Postcode lookup failed:", err.message);
    setSuggestions([]);
  } finally {
    setLoadingAddr(false);
  }
}, 500);

// 🔹 Step 2: Nominatim via allorigins → fetch streets for selected postcode
// ✅ On final postcode selection → build ONE Foodhub-style formatted line
const fetchFormattedAddress = async (postcode, attempt = 1) => {
  try {
    setLoadingAddr(true);

    // Step 1: lat/lon from Postcodes.io
    const geo = await axios.get(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`
    );
    const r = geo.data?.result;
    const lat = r?.latitude;
    const lon = r?.longitude;

    if (!lat || !lon) {
      console.warn("No lat/lon for", postcode);
      // fallback: best-effort using Postcodes.io parts
      const fallback = [
        postcode,
        r?.admin_ward,
        r?.admin_district,
        r?.region,
        "UK",
      ].filter(Boolean).join(", ");
      setQuery(fallback);
      setAddress(fallback);
      setSelectedPostcode(postcode);
      setSuggestions([]);
      return;
    }

    // Step 2: reverse geocode (via allorigins to avoid CORS)
    const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const revRes = await axios.get(
      `https://api.allorigins.win/get?url=${encodeURIComponent(revUrl)}`
    );
    const rev = JSON.parse(revRes.data.contents);

    const a = rev?.address || {};
    // Prefer road; else suburb/village/hamlet; then town/city/county
    const partRoad = a.road || a.pedestrian || a.footway || a.path || a.suburb || a.village || a.hamlet || a.neighbourhood;
    const partTown = a.town || a.city || a.county || a.state_district || a.state;

    const formatted = [
      postcode,
      partRoad,                 // street/area if available
      a.suburb && a.suburb !== partRoad ? a.suburb : null,
      partTown,
      "UK",
    ].filter(Boolean).join(", ");

    // ✅ Set final one-line address like Foodhub
    setQuery(formatted);
    setAddress(formatted);
    setSelectedPostcode(postcode);
    setSuggestions([]);
  } catch (err) {
    console.error("Formatted address build failed:", err.message);
    if (attempt === 1) return fetchFormattedAddress(postcode, 2);

    // last fallback: only postcode + UK
    const minimal = `${postcode}, UK`;
    setQuery(minimal);
    setAddress(minimal);
    setSelectedPostcode(postcode);
    setSuggestions([]);
  } finally {
    setLoadingAddr(false);
  }
};

// const fetchStreets = async (postcode, attempt = 1) => {
//   try {
//     setLoadingAddr(true);

//     // Step 1: Get lat/lon from Postcodes.io
//     const geo = await axios.get(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
//     const lat = geo.data?.result?.latitude;
//     const lon = geo.data?.result?.longitude;

//     if (!lat || !lon) {
//       console.warn("❌ No lat/lon found for postcode", postcode);
//       setSuggestions([]);
//       return;
//     }

//     // Step 2: Overpass query by radius (1km circle)
//     const query = `
//       [out:json][timeout:25];
//       way(around:1000,${lat},${lon})["highway"];
//       out tags;
//     `;

//     const res = await axios.post(
//       "https://overpass-api.de/api/interpreter",
//       query,
//       { headers: { "Content-Type": "text/plain" } }
//     );

//     const elements = res.data?.elements || [];

//     const streets = elements
//       .map((el) => el.tags?.name)
//       .filter(Boolean);

//     console.log("📍 Postcode:", postcode, "Lat/Lon:", lat, lon);
//     console.log("🔎 Overpass elements:", elements.length);
//     console.log("✅ Streets extracted:", streets);

//     setSuggestions([...new Set(streets)]);
//   } catch (err) {
//     console.error("Street lookup failed:", err.message);
//     if (attempt === 1) {
//       console.log("Retrying street lookup...");
//       fetchStreets(postcode, 2);
//     } else {
//       setSuggestions([]);
//     }
//   } finally {
//     setLoadingAddr(false);
//   }
// };



  const handleFinish = async (forcedMethod) => {
    if (placing || isEmpty) return;
    if (authLoading) return;
    if (!currentUser) {
      alert("User not identified. Please sign in again.");
      return;
    }

    // guards
    if (!shopId) {
      alert("Shop not selected. Open via dashboard and try again.");
      return;
    }
    if (ownerLoading) {
      alert("Please wait, preparing your account…");
      return;
    }
    if (!ownerKey) {
      alert("Owner account not identified. Please sign in again.");
      return;
    }
    if (!shopAllowed) {
      alert("You are not allowed to place orders for this shop.");
      return;
    }

    const payMethod = forcedMethod || paymentMethod || "Not Paid";

    // light validation
    if (!phone.trim()) {
      alert("Please enter customer phone.");
      return;
    }
    if (orderType === "Delivery" && !address.trim()) {
      alert("Please add delivery address or switch to Pickup/In-Store.");
      return;
    }

    try {
      setPlacing(true);

      // payload aligns with CheckoutPanel line shape
      const payload = {
        status: "Pending",
        orderType, // Delivery / Pickup / In-Store
        items, // [{ key, productId, name, size, serve, toppings[], sauce, drink, unitPrice, qty }]
        subtotal,
        discountType,
        discountValue: Number(discountValue) || 0,
        discountAmount,
        deliveryCharge: Number(deliveryCharge) || 0,   // 🔹
        serviceCharge: Number(serviceCharge) || 0,     // 🔹
        total: grandTotal,
        paymentMethod: payMethod,
        paid: ["Cash", "Card", "Card Over Phone"].includes(payMethod),
        customerPhone: phone.trim(),
        customerFirstName: firstName.trim() || null,
        customerLastName: lastName.trim() || null,
        address:
  orderType === "Delivery"
     ? `${doorNumber ? doorNumber + ", " : ""}${address} (${addressType})`
    : null,
deliveryNote: deliveryNote || null,

        // address: orderType === "Delivery" ? address.trim() : null,
        comments: comments?.trim() || null,
      };

      // write under names/{ownerKey}/shops/{shopId}/orders
      const orderId = await createOrder(shopId, payload, { authUser: currentUser });

      clearCart();
      navigate(`${base}/menu`, { replace: true }); // ⬅️ base-aware
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="fhx-wrap">
      {/* Header row */}
      <div className="fhx-top">
        <button className="fhx-ghost" onClick={() => navigate(`${base}/menu`)}>
          <ArrowLeftOutlined /> Menu
        </button>
        <div className="fhx-top-center">Manage</div>
        <div className="fhx-top-end">{ownerKey || "Shop"}</div>
      </div>

      <div className="fhx-grid">
        {/* LEFT: form */}
        <div className="fhx-left fhx-card">
          {/* tabs */}
          <div className="fhx-tabs">
            {[
              { key: "Delivery", label: "Delivery", eta: "45 mins", icon: "🚚" },
              { key: "Pickup", label: "Pickup", eta: "20 mins", icon: "🧺" },
              { key: "In-Store", label: "In-Store", eta: "15 mins", icon: "🧾" },
            ].map((t) => (
              <button
                key={t.key}
                className={`fhx-tab ${orderType === t.key ? "active" : ""}`}
                onClick={() => setOrderType(t.key)}
                type="button"
              >
                <span className="fhx-tab-icon">{t.icon}</span>
                <div className="fhx-tab-text">
                  <div>{t.label}</div>
                  <small>{t.eta}</small>
                </div>
              </button>
            ))}
          </div>

          {/* customer fields */}
          <div className="fhx-row-3">
            <div className="fhx-field">
              <label>
                Phone no.<span className="req">*</span>
              </label>
              <input
                className="fhx-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07xxx xxxxxx"
              />
            </div>
            <div className="fhx-field">
              <label>First Name</label>
              <input
                className="fhx-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ali"
              />
            </div>
            <div className="fhx-field">
              <label>Last Name</label>
              <input
                className="fhx-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Khan"
              />
            </div>
          </div>

          {/* address for Delivery */}
{orderType === "Delivery" && (
  <>
    <div className="fhx-add-address">ADD ADDRESS</div>
    <div className="fhx-field" style={{ position: "relative" }}>

<input
  className="fhx-input"
  value={query}
  onChange={(e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedPostcode("");  // reset when typing new
    fetchAddresses(val);      // step 1: postcode suggestions
  }}
  placeholder="Enter postcode..."
/>
{loadingAddr && <div className="loading">Searching...</div>}

{/* 🔹 Postcode suggestions */}
{!selectedPostcode && suggestions.length > 0 && (
  <div className="autocomplete-dropdown">
    {suggestions.map((pc, idx) => (
      <div
        key={idx}
        className="suggestion-item"
        onClick={() => {
          setQuery(pc);
          setSelectedPostcode(pc);
          setSuggestions([]);   // clear first
          fetchFormattedAddress(pc);
        }}
      >
        {pc}
      </div>
    ))}
  </div>
)}

{/* 🔹 Street suggestions (after postcode selected) */}
{selectedPostcode && suggestions.length > 0 && (
  <div className="autocomplete-dropdown">
    {suggestions.map((street, idx) => (
      <div
        key={idx}
        className="suggestion-item"
        onClick={() => {
          setQuery(`${street}, ${selectedPostcode}`);
          setAddress(`${street}, ${selectedPostcode}`);
          setSuggestions([]);
        }}
      >
        {street}
      </div>
    ))}
  </div>
)}


      {/* <input
        className="fhx-input"
        value={query}
        onChange={(e) => {
          const val = e.target.value;
          setQuery(val);
          fetchAddresses(val);
        }}
        placeholder="Start typing address..."
      />
      {loadingAddr && <div className="loading">Searching...</div>}

      {suggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              className="suggestion-item"
              onClick={() => {
                setQuery(s.display_name);
                setSuggestions([]);
                setAddress(s.display_name);
              }}
            >
              {s.display_name}
            </div>
          ))}
        </div>
      )} */}

    </div>

    {address && (
      <>
        <div className="fhx-field">
          <label>House/Door No.</label>
          <input
            className="fhx-input"
            value={doorNumber}
            onChange={(e) => setDoorNumber(e.target.value)}
            placeholder="e.g. 12A"
          />
        </div>

        <div className="fhx-chip-row">
          {["House", "Apartment", "Office", "Hotel", "Others"].map((t) => (
            <button
              key={t}
              className={`fhx-chip ${addressType === t ? "active" : ""}`}
              onClick={() => setAddressType(t)}
              type="button"
            >
              {t}
            </button>
          ))}
        </div>

        <div className="fhx-field">
          <label>Instruction for delivery person</label>
          <textarea
            className="fhx-input"
            rows={2}
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            placeholder="e.g. Ring the bell, leave at reception..."
          />
        </div>
      </>
    )}
  </>
)}

          {/* {orderType === "Delivery" && (
            <>
              <div className="fhx-add-address">ADD ADDRESS</div>
              <div className="fhx-field">
                <input
                  className="fhx-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Search for address"
                />
              </div>
            </>
          )} */}

          {/* payment chips */}
          <div className="fhx-section-title">PAYMENT</div>
          <div className="fhx-chip-row">
            {["Not Paid", "Cash", "Card", "Card Over Phone"].map((p) => (
              <button
                key={p}
                className={`fhx-chip ${paymentMethod === p ? "active" : ""}`}
                onClick={() => setPaymentMethod(p)}
                type="button"
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          {/* controls */}
          <div className="fhx-left-actions">
            <button className="fhx-btn ghost" onClick={clearCart} disabled={isEmpty}>
              CLEAR
            </button>
            <button
              className="fhx-btn"
              onClick={() => handleFinish()}
              disabled={isEmpty || placing || authLoading || !currentUser}
              title={isEmpty ? "Basket is empty" : "Finish order"}
            >
              FINISH
            </button>
            <button className="fhx-btn ghost" disabled>
              Preorder
            </button>
          </div>
        </div>

        {/* RIGHT: action panel + basket (summary) */}
        <div className="fhx-right">
          <div className="fhx-card fhx-right-top">
            <div className="fhx-right-row">
              <button className="fhx-btn ghost wide">OPTIONS</button>
              <button
                className="fhx-btn success wide"
                onClick={() => handleFinish()}
                disabled={isEmpty || placing || authLoading || !currentUser}
              >
                FINISH £{formatCurrency(grandTotal)}
              </button>
            </div>

            <div className="fhx-right-row">
              <button
                className="fhx-btn success wide"
                onClick={() => handleFinish("Cash")}
                disabled={isEmpty || placing || authLoading || !currentUser}
              >
                <ThunderboltOutlined /> CASH
              </button>
              <button
                className="fhx-btn success wide"
                onClick={() => handleFinish("Card")}
                disabled={isEmpty || placing || authLoading || !currentUser}
              >
                <ThunderboltOutlined /> CARD
              </button>
            </div>

            {/* toolbar (quick inputs) */}
            <div className="fhx-toolbar">
              <button className="fhx-tool" onClick={() => navigate(`${base}/menu`)}>
                <PlusOutlined /> <span>Add Item</span>
              </button>

              <div className="fhx-tool">
                <PercentageOutlined /> <span>Discount</span>
                <div className="fhx-discount">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="fhx-input"
                  >
                    <option value="amount">Amount (£)</option>
                    <option value="percent">Percent (%)</option>
                  </select>
                  <input
                    type="number"
                    className="fhx-input"
                    placeholder={discountType === "percent" ? "0–100" : "0"}
                    min="0"
                    max={discountType === "percent" ? 100 : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="fhx-tool">
                <MessageOutlined /> <span>Comments</span>
                <textarea
                  className="fhx-input"
                  rows={2}
                  placeholder="Add any special instructions..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>

           
              <button className="fhx-tool danger" onClick={() => navigate(`${base}/menu`)}>
                <CloseCircleOutlined /> <span>Cancel</span>
              </button>
            </div>

             {/* 🔹 Charges Section */}
<div className="fhx-charges">
  <h4>Charges</h4>

  <div className="fhx-charge-row">
    <label>Delivery Charge (£)</label>
    <input
      type="number"
      className="fhx-input"
      value={deliveryCharge}
      onChange={(e) => setDeliveryCharge(e.target.value)}
      placeholder="0.00"
    />
  </div>

  <div className="fhx-charge-row">
    <label>Service Charge (£)</label>
    <input
      type="number"
      className="fhx-input"
      value={serviceCharge}
      onChange={(e) => setServiceCharge(e.target.value)}
      placeholder="0.00"
    />
  </div>
</div>

            <div className="fhx-total-row">
              <div>Total</div>
              <div className="fhx-total-amount">£{formatCurrency(grandTotal)}</div>
            </div>
          </div>

          {/* basket */}
          <div className="fhx-card fhx-basket">
            {isEmpty ? (
              <div className="fhx-empty">
                <p>Your basket is empty!!</p>
                <p>Please add items to place order</p>
              </div>
            ) : (
              <div className="fhx-basket-list">
                {items.map((it) => {
                  const lineTotal =
                    (Number(it.unitPrice) || 0) * (Number(it.qty) || 0);
                  return (
                    <div key={it.key} className="fhx-basket-item">
                      <div className="fhx-b-left">
                        <div className="fhx-b-name">{it.name}</div>
                        <div className="fhx-b-meta">
                          {!!it.size && <span>{asText(it.size)}</span>}
                          {it.serve && <span>• {it.serve}</span>}
                        </div>
                        {Array.isArray(it.toppings) && it.toppings.length > 0 && (
                          <div className="fhx-b-tags">
                            {it.toppings.map((t) => (
                              <span key={t.id} className="fhx-tag">
                                {t.label}
                                {t.isCrust ? " (Crust)" : ""}
                                {t.mode === "free"
                                  ? " (Free)"
                                  : t.mode === "less"
                                  ? " (Less)"
                                  : t.mode === "no"
                                  ? " (No)"
                                  : ""}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="fhx-b-extras">
                          {!!it.sauce && (
                            <span className="fhx-pill">Sauce: {asText(it.sauce)}</span>
                          )}
                          {!!it.drink && (
                            <span className="fhx-pill">Drink: {asText(it.drink)}</span>
                          )}
                        </div>
                      </div>
                      <div className="fhx-b-right">
                        <div className="fhx-b-qty">× {it.qty}</div>
                        <div className="fhx-b-price">£{formatCurrency(lineTotal)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
