// components/TaskSelector.js

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import exercises from "../sportsdata/exercises.json";

const API_BASE = "http://localhost:5000";
const COOLDOWN_DAYS = 5; // 近 N 天內盡量不重複

function getPlanByScore(score) {
  if (score == null) return [1, 2, 2, 3];
  const s = Math.max(0, Math.min(100, score));
  if (s >= 8 && s < 18) return [1, 1, 2];
  if (s >= 18 && s < 30) return [1, 2, 2, 3];
  if (s >= 30 && s < 40) return [2, 2, 2, 3, 3];
  if (s >= 40 && s <= 50) return [2, 2, 3, 3, 3];
  return [1, 2, 2, 3];
}

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// 選擇器已改為在 getDailyTasksWithCooldown 內部進行，移除舊的公用挑選函數

// 將字串轉成穩定的 32-bit 正整數雜湊（用於每天 + 使用者的隨機種子）
function hashToUint32(str = "") {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i); // h * 33 + c
  }
  return h >>> 0; // 轉為無號 32-bit
}

// 根據近幾天的冷卻名單，優先避開重複；若資源不足再回退到原池
function getDailyTasksWithCooldown(exercises, date = new Date(), score, seedSalt = 0, cooldownSet = new Set()) {
  const seedBase =
    (date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()) + (seedSalt >>> 0);
  const plan = getPlanByScore(score);
  const allIdx = [...Array(exercises.length).keys()];
  const pools = { 1: [], 2: [], 3: [] };
  const poolsPref = { 1: [], 2: [], 3: [] }; // 過濾冷卻後的優先池
  allIdx.forEach((i) => {
    const d = exercises[i]?.難易度;
    if (d === 1 || d === 2 || d === 3) {
      pools[d].push(i);
      const id = exercises[i]?.ID;
      if (!cooldownSet.has(id)) poolsPref[d].push(i);
    }
  });
  const allLeft = [...allIdx];
  const allLeftPref = allIdx.filter(i => !cooldownSet.has(exercises[i]?.ID));

  const removeFrom = (dict, picked) => {
    Object.values(dict).forEach(arr => {
      const idx = arr.indexOf(picked);
      if (idx !== -1) arr.splice(idx, 1);
    });
  };

  const pickedIdx = [];
  plan.forEach((d, k) => {
    const prefSource = poolsPref[d];
    const src = (prefSource && prefSource.length > 0) ? 'pref' : 'full';
    let chosen = null;
    if (src === 'pref') {
      const idx = Math.floor(seededRandom(seedBase + k + 1) * poolsPref[d].length);
      chosen = poolsPref[d][idx];
    } else {
      // 回退：使用原始池
      const pool = pools[d];
      const source = pool.length > 0 ? pool : allLeft;
      if (source.length > 0) {
        const idx = Math.floor(seededRandom(seedBase + k + 1) * source.length);
        chosen = source[idx];
      }
    }
    if (chosen != null) {
      pickedIdx.push(chosen);
      // 從兩組池中移除已選
      removeFrom(poolsPref, chosen);
      removeFrom(pools, chosen);
      const i1 = allLeftPref.indexOf(chosen);
      if (i1 !== -1) allLeftPref.splice(i1, 1);
      const i2 = allLeft.indexOf(chosen);
      if (i2 !== -1) allLeft.splice(i2, 1);
    }
  });
  return pickedIdx.map(i => exercises[i].ID);
}

function getLocalDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`; // 本地日期鍵
}

function msUntilNextLocalMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0); // 明天 00:00 本地時間
  return next.getTime() - now.getTime();
}

// 讀寫每位使用者的運動歷史，格式：[{ date: 'YYYY-MM-DD', ids: [...] }, ...]
const loadHistory = (email) => {
  try {
    const raw = localStorage.getItem(`exerciseHistory_${email}`);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const saveHistory = (email, entries) => {
  try {
    localStorage.setItem(`exerciseHistory_${email}`, JSON.stringify(entries.slice(-30))); // 最多保留 30 天
  } catch {}
};
const getCooldownSet = (email, baseDateKey, days) => {
  const entries = loadHistory(email);
  const base = new Date(baseDateKey);
  const cutoff = new Date(base);
  cutoff.setDate(base.getDate() - days);
  const set = new Set();
  for (const e of entries) {
    if (!e?.date || !Array.isArray(e?.ids)) continue;
    const d = new Date(e.date);
    // 只看 base 前 N 天（不含 base 當日）
    if (d < base && d >= cutoff) {
      e.ids.forEach(id => set.add(id));
    }
  }
  return set;
};

export default function TaskSelector({ isLoggedIn, userEmail, settingsVersion = 0, onTaskClick, onWeeklyTaskClick }) {
  const [finalScore, setFinalScore] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false); // 已登入但尚未填寫個資
  const [todayKey, setTodayKey] = useState(getLocalDateKey());

  useEffect(() => {
    if (!isLoggedIn) {
      setFinalScore(null);
      setNeedsProfile(false);
      return;
    }
    const email = userEmail || localStorage.getItem("google_user_email");
    if (!email) {
      setFinalScore(null);
      setNeedsProfile(false);
      return;
    }
    const url = `${API_BASE}/load-user?googleAccount=${encodeURIComponent(email)}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const raw = data && data.finalScore;
        const num = raw != null ? parseFloat(raw) : null;
        const ok = Number.isFinite(num);
        setFinalScore(ok ? num : null);
        setNeedsProfile(!ok); // 沒有 finalScore 視為新用戶，需先填基本資料
      })
      .catch(() => { setFinalScore(null); setNeedsProfile(false); });
  }, [isLoggedIn, userEmail, settingsVersion]);

  // 每到本地午夜自動更新 todayKey，觸發任務重新計算
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTodayKey(getLocalDateKey());
    }, Math.max(1000, msUntilNextLocalMidnight()));
    return () => clearTimeout(timeout);
  }, [todayKey]);

  const todayTasks = useMemo(() => {
    // 使用 todayKey 對應的本地日期來產生任務，避免 ESLint 警告
    const [y, m, d] = todayKey.split('-').map(Number);
    const today = new Date(y, m - 1, d);
    // 加入 email 為鹽，確保同一天不同使用者抽到的任務不同
    const emailForSeed = (userEmail || localStorage.getItem("google_user_email") || "");
    const seedSalt = isLoggedIn ? hashToUint32(emailForSeed) : 0;
    // 近 N 天冷卻：盡量避免重複
    const cooldown = (isLoggedIn && emailForSeed)
      ? getCooldownSet(emailForSeed, todayKey, COOLDOWN_DAYS)
      : new Set();
    return getDailyTasksWithCooldown(exercises, today, finalScore, seedSalt, cooldown);
  }, [finalScore, todayKey, userEmail, isLoggedIn]);

  // 將今日選中的任務寫入歷史（每位使用者獨立）
  useEffect(() => {
    if (!isLoggedIn || needsProfile) return;
    const email = userEmail || localStorage.getItem("google_user_email");
    if (!email || !todayKey || !todayTasks?.length) return;
    const entries = loadHistory(email);
    const idx = entries.findIndex(e => e.date === todayKey);
    if (idx === -1) {
      entries.push({ date: todayKey, ids: todayTasks });
    } else {
      entries[idx] = { date: todayKey, ids: todayTasks };
    }
    saveHistory(email, entries);
  }, [isLoggedIn, needsProfile, userEmail, todayKey, todayTasks]);

  // 明日預告（僅記錄在 console，避免打擾 UI）
  useEffect(() => {
    if (!isLoggedIn || needsProfile) return;
    const email = userEmail || localStorage.getItem("google_user_email");
    const [y, m, d] = todayKey.split('-').map(Number);
    const today = new Date(y, m - 1, d);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowKey = getLocalDateKey(tomorrow);
    const emailForSeed = email || "";
    const seedSalt = hashToUint32(emailForSeed);
    const cooldown = email ? getCooldownSet(email, tomorrowKey, COOLDOWN_DAYS) : new Set();
    // 將今天任務也視為明日冷卻的一部分，降低隔天重複
    (todayTasks || []).forEach(id => cooldown.add(id));
    const ids = getDailyTasksWithCooldown(exercises, tomorrow, finalScore, seedSalt, cooldown);
    const names = ids
      .map(id => exercises.find(e => e.ID === id)?.名稱)
      .filter(Boolean);
    // eslint-disable-next-line no-console
    console.info(`[明日預告] ${tomorrowKey}: ${names.join('、')}`);
  }, [isLoggedIn, needsProfile, userEmail, todayKey, todayTasks, finalScore]);

  return (
    <>
      {(!isLoggedIn) ? (
        <>
          {/* 未登入：顯示替代提示圖，維持排版 */}
          <button
            className="task-btn"
            style={{ backgroundImage: `url('/images/daily-tasks.png')`, opacity: 0.85, cursor: 'not-allowed' }}
            title="請先登入 Google 帳號後查看每日任務"
            onClick={() => toast.warn('請先登入 Google 帳號後查看每日任務！')}
          ></button>
          <button
            className="task-btn"
            style={{ backgroundImage: `url('/images/daily-tasks.png')`, opacity: 0.85, cursor: 'not-allowed' }}
            title="請先登入 Google 帳號後查看每週任務"
            onClick={() => toast.warn('請先登入 Google 帳號後查看每週任務！')}
          ></button>
        </>
      ) : needsProfile ? (
        <>
          {/* 已登入但未填基本資料：顯示兩張每日任務占位，點擊提示先完成資料 */}
          <button
            className="task-btn"
            style={{ backgroundImage: `url('/images/daily-tasks.png')`, opacity: 0.9 }}
            title="請先完成基本資料"
            onClick={() => toast.warn('請先完成基本資料填寫，好讓我來幫您安排！')}
          ></button>
          <button
            className="task-btn"
            style={{ backgroundImage: `url('/images/daily-tasks.png')`, opacity: 0.9 }}
            title="請先完成基本資料"
            onClick={() => toast.warn('請先完成基本資料填寫，好讓我來幫您安排！')}
          ></button>
        </>
      ) : (
        <>
  {/* 每日任務（依配比 3~5 個） */}
  {todayTasks.map((id) => {
        const ex = exercises.find((e) => e.ID === id);
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
      )}
    </>
  );
}
