import React from "react";

export default function MainPanel({ onSwitch }) {
  return (
    <div>
      <h1>🏠 主畫面</h1>
      <button onClick={onSwitch}>查看運動行事曆</button>
    </div>
  );
}
