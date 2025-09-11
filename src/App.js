

  import React, { useState, useEffect } from "react";
  // import { Routes, Route } from "react-router-dom";
  import TaskModal from "./components/TaskModal";
  import CalendarPanel from "./components/CalendarPanel";
  import SettingsPanel from "./components/SettingsPanel";
  import GoogleAuthBar from "./components/GoogleAuthBar";
  import "./style/App.css";
  import { ToastContainer, toast } from "react-toastify";
  import "react-toastify/dist/ReactToastify.css";
  import TaskSelector from "./components/TaskSelector";
  import GamePanelApp from "./GamePanel/App.jsx";

  function App() {
    // Modal 狀態
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskModalContent, setTaskModalContent] = useState({ title: '', content: '' });
    // 移除每日/每週任務邏輯，交由 TaskSelector 元件管理
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [activePanel, setActivePanel] = useState("main");
    // 畫面縮放比例
    const [scale, setScale] = useState(1);
    // Google 帳號 email 狀態
    const [globalUserEmail, setGlobalUserEmail] = useState(null);
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
    // 每週登入天數
    const [weekLoginDays, setWeekLoginDays] = useState(0);
    // 所有登入日期（YYYY-MM-DD）
    const [allLoginDays, setAllLoginDays] = useState([]);
    // 設定儲存版本，變動時通知子元件刷新
    const [settingsVersion, setSettingsVersion] = useState(0);
    // 從每日任務帶入的預選運動 key（傳給 GamePanel）
    const [preselectedSport, setPreselectedSport] = useState(null);
    const [pendingDailyExercise, setPendingDailyExercise] = useState(null);

    // 中文名稱 → GamePanel 運動 key 對應
    const mapExerciseToSportKey = (ex) => {
      if (!ex) return null;
      const name = (ex.名稱 || '').trim();
      const table = {
        '三頭肌伸展': 'triceps_extension',
        '伏地挺身': 'push_ups',
        '前肩伸展': 'front_shoulder_stretch',
        '原地提膝': 'march_in_place',
        '原地提膝踏步': 'march_in_place',
        '測步移動': 'side_step',
        '側步移動': 'side_step',
        '捲腹': 'crunch',
        '游泳式': 'swimming',
        '菱形肌後拉': 'rhomboid_pull',
        '開合跳': 'jumping_jack',
        '踢臀跑': 'butt_kick',
        '擺臂': 'arm_swing',
        '雙臂側舉': 'double_arm_raise',
        '深蹲': 'squat_status',
        '弓步蹲': 'lunge',
        'Wall Angels': 'wall_angel',
        '無限跳繩': 'nonstop_jump_rope',
        '無限套繩': 'nonstop_jump_rope',
      };
      if (table[name]) return table[name];
      const idMap = {
        5: 'march_in_place',
        7: 'side_step',
        9: 'squat_status',
        13: 'jumping_jack',
        14: 'butt_kick',
        15: 'arm_swing',
        16: 'double_arm_raise',
        17: 'nonstop_jump_rope',
        18: 'lunge',
        20: 'wall_angel',
      };
      return idMap[ex.ID] || null;
    };

    // 🔥 全域檢查登入狀態 + 每週登入累計
    useEffect(() => {
      // 取得今年第幾週
      function getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        // 週一為一週的開始
        return Math.floor((pastDaysOfYear + firstDayOfYear.getDay() - 1) / 7) + 1;
      }

      // 每次刷新都判斷一次登入
      const token = localStorage.getItem("google_access_token");
      const name = localStorage.getItem("google_user_name");
      const email = localStorage.getItem("google_user_email");
      if (token !== globalAccessToken) {
        setGlobalAccessToken(token);
      }
      if (name !== globalUserName) {
        setGlobalUserName(name);
      }
      if (email !== globalUserEmail) {
        setGlobalUserEmail(email);
      }

      if (token && name) {
        const now = new Date();
        const year = now.getFullYear();
        const week = getWeekNumber(now);
        const todayStr = now.toISOString().slice(0, 10);
        const loginKey = `weekLogin_${name}_${year}_${week}`;
        let loginDays = JSON.parse(localStorage.getItem(loginKey) || '[]');
        if (!loginDays.includes(todayStr)) {
          loginDays.push(todayStr);
          localStorage.setItem(loginKey, JSON.stringify(loginDays));
        }
        setWeekLoginDays(loginDays.length);

        // 只收集目前帳號的登入日期
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith(`weekLogin_${name}_`));
        let allDays = [];
        allKeys.forEach(k => {
          try {
            const arr = JSON.parse(localStorage.getItem(k) || '[]');
            allDays = allDays.concat(arr);
          } catch {}
        });
        setAllLoginDays(allDays);
      } else {
        setWeekLoginDays(0);
        setAllLoginDays([]);
      }

      // 監聽 localStorage 變化
      const handleStorageChange = (e) => {
        if (e.key === "google_access_token" || e.key === "google_user_name") {
          // 只要帳號或 token 變化就再判斷一次
          const token = localStorage.getItem("google_access_token");
          const name = localStorage.getItem("google_user_name");
          if (token && name) {
            const now = new Date();
            const year = now.getFullYear();
            const week = getWeekNumber(now);
            const todayStr = now.toISOString().slice(0, 10);
            const loginKey = `weekLogin_${name}_${year}_${week}`;
            let loginDays = JSON.parse(localStorage.getItem(loginKey) || '[]');
            if (!loginDays.includes(todayStr)) {
              loginDays.push(todayStr);
              localStorage.setItem(loginKey, JSON.stringify(loginDays));
            }
            setWeekLoginDays(loginDays.length);
          } else {
            setWeekLoginDays(0);
          }
        }
      };
      window.addEventListener('storage', handleStorageChange);

      // 定期檢查（防止跨頁面狀態不同步）
      const interval = setInterval(() => {
        const token = localStorage.getItem("google_access_token");
        const name = localStorage.getItem("google_user_name");
        if (token && name) {
          const now = new Date();
          const year = now.getFullYear();
          const week = getWeekNumber(now);
          const todayStr = now.toISOString().slice(0, 10);
          const loginKey = `weekLogin_${name}_${year}_${week}`;
          let loginDays = JSON.parse(localStorage.getItem(loginKey) || '[]');
          if (!loginDays.includes(todayStr)) {
            loginDays.push(todayStr);
            localStorage.setItem(loginKey, JSON.stringify(loginDays));
          }
          setWeekLoginDays(loginDays.length);
        } else {
          setWeekLoginDays(0);
        }
      }, 500);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }, [globalAccessToken, globalUserName, globalUserEmail]);

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

    // 只顯示 GamePanelApp 畫面，其他內容完全不渲染
    if (activePanel === "start") {
      return <GamePanelApp initialSport={preselectedSport} onGoHome={() => setActivePanel("main")} />;
    }

    // 原本主畫面內容
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
          setGlobalUserEmail={setGlobalUserEmail}
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
                  {/* 任務卡片元件（每日/每週） */}
                  <TaskSelector
                    isLoggedIn={!!(globalAccessToken && globalUserName)}
                    userEmail={globalUserEmail}
                    key={globalUserEmail || 'guest'}
                    settingsVersion={settingsVersion}
                    onTaskClick={(ex) => {
                      // 未登入：顯示提醒，不進行後續動作
                      if (!globalAccessToken || !globalUserName) {
                        toast.warn("請先登入 Google 帳號後再使用每日任務！");
                        return;
                      }
                      // 每週任務不顯示彈窗內容
                      if (ex.isWeeklyTask) return;
                      setPendingDailyExercise(ex);
                      // 顯示新版 JSON 欄位（中文）
                      const formatDuration = (sec) => {
                        if (typeof sec !== 'number') return sec;
                        return sec % 60 === 0 ? `${Math.round(sec/60)} 分鐘` : `${sec} 秒`;
                      };
                      const formatIntensity = (n) => n === 1 ? '低' : n === 2 ? '中' : n === 3 ? '高' : n;
                      setTaskModalContent({
                        title: ex.名稱,
                        content: (
                          <>
                            <div><b>持續時間：</b> {formatDuration(ex.運動時間)}</div>
                            <div><b>難易度：</b> {formatIntensity(ex.難易度)}</div>
                            <div style={{ marginTop: 8 }}><b>介紹：</b> {ex.簡介}</div>
                          </>
                        )
                      });
                      setShowTaskModal(true);
                    }}
                    onWeeklyTaskClick={() => {
                      // 未登入：顯示提醒，不進行後續動作
                      if (!globalAccessToken || !globalUserName) {
                        toast.warn("請先登入 Google 帳號後再查看每週任務！");
                        return;
                      }
                      setTaskModalContent({
                        title: '本週累計登入天數',
                        content: (
                          <>
                            <div style={{ width: '100%', height: '1.2rem', background: '#eee', borderRadius: '0.6rem', overflow: 'hidden', marginBottom: '0.7rem', boxShadow: '0 1px 4px #0001' }}>
                              <div style={{
                                width: `${Math.min(weekLoginDays,7)/7*100}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg,#2563eb,#4f8cff)',
                                borderRadius: '0.6rem',
                                transition: 'width 0.5s',
                              }}></div>
                            </div>
                            <div style={{ fontSize: '1.1rem', color: '#333' }}>{weekLoginDays} / 7 天</div>
                            <div style={{ fontSize: '0.95rem', color: '#888', marginTop: '0.5rem' }}>每週一重置</div>
                          </>
                        )
                      });
                      setShowTaskModal(true);
                    }}
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
              <div className={`main-content ${activePanel !== 'main' ? 'panel-open' : ''}`}>
                {activePanel === "main" && null /* 或 MainPanel 元件 */}
                {activePanel === "calendar" && (
                  <div className="calendar-in-board">
                    <CalendarPanel 
                      globalAccessToken={globalAccessToken}
                      globalUserName={globalUserName}
                      globalUserEmail={globalUserEmail}
                      loginDays={allLoginDays}
                    />
                  </div>
                )}
                {activePanel === "settings" && (
                  <SettingsPanel 
                    onClose={() => setActivePanel("main")} 
                    onSaved={() => setSettingsVersion(v => v + 1)}
                    globalAccessToken={globalAccessToken}
                    googleEmail={globalUserEmail}
                  />
                )}
                {activePanel === "start" && (
                  <div className="game-panel-in-board">
                    <GamePanelApp initialSport={preselectedSport} onGoHome={() => setActivePanel("main")} />
                  </div>
                )}
              </div>
            </div>
            {/* 將任務彈窗移出有 transform 的容器，避免 overlay 只覆蓋部分畫面 */}
            <TaskModal
              show={showTaskModal}
              title={taskModalContent.title}
              content={taskModalContent.content}
              onClose={() => setShowTaskModal(false)}
              onGoExercise={() => {
                setShowTaskModal(false);
                const key = mapExerciseToSportKey(pendingDailyExercise);
                if (key) {
                  setPreselectedSport(key);
                } else {
                  setPreselectedSport(null);
                  toast.info('此每日任務目前無對應的即時訓練項目，請在畫面中手動選擇最接近的運動。');
                }
                setActivePanel('start');
                // 清掉暫存
                setTimeout(() => setPendingDailyExercise(null), 0);
              }}
            />
          </>
        )}
      </div>
    );
  }

  export default App;