import { useState, useEffect } from 'react';
import Background from './Background';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import CharacterWithResponsivePosition from './CharacterWithResponsivePosition';
import SkeletonWithHP from './SkeletonWithHP';
import '../style/ExercisePanel.css';
import { Image as DreiImage } from '@react-three/drei';

export default function ExercisePanel({ onClose, autoPlayVideo }) {
  const [bgX, setBgX] = useState(0);
  const [model, setModel] = useState('v3');
  const [position, setPosition] = useState([-7, -9, 0]);
  const [rotationY, setRotationY] = useState(Math.PI / 1.5);
  const [model2, setModel2] = useState('skeleton');
  const [position2, setPosition2] = useState([9, -6, 0]);
  const [rotationY2, setRotationY2] = useState(Math.PI / 75);
  const [skeletonHp, setSkeletonHp] = useState(5);
  const [showCoinBag, setShowCoinBag] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(100);
  const [characterScale, setCharacterScale] = useState([1, 1, 1]);
  const [count, setCount] = useState(0);
  const [prevCount, setPrevCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const runDuration = 2000;
  const punchDuration = 1000;
  const returnDuration = 2000;
  const CHARACTER_SCREEN_RATIO = 0.001;
  const CHARACTER_MODEL_WIDTH = 1;
  const BG_SCREEN_RATIO = 1;
  const BG_MODEL_WIDTH = 1;
  const CHARACTER_X_RATIO = 0.4;
  const CHARACTER_Y_RATIO = 0.001;
  const [isAutoPosition, setIsAutoPosition] = useState(true);
  const [characterPosition, setCharacterPosition] = useState([0, 0, 0]);
  const [bgScale, setBgScale] = useState([1, 1, 1]);
  const SKELETON_X_RATIO = 0.8;
  const SKELETON_Y_RATIO = 0.1;
  const [isSkeletonAutoPosition, setIsSkeletonAutoPosition] = useState(true);
  const [skeletonPosition, setSkeletonPosition] = useState([0, 0, 0]);
  const [showYoutube, setShowYoutube] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/success-count")
        .then(res => res.json())
        .then(data => {
          setPrevCount(count);
          setCount(data.count);
        });
    }, 500);
    return () => clearInterval(interval);
  }, [count]);

  useEffect(() => {
    if (count > prevCount && !isRunning) {
      handleRun();
    }
  }, [count, prevCount, isRunning]);

  useEffect(() => {
    function handleResize() {
      const aspect = window.innerWidth / window.innerHeight;
      if (aspect > 16 / 9) {
        setCameraZoom(100 * (aspect / (16 / 9)));
      } else {
        setCameraZoom(100);
      }
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    function handleResize() {
      const screenWidth = window.innerWidth;
      const worldScreenWidth = screenWidth / cameraZoom;
      const scaleValue = (worldScreenWidth * CHARACTER_SCREEN_RATIO) / CHARACTER_MODEL_WIDTH;
      setCharacterScale([scaleValue, scaleValue, scaleValue]);
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [cameraZoom]);

  useEffect(() => {
    function handleResize() {
      const screenWidth = window.innerWidth;
      const worldScreenWidth = screenWidth / cameraZoom;
      const scaleValue = (worldScreenWidth * BG_SCREEN_RATIO) / BG_MODEL_WIDTH;
      setBgScale([scaleValue, scaleValue, scaleValue]);
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [cameraZoom]);

  useEffect(() => {
    if (!isAutoPosition) return;
    function updatePosition() {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const worldScreenWidth = screenWidth / cameraZoom;
      const worldScreenHeight = screenHeight / cameraZoom;
      const x = (CHARACTER_X_RATIO - 0.5) * worldScreenWidth;
      const y = (CHARACTER_Y_RATIO - 0.5) * worldScreenHeight;
      setCharacterPosition([x, y, 0]);
    }
    window.addEventListener('resize', updatePosition);
    updatePosition();
    return () => window.removeEventListener('resize', updatePosition);
  }, [cameraZoom, isAutoPosition]);

  useEffect(() => {
    if (!isSkeletonAutoPosition) return;
    function updateSkeletonPosition() {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const worldScreenWidth = screenWidth / cameraZoom;
      const worldScreenHeight = screenHeight / cameraZoom;
      const x = (SKELETON_X_RATIO - 0.5) * worldScreenWidth;
      const y = (SKELETON_Y_RATIO - 0.5) * worldScreenHeight;
      setSkeletonPosition([x, y, 0]);
    }
    window.addEventListener('resize', updateSkeletonPosition);
    updateSkeletonPosition();
    return () => window.removeEventListener('resize', updateSkeletonPosition);
  }, [cameraZoom, isSkeletonAutoPosition]);

  useEffect(() => {
    if (autoPlayVideo) {
      setShowYoutube(true);
    }
  }, [autoPlayVideo]);

  function standing() {
    setIsAutoPosition(true);
    setModel('v3');
  }

  function handleRun() {
    if (isRunning) return;
    setIsRunning(true);
    setIsAutoPosition(false);
    setModel('running');
    setRotationY(Math.PI / 1.5);
    setShowYoutube(true); // 按下運動開始時顯示 YouTube

    const start = Date.now();
    const duration = 2000;
    const [startX, startY] = characterPosition;
    const endX = startX + 13;
    const endY = startY + 1.6;

    function animateForward() {
      const now = Date.now();
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      const newX = startX + (endX - startX) * t;
      const newY = startY + (endY - startY) * t;
      setCharacterPosition([newX, newY, 0]);

      if (t < 1) {
        requestAnimationFrame(animateForward);
      } else {
        setModel('Light_Punching');

        setTimeout(() => {
          handleRunBack(endX, endY);
        }, 1000);
        setTimeout(() => {
          playSkeletonKnockdown();
          attackSkeleton();
        }, 800);
        setTimeout(() => {
          setIsRunning(false);
        }, 2000 + 1000 + 2000);
      }
    }

    animateForward();
  }

  function pickRun() {
    setIsAutoPosition(false);
    setModel('running');
    setRotationY(Math.PI / 1.5);

    const start = Date.now();
    const duration = 2000;
    const [startX, startY] = characterPosition;
    const endX = startX + 13;
    const endY = startY + 1.6;

    function animateForward() {
      const now = Date.now();
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      const newX = startX + (endX - startX) * t;
      const newY = startY + (endY - startY) * t;
      setCharacterPosition([newX, newY, 0]);

      if (t < 1) {
        requestAnimationFrame(animateForward);
      } else {
        setModel('Pick');

        setTimeout(() => {
          handleRunBack(endX, endY);
          setShowCoinBag(false);
        }, 3000);
      }
    }

    animateForward();
  }

  function handleRunBack(startX, startY) {
    setModel('running');
    setRotationY(11);

    const start = Date.now();
    const duration = 2000;
    const endX = -7;
    const endY = -6;

    function animateBack() {
      const now = Date.now();
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      const newX = startX + (endX - startX) * t;
      const newY = startY + (-endY + startY) * t;
      setCharacterPosition([newX, newY, 0]);

      if (t < 1) {
        requestAnimationFrame(animateBack);
      } else {
        setModel('v3');
        setRotationY(Math.PI / 1.5);
        setIsAutoPosition(true);
      }
    }

    animateBack();
  }

  function playSkeletonKnockdown() {
    setModel2('skeleton_knockdown');
    setTimeout(() => {
      setModel2('skeleton');
    }, 2000);
  }

  function attackSkeleton() {
    setSkeletonHp(prev => {
      const nextHp = prev - 5;
      if (nextHp <= 0) {
        setShowCoinBag(true);
      }
      return nextHp;
    });
  }

  function skeletonRunAnimation() {
    setIsSkeletonAutoPosition(false);
    const [startX, startY] = skeletonPosition;
    const endX = startX - 5;
    const endY = startY;
    const start = Date.now();
    const duration = 2000;
    function animate() {
      const now = Date.now();
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const newX = startX + (endX - startX) * t;
      setSkeletonPosition([newX, endY, 0]);
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSkeletonAutoPosition(true);
      }
    }
    animate();
  }

  function skeletonBackToIdle() {
    setIsSkeletonAutoPosition(false);
    const [startX, startY] = skeletonPosition;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const worldScreenWidth = screenWidth / cameraZoom;
    const worldScreenHeight = screenHeight / cameraZoom;
    const idleX = (SKELETON_X_RATIO - 0.5) * worldScreenWidth;
    const idleY = (SKELETON_Y_RATIO - 0.5) * worldScreenHeight;
    const endX = idleX;
    const endY = idleY;
    const start = Date.now();
    const duration = 2000;
    function animate() {
      const now = Date.now();
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const newX = startX + (endX - startX) * t;
      const newY = startY + (endY - startY) * t;
      setSkeletonPosition([newX, newY, 0]);
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSkeletonAutoPosition(true);
      }
    }
    animate();
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: '#111',
      }}
    >
      {/* 影片滿版，內容超出自動裁切 */}
      <div
        style={{
          position: 'absolute',
          width: '50vw',
          height: '24vw', // 21:9 比例大約是 24vw
          left: '25vw',
          top: '5vh',
          zIndex: 101,
          background: 'black',
          overflow: 'hidden',
          borderRadius: '12px',
        }}
      >
        {showYoutube ? (
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/cvx06snMQ3A?autoplay=1&mute=1"
            title="YouTube video player"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{ width: '100%', height: '100%' }}
          />
        ) : null}
      </div>
      <div
        style={{
          position: 'absolute',
          left: '2vw',
          bottom: '4vh',
          fontSize: '2vw',
          color: '#1ba8ff',
          background: 'rgba(255,255,255,0.75)',
          padding: '0.7vw 1.8vw',
          borderRadius: '1vw',
          zIndex: 300,
          fontWeight: 'bold',
          boxShadow: '0 4px 20px #0002',
        }}
      >
        成功次數：{count}
      </div>
      {/* 按鈕區 - 百分比定位 */}
      <div
        style={{
          position: 'absolute',
          top: '3vw',
          left: '3vw',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: '1vw',
          background: 'rgba(255,255,255,0.7)',
          padding: '1vw',
          borderRadius: '0.7vw',
        }}
      >
        <button
          style={{
            fontSize: '1.2vw',
            padding: '0.5vw 1.7vw',
            borderRadius: '0.4vw',
            marginBottom: '0.7vw',
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer',
          }}
          onClick={standing}
        >
          待機
        </button>
        <button
          style={{
            fontSize: '1.2vw',
            padding: '0.5vw 1.7vw',
            borderRadius: '0.4vw',
            marginBottom: '0.7vw',
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer',
          }}
          onClick={handleRun}
        >
          奔跑→攻擊→回原位
        </button>
        <button
          style={{
            fontSize: '1.2vw',
            padding: '0.5vw 1.7vw',
            borderRadius: '0.4vw',
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer',
          }}
          onClick={pickRun}
        >
          檢硬幣
        </button>
      </div>
      {/* circle.png 滿版百分比定位 */}
      <img
        src="/images/circle.png"
        alt="flower circle"
        style={{
          position: 'absolute',
          left: '13vw',
          top: '27vh',
          width: '18vw',
          height: 'auto',
          pointerEvents: 'none',
          zIndex: 201,
        }}
      />
      {/* 關閉鈕 */}
      <img
        src="/images/close.png"
        alt="close button"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '3vw',
          right: '3vw',
          width: '6vw',
          height: '6vw',
          cursor: 'pointer',
          zIndex: 202,
          userSelect: 'none',
        }}
      />
      {/* 3D Canvas 疊最上層 */}
      <div
        style={{
          position: 'absolute',
          width: '100vw',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 100,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <Canvas
          style={{
            width: '100vw',
            height: '100vh',
            position: 'absolute',
            left: 0,
            top: 0,
            objectFit: 'cover',
          }}
        >
          <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={cameraZoom} />
          <ambientLight />
          <directionalLight position={[5, 5, 5]} />
          <Background position={[bgX, 0, -15]} scale={bgScale} />
          <CharacterWithResponsivePosition model={model} position={characterPosition} rotationY={rotationY} scale={characterScale} />
          {!showCoinBag ? (
            <>
              <SkeletonWithHP
                model="skeleton"
                position={skeletonPosition}
                rotationY={rotationY2}
                scale={[0.8, 0.8, 0.8]}
                hp={skeletonHp}
              />
              <CharacterWithResponsivePosition
                model={model2}
                position={skeletonPosition}
                rotationY={rotationY2}
                scale={[0.8, 0.8, 0.8]}
              />
            </>
          ) : (
            <>
              <CharacterWithResponsivePosition
                model="pile_of_coins"
                position={position2}
                rotationY={Math.PI}
                scale={[5, 10, 5]}
              />
              <pointLight
                position={[position2[0], position2[1] + 2, position2[2] + 3]}
                intensity={10.0}
                distance={10}
                color={'#ffd700'}
              />
            </>
          )}
        </Canvas>
      </div>
    </div>
  );
} 