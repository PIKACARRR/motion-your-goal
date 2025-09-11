import './App.css'
import CameraFeed from './components/CameraFeed'
import SportSelector from './components/SportSelector'
import WorkoutVideo from './components/WorkoutVideo'
import EnergyBar from './components/EnergyBar'
import CoinDisplay from './components/CoinDisplay'
import InteractiveMascot from './components/InteractiveMascot'
import { useState, useEffect, useRef } from 'react'
import WallAngelStatus from './components/SportStatus'
import SummaryBoardWithLocalSave from "./components/SummaryBoard.tsx"

// 資源管理
import { Assets } from './test.js'

export default function App({ onGoHome, initialSport = null }) {
  const [phase, setPhase] = useState('select')
  const [sport, setSport] = useState(null)
  const [energy, setEnergy] = useState(0)
  const [coins, setCoins] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [lastMsg, setLastMsg] = useState('等待偵測')
  const [totalSeconds, setTotalSeconds] = useState(0)
  const startRef = useRef(0)
  
  // Wall Angel 相關狀態
  const [state, setState] = useState('waiting_W')
  const [totalCount, setTotalCount] = useState(0)

  // 素材系統
  const assetsRef = useRef(null)
  const overlayRef = useRef(null)

  // EnergyBar 相關：顯示對應圖片 & 控制一次性 chest 動畫
  const [energySprite, setEnergySprite] = useState('0')
  const chestPlayedRef = useRef(false)
  const energyResetRef = useRef(null)

  // BGM 狀態
  const assetsReady = useRef(false)
  const bgmKeysRef = useRef(['musmus_bgm_165', 'musmus_bgm_187'])
  const bgmIndexRef = useRef(0)
  const bgmNodeRef = useRef(null)

  // 初始化資源
  useEffect(() => {
    const base = (import.meta?.env?.BASE_URL ?? '/').replace(/\/+$/, '') + '/'
    const a = new Assets(base + 'assets.json')
    a.init()
      .then(() => {
        assetsRef.current = a
        assetsReady.current = true
      })
      .catch(err => console.error('Assets init failed:', err))
    return () => {
      // 清掉可能殘留的 timer
      if (energyResetRef.current) {
        clearTimeout(energyResetRef.current)
        energyResetRef.current = null
      }
    }
  }, [])

  // 簡化呼叫
  const playSfx = (key, opts) => assetsRef.current?.play(key, opts)
  const showGif = (key, opts) => {
    const el = assetsRef.current?.showGif(key, overlayRef.current, opts)
    if (el) setTimeout(() => el.remove(), 1200)
  }
  const centerGif = (w = 220, h = 220) => {
    const r = overlayRef.current?.getBoundingClientRect()
    if (!r) return { x: 0, y: 0, width: w, height: h }
    return {
      x: (r.width - w) / 2,
      y: (r.height * 0.7 - h / 2), // ← 垂直 80%（底部上來 20%）
      width: w,
      height: h
    }
  }


  // BGM 控制
  const stopBgm = () => {
    const node = bgmNodeRef.current
    if (node && assetsRef.current) {
      assetsRef.current.stop(node)
    }
    bgmNodeRef.current = null
  }

  const playNextBgm = () => {
    // 切歌前先停掉上一首，避免重疊
    stopBgm()
    if (!assetsRef.current) return
    const list = bgmKeysRef.current
    if (!list.length) return
    const key = list[bgmIndexRef.current % list.length]
    const node = assetsRef.current.play(key, { volume: 0.45, loop: false })
    bgmNodeRef.current = node
    node.onended = () => {
      bgmIndexRef.current = (bgmIndexRef.current + 1) % list.length
      playNextBgm()
    }
  }

  const playPrevBgm = () => {
    stopBgm()
    if (!assetsRef.current) return
    const list = bgmKeysRef.current
    if (!list.length) return
    bgmIndexRef.current = (bgmIndexRef.current - 1 + list.length) % list.length
    const key = list[bgmIndexRef.current]
    const node = assetsRef.current.play(key, { volume: 0.45, loop: false })
    bgmNodeRef.current = node
    node.onended = () => {
      bgmIndexRef.current = (bgmIndexRef.current + 1) % list.length
      playNextBgm()
    }
  }

  const startBgmPlaylist = (startIndex = 0) => {
    stopBgm()
    if (!bgmKeysRef.current.length) return
    bgmIndexRef.current = startIndex % bgmKeysRef.current.length
    playNextBgm()
  }

  const togglePlayPause = () => {
    const node = bgmNodeRef.current
    if (!node) return
    if (node.paused) node.play()
    else node.pause()
  }

  // 依 phase 啟停 BGM（內聯播放邏輯）
  useEffect(() => {
    if (phase === 'play' && assetsReady.current) {
      stopBgm()
      if (!bgmKeysRef.current.length || !assetsRef.current) return
      const list = bgmKeysRef.current
      const key = list[bgmIndexRef.current % list.length]
      const node = assetsRef.current.play(key, { volume: 0.45, loop: false })
      bgmNodeRef.current = node
      node.onended = () => {
        bgmIndexRef.current = (bgmIndexRef.current + 1) % list.length
        stopBgm()
        if (assetsRef.current) {
          const nextKey = list[bgmIndexRef.current]
          const nextNode = assetsRef.current.play(nextKey, { volume: 0.45, loop: false })
          bgmNodeRef.current = nextNode
          nextNode.onended = node.onended
        }
      }
      return () => stopBgm()
    } else {
      stopBgm()
    }
  }, [phase])

  // 🔋 energy → 對應圖 & chest 特效 & 100% 延遲歸零
  useEffect(() => {
    if (phase !== 'play') return

    // 100%：顯示 4.png，3秒後歸 0
    if (energy >= 100) {
      setEnergySprite('4')
      if (!energyResetRef.current) {
        energyResetRef.current = setTimeout(() => {
          setEnergy(0)
          setEnergySprite('0')
          chestPlayedRef.current = false
          energyResetRef.current = null
        }, 3000)
      }
      return
    } else {
      // 只要低於 100，就清掉可能的重置計時器
      if (energyResetRef.current) {
        clearTimeout(energyResetRef.current)
        energyResetRef.current = null
      }
    }

    // 80~90：播放一次寶箱 GIF，之後維持 3.png
    if (energy >= 80 && energy < 90) {
      if (!chestPlayedRef.current) {
        // showGif('dollar_coins_chest', centerGif(260, 260))
        chestPlayedRef.current = true
      }
      setEnergySprite('3')
      return
    }

    // 其他區間：切對應圖，並重置 chest 播放旗標（確保回到 80 區間會再播一次）
    if (energy <= 50) {
      setEnergySprite('0')
      chestPlayedRef.current = false
    } else if (energy <= 70) {
      setEnergySprite('1')
      chestPlayedRef.current = false
    } else if (energy < 80) {
      setEnergySprite('2')
      chestPlayedRef.current = false
    } else if (energy < 100) {
      setEnergySprite('3') // 90~99
    }
  }, [energy, phase])

  // 計時
  useEffect(() => {
    if (phase !== 'play') return
    startRef.current = Date.now()
    const interval = setInterval(() => {
      setTotalSeconds(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  function handleSportSelect(sportName) {
    fetch('http://localhost:5001/api/set_sport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sport: sportName })
    }).catch(() => {})
    setSport(sportName)
    setCoins(0)
    setEnergy(0)
    setSuccessCount(0)
    setTotalSeconds(0)
    setLastMsg('等待偵測')
    // 重置 Wall Angel 狀態
    setState('waiting_W')
    setTotalCount(0)
    setPhase('play')
  }

  function endWorkout() {
    stopBgm()
    setPhase('summary')
  }

  function retryWorkout() {
    setCoins(0)
    setEnergy(0)
    setSuccessCount(0)
    setTotalSeconds(0)
    setLastMsg('等待偵測')
    // 重置 Wall Angel 狀態
    setState('waiting_W')
    setTotalCount(0)
    setPhase('play')
  }

  if (phase === 'select') {
    return (
      <>
        <SportSelector onSelect={handleSportSelect} initialValue={initialSport || ''} />
        <InteractiveMascot
          position="bottom-right"
          exerciseCount={0}
          isExercising={false}
          onMotivate={(message) => {
            console.log('選擇界面吉祥物:', message);
          }}
        />
      </>
    );
  }

  if (phase === 'play') {
    return (
      <div className="app-container" style={{ position: 'relative' }}>
        {/* GIF 顯示層 */}
        <div
          ref={overlayRef}
          style={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: 50 }}
        >
          {/* 能量圖片：水平置中；垂直 80%（底部上來 20%）；尺寸放大 3 倍 */}
          <img
            src={`/images/${energySprite}.png`}
            alt="energy-stage"
            style={{
              position: 'absolute',
              left: '50%',
              top: '60%',
              transform: 'translate(-50%, -50%)',
              width: 800,            // 原本 72 的 3 倍；若你原本不是 72，就改成原本的 3 倍
              height: 'auto',
            }}
          />
        </div>
        <CoinDisplay coins={coins} />

        {/* 調試顯示 - 顯示 totalCount (已註解，debug時可取消註解) */}
        {false && sport === "wall_angel" && (
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '14px',
            zIndex: 100
          }}>
            Total Count: {totalCount} | State: {state}
          </div>
        )}

        {/* 結束運動 */}
        <button onClick={endWorkout} className="end-workout-btn">
          <img src="/images/close.png" alt="結束運動" />
        </button>

        {/* BGM 控制 UI（放在結束按鈕下方） */}
        <div className="bgm-controls" style={{ position: 'absolute', top: 60, right: 10, zIndex: 60, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button onClick={togglePlayPause}>
            {bgmNodeRef.current?.paused ? '▶️ 播放BGM' : '⏸ 暫停BGM'}
          </button>
          <button onClick={() => {
            if (bgmNodeRef.current) {
              bgmNodeRef.current.muted = !bgmNodeRef.current.muted
            }
          }}>
            {bgmNodeRef.current?.muted ? '🔇 開啟BGM' : '🔊 靜音BGM'}
          </button>
          <button onClick={() => {
            if (assetsReady.current) {
              playPrevBgm()
            }
          }}>
            ⏮ 上一首
          </button>
          <button onClick={() => {
            if (assetsReady.current) {
              const nextIndex = (bgmIndexRef.current + 1) % bgmKeysRef.current.length
              startBgmPlaylist(nextIndex)
            }
          }}>
            ⏭ 下一首
          </button>
        </div>

        <div className="main-content">
          <div className="side-panel">
            <CameraFeed />
          </div>
          <div className="center-panel">
            <WorkoutVideo sport={sport} />
            <WallAngelStatus
              onStatus={({ msg, count }) => {
                console.log('從 WallAngelStatus 收到:', { msg, count, typeof_count: typeof count });
                setLastMsg(msg)
                
                // 處理來自後端的計數更新
                if (typeof count === 'number' && count !== totalCount) {
                  const oldCount = totalCount;
                  setTotalCount(count);
                  
                  // 如果計數增加了，觸發相應的效果
                  if (count > oldCount) {
                    console.log(`Wall Angel 計數更新: ${oldCount} -> ${count}`);
                  }
                }
                
                if (typeof count === 'number') {
                  if (count > successCount) {
                    setEnergy(prev => {
                      const newEnergy = prev + 10
                      if (newEnergy >= 100) {
                        setCoins(c => {
                          playSfx('coins_soundeffect', { volume: 0.9 })
                          showGif('coins_animation', centerGif())
                          return c + 1
                        })
                        // 先顯示 100%，3 秒後自動歸 0（由 energy effect 處理 sprite 和 chest flag）
                        setTimeout(() => { setEnergy(0) }, 3000)
                        return 100
                      }
                      playSfx('charging_power_up_sound_effect_electrical_energy_power_audio_free_4k_download_no', { volume: 0.5 })
                      return newEnergy
                    })
                  }
                  setSuccessCount(count)
                }
              }}
            />
          </div>
        </div>

        <EnergyBar progress={energy} />

        {/* 互動吉祥物 */}
        <InteractiveMascot
          position="bottom-right"
          exerciseCount={successCount}
          isExercising={!!sport && phase === 'play'}
          onMotivate={(message) => {
            console.log('吉祥物:', message);
            // 可以在這裡添加更多互動邏輯，比如播放音效或顯示特效
          }}
        />
      </div>
    )
  }
  
  return (
    <SummaryBoardWithLocalSave
      exerciseName={sport || ''}
      totalTime={`${Math.floor(totalSeconds / 60)}分${totalSeconds % 60}秒`}
      successCount={successCount}
      gameCoins={coins}
      encouragement="太棒了！繼續加油！"
      errorFeedback={/正確|等待|偵測不到/.test(lastMsg) ? '' : lastMsg}
      onRetry={retryWorkout}
      onGoHome={onGoHome}
    />
  )
}
