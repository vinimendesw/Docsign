import { useState } from 'react'
import CampoInput from '../components/CampoInput'

export default function Formulario({ requerimento, onCancelar, onToast }) {
  const hoje = new Date().toISOString().split('T')[0]
  const valoresIniciais = Object.fromEntries(
    requerimento.campos.map(c => {
      if (c.tipo === 'boolean') return [c.id, false]
      if (c.tipo === 'data_hoje') return [c.id, hoje]
      return [c.id, '']
    })
  )
  const [valores, setValores] = useState(valoresIniciais)
  const [erros, setErros] = useState({})
  const [gerando, setGerando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erroGeral, setErroGeral] = useState(null)

  function handleChange(id, valor) {
    setValores(v => ({ ...v, [id]: valor }))
    if (erros[id]) setErros(e => ({ ...e, [id]: null }))
  }

  function validar() {
    const novosErros = {}
    for (const campo of requerimento.campos) {
      const val = valores[campo.id]
      if (campo.obrigatorio && (val === undefined || val === null || val === '')) {
        novosErros[campo.id] = 'Campo obrigatório'
      }
    }
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function handleGerar() {
    if (!validar()) return
    setGerando(true)
    setErroGeral(null)
    try {
      const caminho = await window.rh.gerarDocumento(requerimento.id, valores)
      setResultado(caminho)
      onToast?.('Documento gerado!', requerimento.nome)
    } catch (e) {
      setErroGeral(e?.message ?? 'Erro ao gerar documento.')
    } finally {
      setGerando(false)
    }
  }

  async function handleAbrir() {
    await window.rh.abrirDocumento(resultado)
  }

  async function handleImprimir() {
    await window.rh.imprimirDocumento(resultado)
  }

  if (resultado) {
    return (
      <>
        <div className="topbar">
          <div className="topbar-left">
            <div className="page-title">Documento gerado</div>
            <div className="breadcrumb">
              <span style={{ cursor: 'pointer', color: 'var(--accent-text)' }} onClick={onCancelar}>Painel</span>
              <span>›</span> Concluído
            </div>
          </div>
        </div>
        <div className="content">
          <div className="success-card">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="success-title">Documento gerado com sucesso!</div>
            <div className="success-path">{resultado}</div>
            <div className="success-actions">
              <button className="btn btn-primary" onClick={handleAbrir}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Abrir no Word
              </button>
              <button className="btn btn-ghost" onClick={handleImprimir}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Imprimir
              </button>
              <button className="btn btn-ghost" onClick={onCancelar}>
                ← Voltar ao painel
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div className="page-title">{requerimento.nome}</div>
          <div className="breadcrumb">
            <span style={{ cursor: 'pointer', color: 'var(--accent-text)' }} onClick={onCancelar}>Painel</span>
            <span>›</span> Formulário
          </div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={onCancelar}>← Voltar</button>
        </div>
      </div>

      <div className="content">
        <div className="form-layout">
          {/* Formulário principal */}
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div>
                <div className="form-card-title">{requerimento.nome}</div>
                <div className="form-card-sub">Preencha todos os campos obrigatórios</div>
              </div>
            </div>

            <div className="form-body">
              {erroGeral && <div className="alert alert-danger">{erroGeral}</div>}

              {/* Agrupa campos text/number/date em pares quando possível */}
              {renderCampos(requerimento.campos, valores, handleChange, erros)}
            </div>

            <div className="form-actions">
              <button className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleGerar} disabled={gerando}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {gerando ? 'Gerando...' : 'Gerar documento'}
              </button>
            </div>
          </div>

          {/* Sidebar info */}
          <div className="form-sidebar">
            <div className="info-card">
              <div className="info-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Detalhes do requerimento
              </div>
              <div className="info-row">
                <span className="info-row-label">Documento</span>
                <span className="info-row-val">{requerimento.nome}</span>
              </div>
              {requerimento.categoria && (
                <div className="info-row">
                  <span className="info-row-label">Categoria</span>
                  <span className="tag tag-category">{requerimento.categoria}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-row-label">Campos</span>
                <span className="info-row-val">{requerimento.campos.length} campos</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Status</span>
                <span className="tag tag-active">Ativo</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Template</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-muted)' }}>
                  {requerimento.arquivo}
                </span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Após gerar
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                O arquivo <strong style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px' }}>.docx</strong> será
                salvo automaticamente em <strong>Documentos gerados</strong> e aberto no Word para impressão.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/** Renderiza campos agrupando datas e números em linhas de 2 colunas quando adjacentes */
function renderCampos(campos, valores, onChange, erros) {
  const resultado = []
  let i = 0
  while (i < campos.length) {
    const atual = campos[i]
    const prox = campos[i + 1]
    const emparelhavel = c => c && (c.tipo === 'date' || c.tipo === 'number' || c.tipo === 'text')

    if (emparelhavel(atual) && emparelhavel(prox) && atual.tipo !== 'boolean' && prox.tipo !== 'boolean') {
      resultado.push(
        <div key={atual.id + prox.id} className="form-row">
          <CampoInput campo={atual} valor={valores[atual.id]} onChange={onChange} erro={erros[atual.id]} />
          <CampoInput campo={prox} valor={valores[prox.id]} onChange={onChange} erro={erros[prox.id]} />
        </div>
      )
      i += 2
    } else {
      resultado.push(
        <CampoInput key={atual.id} campo={atual} valor={valores[atual.id]} onChange={onChange} erro={erros[atual.id]} />
      )
      i++
    }
  }
  return resultado
}
