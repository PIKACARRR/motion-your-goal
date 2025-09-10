export default function CameraFeed() {
  return (
    <div className="user-video-box">
      <span className="user-video-title">後端鏡頭畫面</span>
      <img
        src="http://localhost:5001/video_feed"
        alt="cam"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          borderRadius: "18px"
        }}
      />
    </div>
  );
}
