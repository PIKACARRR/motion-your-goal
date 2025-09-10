import React, { useState, useEffect } from "react";
import "../../style/SummaryBoard.css";

type Props = {
  exerciseName: string;
  totalTime: string;
  successCount: number;
  gameCoins: number;
  encouragement: string;
  errorFeedback?: string;
  onRetry: () => void;
  onGoHome?: () => void;
};

interface SessionRecord {
  id: string;
  savedAt: string; // ISO
  exerciseName: string;
  totalTime: string;
  successCount: number;
  gameCoins: number;
  encouragement: string;
  errorFeedback?: string;
}

const STORAGE_KEY = "exerciseSessions";
const MAX_HISTORY = 20;

function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr
        .map((x) => ({
          ...x,
          savedAt: x.savedAt,
        }))
        .sort((a, b) => (a.savedAt > b.savedAt ? -1 : 1));
    }
    return [];
  } catch {
    return [];
  }
}

function saveSessionToLocal(rec: SessionRecord) {
  const existing = loadSessions();
  const filtered = [rec, ...existing.filter((s) => s.id !== rec.id)];
  const limited = filtered.slice(0, MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
}

function clearAllSessions() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function SummaryBoardWithLocalSave({
  exerciseName,
  totalTime,
  successCount,
  gameCoins,
  encouragement,
  errorFeedback,
  onRetry,
  onGoHome,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<SessionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SessionRecord[]>([]);

  useEffect(() => {
    const h = loadSessions();
    setHistory(h);
    setLastSaved(h[0] || null);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const newRecord: SessionRecord = {
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        exerciseName,
        totalTime,
        successCount,
        gameCoins,
        encouragement,
        errorFeedback,
      };
      await new Promise((r) => setTimeout(r, 150));
      saveSessionToLocal(newRecord);
      const updated = loadSessions();
      setHistory(updated);
      setLastSaved(updated[0] || null);
    } catch (err: any) {
      console.error("保存失敗", err);
      setError("儲存時發生錯誤，請稍後再試。");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    clearAllSessions();
    setHistory([]);
    setLastSaved(null);
  };

  return (
    <div className="summary-container">
      <div className="summary-box">
        <div className="summary-section">
          <div className="summary-title">結算報表</div>

          <div className="result-card">
            <div><b>運動：</b>{exerciseName}</div>
            <div>總耗時間：{totalTime}</div>
            <div>成功次數：{successCount}</div>
            <div>獲得金幣：{gameCoins}</div>
          </div>

          {errorFeedback && (
            <div className="error-card">
              <div><b>鼓勵：</b>{encouragement}</div>
            </div>
          )}

          <div className="buttons">
            <button className="btn btn-retry" onClick={onRetry} disabled={saving}>
              再來一次
            </button>
            <button className="btn btn-save" onClick={handleSave} disabled={saving}>
              {saving ? "儲存中…" : "儲存紀錄"}
            </button>
            {/* ⭐ 新增回首頁按鈕 */}
            <button 
              className="btn btn-home"
              onClick={onGoHome}
            >
              回首頁
            </button>
          </div>

          {error && <div className="error-text">{error}</div>}
          {lastSaved && !error && !saving && (
            <div className="last-saved">
              上次儲存：{new Date(lastSaved.savedAt).toLocaleString("zh-TW")}
            </div>
          )}
        </div>

        <div className="history">
          <div className="history-header">
            <b>本地儲存紀錄（最近 {history.length} 筆）</b>
            <button onClick={handleClear} className="btn-clear">清除全部</button>
          </div>
          {history.length === 0 ? (
            <div className="history-empty">尚未儲存任何紀錄。</div>
          ) : (
            history.slice(0, 5).map((s) => (
              <div key={s.id} className="history-item">
                <div>
                  <div className="history-title">
                    {s.exerciseName} —{" "}
                    <span className="history-date">
                      {new Date(s.savedAt).toLocaleString("zh-TW")}
                    </span>
                  </div>
                  <div className="history-info">
                    時間：{s.totalTime}｜成功：{s.successCount}｜金幣：{s.gameCoins}
                  </div>
                </div>
                <div className="history-feedback">
                  {s.errorFeedback ? "有回饋" : "無回饋"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
