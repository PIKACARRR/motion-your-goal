import React from "react";
import "../style/CalendarPanel.css";

export default function TaskModal({ show, title, content, onClose, onGoExercise }) {
  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <div style={{ minHeight: 60, marginBottom: 16 }}>{content}</div>
        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onGoExercise} className="btn btn-primary">前往任務</button>
          <button onClick={onClose} className="btn btn-cancel">關閉</button>
        </div>
      </div>
    </div>
  );
}
