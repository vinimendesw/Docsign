import { useEffect, useState } from 'react'

export default function Usuarios({ usuarioLogado, onToast }) {
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [resetId, setResetId] = useState(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [novo, setNovo] = useState({ nome: '', login: '', senha: '', papel: 'operador' })
  const [salvando, setSalvando] = useState(false)
  const [erroModal, setErroModal] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    try {
      setCarregando(true)
      const lista = await window.rh.listarUsuarios()
      setUsuarios(lista)
    } catch (e) {
      onToast?.('Erro', e?.message ?? 'Não foi possível carregar os usuários.')
    } finally {
      setCarregando(false)
    }
  }

  function abrirNovo() {
    setNovo({ nome: '', login: '', senha: '', papel: 'operador' })
    setErroModal('')
    setModalAberto(true)
  }

  async function handleCriar(e) {
    e.preventDefault()
    setSalvando(true)
    setErroModal('')
    try {
      await window.rh.criarUsuario(novo)
      setModalAberto(false)
      onToast?.('Usuário criado', `${novo.nome} agora pode acessar o sistema.`)
      carregar()
    } catch (e) {
      setErroModal(e?.message ?? 'Não foi possível criar o usuário.')
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivo(usuario) {
    try {
      await window.rh.atualizarUsuario(usuario.id, { ativo: !usuario.ativo })
      onToast?.(usuario.ativo ? 'Usuário desativado' : 'Usuário ativado', usuario.nome)
      carregar()
    } catch (e) {
      onToast?.('Erro', e?.message ?? 'Não foi possível atualizar o usuário.')
    }
  }

  async function alternarPapel(usuario) {
    const novoPapel = usuario.papel === 'admin' ? 'operador' : 'admin'
    try {
      await window.rh.atualizarUsuario(usuario.id, { papel: novoPapel })
      onToast?.('Papel atualizado', `${usuario.nome} agora é ${novoPapel === 'admin' ? 'administrador' : 'operador'}.`)
      carregar()
    } catch (e) {
      onToast?.('Erro', e?.message ?? 'Não foi possível atualizar o papel.')
    }
  }

  async function handleResetarSenha(e) {
    e.preventDefault()
    if (!novaSenha || novaSenha.length < 4) {
      onToast?.('Erro', 'A nova senha deve ter ao menos 4 caracteres.')
      return
    }
    try {
      await window.rh.alterarSenha(resetId, novaSenha)
      onToast?.('Senha redefinida', 'O usuário já pode acessar com a nova senha.')
      setResetId(null)
      setNovaSenha('')
    } catch (e) {
      onToast?.('Erro', e?.message ?? 'Não foi possível redefinir a senha.')
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div className="page-title">Usuários</div>
          <div className="breadcrumb">Início <span>›</span> Usuários</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={abrirNovo}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo usuário
          </button>
        </div>
      </div>

      <div className="content">
        {carregando ? (
          <div className="empty-state"><p>Carregando...</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="rh-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Login</th>
                  <th>Papel</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="table-name">{u.nome}</div>
                      {u.id === usuarioLogado?.id && <div className="table-file">Você</div>}
                    </td>
                    <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{u.login}</td>
                    <td>
                      <span className={`tag ${u.papel === 'admin' ? 'tag-category' : 'tag-inactive'}`}>
                        {u.papel === 'admin' ? 'Administrador' : 'Operador'}
                      </span>
                    </td>
                    <td>
                      <span className={`tag ${u.ativo ? 'tag-active' : 'tag-inactive'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn" title="Redefinir senha" onClick={() => { setResetId(u.id); setNovaSenha('') }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </button>
                        <button className="icon-btn" title={u.papel === 'admin' ? 'Tornar operador' : 'Tornar administrador'} onClick={() => alternarPapel(u)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                          </svg>
                        </button>
                        <button
                          className={`icon-btn ${u.ativo ? 'danger' : ''}`}
                          title={u.ativo ? 'Desativar' : 'Ativar'}
                          onClick={() => toggleAtivo(u)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <circle cx="12" cy="12" r="10"/>
                            {u.ativo
                              ? <line x1="8" y1="12" x2="16" y2="12"/>
                              : <polyline points="9 12 12 15 16 9"/>}
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: novo usuário ── */}
      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div className="modal-title">Novo usuário</div>
            </div>
            <form onSubmit={handleCriar}>
              <div className="modal-body">
                {erroModal && <div className="alert alert-danger">{erroModal}</div>}

                <div className="form-group">
                  <label className="form-label">Nome completo</label>
                  <input className="form-input" value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Login</label>
                  <input className="form-input" value={novo.login} onChange={e => setNovo({ ...novo, login: e.target.value })} placeholder="ex: maria.silva" />
                </div>
                <div className="form-group">
                  <label className="form-label">Senha provisória</label>
                  <input type="password" className="form-input" value={novo.senha} onChange={e => setNovo({ ...novo, senha: e.target.value })} placeholder="mín. 4 caracteres" />
                </div>
                <div className="form-group">
                  <label className="form-label">Papel</label>
                  <select className="form-input" value={novo.papel} onChange={e => setNovo({ ...novo, papel: e.target.value })}>
                    <option value="operador">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Criar usuário'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: redefinir senha ── */}
      {resetId && (
        <div className="modal-overlay" onClick={() => setResetId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div className="modal-title">Redefinir senha</div>
            </div>
            <form onSubmit={handleResetarSenha}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nova senha</label>
                  <input type="password" className="form-input" autoFocus value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="mín. 4 caracteres" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setResetId(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Redefinir</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
