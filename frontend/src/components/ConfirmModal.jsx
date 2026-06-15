import React from "react";
import "../styles/alert.css";

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="confirm-modal">
      <div className="confirm-box">
        <p>{message}</p>
        <div className="confirm-actions">
          <button onClick={onConfirm}>Oui</button>
          <button onClick={onCancel}>Non</button>
        </div>
      </div>
    </div>
  );
}