import { useState, useEffect } from 'react'

export default function GeracaoEmMassa({ onToast }) {
  const [requerimentos, setRequerimentos] = useState([])
  const [requerimentoId, setRequerimentoId] = useState('')
  const [jsonTexto, setJsonTexto] = useState('')
  const [registros, setRegistros] = useState(null)
  const [erroParse, setErroParse] = useState(null)
  const [gerando, setGerando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [resultados, setResultados] = useState(null)
  const [modeloVisivel, setModeloVisivel] = useState(false)
  const [modeloJson, setModeloJson] = useState(null)
  const [carregandoModelo, setCarregandoModelo] = useState(false)

  useEffect(() => {
    window.rh.listarRequerimentos().then(lista => {
      const ativos = lista.filter(r => r.ativo)
      setRequerimentos(ativos)
      if (ativos.length > 0) setRequerimentoId(ativos[0].id)
    }).catch(console.error)
  }, [])

  // Limpa estado ao trocar de template
  useEffect(() => {
    setJsonTexto('')
    setRegistros(null)
    setErroParse(null)
    setResultados(null)
    setModeloJson(null)
    setModeloVisivel(false)
  }, [requerimentoId])

  // Tenta parsear o JSON enquanto o usuário digita
  useEffect(() => {
    if (!jsonTexto.trim()) {
      setRegistros(null)
      setErroParse(null)
      return
    }
    try {
      const parsed = JSON.parse(jsonTexto)
      if (!Array.isArray(parsed)) {
        setErroParse('O JSON deve ser um array de objetos: [ { ... }, { ... } ]')
        setRegistros(null)
      } else {
        setRegistros(parsed)
        setErroParse(null)
      }
    } catch (e) {
      setErroParse('JSON inválido: ' + e.message)
      setRegistros(null)
    }
  }, [jsonTexto])

  const requerimentoAtual = requerimentos.find(r => r.id === requerimentoId)

  async function handleGerarModelo() {
    if (!requerimentoId) return
    setCarregandoModelo(true)
    try {
      const modelo = await window.rh.modeloJsonEmMassa(requerimentoId)
      setModeloJson(modelo)
      setModeloVisivel(true)
    } catch (e) {
      onToast?.('Erro ao gerar modelo', e?.message)
    } finally {
      setCarregandoModelo(false)
    }
  }

  function handleCopiarModelo() {
    if (!modeloJson) return
    navigator.clipboard.writeText(JSON.stringify(modeloJson, null, 2))
    onToast?.('Modelo copiado!', 'JSON copiado para a área de transferência')
  }

  function handleUsarModelo() {
    if (!modeloJson) return
    setJsonTexto(JSON.stringify(modeloJson, null, 2))
    setModeloVisivel(false)
  }

  async function handleImportarArquivo() {
    try {
      const dados = await window.rh.importarJson()
      if (dados) {
        setJsonTexto(JSON.stringify(dados, null, 2))
        onToast?.('Arquivo importado!', `${dados.length} registro(s) carregado(s)`)
      }
    } catch (e) {
      onToast?.('Erro ao importar', e?.message)
    }
  }

  async function handleGerarTodos() {
    if (!registros || registros.length === 0 || !requerimentoId) return
    setGerando(true)
    setProgresso(0)
    setResultados(null)

    // Simula progresso enquanto aguarda (IPC é síncrono no backend)
    const intervalo = setInterval(() => {
      setProgresso(p => Math.min(p + 3, 90))
    }, 80)

    try {
      const res = await window.rh.gerarDocumentosEmMassa(requerimentoId, registros)
      clearInterval(intervalo)
      setProgresso(100)
      setResultados(res)
      const erros = res.filter(r => !r.ok).length
      if (erros === 0) {
        onToast?.('Geração concluída!', `${res.length} documento(s) gerado(s) com sucesso`)
      } else {
        onToast?.(`${res.length - erros} gerado(s), ${erros} com erro`, requerimentoAtual?.nome)
      }
    } catch (e) {
      clearInterval(intervalo)
      setProgresso(0)
      onToast?.('Erro na geração', e?.message)
    } finally {
      setGerando(false)
    }
  }

  async function handleAbrirArquivo(caminho) {
    await window.rh.abrirDocumento(caminho)
  }

  async function handleImprimirTodos() {
    if (!resultados) return
    const gerados = resultados.filter(r => r.ok && r.arquivo)
    for (const r of gerados) {
      await window.rh.imprimirDocumento(r.arquivo)
    }
    onToast?.('Impressão enviada', `${gerados.length} documento(s) enviado(s) para impressão`)
  }

  const camposTemplate = requerimentoAtual?.campos ?? []
  const colunas = registros && registros.length > 0 ? Object.keys(registros[0]) : []
  const okCount = resultados ? resultados.filter(r => r.ok).length : 0
  const erroCount = resultados ? resultados.filter(r => !r.ok).length : 0

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div className="page-title">Geração em Massa</div>
          <div className="breadcrumb">Início <span>›</span> Geração em Massa</div>
        </div>
      </div>

      <div className="content">

        {/* ── Seletor de template ── */}
        <div className="form-card" style={{ marginBottom: '1rem' }}>
          <div className="form-card-header">
            <div className="form-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div>
              <div className="form-card-title">1. Selecione o modelo de documento</div>
              <div className="form-card-sub">Escolha qual template será usado para todos os registros</div>
            </div>
          </div>
          <div className="form-body">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Modelo de documento
                </label>
                <select
                  value={requerimentoId}
                  onChange={e => setRequerimentoId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  {requerimentos.map(r => (
                    <option key={r.id} value={r.id}>{r.nome}</option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-ghost"
                onClick={handleGerarModelo}
                disabled={!requerimentoId || carregandoModelo}
                title="Gera um JSON de exemplo com os campos deste modelo"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                {carregandoModelo ? 'Gerando...' : 'Gerar modelo JSON'}
              </button>
            </div>

            {/* Campos do template */}
            {camposTemplate.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {camposTemplate.map(c => (
                  <span key={c.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '2px 8px', borderRadius: '4px',
                    background: 'var(--surface-2, #f0eeeb)',
                    border: '1px solid var(--border)',
                    fontSize: '11px', fontFamily: "'DM Mono', monospace",
                    color: 'var(--accent-text, #4f7cff)',
                  }}>
                    {c.id}
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
                      ({c.tipo}{c.obrigatorio ? ', obrig.' : ''})
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Modelo JSON expandível ── */}
        {modeloVisivel && modeloJson && (
          <div className="form-card" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--accent-text, #4f7cff)' }}>
            <div className="form-card-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="form-card-icon" style={{ background: 'var(--accent-bg, #eef2ff)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-text, #4f7cff)" strokeWidth="2.5">
                    <polyline points="16 18 22 12 16 6"/>
                    <polyline points="8 6 2 12 8 18"/>
                  </svg>
                </div>
                <div>
                  <div className="form-card-title">Modelo JSON esperado</div>
                  <div className="form-card-sub">
                    Array com {modeloJson.length} exemplo(s) — cada objeto representa 1 documento
                  </div>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                onClick={() => setModeloVisivel(false)}
              >✕</button>
            </div>
            <div className="form-body">
              <pre style={{
                background: 'var(--surface-2, #f5f4f2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '12px 16px',
                fontSize: '11.5px',
                fontFamily: "'DM Mono', monospace",
                color: 'var(--text-primary)',
                overflowX: 'auto',
                maxHeight: '260px',
                overflowY: 'auto',
                margin: 0,
                lineHeight: 1.6,
              }}>
                {JSON.stringify(modeloJson, null, 2)}
              </pre>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-primary" onClick={handleUsarModelo}>
                  ← Usar como base de entrada
                </button>
                <button className="btn btn-ghost" onClick={handleCopiarModelo}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copiar JSON
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Entrada de dados ── */}
        <div className="form-card" style={{ marginBottom: '1rem' }}>
          <div className="form-card-header">
            <div className="form-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <div>
              <div className="form-card-title">2. Cole ou importe o JSON com os dados</div>
              <div className="form-card-sub">Array de objetos — cada objeto gera um documento</div>
            </div>
          </div>
          <div className="form-body">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={handleImportarArquivo}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Importar arquivo .json
              </button>
              {jsonTexto && (
                <button className="btn btn-ghost" onClick={() => { setJsonTexto(''); setRegistros(null); setErroParse(null) }}>
                  Limpar
                </button>
              )}
            </div>

            <textarea
              value={jsonTexto}
              onChange={e => setJsonTexto(e.target.value)}
              placeholder={'[\n  {\n    "CAMPO_1": "valor",\n    "CAMPO_2": "valor"\n  }\n]'}
              spellCheck={false}
              style={{
                width: '100%',
                minHeight: '180px',
                padding: '12px',
                borderRadius: '6px',
                border: `1px solid ${erroParse ? 'var(--danger, #ef4444)' : 'var(--border)'}`,
                background: 'var(--surface-2, #f5f4f2)',
                color: 'var(--text-primary)',
                fontFamily: "'DM Mono', monospace",
                fontSize: '12px',
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            {erroParse && (
              <div className="alert alert-danger" style={{ marginTop: '0.5rem', fontSize: '12px' }}>
                {erroParse}
              </div>
            )}

            {registros && !erroParse && (
              <div style={{ marginTop: '0.5rem', fontSize: '12px', color: 'var(--text-secondary)' }}>
                ✓ {registros.length} registro(s) válido(s) detectado(s)
              </div>
            )}
          </div>
        </div>

        {/* ── Pré-visualização tabular ── */}
        {registros && registros.length > 0 && !erroParse && (
          <div className="form-card" style={{ marginBottom: '1rem' }}>
            <div className="form-card-header">
              <div className="form-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="3" y1="15" x2="21" y2="15"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                </svg>
              </div>
              <div>
                <div className="form-card-title">3. Pré-visualização dos registros</div>
                <div className="form-card-sub">{registros.length} documento(s) serão gerados</div>
              </div>
            </div>
            <div className="form-body" style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%', borderCollapse: 'collapse',
                fontSize: '12px', fontFamily: "'DM Mono', monospace",
              }}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    {colunas.map(col => (
                      <th key={col} style={{
                        ...thStyle,
                        color: camposTemplate.some(c => c.id === col)
                          ? 'var(--accent-text, #4f7cff)'
                          : 'var(--text-muted)',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registros.slice(0, 8).map((reg, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>{i + 1}</td>
                      {colunas.map(col => (
                        <td key={col} style={tdStyle}>
                          {reg[col] === undefined
                            ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                            : String(reg[col]).length > 30
                              ? String(reg[col]).slice(0, 28) + '…'
                              : String(reg[col])
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {registros.length > 8 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  … e mais {registros.length - 8} registro(s) não exibido(s)
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Ações ── */}
        {registros && registros.length > 0 && !erroParse && !resultados && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleGerarTodos}
              disabled={gerando}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {gerando ? 'Gerando...' : `Gerar ${registros.length} documento(s)`}
            </button>
          </div>
        )}

        {/* ── Barra de progresso ── */}
        {gerando && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Gerando documentos… {progresso}%
            </div>
            <div style={{
              height: '6px', borderRadius: '3px',
              background: 'var(--border)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: '3px',
                background: 'var(--accent-text, #4f7cff)',
                width: `${progresso}%`,
                transition: 'width 0.15s ease',
              }} />
            </div>
          </div>
        )}

        {/* ── Resultados ── */}
        {resultados && (
          <div className="form-card">
            <div className="form-card-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="form-card-icon" style={{
                  background: erroCount === 0 ? 'var(--success-bg, #f0fdf4)' : 'var(--warning-bg, #fffbeb)',
                }}>
                  <svg viewBox="0 0 24 24" fill="none"
                    stroke={erroCount === 0 ? '#22c55e' : '#f59e0b'}
                    strokeWidth="2.5">
                    {erroCount === 0
                      ? <polyline points="20 6 9 17 4 12"/>
                      : <><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/><circle cx="12" cy="12" r="10"/></>
                    }
                  </svg>
                </div>
                <div>
                  <div className="form-card-title">
                    {okCount} gerado(s){erroCount > 0 ? `, ${erroCount} com erro` : ' — concluído!'}
                  </div>
                  <div className="form-card-sub">{requerimentoAtual?.nome}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {okCount > 0 && (
                  <button className="btn btn-ghost" onClick={handleImprimirTodos}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <polyline points="6 9 6 2 18 2 18 9"/>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                      <rect x="6" y="14" width="12" height="8"/>
                    </svg>
                    Imprimir todos
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => {
                  setResultados(null); setProgresso(0)
                }}>
                  Nova geração
                </button>
              </div>
            </div>

            <div className="form-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {resultados.map(r => (
                  <div key={r.indice} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', borderRadius: '6px',
                    background: r.ok ? 'var(--surface-2, #f5f4f2)' : 'var(--danger-bg, #fef2f2)',
                    border: `1px solid ${r.ok ? 'var(--border)' : 'var(--danger-border, #fecaca)'}`,
                    fontSize: '12px',
                  }}>
                    <span style={{
                      fontWeight: 700, minWidth: 28,
                      color: r.ok ? '#22c55e' : '#ef4444',
                    }}>
                      {r.ok ? '✓' : '✗'} #{r.indice}
                    </span>
                    {r.ok ? (
                      <>
                        <span style={{
                          flex: 1, fontFamily: "'DM Mono', monospace", fontSize: '11px',
                          color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {r.arquivo}
                        </span>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                          onClick={() => handleAbrirArquivo(r.arquivo)}
                        >
                          Abrir
                        </button>
                      </>
                    ) : (
                      <span style={{ flex: 1, color: '#ef4444' }}>{r.erro}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

const thStyle = {
  textAlign: 'left',
  padding: '6px 10px',
  background: 'var(--surface-2, #f0eeeb)',
  borderBottom: '2px solid var(--border)',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  color: 'var(--text-secondary)',
}

const tdStyle = {
  padding: '6px 10px',
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap',
  maxWidth: '200px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}
