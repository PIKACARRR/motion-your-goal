import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../style/CalendarPanel.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CalendarPanel() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [showInput, setShowInput] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [inputText, setInputText] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [isEditing, setIsEditing] = useState(false);

  const [accessToken, setAccessToken] = useState(null);
  const [userName, setUserName] = useState(null);
  const tokenClient = useRef(null);

  // ✅ 初始化 Google Token Client
  useEffect(() => {
    const token = localStorage.getItem("google_access_token");
    const name = localStorage.getItem("google_user_name");
    if (token) setAccessToken(token);
    if (name) setUserName(name);

    /* global google */
    tokenClient.current = window.google.accounts.oauth2.initTokenClient({
      client_id: "164779046247-32plpf686mbgasdick4hhvp5bh8aj3k2.apps.googleusercontent.com",
      scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile",
      prompt: "consent", // ✅ 加這個非常重要！
      callback: async (tokenResponse) => {
        console.log("📥 拿到的 token response：", tokenResponse);
        setAccessToken(tokenResponse.access_token);
        localStorage.setItem("google_access_token", tokenResponse.access_token);

        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const user = await res.json();
        setUserName(user.name);
        localStorage.setItem("google_user_name", user.name);
        toast.success(`登入成功：${user.name}`);
      },
});

  }, []);

  const handleLogin = () => {
    tokenClient.current.requestAccessToken();
  };

  const handleLogout = () => {
    setAccessToken(null);
    setUserName(null);
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_user_name");
    toast.info("已登出");
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDateKey = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

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
      setStartTime(existingEvent.start?.dateTime ? existingEvent.start.dateTime.substring(11, 16) : "10:00");
      setEndTime(existingEvent.end?.dateTime ? existingEvent.end.dateTime.substring(11, 16) : "11:00");
    } else {
      setIsEditing(false);
      setInputText("");
      setStartTime("10:00");
      setEndTime("11:00");
    }

    setShowInput(true);
  };

  const handleSave = async () => {
    setEvents((prev) => ({ 
      ...prev, 
      [selectedDate]: {
        ...prev[selectedDate],
        summary: inputText,
        start: { dateTime: `${selectedDate}T${startTime}:00` },
        end: { dateTime: `${selectedDate}T${endTime}:00` }
      }
    }));
    setShowInput(false);

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
      console.log("📥 Google API 回傳：", result);

      if (res.ok) {
        setEvents((prev) => ({
          ...prev,
          [selectedDate]: {
            id: result.id,
            summary: result.summary,
            htmlLink: result.htmlLink,
            start: result.start,
            end: result.end
          },
        }));
        toast.success(`✅ ${isUpdating ? '更新' : '新增'}成功！`);
      } else {
        toast.error(`❌ Google 回傳錯誤：${result.error?.message || "未知錯誤"}`);
      }
    } catch (err) {
      console.error("🚫 發生例外錯誤：", err);
      toast.error("🚫 無法寫入 Google Calendar");
    }
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
      <ToastContainer position="bottom-right" autoClose={3000} />
      {/* 登入區塊 */}
      <div style={{ position: "absolute", top: -45, right: 200, zIndex: 9999 }}>
        {!accessToken ? (
          <button onClick={handleLogin} style={loginStyle}>登入 Google</button>
        ) : (
          <div className="login-status">
            ✅ {userName} 已登入
            <button onClick={handleLogout} className="logout-btn">登出</button>
          </div>
        )}
      </div>

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
              return (
                <div key={index} className={`day-box ${day === null ? "empty" : ""}`} onClick={() => day && handleDayClick(day)}>
                  {day !== null && (
                    <div style={{ textAlign: "center" }}>
                      <div>{day}</div>
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
              <button onClick={handleSave} className="btn btn-save">{isEditing ? '儲存變更' : '儲存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const loginStyle = {
  backgroundColor: "#4285f4",
  color: "#fff",
  padding: "6px 12px",
  borderRadius: "6px",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
};

