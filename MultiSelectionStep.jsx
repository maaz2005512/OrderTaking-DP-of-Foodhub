import React from "react";

/**
 * Multi-select step (e.g., Sauces, simple extra choices without NO/LESS/FREE).
 * NOTE: If you need NO/LESS/FREE, use ModifiersStep instead.
 *
 * Props:
 * - group: {
 *     key, label,
 *     type: "multi",
 *     required?: boolean,
 *     options: [{ label, price? }]
 *   }
 * - value: []  // current selections [{ label, price }]
 * - onChange: (nextArray) => void
 */
// export default function MultiSelectStep({ group, value = [], onChange }) {
export default function MultiSelectStep({ group, value = [], onChange, extraTile = null, onEdit }) {
  // const toggle = (opt) => {
  //   const exists = value.find((v) => v.label === opt.label);
  //   if (exists) {
  //     onChange(value.filter((v) => v.label !== opt.label));
  //   } else {
  //     onChange([
  //       ...value,
  //       { label: opt.label, price: Number(opt.price || 0) }
  //     ]);
  //   }
  // };
  const toggle = (opt) => {
  const exists = value.find((v) => String(v.id) === String(opt.id));
  if (exists) {
    onChange(value.filter((v) => String(v.id) !== String(opt.id)));
  } else {
    onChange([
      ...value,
      { id: opt.id, label: opt.label, price: Number(opt.price || 0) }
    ]);
  }
};

  // const isSelected = (label) => value.some((v) => v.label === label);
  const isSelected = (id) => value.some((v) => String(v.id) === String(id));


  return (
    <div className="multi-select-step">
      <div className="options-grid">
        {group.options.map((opt) => (
          <button
            // key={opt.label}
            // type="button"
            // className={`product-card ${isSelected(opt.label) ? "active" : ""}`}
            // onClick={() => toggle(opt)}
            // title={opt.label}
            key={opt.id || opt.label}
  type="button"
  className={`product-card ${isSelected(opt.id) ? "active" : ""}`}
  onClick={() => toggle(opt)}
  title={opt.label}
          >

            <span
    className="edit-chip"
    onClick={(e) => {
      e.stopPropagation();
      onEdit?.(opt);
    }}
  >
    Edit
  </span>
            {opt.label}
            {opt.price ? ` – £${Number(opt.price).toFixed(2)}` : ""}
          </button>
        ))}
        {extraTile}
      </div>
    </div>
  );
}
