import { useEffect } from 'react'

// ── Formatação de CPF ──────────────────────────────────────────────
function formatarCpf(valor) {
  const d = String(valor ?? '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

export default function CampoInput({ campo, valor, onChange, erro }) {
  // data_hoje: preenche automaticamente ao montar se vazio
  useEffect(() => {
    if (campo.tipo === 'data_hoje' && !valor) {
      onChange(campo.id, new Date().toISOString().split('T')[0])
    }
  }, []) // eslint-disable-line

  return (
    <div className="form-group">
      <div className="form-label">
        {campo.obrigatorio && <span className="required-dot" />}
        {campo.label}
        {campo.tipo === 'data_hoje' && (
          <span style={{ fontSize: '10px', color: 'var(--accent-text)', marginLeft: 6, fontWeight: 400 }}>
            (hoje)
          </span>
        )}
      </div>

      {/* ── text ── */}
      {campo.tipo === 'text' && (
        <input
          type="text"
          className={`form-input${erro ? ' error' : ''}`}
          placeholder={campo.placeholder ?? ''}
          value={valor ?? ''}
          onChange={e => onChange(campo.id, e.target.value)}
        />
      )}

      {/* ── cpf ── */}
      {campo.tipo === 'cpf' && (
        <input
          type="text"
          inputMode="numeric"
          className={`form-input${erro ? ' error' : ''}`}
          placeholder="000.000.000-00"
          value={formatarCpf(valor)}
          onChange={e => onChange(campo.id, formatarCpf(e.target.value))}
        />
      )}

      {/* ── number ── */}
      {campo.tipo === 'number' && (
        <input
          type="number"
          className={`form-input${erro ? ' error' : ''}`}
          placeholder={campo.placeholder ?? ''}
          value={valor ?? ''}
          onChange={e => onChange(campo.id, e.target.value)}
        />
      )}

      {/* ── date ── */}
      {campo.tipo === 'date' && (
        <input
          type="date"
          className={`form-input${erro ? ' error' : ''}`}
          value={valor ?? ''}
          onChange={e => onChange(campo.id, e.target.value)}
        />
      )}

      {/* ── data_hoje: date pré-preenchida com hoje, editável ── */}
      {campo.tipo === 'data_hoje' && (
        <input
          type="date"
          className={`form-input${erro ? ' error' : ''}`}
          value={valor ?? new Date().toISOString().split('T')[0]}
          onChange={e => onChange(campo.id, e.target.value)}
        />
      )}

      {/* ── boolean (toggle) ── */}
      {campo.tipo === 'boolean' && (
        <div className="form-toggle" onClick={() => onChange(campo.id, !valor)}>
          <div className={`toggle-switch${valor ? ' on' : ''}`} />
          <div className="toggle-label">{valor ? 'Sim' : 'Não'}</div>
        </div>
      )}

      {/* ── select ── */}
      {campo.tipo === 'select' && (
        <select
          className={`form-input${erro ? ' error' : ''}`}
          value={valor ?? ''}
          onChange={e => onChange(campo.id, e.target.value)}
        >
          <option value="">Selecione uma opção...</option>
          {(campo.opcoes ?? []).map(op => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      )}

      {erro && <div className="form-error">{erro}</div>}
    </div>
  )
}
