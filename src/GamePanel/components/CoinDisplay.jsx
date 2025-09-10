export default function CoinDisplay({ coins = 0 }) {
  return (
    <div className="coin-text">
      💰 金幣：{coins}
    </div>
  )
}
