import { useState, useEffect } from 'react'
import CampoInput from '../components/CampoInput'
import Icon from '../components/Icon'

export default function Formulario({ requerimento, onCancelar, onToast }) {
  const hoje = new Date().toISOString().split('T')[0]
  const valoresIniciais = Object.fromEntries(
    requerimento.campos.map(c => {
      if (c.tipo === 'boolean') return [c.id, false]
      if (c.tipo === 'data_hoje') return [c.id, hoje]
      if (c.tipo === 'checkbox') return [c.id, []]
      return [c.id, '']
    })
  )
  const [valores, setValores] = useState(valoresIniciais)

  useEffect(() => {
    if (!requerimento.usarAssinatura || !requerimento.campoAssinaturaId) return
    window.rh.lerConfiguracoes().then(cfg => {
      setValores(v => ({ ...v, [requerimento.campoAssinaturaId]: cfg.assinatura ?? '' }))
    }).catch(() => {})
  }, [])
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
      const vazio = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)
      if (campo.obrigatorio && vazio) {
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

  function handleNovo() {
    setResultado(null)
    setValores(valoresIniciais)
    setErros({})
    setErroGeral(null)
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
              <Icon name="check" size={24} />
            </div>
            <div className="success-title">Documento gerado com sucesso!</div>
            <div className="success-path">{resultado}</div>
            <div className="success-actions">
              <button className="btn btn-primary" onClick={handleAbrir}>
                <Icon name="external-link" size={14} />
                Abrir no Word
              </button>
              <button className="btn btn-ghost" onClick={handleImprimir}>
                <Icon name="printer" size={14} />
                Imprimir
              </button>
              <button className="btn btn-ghost" onClick={handleNovo}>
                <Icon name="rotate-ccw" size={14} />
                Preencher novamente
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
                <Icon name="document-text" size={17} />
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
                <Icon name="download" size={14} />
                {gerando ? 'Gerando...' : 'Gerar documento'}
              </button>
            </div>
          </div>

          {/* Sidebar info */}
          <div className="form-sidebar">
            <div className="info-card">
              <div className="info-card-title">
                <Icon name="info" size={13} />
                Detalhes do modelo
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
                <span className="info-row-label">Modelo</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-muted)' }}>
                  {requerimento.arquivo}
                </span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-title">
                <Icon name="document" size={13} />
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
