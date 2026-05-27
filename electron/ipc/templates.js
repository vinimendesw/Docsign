const { ipcMain, dialog, app } = require('electron')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const { getDb } = require('./db')

ipcMain.handle('rh:listar-requerimentos', () => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM requerimentos ORDER BY criado_em DESC').all()
  return rows.map(r => ({ ...r, campos: JSON.parse(r.campos), ativo: r.ativo === 1 }))
})

ipcMain.handle('rh:importar-template', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Selecionar template Word',
    filters: [{ name: 'Word', extensions: ['docx'] }],
    properties: ['openFile'],
  })

  if (result.canceled || !result.filePaths.length) return null

  const origem = result.filePaths[0]
  const nomeOriginal = path.basename(origem)
  const nomeArquivo = `${uuidv4()}_${nomeOriginal}`
  const destino = path.join(app.getPath('userData'), 'templates', nomeArquivo)

  fs.copyFileSync(origem, destino)

  return { nomeArquivo, nomeOriginal }
})

ipcMain.handle('rh:salvar-requerimento', (_, dados) => {
  const db = getDb()
  const { id, nome, categoria, arquivo, campos } = dados

  const existe = db.prepare('SELECT id FROM requerimentos WHERE id = ?').get(id)

  if (existe) {
    db.prepare(`
      UPDATE requerimentos SET nome = ?, categoria = ?, arquivo = ?, campos = ?
      WHERE id = ?
    `).run(nome, categoria || null, arquivo, JSON.stringify(campos), id)
  } else {
    db.prepare(`
      INSERT INTO requerimentos (id, nome, categoria, arquivo, campos)
      VALUES (?, ?, ?, ?, ?)
    `).run(id || uuidv4(), nome, categoria || null, arquivo, JSON.stringify(campos))
  }

  return { ok: true }
})

ipcMain.handle('rh:excluir-requerimento', (_, id) => {
  const db = getDb()
  db.prepare('UPDATE requerimentos SET ativo = 0 WHERE id = ?').run(id)
  return { ok: true }
})

ipcMain.handle('rh:toggle-requerimento', (_, id, ativo) => {
  const db = getDb()
  db.prepare('UPDATE requerimentos SET ativo = ? WHERE id = ?').run(ativo ? 1 : 0, id)
  return { ok: true }
})
