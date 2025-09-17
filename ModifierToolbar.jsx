import React from "react";

/**
 * NO / LESS / FREE toolbar
 * - Use only on modifier steps (when group.uiHints?.showFreeNoLess = true)
 * - mode: "normal" | "no" | "less" | "free"
 */
export default function ModifierToolbar({ mode, setMode }) {
  const Btn = (key, label) => (
    <button
      type="button"
      className={`mode-btn ${mode === key ? "active" : ""}`}
      onClick={() => setMode(mode === key ? "normal" : key)}
    >
      {label}
    </button>
  );

  return (
    <div className="modifier-toolbar">
      {Btn("no", "NO")}
      {Btn("less", "LESS")}
      {Btn("free", "FREE")}
    </div>
  );
}
