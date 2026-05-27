import { useEffect, useState } from 'react'

export default function Configuracoes({ onToast }) {
  const [config, setConfig] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [alterando, setAlterando] = useState(false)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    try {
      setCarregando(true)
      const dados = await window.rh.lerConfiguracoes()
      setConfig(dados)
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

  async function handleAbrirPasta() {
    try {
      await window.rh.abrirPastaGerados()
    } catch (e) {
      onToast?.('Erro', e?.message ?? 'Não foi possível abrir a pasta.')
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="#141412" strokeWidth="2.5" width="18" height="18">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" width="14" height="14" style={{ flexShrink: 0 }}>
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    {alterando ? 'Aguarde...' : 'Alterar pasta'}
                  </button>

                  <button
                    className="btn btn-ghost"
                    onClick={handleAbrirPasta}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Abrir no Explorer
                  </button>

                  {config?.personalizada && (
                    <button
                      className="btn btn-ghost"
                      onClick={handleResetar}
                      style={{ color: 'var(--danger)' }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <polyline points="23 4 23 10 17 10"/>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                      </svg>
                      Restaurar padrão
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Info card */}
            <div className="info-card">
              <div className="info-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Sobre a pasta de destino
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <p style={{ margin: '0 0 8px' }}>
                  Ao gerar um documento, o arquivo <strong style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px' }}>.docx</strong> é
                  salvo nesta pasta com um nome único baseado no requerimento e na data/hora.
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
              RHdoc · Versão 1.0.0
            </div>
          </div>
        )}
      </div>
    </>
  )
}
