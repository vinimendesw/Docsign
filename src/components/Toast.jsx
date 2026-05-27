export default function Toast({ titulo, sub }) {
  return (
    <div className="toast">
      <div className="toast-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div className="toast-text">
        <div className="toast-title">{titulo}</div>
        {sub && <div className="toast-sub">{sub}</div>}
      </div>
    </div>
  )
}
