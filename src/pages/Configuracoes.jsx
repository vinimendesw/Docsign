import { useEffect, useState } from 'react'
import Icon from '../components/Icon'

export default function Configuracoes({ onToast }) {
  const [config, setConfig] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [alterando, setAlterando] = useState(false)
  const [assinatura, setAssinatura] = useState('')
  const [salvandoAssinatura, setSalvandoAssinatura] = useState(false)

  const [loginCadastrado, setLoginCadastrado] = useState(false)
  const [loginUsuario, setLoginUsuario] = useState('')
  const [loginSenha, setLoginSenha] = useState('')
  const [loginConfirmarSenha, setLoginConfirmarSenha] = useState('')
  const [salvandoLogin, setSalvandoLogin] = useState(false)

  useEffect(() => {
    carregar()
    window.rh?.temLoginCadastrado().then(setLoginCadastrado).catch(() => {})
  }, [])

  async function carregar() {
    try {
      setCarregando(true)
      const dados = await window.rh.lerConfiguracoes()
      setConfig(dados)
      setAssinatura(dados.assinatura ?? '')
    } catch (e) {
      console.error(e)
    } finally {
      setCarregando(false)
    }
  }

  async function handleEscolherPasta() {
    setAlterando(true)
    try {
      const novoConfig = await window.rh.escolherPastaGerados()
      if (novoConfig) {
        setConfig(novoConfig)
        onToast?.('Pasta atualizada', novoConfig.pastaGerados)
      }
    } catch (e) {
      onToast?.('Erro', e?.message ?? 'Não foi possível alterar a pasta.')
    } finally {
      setAlterando(false)
    }
  }

  async function handleResetar() {
    try {
      const novoConfig = await window.rh.resetarPastaGerados()
      setConfig(novoConfig)
      onToast?.('Pasta restaurada', 'Usando pasta padrão do sistema.')
    } catch (e) {
      onToast?.('Erro', e?.message ?? 'Não foi possível restaurar.')
    }
  }

  async function handleSalvarAssinatura() {
    setSalvandoAssinatura(true)
    try {
      const novoConfig = await window.rh.salvarAssinatura(assinatura)
      setConfig(novoConfig)
      onToast?.('Assinatura salva', 'Configuração atualizada com sucesso.')
    } catch (e) {
      onToast?.('Erro', e?.message ?? 'Não foi possível salvar a assinatura.')
    } finally {
      setSalvandoAssinatura(false)
    }
  }

  async function handleAbrirPasta() {
    try {
      await window.rh.abrirPastaGerados()
    } catch (e) {
      onToast?.('Erro', e?.message ?? 'Não foi possível abrir a pasta.')
    }
  }

  async function handleCadastrarLogin() {
    if (!loginUsuario.trim()) {
      onToast?.('Erro', 'Informe um usuário.')
      return
    }
    if (loginSenha.length < 6) {
      onToast?.('Erro', 'A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (loginSenha !== loginConfirmarSenha) {
      onToast?.('Erro', 'As senhas não conferem.')
      return
    }

    setSalvandoLogin(true)
    try {
      await window.rh.cadastrarLogin(loginUsuario.trim(), loginSenha)
      setLoginCadastrado(true)
      setLoginSenha('')
      setLoginConfirmarSenha('')
      onToast?.('Login salvo', 'O sistema agora exigirá login ao abrir.')
    } catch (e) {
      onToast?.('Erro', e?.message ?? 'Não foi possível salvar o login.')
    } finally {
      setSalvandoLogin(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div className="page-title">Configurações</div>
          <div className="breadcrumb">Início <span>›</span> Configurações</div>
        </div>
      </div>

      <div className="content">
        {carregando ? (
          <div className="empty-state"><p>Carregando...</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>

            {/* Pasta de saída */}
            <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'var(--accent)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Icon name="folder" size={18} color="#141412" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    Pasta de documentos gerados
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                    Local onde os arquivos <strong>.docx</strong> serão salvos após a geração
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 20px' }}>
                {/* Caminho atual */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                    Caminho atual
                  </div>
                  <div style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <Icon name="folder" size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      wordBreak: 'break-all',
                      flex: 1
                    }}>
                      {config?.pastaGerados ?? '—'}
                    </span>
                    {config?.personalizada && (
                      <span className="tag tag-active" style={{ fontSize: '10px', flexShrink: 0 }}>Personalizada</span>
                    )}
                    {!config?.personalizada && (
                      <span className="tag tag-category" style={{ fontSize: '10px', flexShrink: 0 }}>Padrão</span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleEscolherPasta}
                    disabled={alterando}
                  >
                    <Icon name="folder" size={14} />
                    {alterando ? 'Aguarde...' : 'Alterar pasta'}
                  </button>

                  <button
                    className="btn btn-ghost"
                    onClick={handleAbrirPasta}
                  >
                    <Icon name="external-link" size={14} />
                    Abrir no Explorer
                  </button>

                  {config?.personalizada && (
                    <button
                      className="btn btn-ghost"
                      onClick={handleResetar}
                      style={{ color: 'var(--danger)' }}
                    >
                      <Icon name="refresh" size={14} />
                      Restaurar padrão
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Assinatura */}
            <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'var(--accent)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Icon name="edit" size={18} color="#141412" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    Assinatura do usuário
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                    Nome ou identificação que aparecerá nos documentos gerados
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 20px' }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                    Nome / Assinatura
                  </div>
                  <textarea
                    className="form-textarea"
                    placeholder="Ex: João da Silva&#10;Analista de RH"
                    value={assinatura}
                    onChange={e => setAssinatura(e.target.value)}
                    rows={3}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleSalvarAssinatura}
                  disabled={salvandoAssinatura}
                >
                  <Icon name="check" size={14} />
                  {salvandoAssinatura ? 'Salvando...' : 'Salvar assinatura'}
                </button>
              </div>
            </div>

            {/* Login de acesso */}
            <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'var(--accent)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Icon name="lock" size={18} color="#141412" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    Login de acesso
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                    Opcional: exige usuário e senha para abrir o sistema
                  </div>
                </div>
                {loginCadastrado && (
                  <span className="tag tag-active" style={{ fontSize: '10px', flexShrink: 0, marginLeft: 'auto' }}>Ativo</span>
                )}
              </div>

              <div style={{ padding: '16px 20px' }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                    Usuário
                  </div>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Ex: admin"
                    value={loginUsuario}
                    onChange={e => setLoginUsuario(e.target.value)}
                  />
                </div>

                <div className="form-row" style={{ marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                      Senha
                    </div>
                    <input
                      className="form-input"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={loginSenha}
                      onChange={e => setLoginSenha(e.target.value)}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                      Confirmar senha
                    </div>
                    <input
                      className="form-input"
                      type="password"
                      placeholder="Repita a senha"
                      value={loginConfirmarSenha}
                      onChange={e => setLoginConfirmarSenha(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleCadastrarLogin}
                  disabled={salvandoLogin}
                >
                  <Icon name="check" size={14} />
                  {salvandoLogin ? 'Salvando...' : loginCadastrado ? 'Atualizar login' : 'Cadastrar login'}
                </button>
              </div>
            </div>

            {/* Info card */}
            <div className="info-card">
              <div className="info-card-title">
                <Icon name="info" size={14} />
                Sobre a pasta de destino
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <p style={{ margin: '0 0 8px' }}>
                  Ao gerar um documento, o arquivo <strong style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px' }}>.docx</strong> é
                  salvo nesta pasta com um nome único baseado no modelo e na data/hora.
                </p>
                <p style={{ margin: 0 }}>
                  A pasta padrão fica dentro do diretório de dados do aplicativo. Você pode alterar para
                  qualquer pasta de fácil acesso, como a área de trabalho ou uma pasta de rede compartilhada.
                </p>
              </div>
            </div>

            {/* Versão */}
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              paddingTop: 8
            }}>
              Docsign · Versão 1.0.0
            </div>
          </div>
        )}
      </div>
    </>
  )
}
