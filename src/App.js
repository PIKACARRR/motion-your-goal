import React, { useState, useEffect } from "react";
import CalendarPanel from "./components/CalendarPanel";
import "./App.css"; // 引入 CSS 檔案

function App() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activePanel, setActivePanel] = useState("main");

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

  // 除錯用：顯示圖片路徑
  const backgroundImagePath = `${process.env.PUBLIC_URL}/images/fullscreen_background.jpg`;
  console.log("背景圖片路徑:", backgroundImagePath);

  return (
    <div className="App">
      {/* 全螢幕前的遮罩和按鈕 */}
      {!isFullScreen && (
        <div className="fullscreen-overlay">
          <button onClick={enterFullScreen} className="full_screen_button">
            請點擊按鈕進入全螢幕模式
          </button>
        </div>
      )}

      {/* 只有在全螢幕模式下才顯示主要內容 */}
      {isFullScreen && (
        <>
          {/* 主畫面 */}
          {activePanel === "main" && (
            <>
              {/* 嘗試不同的路徑寫法 */}
              <img 
                src="/images/fullscreen_background.jpg" 
                className="background" 
                alt="背景"
                onLoad={() => console.log("背景圖片載入成功")}
                onError={() => console.log("背景圖片載入失敗")}
              />
              <img src="/images/background_cat.gif" className="background_cat" alt="背景貓咪" />
              <img src={`${process.env.PUBLIC_URL}/images/advertising_billboard.png`} className="advertising_billboard" alt="廣告看板" />
              <img src={`${process.env.PUBLIC_URL}/images/cloud.png`} className="cloud" alt="雲" />
              <img src={`${process.env.PUBLIC_URL}/images/cloud.png`} className="cloud2" alt="雲" />
              <img src={`${process.env.PUBLIC_URL}/images/cloud.png`} className="cloud3" alt="雲" />
              <img src={`${process.env.PUBLIC_URL}/images/weekly_tasks.png`} className="weekly_tasks" alt="每週任務" />
              <img src={`${process.env.PUBLIC_URL}/images/daily-tasks.png`} className="daily-tasks" alt="每日任務" />
              <img src={`${process.env.PUBLIC_URL}/images/daily-tasks.png`} className="daily-tasks2" alt="每日任務2" />
            </>
          )}

          {/* 行事曆畫面 */}
          {activePanel === "calendar" && (
            <>
              <img src={`${process.env.PUBLIC_URL}/images/background.jpg`} className="background" alt="背景" />
              <img src={`${process.env.PUBLIC_URL}/images/advertising_billboard.png`} className="advertising_billboard" alt="廣告看板" />
              <div className="calendar-in-board">
                <CalendarPanel />
              </div>
            </>
          )}

          {/* 功能按鈕 - 只在全螢幕模式下可用 */}
          <div className="button-wrapper index-1">
            <img
              src="/images/行事曆按鈕.png"
              className="button"
              alt="行事曆"
              onClick={() => setActivePanel((prev) => (prev === "calendar" ? "main" : "calendar"))}
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
            <img src="/images/設定按鈕.png" className="button" alt="按鈕5" onClick={() => setActivePanel("settings")} />
          </div>
        </>
      )}
    </div>
  );
}

export default App;