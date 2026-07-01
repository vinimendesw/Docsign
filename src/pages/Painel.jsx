import { useEffect, useState } from 'react'
import RequerimentoCard from '../components/RequerimentoCard'
import Icon from '../components/Icon'

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
          <div className="page-title">Painel de Documentos</div>
          <div className="breadcrumb">Início <span>›</span> Painel</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={onGerenciar}>
            <Icon name="edit" size={14} />
            Gerenciar
          </button>
        </div>
      </div>

      <div className="content">
        <div className="stats-row">
          <div className="stat-card">
            <div>
              <div className="stat-value">{requerimentos.length}</div>
              <div className="stat-label">Modelos ativos</div>
            </div>
            <div className="stat-icon">
              <Icon name="document" size={16} />
            </div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-value">{docsMes}</div>
              <div className="stat-label">Documentos gerados este mês</div>
            </div>
            <div className="stat-icon">
              <Icon name="activity" size={16} />
            </div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-value">{categorias}</div>
              <div className="stat-label">Categorias cadastradas</div>
            </div>
            <div className="stat-icon">
              <Icon name="folder" size={16} />
            </div>
          </div>
        </div>

        <div className="section-header">
          <div className="section-title">Documentos disponíveis</div>
          <div className="section-meta">{requerimentos.length} modelo{requerimentos.length !== 1 ? 's' : ''}</div>
        </div>

        <div className="search-bar">
          <Icon name="search" size={15} />
          <input
            type="text"
            placeholder="Buscar modelo..."
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
            <Icon name="document" size={40} />
            <strong>{filtro ? 'Nenhum resultado' : 'Nenhum modelo cadastrado'}</strong>
            <p>{filtro ? 'Tente outro termo de busca.' : 'Acesse "Gerenciar modelos" para importar o primeiro modelo .docx.'}</p>
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
