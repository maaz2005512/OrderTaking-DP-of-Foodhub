// FilterBar.jsx
import React, { useEffect, useState, useMemo } from "react";
import { HomeOutlined, SearchOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase"; // your firebase config
import "./styles.css";

const FilterBar = () => {
  const { shopId } = useParams(); // dynamic route param
  // const shopName = decodeURIComponent(shopId || "Shop"); // fallback if not passed
   const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith("/admin");
  const base = isAdmin ? `/admin/shop/${shopId}` : `/dashboard/${shopId}`;

  const [shopName, setShopName] = useState("Loading...");
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [allProducts, setAllProducts] = useState([]);   // cached on first open
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      if (!shopId) return;
      const docRef = doc(db, "shops", shopId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setShopName(docSnap.data().name || "Unnamed Shop");
      } else {
        setShopName("Unknown Shop");
      }
    };

    fetchShop();
  }, [shopId]);

  // lazy load products only when search opens the first time
  useEffect(() => {
    if (!searchOpen || allProducts.length || !shopId) return;
    (async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, `shops/${shopId}/products`));
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllProducts(rows);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchOpen, allProducts.length, shopId]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return allProducts
      .filter(p => String(p.name || "").toLowerCase().includes(term))
      .slice(0, 30);
  }, [q, allProducts]);

  const goToProduct = (p) => {
    if (!p) return;
    const cat = (p.categoryPathStr || p.category || "").toString();
    const safeCat = cat ? cat : "menu";
    // Foodhub-style: jump straight to sizes/builder route
    navigate(`${base}/menu/${safeCat}/${p.id}/sizes`, { state: { product: p } });
    setSearchOpen(false);
    setQ("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") { setSearchOpen(false); setQ(""); }
    if (e.key === "Enter" && results[0]) { goToProduct(results[0]); }
  };

  return (
    // <div className="filter-bar">
    //   <div className="tab-buttons">
    //     <button className="tab-btn selected">Menu</button>
    //     <button className="tab-btn">Manage</button>
    //     <span className="shop-name">{shopName}</span>
    //   </div>

    //   <div className="right-section">
    //     <SearchOutlined className="filter-icon" />
    //     <HomeOutlined className="filter-icon" />
    //     <AppstoreOutlined className="filter-icon selected-icon" />
        
    //   </div>
    // </div>
    <>
      <div className="filter-bar">
        <div className="tab-buttons">
          <button className="tab-btn selected">Menu</button>
          <button className="tab-btn">Manage</button>
          <span className="shop-name">{shopName}</span>
        </div>

        <div className="right-section">
          <SearchOutlined className="filter-icon" onClick={() => setSearchOpen(true)} />
          <HomeOutlined className="filter-icon" />
          <AppstoreOutlined className="filter-icon selected-icon" />
        </div>
      </div>

      {searchOpen && (
        <div className="search-overlay" onKeyDown={onKeyDown}>
          <div className="search-modal" role="dialog" aria-modal="true">
            <div className="search-head">
              <input
                autoFocus
                type="text"
                placeholder="Search menu items…"
                className="search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="search-close" onClick={() => { setSearchOpen(false); setQ(""); }}>
                ×
              </button>
            </div>
            <div className="search-body">
              {loading && <div className="search-status">Loading…</div>}
              {!loading && q && results.length === 0 && (
                <div className="search-status">No matches</div>
              )}
              {!loading && results.length > 0 && (
                <ul className="search-list">
                  {results.map(p => (
                    <li
                      key={p.id}
                      className="search-item"
                      onClick={() => goToProduct(p)}
                    >
                      <div className="si-name">{p.name}</div>
                      <div className="si-meta">
                        {(p.categoryPathStr || p.category || "Uncategorised")}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterBar;
