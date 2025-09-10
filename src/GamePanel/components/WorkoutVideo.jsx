import { useState, useEffect, useRef } from "react";

export default function WorkoutVideo({ sport }) {
  // 用於偵測影片載入錯誤
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  // 運動對應的教學影片映射
  const videoMapping = {
    "wall_angel": "/video/wall_angel_tutorial.mp4",
    "march_in_place": "/video/march_in_place_tutorial.mp4", 
    "side_step": "/video/side_step_tutorial.mp4",
    "jumping_jack": "/video/jumping_jack_tutorial.mp4",
    "lunge": "/video/lunge_tutorial.mp4",
    "triceps_extension": "/video/triceps_extension_tutorial.mp4",
    "push_ups": "/video/push_ups_tutorial.mp4",
    "front_shoulder_stretch": "/video/front_shoulder_stretch_tutorial.mp4",
    "crunch": "/video/crunch_tutorial.mp4",
    "swimming": "/video/swimming_tutorial.mp4",
    "rhomboid_pull": "/video/rhomboid_pull_tutorial.mp4",
    "butt_kick": "/video/butt_kick_tutorial.mp4",
    "double_arm_raise": "/video/double_arm_raise_tutorial.mp4",
    "long_jump_arm": "/video/long_jump_arm_tutorial.mp4",
    "arm_swing": "/video/arm_swing_tutorial.mp4",
    "squat_status": "/video/squat_tutorial.mp4",
    "single_leg_deadlift": "/video/single_leg_deadlift_tutorial.mp4",
    "nonstop_jump_rope": "/video/nonstop_jump_rope_tutorial.mp4",
    "skipping_rope": "/video/skipping_rope_tutorial.mp4"
  };

  // 運動說明文字映射
  const exerciseDescriptions = {
    "wall_angel": "雙手靠牆做W型和Y型伸展，改善肩膀靈活度",
    "march_in_place": "原地踏步，抬高膝蓋到腰部高度",
    "side_step": "側向跨步，保持身體穩定",
    "jumping_jack": "跳躍時雙腿分開，手臂上下揮動",
    "lunge": "向前跨步下蹲，鍛鍊腿部肌肉",
    "triceps_extension": "手臂後伸運動，鍛鍊三頭肌",
    "push_ups": "俯臥撐，鍛鍊胸肌和手臂",
    "front_shoulder_stretch": "向前伸展肩膀，放鬆肩部肌肉",
    "crunch": "仰臥起坐，鍛鍊腹部核心肌群",
    "swimming": "模擬游泳動作，全身性運動",
    "rhomboid_pull": "菱形肌拉伸，改善背部姿勢",
    "butt_kick": "向後踢臀部，鍛鍊腿後肌群",
    "double_arm_raise": "雙臂上舉運動，鍛鍊肩膀",
    "long_jump_arm": "跳遠手臂擺動，協調性訓練",
    "arm_swing": "手臂擺動運動，暖身準備",
    "squat_status": "深蹲動作，鍛鍊下半身力量",
    "single_leg_deadlift": "單腿硬舉，平衡與力量訓練",
    "nonstop_jump_rope": "連續跳繩，有氧心肺訓練",
    "skipping_rope": "跳繩運動，提升協調性"
  };

  // 獲取當前運動的教學影片路徑
  const getVideoSrc = () => {
    if (sport && videoMapping[sport]) {
      return videoMapping[sport];
    }
    return "/video/demo.mp4"; // 默認影片
  };

  // 當運動改變時重置錯誤狀態並自動播放
  useEffect(() => {
    setVideoError(false);
    
    // 當有新的運動影片時，自動播放
    if (sport && videoRef.current) {
      const playVideo = async () => {
        try {
          await videoRef.current.play();
        } catch (error) {
          console.log("自動播放失敗，需要用戶互動:", error);
        }
      };
      
      // 稍微延遲以確保影片已載入
      const timer = setTimeout(() => {
        playVideo();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [sport]);

  const videoSrc = getVideoSrc();
  const description = sport ? exerciseDescriptions[sport] : "選擇運動開始訓練";

  return (
    <div className="teach-video-container">
      {videoError || !sport ? (
        <div className="teach-video-box no-video-placeholder">
          <div className="exercise-info">
            <h3>{sport ? sport.replace(/_/g, ' ').toUpperCase() : "運動教學"}</h3>
            <p>{description}</p>
          </div>
        </div>
      ) : (
        <div className="teach-video-box">
          <video
            ref={videoRef}
            key={videoSrc} // 添加 key 強制重新載入影片
            src={videoSrc}
            controls
            loop // 無限循環播放
            autoPlay // 自動播放
            muted // 靜音以確保自動播放在所有瀏覽器中工作
            playsInline // 在 iOS 設備上內聯播放
            style={{ width: '100%', height: '100%' }}
            onError={() => setVideoError(true)}
            onLoadedData={() => {
              // 當影片載入完成時確保播放
              if (videoRef.current) {
                videoRef.current.play().catch(console.log);
              }
            }}
            preload="auto" // 自動預載整個影片以確保順暢播放
          />
          
          {/* 運動資訊覆蓋層 */}
          <div className="exercise-overlay">
            <div className="exercise-name">
              {sport.replace(/_/g, ' ').toUpperCase()}
            </div>
            <div className="exercise-desc">
              {description}
            </div>
          </div>
        </div>
      )}
      
      {/* CSS 樣式 */}
      <style jsx>{`
        .teach-video-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .no-video-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
        }
        
        .exercise-info {
          text-align: center;
          margin-top: 15px;
        }
        
        .exercise-info h3 {
          margin: 0 0 10px 0;
          font-size: 1.5em;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .exercise-info p {
          margin: 0;
          font-size: 1.1em;
          line-height: 1.4;
          opacity: 0.9;
        }
        
        .exercise-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.7));
          color: white;
          padding: 15px;
          border-bottom-left-radius: 10px;
          border-bottom-right-radius: 10px;
        }
        
        .exercise-name {
          font-size: 1.2em;
          font-weight: bold;
          margin-bottom: 5px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        
        .exercise-desc {
          font-size: 0.9em;
          opacity: 0.9;
          line-height: 1.3;
        }
      `}</style>
    </div>
  );
}
