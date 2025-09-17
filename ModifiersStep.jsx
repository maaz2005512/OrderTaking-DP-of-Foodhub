// import React, { useMemo, useState } from "react";
// import "./builder.css";

// export default function ModifiersStep({ group, value = [], onChange }) {
//   const [activeId, setActiveId] = useState(null);

//   const byId = useMemo(() => {
//     const m = new Map();
//     value.forEach(v => m.set(String(v.id), v));
//     return m;
//   }, [value]);

//   const isSelected = (id) => byId.has(String(id));

//   const upsert = (opt, mode = "normal") => {
//     // crust exclusive
//     if (opt.isCrust) {
//       const next = [
//         ...value.filter(v => !v.isCrust && v.id !== opt.id),
//         { id: opt.id, label: opt.label, price: opt.price || 0, mode, isCrust: true },
//       ];
//       onChange(next);
//       return;
//     }
//     // regular
//     const exists = byId.get(String(opt.id));
//     if (exists) {
//       const next = value.map(v => (v.id === opt.id ? { ...v, mode } : v));
//       onChange(next);
//     } else {
//       const next = [
//         ...value,
//         { id: opt.id, label: opt.label, price: opt.price || 0, mode, isCrust: !!opt.isCrust },
//       ];
//       onChange(next);
//     }
//   };

//   const remove = (opt) => onChange(value.filter(v => v.id !== opt.id));

//   const onTileClick = (opt) => {
//     setActiveId(opt.id);
//     // select if not selected yet
//     if (!isSelected(opt.id)) upsert(opt, "normal");
//     // debug
//     // eslint-disable-next-line no-console
//     console.log("tile click:", opt);
//   };

//   const applyMode = (mode) => {
//     const opt = group.options.find(o => String(o.id) === String(activeId));
//     if (!opt) return;
//     if (mode === "no") return remove(opt);
//     if (mode === "less") return upsert(opt, "less");
//     if (mode === "free") return upsert(opt, "free");
//   };

//   return (
//     <div className="fh-mods">
//       <div className="fh-grid">
//         {group.options.map((opt) => {
//           const selected = isSelected(opt.id);
//           return (
//             <button
//               key={opt.id}
//               type="button"
//               className={`fh-tile ${selected ? "selected" : ""} ${opt.isCrust ? "crust" : ""}`}
//               onClick={() => onTileClick(opt)}
//               onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onTileClick(opt)}
//             >
//               <div className="fh-title">{opt.label}</div>
//               <div className="fh-price">{opt.price ? `£${opt.price.toFixed(2)}` : ""}</div>
//             </button>
//           );
//         })}
//       </div>

//       <div className="fh-footer">
//         <button type="button" className="fh-btn big" onClick={() => applyMode("no")} disabled={!activeId}>
//           No
//         </button>
//         <button type="button" className="fh-btn big" onClick={() => applyMode("less")} disabled={!activeId}>
//           Less
//         </button>
//         <button type="button" className="fh-btn big" onClick={() => applyMode("free")} disabled={!activeId}>
//           Free
//         </button>
//       </div>
//     </div>
//   );
// }

import React, { useMemo, useState } from "react";
import "./builder.css";

/**
 * Props:
 *  group: { key:"toppings", label, options:[{id,label,price,isCrust?}], ... }
 *  value: [{ id,label,price,mode?:'normal'|'less'|'free', isCrust? }]
 *  onChange: (nextArray) => void
 *
 * Behaviour:
 *  - Footer buttons set a global MODE (highlighted): 'normal' (default), 'no', 'less', 'free'
 *  - Tile click applies CURRENT MODE to that tile:
 *      normal -> add/update with mode:'normal' (price adds)
 *      less   -> add/update with mode:'less'  (price 0 by our calc)
 *      free   -> add/update with mode:'free'  (price 0)
 *      no     -> remove that topping if present
 *  - Crust (isCrust) exclusive: max 1 at a time
 */
// export default function ModifiersStep({ group, value = [], onChange }) {
export default function ModifiersStep({ group, value = [], onChange, showAddMore = false, onAddMore,  onEdit, }) {
  // global active mode for next clicks
  const [activeMode, setActiveMode] = useState("normal"); // 'normal'|'no'|'less'|'free'

  const byId = useMemo(() => {
    const m = new Map();
    value.forEach((v) => m.set(String(v.id), v));
    return m;
  }, [value]);

  const isSelected = (id) => byId.has(String(id));

  const upsert = (opt, mode = "normal") => {
    // exclusive crust
    if (opt.isCrust) {
      const next = [
        ...value.filter((v) => !v.isCrust && v.id !== opt.id),
        // { id: opt.id, label: opt.label, price: opt.price || 0, mode, isCrust: true },
        { id: opt.id, label: opt.label, price: opt.price || 0, mode, isCrust: true, raw: opt.raw },

      ];
      onChange(next);
      return;
    }
    // regular
    const exists = byId.get(String(opt.id));
    if (exists) {
      // const next = value.map((v) => (v.id === opt.id ? { ...v, mode } : v));
      const next = value.map((v) => (v.id === opt.id ? { ...v, mode, raw: v.raw ?? opt.raw } : v));

      onChange(next);
    } else {
      const next = [
        ...value,
        // { id: opt.id, label: opt.label, price: opt.price || 0, mode, isCrust: !!opt.isCrust },
        { id: opt.id, label: opt.label, price: opt.price || 0, mode, isCrust: !!opt.isCrust, raw: opt.raw },

      ];
      onChange(next);
    }
  };

  const remove = (opt) => {
    if (!isSelected(opt.id)) return; // nothing to remove
    onChange(value.filter((v) => v.id !== opt.id));
  };

  const onTileClick = (opt) => {

    // if (activeMode === "no") return upsert(opt, "no");
    // if (activeMode === "less") return upsert(opt, "less");
    // if (activeMode === "free") return upsert(opt, "free");
    if (activeMode === "no") { upsert(opt, "no");   setActiveMode("normal"); return; }
     if (activeMode === "less"){ upsert(opt, "less"); setActiveMode("normal"); return; }
     if (activeMode === "free"){ upsert(opt, "free"); setActiveMode("normal"); return; }
       if (activeMode === "onBurger"){ upsert(opt, "onBurger"); setActiveMode("normal"); return; }
  if (activeMode === "onChips"){  upsert(opt, "onChips");  setActiveMode("normal"); return; }

    // default normal
    return upsert(opt, "normal");
  };

  return (
    <div className="fh-mods">
      {/* Tiles */}
      <div className="fh-grid">
        {group.options.map((opt) => {
          const selected = isSelected(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              className={`fh-tile ${selected ? "selected" : ""} ${opt.isCrust ? "crust" : ""}`}
              onClick={() => onTileClick(opt)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onTileClick(opt)}
            >
              {/* EDIT chip — same as flavours/sizes */}
  <span
    className="edit-chip"
    onClick={(e) => {
      e.stopPropagation();
      onEdit?.(opt);              // ← parent se onEdit aayega
    }}
  >
    Edit
  </span>

                <div className="fh-title">{opt.label}</div>
              <div className="fh-price">{opt.price ? `£${opt.price.toFixed(2)}` : ""}</div>
            </button>
          );
        })}

        {showAddMore && (
         <button
           type="button"
           className="fh-tile add-more fh-addmore-tile"
           onClick={onAddMore}
         >
           Add More
         </button>
       )}
      </div>

      
      {/* Mode selector (sticky behaviour) */}
      <div className="fh-footer">
        <button
          type="button"
          className={`fh-btn big ${activeMode === "no" ? "active" : ""}`}
          onClick={() => setActiveMode("no")}
        >
          No
        </button>
        <button
          type="button"
          className={`fh-btn big ${activeMode === "less" ? "active" : ""}`}
          onClick={() => setActiveMode("less")}
        >
          Less
        </button>
        <button
          type="button"
          className={`fh-btn big ${activeMode === "free" ? "active" : ""}`}
          onClick={() => setActiveMode("free")}
        >
          Free
        </button>

        {group?.uiHints?.showPlacementPills && (
  <>
    <button
      type="button"
      className={`fh-btn big ${activeMode === "onBurger" ? "active" : ""}`}
      onClick={() => setActiveMode("onBurger")}
    >
      On Burger
    </button>
    <button
      type="button"
      className={`fh-btn big ${activeMode === "onChips" ? "active" : ""}`}
      onClick={() => setActiveMode("onChips")}
    >
      On Chips
    </button>
  </>
)}

      </div>

      {/* Hint / status */}
      <div className="fh-mode-hint">
        Mode: <b>{activeMode === "no" ? "No" : activeMode === "less" ? "Less" : activeMode === "free" ? "Free" : "Normal"}</b>
        {"  "}• Click a topping to apply
      </div>
    </div>
  );
}
