import Icon from './Icon'

export default function RequerimentoCard({ requerimento, onPreencher }) {
  return (
    <div className="req-card">
      <div className="req-card-icon">
        <Icon name="document-text" size={17} />
      </div>
      <div className="req-card-name">{requerimento.nome}</div>
      <div className="req-card-cat">{requerimento.categoria || 'Geral'}</div>
      <div className="req-card-footer">
        <div className="req-card-fields">
          {requerimento.campos.length} campo{requerimento.campos.length !== 1 ? 's' : ''}
        </div>
        <button className="req-card-btn" onClick={() => onPreencher(requerimento)}>
          Preencher →
        </button>
      </div>
    </div>
  )
}
