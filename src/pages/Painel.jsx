import { useEffect, useState } from 'react'
import RequerimentoCard from '../components/RequerimentoCard'

export default function Painel({ onPreencher, onGerenciar }) {
  const [requerimentos, setRequerimentos] = useState([])
  const [filtro, setFiltro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [docsMes, setDocsMes] = useState(0)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    try {
      setCarregando(true)
      const lista = await window.rh.listarRequerimentos()
      setRequerimentos(lista.filter(r => r.ativo))
    } catch (e) {
      console.error(e)
    } finally {
      setCarregando(false)
    }
  }

  const filtrados = requerimentos.filter(r =>
    (r.nome + ' ' + (r.categoria || '')).toLowerCase().includes(filtro.toLowerCase())
  )

  const categorias = [...new Set(requerimentos.map(r => r.categoria).filter(Boolean))].length

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div className="page-title">Painel de Requerimentos</div>
          <div className="breadcrumb">Início <span>›</span> Painel</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={onGerenciar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Gerenciar
          </button>
        </div>
      </div>

      <div className="content">
        <div className="stats-row">
          <div className="stat-card">
            <div>
              <div className="stat-value">{requerimentos.length}</div>
              <div className="stat-label">Requerimentos ativos</div>
            </div>
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-value">{docsMes}</div>
              <div className="stat-label">Documentos gerados este mês</div>
            </div>
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-value">{categorias}</div>
              <div className="stat-label">Categorias cadastradas</div>
            </div>
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="section-header">
          <div className="section-title">Documentos disponíveis</div>
          <div className="section-meta">{requerimentos.length} requerimento{requerimentos.length !== 1 ? 's' : ''}</div>
        </div>

        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar requerimento..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>

        {carregando ? (
          <div className="empty-state">
            <p>Carregando...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <strong>{filtro ? 'Nenhum resultado' : 'Nenhum requerimento cadastrado'}</strong>
            <p>{filtro ? 'Tente outro termo de busca.' : 'Acesse "Gerenciar templates" para importar o primeiro template .docx.'}</p>
          </div>
        ) : (
          <div className="reqs-grid">
            {filtrados.map(req => (
              <RequerimentoCard key={req.id} requerimento={req} onPreencher={onPreencher} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
