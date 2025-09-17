// menu/components/ModifierSelector.jsx
import React from "react";
import "./styles.css";

const ModifierSelector = ({ modifiers = [], selectedModifiers = [], onToggle }) => {
  return (
    <div className="modifier-selector">
      <h4 className="modifier-title">Choose Options</h4>
      <div className="modifier-options">
        {modifiers.map((mod) => {
          const isSelected = selectedModifiers.includes(mod);
          return (
            <button
              key={mod}
              className={`modifier-btn ${isSelected ? "selected" : ""}`}
              onClick={() => onToggle(mod)}
            >
              {mod}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModifierSelector;
