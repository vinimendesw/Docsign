const { ipcMain } = require('electron')
const bcrypt = require('bcryptjs')
const { getDb } = require('./db')

ipcMain.handle('rh:tem-login-cadastrado', () => {
  const db = getDb()
  const row = db.prepare('SELECT COUNT(*) AS total FROM usuarios').get()
  return row.total > 0
})

ipcMain.handle('rh:cadastrar-login', (_, { login, senha }) => {
  if (!login || !String(login).trim()) throw new Error('Informe um usuário.')
  if (!senha || String(senha).length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.')

  const db = getDb()
  const senhaHash = bcrypt.hashSync(String(senha), 10)
  const existente = db.prepare('SELECT id FROM usuarios ORDER BY id LIMIT 1').get()

  if (existente) {
    db.prepare('UPDATE usuarios SET login = ?, senha_hash = ? WHERE id = ?')
      .run(String(login).trim(), senhaHash, existente.id)
  } else {
    db.prepare('INSERT INTO usuarios (login, senha_hash) VALUES (?, ?)')
      .run(String(login).trim(), senhaHash)
  }

  return { ok: true }
})

ipcMain.handle('rh:validar-login', (_, { login, senha }) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM usuarios WHERE login = ?').get(String(login ?? '').trim())

  if (!row || !bcrypt.compareSync(String(senha ?? ''), row.senha_hash)) {
    return { ok: false, erro: 'Usuário ou senha inválidos.' }
  }

  return { ok: true }
})
