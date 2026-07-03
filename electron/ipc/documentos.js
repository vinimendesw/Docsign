const { ipcMain, app, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { execFile } = require('child_process')
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
  if (!fs.existsSync(templatePath)) throw new Error('Modelo não encontrado: ' + req.arquivo)

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

  // Invoca o verbo "Print" do shell do Windows via PowerShell.
  // Start-Process -Verb Print abre o Word minimizado, envia para a
  // impressora padrão e fecha automaticamente — sem abrir a janela do Word.
  const caminhoPS = caminho.replace(/'/g, "''") // escapa aspas simples no PS

  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-WindowStyle', 'Hidden',
        '-Command',
        `Start-Process -FilePath '${caminhoPS}' -Verb Print`,
      ],
      { windowsHide: true },
      (error) => {
        if (error) reject(new Error('Falha ao enviar para impressão: ' + error.message))
        else resolve({ ok: true })
      }
    )
  })
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
