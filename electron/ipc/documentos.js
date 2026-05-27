const { ipcMain, app, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const PizZip = require('pizzip')
const Docxtemplater = require('docxtemplater')
const { getDb } = require('./db')
const { getPastaGerados } = require('./settings')

ipcMain.handle('rh:gerar-documento', (_, requerimentoId, dados) => {
  const db = getDb()
  const userData = app.getPath('userData')

  const req = db.prepare('SELECT * FROM requerimentos WHERE id = ?').get(requerimentoId)
  if (!req) throw new Error('Requerimento não encontrado')

  const templatePath = path.join(userData, 'templates', req.arquivo)
  if (!fs.existsSync(templatePath)) throw new Error('Template não encontrado: ' + req.arquivo)

  const content = fs.readFileSync(templatePath, 'binary')
  const zip = new PizZip(content)

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
    nullGetter: () => '',
  })

  const campos = JSON.parse(req.campos)
  const dadosFormatados = {}

  for (const campo of campos) {
    const v = dados[campo.id]

    if (typeof v === 'boolean') {
      dadosFormatados[campo.id] = v ? 'Sim' : 'Não'
    } else if (v === undefined || v === null) {
      dadosFormatados[campo.id] = ''
    } else if ((campo.tipo === 'date' || campo.tipo === 'data_hoje') && String(v).includes('-')) {
      // Converte YYYY-MM-DD → DD/MM/YYYY para o documento
      const [year, month, day] = String(v).split('-')
      dadosFormatados[campo.id] = `${day}/${month}/${year}`
    } else {
      dadosFormatados[campo.id] = String(v)
    }
  }

  try {
    doc.render(dadosFormatados)
  } catch (err) {
    if (err.properties && Array.isArray(err.properties.errors)) {
      const detalhes = err.properties.errors
        .map(e => e.properties?.explanation || e.message)
        .join(' | ')
      throw new Error('Erro no template .docx: ' + detalhes)
    }
    throw err
  }

  const buffer = doc.getZip().generate({ type: 'nodebuffer' })

  // Usa pasta configurada pelo usuário (ou padrão)
  const pastaDestino = getPastaGerados()
  fs.mkdirSync(pastaDestino, { recursive: true })

  const nomeArquivo = `${requerimentoId}_${Date.now()}.docx`
  const destino = path.join(pastaDestino, nomeArquivo)

  fs.writeFileSync(destino, buffer)

  // Armazena caminho completo para facilitar abertura no histórico
  db.prepare(`
    INSERT INTO documentos_gerados (requerimento_id, dados, arquivo_gerado)
    VALUES (?, ?, ?)
  `).run(requerimentoId, JSON.stringify(dados), destino)

  return destino
})

ipcMain.handle('rh:abrir-documento', (_, caminho) => {
  if (!fs.existsSync(caminho)) throw new Error('Arquivo não encontrado: ' + caminho)
  shell.openPath(caminho)
  return { ok: true }
})

ipcMain.handle('rh:imprimir-documento', (_, caminho) => {
  if (!fs.existsSync(caminho)) throw new Error('Arquivo não encontrado: ' + caminho)
  shell.openPath(caminho)
  return { ok: true }
})

ipcMain.handle('rh:listar-historico', () => {
  const db = getDb()
  const rows = db.prepare(`
    SELECT
      dg.id,
      dg.requerimento_id,
      dg.dados,
      dg.arquivo_gerado,
      dg.gerado_em,
      r.nome  AS requerimento_nome,
      r.categoria
    FROM documentos_gerados dg
    LEFT JOIN requerimentos r ON r.id = dg.requerimento_id
    ORDER BY dg.gerado_em DESC
    LIMIT 200
  `).all()

  return rows.map(r => ({
    ...r,
    dados: (() => { try { return JSON.parse(r.dados) } catch { return {} } })(),
    existe: fs.existsSync(r.arquivo_gerado),
  }))
})

ipcMain.handle('rh:listar-documentos-gerados', (_, requerimentoId) => {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM documentos_gerados WHERE requerimento_id = ? ORDER BY gerado_em DESC LIMIT 20
  `).all(requerimentoId)
  return rows.map(r => ({ ...r, dados: JSON.parse(r.dados) }))
})

// ── Geração em massa ────────────────────────────────────────────────────────

/** Retorna um array JSON de exemplo com 2 registros, baseado nos campos do requerimento */
ipcMain.handle('rh:modelo-json-em-massa', (_, requerimentoId) => {
  const db = getDb()
  const req = db.prepare('SELECT * FROM requerimentos WHERE id = ?').get(requerimentoId)
  if (!req) throw new Error('Requerimento não encontrado')

  const campos = JSON.parse(req.campos)

  function valorExemplo(campo, indice) {
    const sufixo = indice === 1 ? '' : ` ${indice}`
    switch (campo.tipo) {
      case 'text':      return `${campo.label}${sufixo}`
      case 'textarea':  return `Texto de exemplo para ${campo.label}${sufixo}`
      case 'number':    return indice
      case 'date':      return indice === 1 ? '2025-01-15' : '2025-06-30'
      case 'data_hoje': return new Date().toISOString().split('T')[0]
      case 'boolean':   return false
      case 'cpf':       return indice === 1 ? '000.000.000-01' : '000.000.000-02'
      case 'select':    return Array.isArray(campo.opcoes) && campo.opcoes.length > 0
                          ? campo.opcoes[0]
                          : 'opcao'
      default:          return `${campo.label}${sufixo}`
    }
  }

  const modelo = [1, 2].map(i =>
    Object.fromEntries(campos.map(c => [c.id, valorExemplo(c, i)]))
  )

  return modelo
})

/** Abre dialog para o usuário selecionar um arquivo .json e retorna o array parseado */
ipcMain.handle('rh:importar-json', async () => {
  const { dialog } = require('electron')
  const result = await dialog.showOpenDialog({
    title: 'Selecionar arquivo JSON',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  })
  if (result.canceled || !result.filePaths.length) return null
  const conteudo = fs.readFileSync(result.filePaths[0], 'utf-8')
  const dados = JSON.parse(conteudo)
  if (!Array.isArray(dados)) throw new Error('O arquivo JSON deve conter um array de objetos.')
  return dados
})

/** Gera um documento para cada registro do array e retorna um relatório de resultados */
ipcMain.handle('rh:gerar-documentos-em-massa', (_, requerimentoId, registros) => {
  const db = getDb()
  const userData = app.getPath('userData')

  if (!Array.isArray(registros) || registros.length === 0)
    throw new Error('Nenhum registro fornecido.')

  const req = db.prepare('SELECT * FROM requerimentos WHERE id = ?').get(requerimentoId)
  if (!req) throw new Error('Requerimento não encontrado')

  const templatePath = path.join(userData, 'templates', req.arquivo)
  if (!fs.existsSync(templatePath)) throw new Error('Template não encontrado: ' + req.arquivo)

  const campos = JSON.parse(req.campos)
  const pastaDestino = getPastaGerados()
  fs.mkdirSync(pastaDestino, { recursive: true })

  const resultados = registros.map((registro, idx) => {
    try {
      const content = fs.readFileSync(templatePath, 'binary')
      const zip = new PizZip(content)
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{{', end: '}}' },
        nullGetter: () => '',
      })

      const dadosFormatados = {}
      for (const campo of campos) {
        const v = registro[campo.id]
        if (typeof v === 'boolean') {
          dadosFormatados[campo.id] = v ? 'Sim' : 'Não'
        } else if (v === undefined || v === null) {
          dadosFormatados[campo.id] = ''
        } else if ((campo.tipo === 'date' || campo.tipo === 'data_hoje') && String(v).includes('-')) {
          const [year, month, day] = String(v).split('-')
          dadosFormatados[campo.id] = `${day}/${month}/${year}`
        } else {
          dadosFormatados[campo.id] = String(v)
        }
      }

      doc.render(dadosFormatados)
      const buffer = doc.getZip().generate({ type: 'nodebuffer' })

      const nomeArquivo = `${requerimentoId}_massa_${Date.now()}_${idx + 1}.docx`
      const destino = path.join(pastaDestino, nomeArquivo)
      fs.writeFileSync(destino, buffer)

      db.prepare(`
        INSERT INTO documentos_gerados (requerimento_id, dados, arquivo_gerado)
        VALUES (?, ?, ?)
      `).run(requerimentoId, JSON.stringify(registro), destino)

      return { indice: idx + 1, ok: true, arquivo: destino, erro: null }
    } catch (err) {
      const mensagem = err.properties?.errors
        ? err.properties.errors.map(e => e.properties?.explanation || e.message).join(' | ')
        : err.message
      return { indice: idx + 1, ok: false, arquivo: null, erro: mensagem }
    }
  })

  return resultados
})
