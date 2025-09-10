import { useEffect, useState } from "react";

export default function WallAngelStatus({ onStatus }) {
  const [msg, setMsg] = useState("等待偵測");
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      fetch("http://localhost:5001/api/sport_status")
        .then(res => res.json())
        .then(data => {
          const nextMsg = data.msg ?? "等待偵測";
          const nextCount = data.count ?? 0;
          setMsg(nextMsg);
          setCount(nextCount);
          if (typeof onStatus === "function") {
            onStatus({ msg: nextMsg, count: nextCount });
          }
        })
        .catch(() => {});
    }, 500);
    return () => clearInterval(timer);
  }, [onStatus]);

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(25% + 420px + 10px)", // teach-video-box top + 高度 + 間距
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
        color: "#FFD700",
        fontSize: 28,
        fontWeight: "bold",
        textShadow: "0 2px 12px #000b",
        zIndex: 20
      }}
    >
      {msg} {count ? `(${count})` : ""}
      {/* 如果要加按鈕 */}

    </div>
  );
}
