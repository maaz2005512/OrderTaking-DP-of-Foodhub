import React from "react";
import { useNavigate } from "react-router-dom";
/**
 * Single-select step (e.g., Size, Serve, Drink).
 *
 * Props:
 * - group: { key, label, type: "single", required?, options: [{ label, price?, value? }] }
 * - value: []   // current selection as array of one [{ label, price, value? }]
 * - onChange: (nextArray) => void
 */
// export default function SingleSelectStep({ group, value = [], onChange }) {
export default function SingleSelectionStep({ group, value = [], onChange, extraTile = null, onEdit, autoNavigateBack = false, shopId }) {
  // const selected = value[0]?.label;
   const navigate = useNavigate();
  const selectedId = value[0]?.id;


  
//   const click = (opt) => {
//   if (selectedId === opt.id) {
//     onChange([]);
//   } else {
//     onChange([{
//       id: opt.id,
//       label: opt.label,
//       price: Number(opt.price || 0),
//       value: opt.value ?? opt.id
//     }]);
//      // 🆕 If autoNavigateBack is true → go back immediately
//       if (autoNavigateBack) {
//         setTimeout(() => {
//            navigate(`/dashboard/${shopId}/menu`, { state: { refresh: Date.now() } });
//         }, 150); // small delay to let state update
//       }
//   }
// };
  const click = (opt) => {
    if (selectedId === opt.id) {
      onChange([]);
    } else {

     const normalized = {
       id: String(opt.id ?? opt.value ?? ""),
       value: String(opt.value ?? opt.id ?? ""),
       label: opt.label,
       price: Number(opt.price || 0),
       raw: opt,
     };

     // 🟢 requiredIf generic resolver:
     // ensure dependent steps will see the expected value
     if (group?.id || group?.key) {
       normalized.groupKey = group.id || group.key;
     }
     onChange([normalized]);
      if (autoNavigateBack) {
        setTimeout(() => {
          navigate(`/dashboard/${shopId}/menu`, { state: { refresh: Date.now() } });
        }, 150); // chhota delay taake state update ho jaye
      }
    }
  }
  return (
    <div className="single-select-step">
      <div className="options-grid">
        {group.options.map((opt) => (
          <button
           
            key={opt.id || opt.label}
  type="button"
  className={`product-card ${selectedId === opt.id ? "active" : ""}`}
  onClick={() => click(opt)}
  title={opt.label}
          >
            {opt.label}
            {/* {opt.price ? ` – £${Number(opt.price).toFixed(2)}` : ""} */}
            {(() => {
  const hide =
    (group?.uiHints?.hidePriceFor || []).includes(opt.id) ||
    Boolean(opt?.raw?.ui?.hidePrice);
  return !hide && Number(opt.price)
    ? ` – £${Number(opt.price).toFixed(2)}`
    : "";
})()}
          </button>
        ))}
        {extraTile}
      </div>
    </div>
  );
}
