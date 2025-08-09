// components/TaskSelector.js

import React, { useEffect, useState } from "react";
import exercises from "../sportsdata/exercises.json";

// 依日期產生每日任務（3個不同運動 id）
function getDailyTasks(exercises, date = new Date()) {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  let arr = [...Array(exercises.length).keys()];
  let selected = [];
  let s = seed;
  function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
  for (let i = 0; i < 3; i++) {
    if (arr.length === 0) break;
    s = Math.floor(seededRandom(s + i) * arr.length);
    selected.push(arr[s]);
    arr.splice(s, 1);
  }
  return selected.map(idx => exercises[idx].id);
}

export default function TaskSelector({ onTaskClick, onWeeklyTaskClick }) {
  // ...existing code...
  const today = new Date();
  const todayTasks = getDailyTasks(exercises, today);

  return (
    <>
      {/* 每日任務（前兩個） */}
      {todayTasks.slice(0, 2).map((id) => {
        const ex = exercises.find((e) => e.id === id);
        if (!ex) return null;
        return (
          <button
            key={id}
            className="task-btn"
            style={{ backgroundImage: `url('/images/daily-tasks.png')` }}
            onClick={() => onTaskClick(ex)}
          ></button>
        );
      })}
  {/* 每週任務圖片（可點擊顯示累計登入天數進度條） */}
  <button
    className="task-btn"
    style={{ backgroundImage: `url('/images/weekly_tasks.png')`, cursor: 'pointer' }}
    onClick={() => {
                    if (typeof onWeeklyTaskClick === 'function') {
                      onWeeklyTaskClick();
      }
    }}
  ></button>
    </>
  );
}
