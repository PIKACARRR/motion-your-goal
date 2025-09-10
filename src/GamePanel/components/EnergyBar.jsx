export default function EnergyBar({ progress = 0 }) {
  return (
    <div className="energy-bar-wrapper">
      <div
        className="energy-bar"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  )
}
