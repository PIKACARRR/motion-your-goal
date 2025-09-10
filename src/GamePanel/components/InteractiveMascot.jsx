//  npm install framer-motion
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

const InteractiveMascot = ({ 
  position = 'bottom-right',  // 改為右下角預設
  onMotivate,
  exerciseCount = 0,
  isExercising = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [mascotPosition, setMascotPosition] = useState({ x: 0, y: 0 });
  const [mood, setMood] = useState('happy'); // happy, excited, sleepy, cheering
  const [isAutoTalking, setIsAutoTalking] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const [bounceDirection, setBounceDirection] = useState({ x: 0, y: 0 });
  const [isReturning, setIsReturning] = useState(false);
  
  const dragControls = useDragControls();
  const autoTalkTimer = useRef(null);
  const mascotRef = useRef(null);
  const returnTimer = useRef(null);

  // 豐富的對話內容
  const dialogues = {
    greeting: [
      "嗨！我是你的運動夥伴小機器人！🤖",
      "準備好一起運動了嗎？💪",
      "今天也要加油喔！✨",
      "讓我們一起變得更強壯吧！",
      "運動時間到啦！準備好了嗎？",
    ],
    motivation: [
      "你做得太棒了！繼續保持！💪",
      "每一次運動都讓你更健康！",
      "堅持就是勝利！我相信你！",
      "哇！你的進步真是令人驚艷！",
      "運動讓你閃閃發光！✨",
      "不要放棄！你已經很厲害了！",
      "每一滴汗水都是成功的證明！",
      "你是我見過最努力的人！",
      "繼續加油！勝利就在前方！",
      "你的毅力讓我刮目相看！",
    ],
    encouragement: [
      "別灰心！每個人都有起起伏伏！",
      "休息一下再繼續吧！",
      "慢慢來，不用急！",
      "你已經很努力了！",
      "保持正確姿勢比速度更重要喔！",
      "深呼吸，放鬆一下！",
      "記住，進步不一定要快，但要持續！",
    ],
    celebration: [
      "太棒了！🎉 你完成了 {} 次！",
      "哇！{} 次！你是超級巨星！⭐",
      "不可思議！{} 次的成就解鎖！",
      "慶祝時刻！{} 次達成！🎊",
      "你打破了自己的記錄！{} 次！",
      "驚人的 {} 次！你太強了！",
    ],
    interaction: [
      "想和我聊聊嗎？我隨時都在！",
      "你可以拖拽我到任何地方喔！",
      "點點我，我有更多話想說！",
      "我喜歡和你互動！😊",
      "有什麼問題都可以問我！",
      "我們是最佳運動夥伴！",
      "你知道嗎？運動可以增加快樂荷爾蒙！",
      "每天運動30分鐘，健康跟著來！",
      "記得運動前後要做伸展運動喔！",
      "保持水分補充很重要！",
      "充足的睡眠對運動表現很重要！",
    ],
    tips: [
      "小叮嚀：運動前記得熱身喔！",
      "提醒：保持正確的呼吸節奏！",
      "建議：運動後要記得放鬆肌肉！",
      "秘訣：循序漸進比急於求成更有效！",
      "重點：專注在動作的品質上！",
      "要點：運動時保持愉快的心情！",
    ],
    farewell: [
      "今天辛苦了！明天見！",
      "記得好好休息喔！",
      "你今天表現得很棒！",
      "運動結束，記得補充水分！",
      "期待下次和你一起運動！",
    ]
  };

  // 根據運動次數和情況選擇對話
  const getContextualMessage = () => {
    if (exerciseCount === 0) {
      return dialogues.greeting[Math.floor(Math.random() * dialogues.greeting.length)];
    } else if (exerciseCount > 0 && exerciseCount % 10 === 0) {
      const template = dialogues.celebration[Math.floor(Math.random() * dialogues.celebration.length)];
      return template.replace('{}', exerciseCount);
    } else if (exerciseCount > 0 && exerciseCount % 5 === 0) {
      return dialogues.motivation[Math.floor(Math.random() * dialogues.motivation.length)];
    } else if (interactionCount % 3 === 0) {
      return dialogues.tips[Math.floor(Math.random() * dialogues.tips.length)];
    } else {
      return dialogues.interaction[Math.floor(Math.random() * dialogues.interaction.length)];
    }
  };

  // 自動對話系統
  useEffect(() => {
    if (isExercising && exerciseCount > 0) {
      const interval = setInterval(() => {
        if (Math.random() > 0.7) { // 30% 機率自動說話
          const message = dialogues.motivation[Math.floor(Math.random() * dialogues.motivation.length)];
          setCurrentMessage(message);
          setShowMessage(true);
          setIsAutoTalking(true);
          setTimeout(() => {
            setShowMessage(false);
            setIsAutoTalking(false);
          }, 3000);
        }
      }, 8000);
      
      return () => clearInterval(interval);
    }
  }, [isExercising, exerciseCount]);

  // 清理定時器
  useEffect(() => {
    return () => {
      if (autoTalkTimer.current) {
        clearTimeout(autoTalkTimer.current);
      }
      if (returnTimer.current) {
        clearTimeout(returnTimer.current);
      }
    };
  }, []);

  // 根據運動狀態改變心情
  useEffect(() => {
    if (exerciseCount === 0) {
      setMood('happy');
    } else if (exerciseCount >= 10) {
      setMood('cheering');
    } else if (isExercising) {
      setMood('excited');
    } else {
      setMood('happy');
    }
  }, [exerciseCount, isExercising]);

  // 點擊處理
  const handleClick = () => {
    if (isDragging) return;
    
    setIsClicked(true);
    setInteractionCount(prev => prev + 1);
    
    const message = getContextualMessage();
    setCurrentMessage(message);
    setShowMessage(true);
    
    if (onMotivate) {
      onMotivate(message);
    }

    setTimeout(() => setIsClicked(false), 300);
    setTimeout(() => {
      if (!isAutoTalking) {
        setShowMessage(false);
      }
    }, 4000);
  };

  // 拖拽處理
  const handleDragStart = () => {
    setIsDragging(true);
    setIsBouncing(false);
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    
    // 清除之前的定時器
    if (returnTimer.current) {
      clearTimeout(returnTimer.current);
    }
    
    // 獲取螢幕尺寸和吉祥物尺寸
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const mascotSize = 300;
    
    // 獲取當前位置（相對於視窗）
    const currentX = info.point.x;
    const currentY = info.point.y;
    
    // 檢查是否超出邊界
    const isOutOfBounds = 
      currentX < 0 || 
      currentX > screenWidth - mascotSize || 
      currentY < 0 || 
      currentY > screenHeight - mascotSize;
    
    if (isOutOfBounds) {
      // 顯示警告訊息
      const outOfBoundsMessages = [
        "咦！我跑太遠了！😅",
        "超出邊界了！馬上回來！",
        "哎呀！我迷路了！",
        "邊界警報！正在回歸！🚨",
        "回到安全區域！",
      ];
      const message = outOfBoundsMessages[Math.floor(Math.random() * outOfBoundsMessages.length)];
      setCurrentMessage(message);
      setShowMessage(true);
      setMood('surprised');
      
      // 1秒後自動回到預設位置
      returnTimer.current = setTimeout(() => {
        setIsReturning(true);
        
        // 根據 position prop 決定預設位置
        const defaultPosition = getDefaultPosition();
        
        // 使用 Framer Motion 的 animate 回到預設位置
        if (mascotRef.current) {
          // 重置到預設位置的訊息
          setCurrentMessage("我回來了！😊");
          setMood('happy');
          
          // 停止回歸狀態
          setTimeout(() => {
            setIsReturning(false);
            setShowMessage(false);
          }, 1500);
        }
      }, 1000);
    } else {
      // 檢查是否接近邊界，提供反彈回饋
      let hitWall = false;
      let bounceX = 0;
      let bounceY = 0;
      
      if (currentX <= 10) {
        bounceX = 1;
        hitWall = true;
      } else if (currentX >= screenWidth - mascotSize - 10) {
        bounceX = -1;
        hitWall = true;
      }
      
      if (currentY <= 10) {
        bounceY = 1;
        hitWall = true;
      } else if (currentY >= screenHeight - mascotSize - 10) {
        bounceY = -1;
        hitWall = true;
      }
      
      if (hitWall) {
        setIsBouncing(true);
        setBounceDirection({ x: bounceX, y: bounceY });
        
        const bounceMessages = [
          "咚！撞到邊界了！😵",
          "小心邊界喔！",
          "邊界警報！⚠️",
        ];
        const bounceMessage = bounceMessages[Math.floor(Math.random() * bounceMessages.length)];
        setCurrentMessage(bounceMessage);
        setShowMessage(true);
        setMood('surprised');
        
        setTimeout(() => {
          setIsBouncing(false);
          setShowMessage(false);
          setMood('happy');
        }, 1500);
      }
    }
  };

  // 獲取預設位置
  const getDefaultPosition = () => {
    switch (position) {
      case 'bottom-left':
        return { x: 20, y: window.innerHeight - 320 };
      case 'top-right':
        return { x: window.innerWidth - 320, y: 20 };
      case 'top-left':
        return { x: 20, y: 20 };
      case 'bottom-right':
      default:
        return { x: window.innerWidth - 320, y: window.innerHeight - 320 };
    }
  };

  // 心情對應的動畫效果
  const getMoodAnimation = () => {
    if (isBouncing) {
      return {
        scale: [1, 1.4, 0.7, 1.2, 1],
        rotate: [0, bounceDirection.x * 25, bounceDirection.x * -15, bounceDirection.x * 10, 0],
        transition: {
          duration: 0.6,
          ease: "easeOut"
        }
      };
    }
    
    switch (mood) {
      case 'excited':
        return {
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        };
      case 'cheering':
        return {
          scale: [1, 1.15, 1],
          y: [0, -10, 0],
          rotate: [0, 10, -10, 0],
        };
      case 'sleepy':
        return {
          scale: [1, 0.95, 1],
          rotate: [0, -2, 2, 0],
        };
      case 'surprised':
        return {
          scale: [1, 1.3, 1],
          rotate: [0, 15, -15, 0],
          transition: {
            duration: 0.4,
            ease: "easeOut"
          }
        };
      default:
        return {
          y: [0, -8, 0],
          rotate: [0, 3, -3, 0],
        };
    }
  };

  // 位置樣式
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed',
      zIndex: 1000,
    };

    // 設定初始位置，讓 Framer Motion 從這裡開始
    switch (position) {
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      case 'bottom-right':
      default:
        return { ...baseStyles, bottom: '20px', right: '20px' };
    }
  };

  return (
    <motion.div 
      style={getPositionStyles()}
      drag
      dragConstraints={{
        left: -(window.innerWidth - 320), // 320px = 吉祥物寬度 + 邊距
        right: 0, // 不能超過初始右邊界
        top: -(window.innerHeight - 320), // 320px = 吉祥物高度 + 邊距
        bottom: 0, // 不能超過初始下邊界
      }}
      dragElastic={0.05}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={
        isReturning ? {
          x: 0,
          y: 0,
          transition: {
            duration: 1.0,
            ease: "easeInOut"
          }
        } : {}
      }
    >
      {/* 訊息氣泡 - 現在會跟著整個容器移動 */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            style={{
              position: 'absolute',
              bottom: '220px',
              left: position.includes('right') ? '-280px' : '0px',
              background: isBouncing 
                ? 'linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%)' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '20px 26px',
              borderRadius: '30px',
              maxWidth: '350px',
              fontSize: '17px',
              fontWeight: 'bold',
              textAlign: 'center',
              boxShadow: isBouncing 
                ? '0 15px 30px rgba(255,107,107,0.4)' 
                : '0 12px 24px rgba(0,0,0,0.25)',
              border: '4px solid white',
              backdropFilter: 'blur(10px)',
              zIndex: 1002,
            }}
          >
            {currentMessage}
            {/* 氣泡尾巴 */}
            <div
              style={{
                position: 'absolute',
                bottom: '-12px',
                left: position.includes('right') ? '270px' : '40px',
                width: '0',
                height: '0',
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: isBouncing ? '12px solid #ff6b6b' : '12px solid #667eea',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 吉祥物本體 */}
      <motion.div
        ref={mascotRef}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        whileDrag={{ scale: 1.05, zIndex: 1001 }}
        animate={getMoodAnimation()}
        transition={
          isBouncing ? 
          {
            duration: 0.6,
            ease: "easeOut",
            repeat: 0
          } :
          {
            scale: { duration: 2.5, repeat: Infinity },
            y: { duration: mood === 'excited' ? 1.8 : 3.0, repeat: Infinity },
            rotate: { duration: mood === 'cheering' ? 1.2 : 2.5, repeat: Infinity },
          }
        }
        style={{
          width: '300px',  // 大幅增加尺寸
          height: '300px', // 大幅增加尺寸
          cursor: isDragging ? 'grabbing' : 'grab',
          filter: isClicked ? 'brightness(1.3)' : 'brightness(1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* 多層光環效果 */}
        <motion.div
          animate={{
            scale: isHovered ? [1, 1.3, 1] : 1,
            opacity: isHovered ? [0.3, 0.7, 0.3] : 0,
            rotate: [0, 360],
          }}
          transition={{
            scale: { duration: 1.5, repeat: isHovered ? Infinity : 0 },
            opacity: { duration: 1.5, repeat: isHovered ? Infinity : 0 },
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
          }}
          style={{
            position: 'absolute',
            top: '-20px',
            left: '-20px',
            right: '-20px',
            bottom: '-20px',
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24, #ff6b6b)',
            pointerEvents: 'none',
          }}
        />

        {/* 內層光環 */}
        <motion.div
          animate={{
            scale: isHovered ? [1, 1.15, 1] : 1,
            opacity: isHovered ? [0.5, 0.8, 0.5] : 0,
          }}
          transition={{
            duration: 1,
            repeat: isHovered ? Infinity : 0,
          }}
          style={{
            position: 'absolute',
            top: '-12px',
            left: '-12px',
            right: '-12px',
            bottom: '-12px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* 機器人圖片 */}
        <img
          src="/images/Little power robot.gif"
          alt="Power Robot Mascot"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '6px solid #fff',
            boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
            background: 'white',
            objectFit: 'cover',
          }}
        />

        {/* 運動計數徽章 */}
        {exerciseCount > 0 && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            style={{
              position: 'absolute',
              top: '-12px',
              right: '-12px',
              background: exerciseCount >= 20 ? '#ff6b6b' : exerciseCount >= 10 ? '#4ecdc4' : '#45b7d1',
              color: 'white',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              border: '4px solid white',
              boxShadow: '0 6px 12px rgba(0,0,0,0.4)',
            }}
          >
            {exerciseCount}
          </motion.div>
        )}

        {/* 心情指示器 */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
          }}
          style={{
            position: 'absolute',
            top: '-8px',
            left: '-8px',
            fontSize: '26px',
            pointerEvents: 'none',
          }}
        >
          {mood === 'excited' && '😆'}
          {mood === 'cheering' && '🎉'}
          {mood === 'sleepy' && '😴'}
          {mood === 'surprised' && '😲'}
          {mood === 'happy' && '😊'}
        </motion.div>
      </motion.div>

      {/* 互動提示 */}
      <AnimatePresence>
        {isHovered && !showMessage && !isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'absolute',
              bottom: '210px',
              left: position.includes('right') ? '-180px' : '10px',
              background: 'rgba(0,0,0,0.9)',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '16px',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
              zIndex: 1002,
            }}
          >
            🖱️ 點我聊天 · ✋ 拖拽移動
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InteractiveMascot;
 