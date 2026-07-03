import { useState } from 'react'
import Icon from './Icon'

export default function TelaLogin({ onSuccess }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [validando, setValidando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!usuario.trim() || !senha) {
      setErro('Preencha usuário e senha.')
      return
    }

    setValidando(true)
    setErro('')
    try {
      const resultado = await window.rh.validarLogin(usuario.trim(), senha)
      if (resultado.ok) {
        onSuccess?.()
      } else {
        setErro(resultado.erro ?? 'Usuário ou senha inválidos.')
      }
    } catch (err) {
      setErro(err?.message ?? 'Não foi possível validar o login.')
    } finally {
      setValidando(false)
    }
  }

  return (
    <div style={{
      height: '100vh', width: '100%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--sidebar-bg)',
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: 340,
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="lock" size={20} color="#141412" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Docsign</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Entre com seu usuário e senha</div>
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
            Usuário
          </div>
          <input
            className="form-input"
            type="text"
            autoFocus
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
          />
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
            Senha
          </div>
          <input
            className="form-input"
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
          />
        </div>

        {erro && <div className="form-error">{erro}</div>}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={validando}
          style={{ justifyContent: 'center' }}
        >
          <Icon name="check" size={14} />
          {validando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
