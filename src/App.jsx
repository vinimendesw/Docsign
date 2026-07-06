import { useState, useEffect } from 'react'
import Painel from './pages/Painel'
import Formulario from './pages/Formulario'
import Gerenciador from './pages/Gerenciador'
import Historico from './pages/Historico'
import Configuracoes from './pages/Configuracoes'
import Toast from './components/Toast'
import Icon from './components/Icon'
import TelaLogin from './components/TelaLogin'

export default function App() {
  const [pagina, setPagina] = useState('painel')
  const [sidebarAberta, setSidebarAberta] = useState(true)
  const [requerimentoSelecionado, setRequerimentoSelecionado] = useState(null)
  const [toast, setToast] = useState(null)
  const [totalAtivos, setTotalAtivos] = useState(0)
  const [updateAvailable, setUpdateAvailable] = useState(null)   // { version }
  const [updateReady, setUpdateReady] = useState(null)           // { version }
  const [updateProgress, setUpdateProgress] = useState(null)     // 0-100 ou null

  const [precisaLogin, setPrecisaLogin] = useState(null) // null = verificando | true | false
  const [autenticado, setAutenticado] = useState(false)

  useEffect(() => {
    if (!window.rh) {
      setPrecisaLogin(false)
      return
    }
    window.rh.temLoginCadastrado()
      .then(setPrecisaLogin)
      .catch(() => setPrecisaLogin(false))
  }, [])

  useEffect(() => {
    if (window.rh) {
      window.rh.listarRequerimentos().then(lista => {
        setTotalAtivos(lista.filter(r => r.ativo).length)
      }).catch(() => {})
    }
  }, [pagina])

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

  function mostrarToast(titulo, sub) {
    setToast({ titulo, sub })
    setTimeout(() => setToast(null), 3200)
  }

  function abrirFormulario(req) {
    setRequerimentoSelecionado(req)
    setPagina('formulario')
  }

  function irPara(p) {
    setPagina(p)
    if (p !== 'formulario') setRequerimentoSelecionado(null)
  }

  const navPrincipal = [
    { id: 'painel', label: 'Painel', badge: totalAtivos > 0 ? totalAtivos : null, icon: <Icon name="grid" size={16} /> },
    { id: 'historico', label: 'Histórico', icon: <Icon name="clock" size={16} /> },
  ]

  const navAdmin = [
    { id: 'gerenciador', label: 'Gerenciar modelos', icon: <Icon name="edit" size={16} /> },
    { id: 'configuracoes', label: 'Configurações', icon: <Icon name="settings" size={16} /> },
  ]

  const paginaAtiva = pagina === 'formulario' ? 'formulario' : pagina

  if (precisaLogin === null) {
    return <div style={{ height: '100vh', background: 'var(--sidebar-bg)' }} />
  }

  if (precisaLogin && !autenticado) {
    return <TelaLogin onSuccess={() => setAutenticado(true)} />
  }

  return (
    <div className="app">
      {/* ── SIDEBAR ── */}
      <nav className={`sidebar${sidebarAberta ? '' : ' collapsed'}`}>
        <div className="sidebar-logo">
          <button
            className="logo-mark"
            onClick={() => setSidebarAberta(a => !a)}
            title={sidebarAberta ? 'Recolher menu' : 'Expandir menu'}
          >
            <Icon name="document-text" size={16} color="#141412" />
          </button>
          <div className="logo-text">
            Docsign
            <small>Documentos</small>
          </div>
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
          <div className="sidebar-user">
            <div className="avatar">RH</div>
            <div className="user-info">
              <div className="user-name">Docsign</div>
              <div className="user-role">Administrador</div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="main">

        {/* ── Banner: download em andamento ── */}
        {updateAvailable && !updateReady && (
          <div className="update-banner update-banner--downloading">
            <Icon name="arrow-down" size={16} />
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
            <Icon name="check-circle" size={16} />
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
        {pagina === 'historico' && (
          <Historico onToast={mostrarToast} />
        )}
        {pagina === 'configuracoes' && (
          <Configuracoes onToast={mostrarToast} />
        )}
      </main>

      {toast && <Toast titulo={toast.titulo} sub={toast.sub} />}
    </div>
  )
}
