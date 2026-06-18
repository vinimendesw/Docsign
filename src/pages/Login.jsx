import { useState } from 'react'

export default function Login({ onLogin }) {
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!login.trim() || !senha) {
      setErro('Informe usuário e senha.')
      return
    }

    setEntrando(true)
    setErro('')
    try {
      const usuario = await window.rh.login(login.trim(), senha)
      onLogin?.(usuario)
    } catch (e) {
      setErro(e?.message ?? 'Não foi possível entrar.')
    } finally {
      setEntrando(false)
    }
  }

  return (
    <div style={{
      height: '100vh', width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--sidebar-bg)',
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '32px 28px',
        animation: 'fadeUp .3s ease both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#141412" strokeWidth="2.5" width="18" height="18">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-.3px' }}>Docsign</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Entrar no sistema</div>
          </div>
        </div>

        {erro && <div className="alert alert-danger">{erro}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuário</label>
            <input
              type="text"
              className="form-input"
              autoFocus
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="seu.usuario"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={entrando}>
            {entrando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
