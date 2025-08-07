import React, { useState, useEffect } from "react";
import TaskModal from "./components/TaskModal";
import exercises from "./sportsdata/exercises.json";
import CalendarPanel from "./components/CalendarPanel";
import SettingsPanel from "./components/SettingsPanel";
import ExercisePanel from './components/ExercisePanel';
import GoogleAuthBar from './components/GoogleAuthBar';
import "./style/App.css"; // 引入 CSS 檔案
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  // Modal 狀態
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalContent, setTaskModalContent] = useState({ title: '', content: '' });

  // 每日隨機任務（運動 id 陣列）
  const [todayTasks, setTodayTasks] = useState([]);

  // 產生一個根據日期固定的亂數種子
  function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // 根據今天日期選出三個不同的運動
  useEffect(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    let arr = [...Array(exercises.length).keys()];
    let selected = [];
    let s = seed;
    for (let i = 0; i < 3; i++) {
      if (arr.length === 0) break;
      s = Math.floor(seededRandom(s + i) * arr.length);
      selected.push(arr[s]);
      arr.splice(s, 1);
    }
    setTodayTasks(selected.map(idx => exercises[idx].id));
  }, []);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activePanel, setActivePanel] = useState("main");
  // 畫面縮放比例
  const [scale, setScale] = useState(1);
  // 監聽 ctrl+滾輪縮放
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setScale((prev) => {
          let next = prev - e.deltaY * 0.001;
          next = Math.max(0.5, Math.min(2, next)); // 限制縮放範圍 0.5~2
          return next;
        });
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);
  
  // 🔥 全域登入狀態管理
  const [globalAccessToken, setGlobalAccessToken] = useState(null);
  const [globalUserName, setGlobalUserName] = useState(null);

  // 🔥 全域檢查登入狀態
  useEffect(() => {
    const checkGlobalAuthStatus = () => {
      const token = localStorage.getItem("google_access_token");
      const name = localStorage.getItem("google_user_name");
      
      // 只有當狀態真的不同時才更新，避免不必要的重新渲染
      if (token !== globalAccessToken) {
        setGlobalAccessToken(token);
      }
      if (name !== globalUserName) {
        setGlobalUserName(name);
      }
    };

    // 初始檢查
    checkGlobalAuthStatus();
    
    // 監聽 localStorage 變化
    const handleStorageChange = (e) => {
      if (e.key === "google_access_token" || e.key === "google_user_name") {
        checkGlobalAuthStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 定期檢查（防止跨頁面狀態不同步）
    const interval = setInterval(checkGlobalAuthStatus, 2000); // 改為每2秒檢查一次，減少頻率
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [globalAccessToken, globalUserName]); // 加入依賴，當狀態改變時重新檢查

  const enterFullScreen = () => {
    const doc = document.documentElement;
    try {
      if (doc.requestFullscreen) {
        doc.requestFullscreen();
      } else if (doc.mozRequestFullScreen) {
        doc.mozRequestFullScreen();
      } else if (doc.webkitRequestFullscreen) {
        doc.webkitRequestFullscreen();
      } else if (doc.msRequestFullscreen) {
        doc.msRequestFullscreen();
      }
      setIsFullScreen(true);
    } catch (err) {
      console.error("全螢幕模式開啟失敗：", err);
      alert("無法進入全螢幕模式，請檢查瀏覽器設置");
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      // 檢查是否真的進入全螢幕模式
      const fullscreenElement = document.fullscreenElement || 
                              document.mozFullScreenElement || 
                              document.webkitFullscreenElement || 
                              document.msFullscreenElement;
      
      if (fullscreenElement) {
        setIsFullScreen(true);
      } else {
        setIsFullScreen(false);
        setActivePanel("main"); // 退出全螢幕時回到主畫面
      }
    };

    const preventDrag = (e) => e.preventDefault();
    
    // 監聽全螢幕狀態變化
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    window.addEventListener("dragstart", preventDrag);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener("dragstart", preventDrag);
    };
  }, []);

  return (
    <div className="App">
      <ToastContainer 
        position="bottom-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={3}
      />
      {/* 全螢幕前的遮罩和按鈕 */}
      {!isFullScreen && (
        <div
          className="fullscreen-overlay"
          style={{
            background: "url('/images/fullscreen_background.jpg') no-repeat center center fixed",
            backgroundSize: "cover",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            backdropFilter: "blur(5px)"
          }}
        >
          <button onClick={enterFullScreen} className="full_screen_button">
            請點擊按鈕進入全螢幕模式
          </button>
        </div>
      )}

      {/* Google 登入/登出區塊（右上角，永遠存在） */}
      <GoogleAuthBar
        globalAccessToken={globalAccessToken}
        globalUserName={globalUserName}
        setGlobalAccessToken={setGlobalAccessToken}
        setGlobalUserName={setGlobalUserName}
      />

      {/* 只有在全螢幕模式下才顯示主要內容 */}
      {isFullScreen && (
        <>
          {/* 背景圖獨立一層，不受縮放影響 */}
          <img 
            src="/images/fullscreen_background.jpg" 
            className="background" 
            alt="背景"
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}
          />
          {/* 雲層獨立一層，不受縮放影響 */}
          <img src={`${process.env.PUBLIC_URL}/images/cloud.png`} className="cloud" alt="雲" style={{ position: 'fixed', top: '10vh', left: '10vw', zIndex: 1, pointerEvents: 'none' }} />
          <img src={`${process.env.PUBLIC_URL}/images/cloud.png`} className="cloud2" alt="雲" style={{ position: 'fixed', top: '15vh', left: '60vw', zIndex: 1, pointerEvents: 'none' }} />
          <img src={`${process.env.PUBLIC_URL}/images/cloud.png`} className="cloud3" alt="雲" style={{ position: 'fixed', top: '20vh', left: '30vw', zIndex: 1, pointerEvents: 'none' }} />
          {/* 內容區縮放 */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', transform: `scale(${scale})`, transformOrigin: 'center center' }}>
            <img src={`${process.env.PUBLIC_URL}/images/advertising_billboard.png`} className="advertising_billboard" alt="廣告看板" />
            {/* 任務卡片區 flex 父層 */}

            {/* 任務卡片區 flex 父層 */}
            <div className="task-row-wrapper">
              <div className="task-row">
                {todayTasks.map((id, idx) => {
                  const ex = exercises.find(e => e.id === id);
                  if (!ex) return null;
                  // 前兩個是每日任務，最後一個是每週任務
                  const isWeekly = idx === 2;
                  return (
                    <button
                      key={id}
                      className="task-btn"
                      style={{ backgroundImage: `url('/images/${isWeekly ? 'weekly_tasks' : 'daily-tasks'}.png')` }}
                      onClick={() => {
                        setTaskModalContent({
                          title: ex.name,
                          content: (
                            <>
                              <div><b>持續時間：</b> {ex.duration}</div>
                              <div><b>強度：</b> {ex.intensity}</div>
                              <div style={{ marginTop: 8 }}><b>介紹：</b> {ex.description}</div>
                            </>
                          )
                        });
                        setShowTaskModal(true);
                      }}
                    ></button>
                  );
                })}
      {/* 任務彈窗（獨立元件） */}
      <TaskModal
        show={showTaskModal}
        title={taskModalContent.title}
        content={taskModalContent.content}
        onClose={() => setShowTaskModal(false)}
      />
              </div>
            </div>

            {/* 功能按鈕區 flex 父層 */}
            <div className="button-row-wrapper">
              <div className="button-row">
                <div className="button-wrapper">
                  <img
                    src="/images/行事曆按鈕.png"
                    className="button"
                    alt="行事曆"
                    onClick={() => {
                      setActivePanel((prev) => {
                        const next = prev === "calendar" ? "main" : "calendar";
                        return next;
                      });
                    }}
                  />
                </div>
                <div className="button-wrapper">
                  <img src="/images/裝備按鈕.png" className="button" alt="按鈕2" onClick={() => setActivePanel("equipment")} />
                </div>
                <div className="button-wrapper">
                  <img src="/images/運動開始按鈕.png" className="button" alt="按鈕3" onClick={() => setActivePanel("start")} />
                </div>
                <div className="button-wrapper">
                  <img src="/images/商城按鈕.png" className="button" alt="按鈕4" onClick={() => setActivePanel("shop")} />
                </div>
                <div className="button-wrapper">
                  <img src="/images/設定按鈕.png" className="button" alt="按鈕5" onClick={() => {
                    setActivePanel((prev) => {
                      const next = prev === "settings" ? "main" : "settings";
                      return next;
                    });
                  }} />
                </div>
              </div>
            </div>

            {/* 主內容區塊（根據 activePanel 切換） */}
            <div className="main-content">
              {activePanel === "main" && null /* 或 MainPanel 元件 */}
              {activePanel === "calendar" && (
                <div className="calendar-in-board">
                  <CalendarPanel 
                    globalAccessToken={globalAccessToken}
                    globalUserName={globalUserName}
                  />
                </div>
              )}
              {activePanel === "start" && (
                <ExercisePanel onClose={() => setActivePanel("main")} autoPlayVideo={true} />
              )}
              {activePanel === "settings" && (
                <SettingsPanel 
                  onClose={() => setActivePanel("main")} 
                  globalAccessToken={globalAccessToken}
                />
              )}
              {/* 其他主內容... */}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;