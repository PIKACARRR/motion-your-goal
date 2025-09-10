// components/SportSelector.jsx
import React, { useState } from 'react';

export default function SportSelector({ onSelect }) {
  const [sport, setSport] = React.useState("");

  function handleChange(e) {
    setSport(e.target.value);
  }

  function handleStart() {
    if (sport) onSelect(sport);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(#222, #555)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        padding: 32, background: "#fff3", borderRadius: 18, boxShadow: "0 4px 32px #0005"
      }}>
        <h2 style={{ color: "#FFD700", textAlign: "center", marginBottom: 32 }}>
          請選擇運動
        </h2>
        <select value={sport} onChange={handleChange}
          style={{
            padding: "8px 16px", fontSize: 20, borderRadius: 8,
            marginBottom: 28, minWidth: 180
          }}>
            <option value="">-- 選擇運動 --</option>
            <option value="wall_angel">W/Y肩運動</option>
            <option value="march_in_place">原地提膝踏步</option>
            <option value="side_step">側步移動</option>
            <option value="jumping_jack">開合跳</option>
            <option value="lunge">弓步蹲</option>
            <option value="triceps_extension">三頭肌伸展</option>
            <option value="push_ups">伏地挺身</option>
            <option value="front_shoulder_stretch">前肩伸展</option>
            <option value="crunch">捲腹</option>
            <option value="swimming">游泳式</option>
            <option value="rhomboid_pull">菱形肌後拉</option>
            <option value="butt_kick">踢臀跑</option>
            <option value="double_arm_raise">雙臂測舉</option>
            <option value="long_jump_arm">跳遠式三節擺臂</option>
            <option value="arm_swing">手臂擺動</option>
            <option value="squat_status">深蹲</option>
            <option value="single_leg_deadlift">單腳硬舉</option>
            <option value="nonstop_jump_rope">無限跳繩</option>
         
          {/* 之後可以一直加 */}
        </select>
        <br />
        <button
          disabled={!sport}
          onClick={handleStart}
          style={{
            fontSize: 22, padding: "6px 36px", borderRadius: 10, color: "#fff",
            background: !sport ? "#aaa" : "#f6b940", border: "none",
            cursor: !sport ? "not-allowed" : "pointer"
          }}>
          開始
        </button>
      </div>
    </div>
  );
}
