import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./CalendarPanel.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CalendarPanel() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [eventLinks, setEventLinks] = useState({});
  const [showInput, setShowInput] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [inputText, setInputText] = useState("");

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
    setInputText(events[key] || "");
    setShowInput(true);
  };

  const handleSave = async () => {
    setEvents((prev) => ({ ...prev, [selectedDate]: inputText }));
    setShowInput(false);

    const event = {
      summary: inputText,
      start: {
        dateTime: `${selectedDate}T10:00:00`,
        timeZone: "Asia/Taipei",
      },
      end: {
        dateTime: `${selectedDate}T11:00:00`,
        timeZone: "Asia/Taipei",
      },
    };

    try {
      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      const result = await res.json();
      console.log("📥 Google API 回傳：", result);

      if (res.ok && result.htmlLink) {
        setEventLinks((prev) => ({ ...prev, [selectedDate]: result.htmlLink }));
        toast.success("✅ 成功寫入 Google 日曆！");
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
      <ToastContainer position="bottom-right" />
      {/* 登入區塊 */}
      <div style={{ position: "absolute", top: 10, right: 30, zIndex: 9999 }}>
        {!accessToken ? (
          <button onClick={handleLogin} style={loginStyle}>登入 Google</button>
        ) : (
          <div style={{ fontSize: "12px", color: "#7a5c48" }}>
            ✅ {userName} 已登入
            <button onClick={handleLogout} style={logoutStyle}>登出</button>
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
              return (
                <div key={index} className={`day-box ${day === null ? "empty" : ""}`} onClick={() => day && handleDayClick(day)}>
                  {day !== null && (
                    <div style={{ textAlign: "center" }}>
                      <div>{day}</div>
                      {events[key] && (
                        <div className="day-box-content" title={events[key]}>
                          {events[key]}
                          {eventLinks[key] && (
                            <a href={eventLinks[key]} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>🔗</a>
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
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h3>{selectedDate} 的事件</h3>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{ width: "100%", height: "80px" }}
              placeholder="請輸入事件內容"
            />
            <div style={{ marginTop: "10px", textAlign: "right" }}>
              <button onClick={handleCancel} style={{ marginRight: "10px" }}>取消</button>
              <button onClick={handleSave}>儲存到 Google 日曆</button>
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

const logoutStyle = {
  marginLeft: "10px",
  fontSize: "12px",
  background: "#f2dac8",
  border: "1px solid #c2a28e",
  borderRadius: "5px",
  padding: "2px 6px",
  cursor: "pointer",
};

const modalStyle = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999
};

const modalContentStyle = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "8px",
  width: "300px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
};
