import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../style/CalendarPanel.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://localhost:5000";

export default function CalendarPanel({ globalAccessToken, globalUserName, globalUserEmail, loginDays = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [showInput, setShowInput] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [inputText, setInputText] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [isEditing, setIsEditing] = useState(false);
  const accessToken = globalAccessToken;
  const userName = globalUserName;
  // 優先使用 props 傳入的 email
  const userEmail = globalUserEmail || localStorage.getItem("google_user_email");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDateKey = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // 載入自己帳號的所有事件（只會取自己那份 json）
  useEffect(() => {
    if (!userName) return;
    fetch(`${API_BASE}/load-all?googleUserName=${encodeURIComponent(userName)}`)
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch(() => toast.error("載入本地資料失敗"));
  }, [year, month, userName]);

  const handleDayClick = (day) => {
    if (!accessToken) {
      toast.warn("請先登入 Google 才能新增事件！");
      return;
    }
    const key = getDateKey(day);
    setSelectedDate(key);

    const existingEvent = events[key];
    if (existingEvent) {
      setIsEditing(true);
      setInputText(existingEvent.summary || "");
      setStartTime(existingEvent.startTime || "10:00");
      setEndTime(existingEvent.endTime || "11:00");
    } else {
      setIsEditing(false);
      setInputText("");
      setStartTime("10:00");
      setEndTime("11:00");
    }
    setShowInput(true);
  };

  // 儲存事件到本地（屬於自己帳號的 json）+ 同步 Google 日曆
  const handleSave = async () => {
    if (!userName) {
      toast.error("找不到登入帳號，請重新登入");
      return;
    }
    let eventData = {
      dateKey: selectedDate,
      summary: inputText,
      startTime,
      endTime,
      savedAt: new Date().toLocaleString(),
      googleUserName: userName,
      googleAccount: userEmail,
    };

    // 1. 本地端儲存
    try {
      const res = await fetch(`${API_BASE}/save-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success("✅ 本地存檔成功！");
        setEvents((prev) => ({ ...prev, [selectedDate]: { ...eventData } }));
      } else {
        toast.error(`❌ 本地存檔失敗：${result.error}`);
        return;
      }
    } catch (err) {
      toast.error("本地存檔 API 失敗");
      return;
    }

    // 2. Google Calendar 同步
    if (accessToken) {
      const eventPayload = {
        summary: inputText,
        start: {
          dateTime: `${selectedDate}T${startTime}:00`,
          timeZone: "Asia/Taipei",
        },
        end: {
          dateTime: `${selectedDate}T${endTime}:00`,
          timeZone: "Asia/Taipei",
        },
      };

      try {
        const isUpdating = isEditing && events[selectedDate]?.id;
        const eventId = isUpdating ? events[selectedDate].id : null;
        const url = isUpdating
          ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`
          : "https://www.googleapis.com/calendar/v3/calendars/primary/events";
        const method = isUpdating ? "PUT" : "POST";

        const res = await fetch(url, {
          method: method,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventPayload),
        });

        const result = await res.json();

        if (res.ok) {
          // ★ 用 Google API 回來的 event 更新本地存檔！
          const googleEvent = {
            ...eventData,
            googleAccount: userEmail,
            id: result.id,
            summary: result.summary,
            htmlLink: result.htmlLink,
            start: result.start,
            end: result.end,
          };
          // 本地再存一次
          await fetch(`${API_BASE}/save-data`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(googleEvent),
          });
          setEvents((prev) => ({
            ...prev,
            [selectedDate]: googleEvent,
          }));
          toast.success(`✅ Google ${isUpdating ? "更新" : "新增"}成功！`);
        } else {
          toast.error(`❌ Google 回傳錯誤：${result.error?.message || "未知錯誤"}`);
        }
      } catch (err) {
        console.error("🚫 Google Calendar 例外錯誤：", err);
        toast.error("🚫 無法寫入 Google Calendar");
      }
    }

    setShowInput(false);
  };

  // 本地端刪除事件（同步 Google 日曆）
  const handleDelete = async () => {
    if (!userName) {
      toast.error("找不到登入帳號，請重新登入");
      return;
    }
    if (!selectedDate) return;

    // 1. 本地端刪除（只會刪自己 json 的資料）
    try {
      const res = await fetch(`${API_BASE}/delete-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey: selectedDate, googleUserName: userName }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success("✅ 本地刪除成功！");
        setEvents((prev) => {
          const updated = { ...prev };
          delete updated[selectedDate];
          return updated;
        });
      } else {
        toast.error(`❌ 本地刪除失敗：${result.error}`);
      }
    } catch (err) {
      toast.error("本地刪除 API 失敗");
    }

    // 2. Google Calendar 同步刪除
    if (accessToken && events[selectedDate]?.id) {
      try {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${events[selectedDate].id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (res.ok) {
          toast.success("✅ Google 日曆刪除成功！");
        } else {
          toast.error("❌ Google 日曆刪除失敗");
        }
      } catch (err) {
        toast.error("刪除 Google 日曆發生例外");
      }
    }

    setShowInput(false);
    setSelectedDate(null);
    setInputText("");
  };

  const handleCancel = () => {
    setShowInput(false);
    setInputText("");
    setSelectedDate(null);
  };

  const calendarGrid = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const grid = Array(42).fill(null);
    for (let i = 0; i < daysInMonth; i++) {
      grid[firstDay + i] = i + 1;
    }
    return grid;
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="calendar-container">
      <div className="calendar-frame">
        <div className="calendar-top">
          <div className="calendar-title-bar">
            <div className="nav-tabs">
              <button className="tab-button active">📅 運動記錄行事曆</button>
            </div>
            <div className="date-controls">
              <button className="nav-button" onClick={prevMonth}>
                <ChevronLeft size={18} />
              </button>
              <div className="current-date">{year}年{month + 1}月</div>
              <button className="nav-button" onClick={nextMonth}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="calendar-board">
          <div className="weekday-labels">
            {["日", "一", "二", "三", "四", "五", "六"].map((label) => (
              <div className="weekday" key={label}>{label}</div>
            ))}
          </div>
          <div className="calendar">
            {calendarGrid().map((day, index) => {
              const key = getDateKey(day);
              const event = events[key];
              // 判斷該天是否有登入
              const isLogin = loginDays.includes(key);
              return (
                <div key={index} className={`day-box ${day === null ? "empty" : ""}`} onClick={() => day && handleDayClick(day)} style={{ position: 'relative' }}>
                  {day !== null && (
                    <div style={{ textAlign: "center" }}>
                      <div>{day}</div>
                      {/* 只顯示有登入的勾勾 */}
                      {isLogin && (
                        <div style={{ position: 'absolute', top: -5, right: 0 }}>
                          <FaCheckCircle color="green" size={18} title="已登入" />
                        </div>
                      )}
                      {event && (
                        <div className="day-box-content" title={event.summary}>
                          {event.summary}
                          {event.htmlLink && (
                            <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }} onClick={(e) => e.stopPropagation()}>🔗</a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showInput && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditing ? '修改' : '新增'} {selectedDate} 的事件</h3>
            <textarea
              className="modal-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="請輸入事件內容"
            />
            <div className="modal-time-pickers">
              <div className="time-picker">
                <label>開始時間</label>
                <input type="time" className="time-input" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="time-picker">
                <label>結束時間</label>
                <input type="time" className="time-input" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={handleCancel} className="btn btn-cancel">取消</button>
              {isEditing && (
                <button onClick={handleDelete} className="btn btn-delete" style={{ background: "#ef4444", color: "#fff" }}>
                  刪除
                </button>
              )}
              <button onClick={handleSave} className="btn btn-save">{isEditing ? '儲存變更' : '儲存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
