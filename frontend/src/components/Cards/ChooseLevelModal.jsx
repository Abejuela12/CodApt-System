import React from "react";
import "./ChooseLevelModal.css";

function ChooseLevelModal({ language, onClose, onSelectLevel }) {
  // We stop propagation so clicking the modal content doesn't trigger the overlay's close (if you add one)
  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={stopPropagation}>
        <button className="closeBtn" onClick={onClose}>×</button>
        
        <h2 className="modalTitle">Choose Your Level</h2>
        
        <div className="buttonGroup">
          <button className="levelBtn" onClick={() => onSelectLevel("Easy")}>
            Easy
          </button>
          <button className="levelBtn" onClick={() => onSelectLevel("Intermediate")}>
            Intermediate
          </button>
          <button className="levelBtn" onClick={() => onSelectLevel("Hard")}>
            Advanced
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChooseLevelModal;