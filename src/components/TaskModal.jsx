import React from "react";
import "../style/CalendarPanel.css";

export default function TaskModal({ show, title, content, onClose }) {
  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <div style={{ minHeight: 60, marginBottom: 16 }}>{content}</div>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-cancel">關閉</button>
        </div>
      </div>
    </div>
  );
}
