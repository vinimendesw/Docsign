import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const TIPOS = ['text', 'cpf', 'date', 'data_hoje', 'number', 'boolean', 'select', 'checkbox']

const TIPOS_LABEL = {
  text: 'Texto',
  cpf: 'CPF (000.000.000-00)',
  date: 'Data',
  data_hoje: 'Data — preenche hoje automaticamente',
  number: 'Número',
  boolean: 'Sim / Não (toggle)',
  select: 'Seleção única (dropdown)',
  checkbox: 'Seleção múltipla (checkboxes)',
}

const campoVazio = () => ({ id: '', label: '', tipo: 'text', obrigatorio: true, placeholder: '', opcoes: '' })

export default function Gerenciador({ onToast }) {
  const [requerimentos, setRequerimentos] = useState([])
  const [modal, setModal] = useState(null) // null | { modo: 'novo'|'editar', form }
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const lista = await window.rh.listarRequerimentos()
    setRequerimentos(lista)
  }

  function novoRequerimento() {
    setModal({
      modo: 'novo',
      form: { id: uuidv4(), nome: '', categoria: '', arquivo: '', campos: [campoVazio()], _nomeOriginal: '', usarAssinatura: false, campoAssinaturaId: 'assinatura' }
    })
  }

  function editarRequerimento(req) {
    setModal({
      modo: 'editar',
      form: {
        ...req,
        campos: req.campos.map(c => ({
          ...c,
          opcoes: Array.isArray(c.opcoes) ? c.opcoes.join(', ') : (c.opcoes ?? ''),
        })),
        _nomeOriginal: req.arquivo,
        usarAssinatura: req.usarAssinatura ?? false,
        campoAssinaturaId: req.campoAssinaturaId ?? 'assinatura',
      }
    })
  }

  function fecharModal() { setModal(null) }

  function handleForm(campo, valor) {
    setModal(m => ({ ...m, form: { ...m.form, [campo]: valor } }))
  }

  async function importarTemplate() {
    const res = await window.rh.importarTemplate()
    if (!res) return
    setModal(m => ({ ...m, form: { ...m.form, arquivo: res.nomeArquivo, _nomeOriginal: res.nomeOriginal } }))
    onToast?.('Template importado', res.nomeOriginal)
  }

  function handleCampo(i, key, val) {
    setModal(m => {
      const campos = [...m.form.campos]
      campos[i] = { ...campos[i], [key]: val }
      return { ...m, form: { ...m.form, campos } }
    })
  }

  function addCampo() {
    setModal(m => ({ ...m, form: { ...m.form, campos: [...m.form.campos, campoVazio()] } }))
  }

  function removeCampo(i) {
    setModal(m => ({ ...m, form: { ...m.form, campos: m.form.campos.filter((_, idx) => idx !== i) } }))
  }

  async function salvar() {
    const { form } = modal
    if (!form.nome.trim()) return onToast?.('Informe o nome')
    if (!form.arquivo) return onToast?.('Importe um arquivo .docx')

    const campos = form.campos.map(c => ({
      id: c.id || c.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      label: c.label,
      tipo: c.tipo,
      obrigatorio: !!c.obrigatorio,
      ...(c.placeholder ? { placeholder: c.placeholder } : {}),
      ...((c.tipo === 'select' || c.tipo === 'checkbox') ? { opcoes: (c.opcoes ?? '').split(',').map(s => s.trim()).filter(Boolean) } : {}),
    }))

    setSalvando(true)
    try {
      await window.rh.salvarRequerimento({
        ...form,
        campos,
        usarAssinatura: !!form.usarAssinatura,
        campoAssinaturaId: form.usarAssinatura ? (form.campoAssinaturaId || 'assinatura') : '',
      })
      await carregar()
      fecharModal()
      onToast?.('Template salvo', form.nome)
    } catch (e) {
      onToast?.('Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(req) {
    if (!confirm(`Desativar "${req.nome}"?`)) return
    await window.rh.excluirRequerimento(req.id)
    await carregar()
    onToast?.('Template desativado', req.nome)
  }

  async function toggle(req) {
    await window.rh.toggleRequerimento(req.id, !req.ativo)
    await carregar()
    onToast?.(req.ativo ? 'Desativado' : 'Ativado', req.nome)
  }

  const form = modal?.form

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div className="page-title">Gerenciar Templates</div>
          <div className="breadcrumb">Início <span>›</span> Administração <span>›</span> Templates</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={novoRequerimento}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Importar template
          </button>
        </div>
      </div>

      <div className="content">
        <div className="manager-header">
          <div className="manager-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <div>
            <div className="manager-title">Templates cadastrados</div>
            <div className="manager-sub">
              Gerencie os modelos disponíveis no painel. Importe um arquivo{' '}
              <code style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', background: 'var(--surface2)', padding: '1px 6px', borderRadius: '4px' }}>.docx</code>{' '}
              para adicionar um novo tipo de documento.
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <div className="table-toolbar">
            <div className="section-title">
              {requerimentos.filter(r => r.ativo).length} template{requerimentos.filter(r => r.ativo).length !== 1 ? 's' : ''} ativo{requerimentos.filter(r => r.ativo).length !== 1 ? 's' : ''}
            </div>
          </div>

          {requerimentos.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <strong>Nenhum template cadastrado</strong>
              <p>Clique em "Importar template" para adicionar o primeiro.</p>
            </div>
          ) : (
            <table className="rh-table">
              <thead>
                <tr>
                  <th>Template</th>
                  <th>Categoria</th>
                  <th>Campos</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {requerimentos.map(req => (
                  <tr key={req.id} style={!req.ativo ? { opacity: .5 } : {}}>
                    <td>
                      <div className="table-name">{req.nome}</div>
                      <div className="table-file">{req.arquivo}</div>
                    </td>
                    <td>
                      {req.categoria
                        ? <span className="tag tag-category">{req.categoria}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                      }
                    </td>
                    <td>{req.campos.length}</td>
                    <td>
                      <span className={`tag ${req.ativo ? 'tag-active' : 'tag-inactive'}`}>
                        {req.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn" title="Editar" onClick={() => editarRequerimento(req)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button className="icon-btn" title={req.ativo ? 'Desativar' : 'Ativar'} onClick={() => toggle(req)}>
                          {req.ativo ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
                            </svg>
                          )}
                        </button>
                        <button className="icon-btn danger" title="Excluir" onClick={() => excluir(req)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── MODAL ── */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && fecharModal()}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                {modal.modo === 'novo' ? 'Novo template' : `Editar: ${form.nome || '...'}`}
              </div>
              <button className="icon-btn" onClick={fecharModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {/* Dados básicos */}
              <div className="form-row" style={{ marginBottom: 18 }}>
                <div>
                  <div className="form-label"><span className="required-dot"/>Nome</div>
                  <input className="form-input" value={form.nome} onChange={e => handleForm('nome', e.target.value)} placeholder="Ex: Solicitação de Licença"/>
                </div>
                <div>
                  <div className="form-label">Categoria</div>
                  <input className="form-input" value={form.categoria} onChange={e => handleForm('categoria', e.target.value)} placeholder="Ex: Benefícios"/>
                </div>
              </div>

              <div style={{ marginBottom: 22 }}>
                <div className="form-label"><span className="required-dot"/>Template .docx</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button className="btn btn-ghost" onClick={importarTemplate}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Selecionar arquivo
                  </button>
                  {form._nomeOriginal && (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: "'DM Mono', monospace" }}>
                      {form._nomeOriginal}
                    </span>
                  )}
                </div>
              </div>

              {/* Campos */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="form-label" style={{ margin: 0 }}>Campos do formulário</div>
                <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={addCampo}>+ Adicionar campo</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {form.campos.map((campo, i) => (
                  <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', background: 'var(--bg)' }}>
                    <div className="form-row" style={{ marginBottom: 8 }}>
                      <div>
                        <div className="form-label" style={{ fontSize: '10px', marginBottom: 4 }}>Label</div>
                        <input className="form-input" style={{ padding: '7px 10px', fontSize: '12px' }} value={campo.label} onChange={e => handleCampo(i, 'label', e.target.value)} placeholder="Nome visível do campo"/>
                      </div>
                      <div>
                        <div className="form-label" style={{ fontSize: '10px', marginBottom: 4 }}>ID (variável no .docx)</div>
                        <input className="form-input" style={{ padding: '7px 10px', fontSize: '12px', fontFamily: "'DM Mono', monospace" }} value={campo.id} onChange={e => handleCampo(i, 'id', e.target.value)} placeholder="nome_campo"/>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div>
                        <div className="form-label" style={{ fontSize: '10px', marginBottom: 4 }}>Tipo</div>
                        <select className="form-input" style={{ padding: '7px 10px', fontSize: '12px', width: 'auto' }} value={campo.tipo} onChange={e => handleCampo(i, 'tipo', e.target.value)}>
                          {TIPOS.map(t => <option key={t} value={t}>{TIPOS_LABEL[t] ?? t}</option>)}
                        </select>
                      </div>
                      {campo.tipo === 'text' && (
                        <div style={{ flex: 1 }}>
                          <div className="form-label" style={{ fontSize: '10px', marginBottom: 4 }}>Placeholder</div>
                          <input className="form-input" style={{ padding: '7px 10px', fontSize: '12px' }} value={campo.placeholder ?? ''} onChange={e => handleCampo(i, 'placeholder', e.target.value)} placeholder="Texto de ajuda (opcional)"/>
                        </div>
                      )}
                      {(campo.tipo === 'select' || campo.tipo === 'checkbox') && (
                        <div style={{ flex: 1 }}>
                          <div className="form-label" style={{ fontSize: '10px', marginBottom: 4 }}>Opções (separadas por vírgula)</div>
                          <input className="form-input" style={{ padding: '7px 10px', fontSize: '12px' }} value={campo.opcoes ?? ''} onChange={e => handleCampo(i, 'opcoes', e.target.value)} placeholder="Opção A, Opção B, Opção C"/>
                        </div>
                      )}
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: 18, whiteSpace: 'nowrap' }}>
                        <input type="checkbox" checked={!!campo.obrigatorio} onChange={e => handleCampo(i, 'obrigatorio', e.target.checked)} style={{ accentColor: 'var(--accent)' }}/>
                        Obrigatório
                      </label>
                      <button className="icon-btn danger" style={{ marginTop: 18 }} onClick={() => removeCampo(i)} title="Remover campo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Assinatura */}
              <div style={{ marginTop: 18, padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!form.usarAssinatura}
                    onChange={e => handleForm('usarAssinatura', e.target.checked)}
                    style={{ accentColor: 'var(--accent)', width: 15, height: 15 }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Incluir assinatura do usuário</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                      Preenche automaticamente com a assinatura configurada nas Configurações
                    </div>
                  </div>
                </label>
                {form.usarAssinatura && (
                  <div style={{ marginTop: 12 }}>
                    <div className="form-label" style={{ fontSize: '10px', marginBottom: 4 }}>ID da variável no .docx</div>
                    <input
                      className="form-input"
                      style={{ padding: '7px 10px', fontSize: '12px', fontFamily: "'DM Mono', monospace", maxWidth: 220 }}
                      value={form.campoAssinaturaId}
                      onChange={e => handleForm('campoAssinaturaId', e.target.value)}
                      placeholder="assinatura"
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 6 }}>
                      Use <code style={{ fontFamily: "'DM Mono', monospace", background: 'var(--surface2)', padding: '1px 5px', borderRadius: 3 }}>{'{{' + (form.campoAssinaturaId || 'assinatura') + '}}'}</code> no seu arquivo .docx
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={fecharModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
