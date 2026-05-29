import { useEffect, useState } from 'react'

function formatarData(isoStr) {
  if (!isoStr) return '—'
  // "2025-06-01 14:32:00" → "01/06/2025 14:32"
  const [datePart, timePart] = isoStr.split(' ')
  if (!datePart) return isoStr
  const [y, m, d] = datePart.split('-')
  const hora = timePart ? timePart.slice(0, 5) : ''
  return `${d}/${m}/${y}${hora ? ' ' + hora : ''}`
}

export default function Historico({ onToast }) {
  const [historico, setHistorico] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [abrindo, setAbrindo] = useState(null)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    try {
      setCarregando(true)
      const lista = await window.rh.listarHistorico()
      setHistorico(lista)
    } catch (e) {
      console.error(e)
    } finally {
      setCarregando(false)
    }
  }

  async function abrir(item) {
    if (!item.existe) {
      onToast?.('Arquivo não encontrado', 'O documento pode ter sido movido ou excluído.')
      return
    }
    setAbrindo(item.id)
    try {
      await window.rh.abrirDocumento(item.arquivo_gerado)
    } catch (e) {
      onToast?.('Erro ao abrir', e?.message ?? '')
    } finally {
      setAbrindo(null)
    }
  }

  const filtrados = historico.filter(h => {
    const q = filtro.toLowerCase()
    return (
      !q ||
      (h.requerimento_nome ?? '').toLowerCase().includes(q) ||
      (h.categoria ?? '').toLowerCase().includes(q)
    )
  })

  // Agrupa por data (dia)
  const grupos = filtrados.reduce((acc, item) => {
    const dia = item.gerado_em ? item.gerado_em.split(' ')[0] : 'Sem data'
    if (!acc[dia]) acc[dia] = []
    acc[dia].push(item)
    return acc
  }, {})

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div className="page-title">Histórico de documentos</div>
          <div className="breadcrumb">Início <span>›</span> Histórico</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={carregar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Atualizar
          </button>
        </div>
      </div>

      <div className="content">
        {/* Stats */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 20 }}>
          <div className="stat-card">
            <div>
              <div className="stat-value">{historico.length}</div>
              <div className="stat-label">Total de documentos gerados</div>
            </div>
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-value">{historico.filter(h => h.existe).length}</div>
              <div className="stat-label">Arquivos disponíveis em disco</div>
            </div>
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Filtrar por template ou categoria..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
          {filtro && (
            <button
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}
              onClick={() => setFiltro('')}
            >×</button>
          )}
        </div>

        {carregando ? (
          <div className="empty-state"><p>Carregando...</p></div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <strong>{filtro ? 'Nenhum resultado' : 'Nenhum documento gerado ainda'}</strong>
            <p>{filtro ? 'Tente outro termo.' : 'Volte ao painel e preencha um template para gerar o primeiro documento.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {Object.entries(grupos).map(([dia, itens]) => {
              const [y, m, d] = dia.split('-')
              const diaFormatado = dia === 'Sem data' ? dia : `${d}/${m}/${y}`
              return (
                <div key={dia}>
                  <div style={{
                    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '1px',
                    marginBottom: 10, paddingBottom: 6,
                    borderBottom: '1px solid var(--border)'
                  }}>
                    {diaFormatado}
                  </div>

                  <div className="table-wrapper">
                    <table className="rh-table">
                      <thead>
                        <tr>
                          <th>Template</th>
                          <th>Horário</th>
                          <th>Resumo</th>
                          <th>Arquivo</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {itens.map(item => (
                          <tr key={item.id}>
                            <td>
                              <div className="table-name">{item.requerimento_nome ?? 'Template removido'}</div>
                              {item.categoria && <div className="table-file">{item.categoria}</div>}
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                              {item.gerado_em ? item.gerado_em.split(' ')[1]?.slice(0, 5) : '—'}
                            </td>
                            <td>
                              <DadosResumo dados={item.dados} />
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {item.existe ? (
                                  <span className="tag tag-active" style={{ fontSize: '10px' }}>Disponível</span>
                                ) : (
                                  <span className="tag tag-inactive" style={{ fontSize: '10px' }}>Não encontrado</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="action-btns">
                                <button
                                  className="icon-btn"
                                  title="Abrir documento"
                                  disabled={!item.existe || abrindo === item.id}
                                  onClick={() => abrir(item)}
                                  style={{ opacity: item.existe ? 1 : .4 }}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

/** Mostra até 3 campos do documento como resumo */
function DadosResumo({ dados }) {
  if (!dados || typeof dados !== 'object') return null
  const entries = Object.entries(dados).filter(([, v]) => v !== '' && v !== null && v !== false)
  const primeiros = entries.slice(0, 3)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
      {primeiros.map(([k, v]) => (
        <span key={k} style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--text-muted)' }}>{k}:</span>{' '}
          <strong>{typeof v === 'boolean' ? (v ? 'Sim' : 'Não') : String(v).slice(0, 30)}</strong>
        </span>
      ))}
      {entries.length > 3 && (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{entries.length - 3} mais</span>
      )}
    </div>
  )
}
