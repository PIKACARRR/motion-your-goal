import React, { useState, useEffect } from "react";
import CalendarPanel from "./components/CalendarPanel";
import SettingsPanel from "./components/SettingsPanel";
import ExercisePanel from './components/ExercisePanel';
import GoogleAuthBar from './components/GoogleAuthBar';
import "./style/App.css"; // 引入 CSS 檔案
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activePanel, setActivePanel] = useState("main");
  
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
          {/* 背景與裝飾（固定不變） */}
          <img 
            src="/images/fullscreen_background.jpg" 
            className="background" 
            alt="背景"
          />
          <img src="/images/background_cat.gif" className="background_cat" alt="背景貓咪" />
          <img src={`${process.env.PUBLIC_URL}/images/advertising_billboard.png`} className="advertising_billboard" alt="廣告看板" />
          <img src={`${process.env.PUBLIC_URL}/images/cloud.png`} className="cloud" alt="雲" />
          <img src={`${process.env.PUBLIC_URL}/images/cloud.png`} className="cloud2" alt="雲" />
          <img src={`${process.env.PUBLIC_URL}/images/cloud.png`} className="cloud3" alt="雲" />
          <img src={`${process.env.PUBLIC_URL}/images/weekly_tasks.png`} className="weekly_tasks" alt="每週任務" />
          <img src={`${process.env.PUBLIC_URL}/images/daily-tasks.png`} className="daily-tasks" alt="每日任務" />
          <img src={`${process.env.PUBLIC_URL}/images/daily-tasks.png`} className="daily-tasks2" alt="每日任務2" />

          {/* 功能按鈕（固定不變） */}
          <div className="button-wrapper index-1">
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
          <div className="button-wrapper index-2">
            <img src="/images/裝備按鈕.png" className="button" alt="按鈕2" onClick={() => setActivePanel("equipment")} />
          </div>
          <div className="button-wrapper index-3">
            <img src="/images/運動開始按鈕.png" className="button" alt="按鈕3" onClick={() => setActivePanel("start")} />
          </div>
          <div className="button-wrapper index-4">
            <img src="/images/商城按鈕.png" className="button" alt="按鈕4" onClick={() => setActivePanel("shop")} />
          </div>
          <div className="button-wrapper index-5">
            <img src="/images/設定按鈕.png" className="button" alt="按鈕5" onClick={() => {
              setActivePanel((prev) => {
                const next = prev === "settings" ? "main" : "settings";
                return next;
              });
            }} />
          </div>

          {/* 主內容區塊（根據 activePanel 切換） */}
          <div className="main-content">
            {activePanel === "main" && null /* 或 MainPanel 元件 */}
            {activePanel === "calendar" && (
              <div className="calendar-in-board">
                <CalendarPanel 
                  globalAccessToken={globalAccessToken}
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
        </>
      )}
    </div>
  );
}

export default App;