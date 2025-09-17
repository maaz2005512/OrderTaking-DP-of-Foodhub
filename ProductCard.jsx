// import React from "react";
// import { useCart } from "../../context/CartContext";
// import "./styles.css";

// /**
//  * ProductCard
//  * - Flavours grid: pass price = undefined (so £ hide) and showDescription = false
//  * - Sizes grid: pass numeric price (so £ shows) and showDescription = false (desc header par aa rahi hoti hai)
//  * - If you want description on a card, pass showDescription={true}
//  */
// const ProductCard = ({ product, onClick, showDescription = false }) => {
//   const { addToCart } = useCart();

//   const handleClick = () => {
//     if (typeof onClick === "function") {
//       onClick(product);
//     } else {
//       // fallback: direct add (use only on places where clicking should add)
//       addToCart(product);
//     }
//   };

//   const showPrice =
//     typeof product?.price === "number" && !Number.isNaN(product.price);

//   return (
//     <div className="product-card" onClick={handleClick}>
//       <div className="product-info">
//         <h3 className="product-name">{product?.name}</h3>

//         {/* £ only when numeric price is provided (e.g., size cards) */}
//         {showPrice && (
//           <p className="product-price">£{product.price.toFixed(2)}</p>
//         )}

//         {/* Optional description (off by default) */}
//         {showDescription && product?.description && (
//           <p className="product-desc">{product.description}</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ProductCard;


import React from "react";
import { useCart } from "../../context/CartContext";
import "./styles.css";

// Map: theme value → css class
const THEME_CLASS = {
  red:   "theme-red",
  blue:  "theme-blue",
  green: "theme-green",
  black: "theme-black",
};

/**
 * ProductCard
 * - Flavours grid: pass price = undefined (so £ hide) and showDescription = false
 * - Sizes grid: pass numeric price (so £ shows) and showDescription = false (desc header par aa rahi hoti hai)
 * - If you want description on a card, pass showDescription={true}
 *
 * Extra:
 * - theme priority: props.theme > product.themeColor > "inherit"
 */
const ProductCard = ({ product, onClick, showDescription = false, theme }) => {
  const { addToCart } = useCart();

  const handleClick = () => {
    if (typeof onClick === "function") {
      onClick(product);
    } else {
      // fallback: direct add (use only on places where clicking should add)
      addToCart(product);
    }
  };

  const showPrice =
    typeof product?.price === "number" && !Number.isNaN(product.price);

  // resolve theme: explicit prop > product.themeColor > inherit
  const resolvedTheme =
    theme || product?.themeColor || "inherit";
  const themeClass = THEME_CLASS[resolvedTheme] || "";

  return (
    <div className={`product-card ${themeClass}`} onClick={handleClick}>
      <div className="product-info">
        <h3 className="product-name">{product?.name}</h3>

        {/* £ only when numeric price is provided (e.g., size cards) */}
        {showPrice && (
          <p className="product-price">£{product.price.toFixed(2)}</p>
        )}

        {/* Optional description (off by default) */}
        {showDescription && product?.description && (
          <p className="product-desc">{product.description}</p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
