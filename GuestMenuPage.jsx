// src/menu/GuestMenuPage.jsx
import React from "react";
import FilterBar from "./components/FilterBar";
import "./components/styles.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import CheckoutPanel from "./components/CheckoutPanel";
import { SHOP_MENUS } from "./configs/shops";
import { collection, query, orderBy, limit, onSnapshot, doc, getDocs, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import DataCache from "../utils/DataCache"

const SHOP_ALIASES = { "tasty-spot": "tastyspot", "qfc-denton": "qfc_denton" };
const normalizeKey = (s = "") => String(s).trim().toLowerCase().replace(/[\s-]+/g, "_");

export default function GuestMenuPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { shopId } = useParams();


  // ✅ namespace-aware base (no UI change)
  const isAdmin = location.pathname.startsWith("/admin");
  const base = isAdmin ? `/admin/shop/${shopId}` : `/dashboard/${shopId}`;

  const [topPicks, setTopPicks] = React.useState([]);
  // const [cfg, setCfg] = React.useState(SHOP_MENUS._default);
  const [cfg, setCfg] = React.useState(SHOP_MENUS);

  React.useEffect(() => {
  const fetchShopConfig = async () => {
    const cacheKey = `shop_config_${shopId}`;
    
    try {
      const config = await DataCache.get(cacheKey, async () => {
        const sref = doc(db, `shops/${shopId}`);
        const snap = await getDoc(sref);
        const data = snap.exists() ? snap.data() : {};
        const raw = data.slug || data.name || "";
        const aliasOrRaw = SHOP_ALIASES[raw] || raw;
        const key = normalizeKey(aliasOrRaw);
        return SHOP_MENUS[key] || SHOP_MENUS._default;
      });
      
      setCfg(config);
    } catch {
      setCfg(SHOP_MENUS._default);
    }
  };
  
  fetchShopConfig();
}, [shopId]);
  // React.useEffect(() => {
  //   let off = false;
  //   (async () => {
  //     try {
  //       const sref = doc(db, `shops/${shopId}`);
  //       const snap = await getDoc(sref);
  //       const data = snap.exists() ? snap.data() : {};
  //       const raw = data.slug || data.name || "";
  //       const aliasOrRaw = SHOP_ALIASES[raw] || raw;
  //       const key = normalizeKey(aliasOrRaw);
  //       const next = SHOP_MENUS[key] || SHOP_MENUS._default;
  //       if (!off) setCfg(next);
  //     } catch {
  //       if (!off) setCfg(SHOP_MENUS._default);
  //     }
  //   })();
  //   return () => { off = true; };
  // }, [shopId]);

  React.useEffect(() => {
  if (!shopId) return;
  
  const fetchTopPicks = async () => {
    const cacheKey = `top_picks_${shopId}`;
    
    const picks = await DataCache.get(cacheKey, async () => {
      const qRef = query(
        collection(db, `shops/${shopId}/topPicks`),
        orderBy("countAll", "desc"),
        limit(10)
      );
      const snap = await getDocs(qRef); // getDocs instead of onSnapshot
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }, 2 * 60 * 1000); // 2 minutes cache
    
    setTopPicks(picks);
  };
  
  fetchTopPicks();
}, [shopId]);
  // React.useEffect(() => {
  //   if (!shopId) return;
  //   const qRef = query(
  //     collection(db, `shops/${shopId}/topPicks`),
  //     orderBy("countAll", "desc"),
  //     limit(10)
  //   );
  //   const unsub = onSnapshot(qRef, (snap) => {
  //     setTopPicks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  //   });
  //   return unsub;
  // }, [shopId]);

  const itemsForTopSelling =
    topPicks.length > 0
      ? topPicks
      : (cfg.topSelling || []).map((name, i) => ({ id: `fallback-${i}`, name }));

  const categories = Array.from(new Set(cfg.categories || []));
  const showAddMoreTile = !categories.some(
    (c) => String(c).toLowerCase() === "add more"
  );

  const handleCategoryClick = (cat) => {
    if (String(cat).toLowerCase() === "add more") {
      navigate(`${base}/add-item-page`);
    } else {
      const formattedCat = String(cat).toLowerCase().replace(/\s+/g, "-");
      navigate(`${base}/menu/${formattedCat}`);
    }
  };

  const handleTopItemClick = (rec) => {
    if (rec.categoryPathStr && rec.productId) {
      navigate(`${base}/menu/${rec.categoryPathStr}/${rec.productId}/sizes`);
    } else if (rec.categoryPathStr) {
      navigate(`${base}/menu/${rec.categoryPathStr}`);
    } else {
      const formatted = String(rec.name || "").toLowerCase().replace(/\s+/g, "-");
      navigate(`${base}/menu/${formatted}`);
    }
  };

  return (
    <div className={`menu-page theme-${cfg.theme || "green"}`}>
      <FilterBar />
      <div className="menu-layout">
        <div className="category-grid">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              className={`category-tile ${String(cat).toLowerCase().includes("instore") ? "red" : cfg.theme}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </button>
          ))}

          {showAddMoreTile && (
            <button
              type="button"
              className="category-tile add-more"
              onClick={() => navigate(`${base}/add-item-page`)}
            >
              Add More
            </button>
          )}

          <div className="top-selling-wrapper">
            <h4 className="top-selling-title">TOP SELLING ITEMS</h4>
            <div className="top-selling-grid">
              {itemsForTopSelling.map((rec) => (
                <button
                  key={rec.id}
                  className="category-tile blue"
                  onClick={() => handleTopItemClick(rec)}
                >
                  {rec.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <CheckoutPanel />
      </div>
    </div>
  );
}

