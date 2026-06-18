import { useState, useEffect } from 'react'
import Painel from './pages/Painel'
import Formulario from './pages/Formulario'
import Gerenciador from './pages/Gerenciador'
import Historico from './pages/Historico'
import Configuracoes from './pages/Configuracoes'
import GeracaoEmMassa from './pages/GeracaoEmMassa'
import Usuarios from './pages/Usuarios'
import Login from './pages/Login'
import Toast from './components/Toast'

export default function App() {
  const [pagina, setPagina] = useState('painel')
  const [sidebarAberta, setSidebarAberta] = useState(true)
  const [requerimentoSelecionado, setRequerimentoSelecionado] = useState(null)
  const [toast, setToast] = useState(null)
  const [totalAtivos, setTotalAtivos] = useState(0)
  const [updateAvailable, setUpdateAvailable] = useState(null)   // { version }
  const [updateReady, setUpdateReady] = useState(null)           // { version }
  const [updateProgress, setUpdateProgress] = useState(null)     // 0-100 ou null
  const [usuarioLogado, setUsuarioLogado] = useState(null)
  const [verificandoSessao, setVerificandoSessao] = useState(true)

  // Verifica se já existe uma sessão ativa no processo main (ex: após reload do renderer)
  useEffect(() => {
    if (!window.rh) {
      setVerificandoSessao(false)
      return
    }
    window.rh.usuarioAtual()
      .then(u => setUsuarioLogado(u))
      .catch(() => {})
      .finally(() => setVerificandoSessao(false))
  }, [])

  useEffect(() => {
    if (window.rh && usuarioLogado) {
      window.rh.listarRequerimentos().then(lista => {
        setTotalAtivos(lista.filter(r => r.ativo).length)
      }).catch(() => {})
    }
  }, [pagina, usuarioLogado])

  function mostrarToast(titulo, sub) {
    setToast({ titulo, sub })
    setTimeout(() => setToast(null), 3200)
  }

  async function handleLogout() {
    try {
      await window.rh.logout()
    } catch {}
    setUsuarioLogado(null)
    setPagina('painel')
  }

  // Escuta eventos do auto-updater (só chegam em produção)
  useEffect(() => {
    if (!window.rh) return
    window.rh.onUpdateAvailable?.((info) => {
      setUpdateAvailable(info)
      setUpdateProgress(0)
    })
    window.rh.onUpdateProgress?.((prog) => {
      setUpdateProgress(prog.percent)
    })
    window.rh.onUpdateDownloaded?.((info) => {
      setUpdateReady(info)
      setUpdateProgress(null)
    })
  }, [])

  function abrirFormulario(req) {
    setRequerimentoSelecionado(req)
    setPagina('formulario')
  }

  function irPara(p) {
    setPagina(p)
    if (p !== 'formulario') setRequerimentoSelecionado(null)
  }

  const navPrincipal = [
    { id: 'painel', label: 'Painel', badge: totalAtivos > 0 ? totalAtivos : null, icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    )},
    { id: 'historico', label: 'Histórico', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    )},
    { id: 'geracao-em-massa', label: 'Geração em massa', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <rect x="2" y="3" width="20" height="5" rx="1"/>
        <rect x="2" y="10" width="20" height="5" rx="1"/>
        <rect x="2" y="17" width="20" height="5" rx="1"/>
      </svg>
    )},
  ]

  const ehAdmin = usuarioLogado?.papel === 'admin'

  const navAdmin = [
    { id: 'gerenciador', label: 'Gerenciar templates', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    )},
    ...(ehAdmin ? [{ id: 'usuarios', label: 'Usuários', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )}] : []),
    { id: 'configuracoes', label: 'Configurações', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    )},
  ]

  const paginaAtiva = pagina === 'formulario' ? 'formulario' : pagina

  if (verificandoSessao) {
    return <div style={{ height: '100vh', background: 'var(--sidebar-bg)' }} />
  }

  if (!usuarioLogado) {
    return <Login onLogin={setUsuarioLogado} />
  }

  return (
    <div className="app">
      {/* ── SIDEBAR ── */}
      <nav className={`sidebar${sidebarAberta ? '' : ' collapsed'}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" color="#141412">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div className="logo-text">
            Docsign
            <small>Documentos</small>
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarAberta(a => !a)} title={sidebarAberta ? 'Recolher menu' : 'Expandir menu'}>
            {sidebarAberta ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Principal</div>
          {navPrincipal.map(item => (
            <button
              key={item.id}
              className={`nav-item${paginaAtiva === item.id ? ' active' : ''}`}
              onClick={() => irPara(item.id)}
              title={!sidebarAberta ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Administração</div>
          {navAdmin.map(item => (
            <button
              key={item.id}
              className={`nav-item${paginaAtiva === item.id ? ' active' : ''}`}
              onClick={() => irPara(item.id)}
              title={!sidebarAberta ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user" title="Sair" onClick={handleLogout} style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div className="avatar">{(usuarioLogado.nome || '?').slice(0, 2).toUpperCase()}</div>
              <div className="user-info">
                <div className="user-name">{usuarioLogado.nome}</div>
                <div className="user-role">{usuarioLogado.papel === 'admin' ? 'Administrador' : 'Operador'}</div>
              </div>
            </div>
            {sidebarAberta && (
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2" width="14" height="14" style={{ flexShrink: 0 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            )}
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="main">

        {/* ── Banner: download em andamento ── */}
        {updateAvailable && !updateReady && (
          <div className="update-banner update-banner--downloading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/>
            </svg>
            <span>
              Nova versão <strong>v{updateAvailable.version}</strong> disponível
              {updateProgress !== null && updateProgress > 0
                ? ` — baixando… ${updateProgress}%`
                : ' — baixando em segundo plano…'
              }
            </span>
            {updateProgress !== null && (
              <div className="update-progress-bar">
                <div className="update-progress-fill" style={{ width: `${updateProgress}%` }} />
              </div>
            )}
          </div>
        )}

        {/* ── Banner: pronto para instalar ── */}
        {updateReady && (
          <div className="update-banner update-banner--ready">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>
              Versão <strong>v{updateReady.version}</strong> baixada e pronta para instalar.
            </span>
            <div className="update-actions">
              <button className="update-btn update-btn--primary" onClick={() => window.rh.installUpdate()}>
                Instalar agora
              </button>
              <button className="update-btn update-btn--ghost" onClick={() => setUpdateReady(null)}>
                Mais tarde
              </button>
            </div>
          </div>
        )}

        {pagina === 'painel' && (
          <Painel onPreencher={abrirFormulario} onGerenciar={() => irPara('gerenciador')} />
        )}
        {pagina === 'formulario' && requerimentoSelecionado && (
          <Formulario
            requerimento={requerimentoSelecionado}
            onCancelar={() => irPara('painel')}
            onToast={mostrarToast}
          />
        )}
        {pagina === 'gerenciador' && (
          <Gerenciador onToast={mostrarToast} />
        )}
        {pagina === 'usuarios' && ehAdmin && (
          <Usuarios usuarioLogado={usuarioLogado} onToast={mostrarToast} />
        )}
        {pagina === 'historico' && (
          <Historico onToast={mostrarToast} />
        )}
        {pagina === 'configuracoes' && (
          <Configuracoes onToast={mostrarToast} />
        )}
        {pagina === 'geracao-em-massa' && (
          <GeracaoEmMassa onToast={mostrarToast} />
        )}
      </main>

      {toast && <Toast titulo={toast.titulo} sub={toast.sub} />}
    </div>
  )
}
