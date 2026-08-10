export default function StatCard({ label, value, delta, direction }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {delta && (
        <div className={`stat-card-delta ${direction}`}>
          {direction === 'up' ? '↑' : '↓'} {delta}
        </div>
      )}
    </div>
  )
}
