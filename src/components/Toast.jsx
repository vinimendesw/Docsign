import Icon from './Icon'

export default function Toast({ titulo, sub }) {
  return (
    <div className="toast">
      <div className="toast-icon">
        <Icon name="check" size={13} />
      </div>
      <div className="toast-text">
        <div className="toast-title">{titulo}</div>
        {sub && <div className="toast-sub">{sub}</div>}
      </div>
    </div>
  )
}
