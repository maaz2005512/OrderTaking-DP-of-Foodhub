// import React from "react";
// import "./styles.css";

// const SubcategoryBar = ({ categoryName, subcategories }) => {
//   return (
//     <div className="subcategory-bar">
//       <span className="breadcrumb">{categoryName}</span>
//       {subcategories.map((sub, index) => (
//         <span className="subcategory-pill" key={index}>
//           {sub}
//         </span>
//       ))}
//     </div>
//   );
// };

// export default SubcategoryBar;

import React from "react";
import "./styles.css";

const SubcategoryBar = ({ categoryName, subcategories, selected, onSelect }) => {
  return (
    <div className="subcategory-bar">
      <span className="breadcrumb">{categoryName}</span>
      {subcategories.map((sub, index) => (
        <span
          className={`subcategory-pill ${sub === selected ? "active" : ""}`}
          key={index}
          onClick={() => onSelect(sub)}
        >
          {sub}
        </span>
      ))}
    </div>
  );
};

export default SubcategoryBar;

