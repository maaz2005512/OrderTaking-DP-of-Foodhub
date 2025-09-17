import React from "react";
import ProductCard from "./ProductCard";
import "../components/styles.css"; // Make sure styling is loaded

const CategoryBlock = ({ title, products , onAddToCart  }) => {
  return (
    <div className="category-block">
      <h2 className="category-title">{title}</h2>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard 
             key={product.id}
             product={product}
             onClick={(product) => onAddToCart(product)}
              />
        ))}
      </div>
    </div>
  );
};

export default CategoryBlock;
