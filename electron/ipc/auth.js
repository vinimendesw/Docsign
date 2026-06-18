const { ipcMain } = require('electron')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const { getDb } = require('./db')

// Sessão simples mantida em memória no processo main.
// Como o app é desktop/offline, não há necessidade de tokens — basta
// rastrear quem está autenticado enquanto o app estiver aberto.
let usuarioAtual = null

function getUsuarioAtual() {
  return usuarioAtual
}

function sanitizar(usuario) {
  if (!usuario) return null
  const { senha_hash, ...resto } = usuario
  return { ...resto, ativo: resto.ativo === 1 }
}

function exigirAdmin() {
  if (!usuarioAtual || usuarioAtual.papel !== 'admin') {
    throw new Error('Apenas administradores podem realizar esta ação.')
  }
}

ipcMain.handle('rh:login', (_, login, senha) => {
  const db = getDb()
  const loginNormalizado = String(login || '').trim().toLowerCase()
  const usuario = db.prepare('SELECT * FROM usuarios WHERE login = ?').get(loginNormalizado)

  if (!usuario || usuario.ativo !== 1) {
    throw new Error('Usuário ou senha inválidos.')
  }

  const ok = bcrypt.compareSync(String(senha || ''), usuario.senha_hash)
  if (!ok) {
    throw new Error('Usuário ou senha inválidos.')
  }

  usuarioAtual = sanitizar(usuario)
  return usuarioAtual
})

ipcMain.handle('rh:logout', () => {
  usuarioAtual = null
  return { ok: true }
})

ipcMain.handle('rh:usuario-atual', () => usuarioAtual)

ipcMain.handle('rh:listar-usuarios', () => {
  exigirAdmin()
  const db = getDb()
  const rows = db.prepare('SELECT * FROM usuarios ORDER BY criado_em ASC').all()
  return rows.map(sanitizar)
})

ipcMain.handle('rh:criar-usuario', (_, dados) => {
  exigirAdmin()
  const db = getDb()
  const { nome, login, senha, papel } = dados || {}

  if (!nome || !login || !senha) {
    throw new Error('Nome, login e senha são obrigatórios.')
  }
  if (String(senha).length < 4) {
    throw new Error('A senha deve ter ao menos 4 caracteres.')
  }

  const loginNormalizado = String(login).trim().toLowerCase()
  const existe = db.prepare('SELECT id FROM usuarios WHERE login = ?').get(loginNormalizado)
  if (existe) {
    throw new Error('Já existe um usuário com este login.')
  }

  const id = uuidv4()
  const senhaHash = bcrypt.hashSync(String(senha), 10)
  const papelFinal = papel === 'admin' ? 'admin' : 'operador'

  db.prepare(`
    INSERT INTO usuarios (id, nome, login, senha_hash, papel)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, String(nome).trim(), loginNormalizado, senhaHash, papelFinal)

  return sanitizar(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id))
})

ipcMain.handle('rh:atualizar-usuario', (_, id, dados) => {
  exigirAdmin()
  const db = getDb()
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id)
  if (!usuario) {
    throw new Error('Usuário não encontrado.')
  }

  const { nome, papel, ativo } = dados || {}
  const papelFinal = papel === 'admin' || papel === 'operador' ? papel : usuario.papel
  const ativoFinal = ativo === undefined ? usuario.ativo : (ativo ? 1 : 0)

  // Impede remover o último administrador ativo do sistema
  const vaiPerderAdmin = usuario.papel === 'admin' && (papelFinal !== 'admin' || ativoFinal === 0)
  if (vaiPerderAdmin) {
    const outrosAdminsAtivos = db.prepare(
      "SELECT COUNT(*) as total FROM usuarios WHERE papel = 'admin' AND ativo = 1 AND id != ?"
    ).get(id).total
    if (outrosAdminsAtivos === 0) {
      throw new Error('Não é possível remover ou desativar o último administrador.')
    }
  }

  db.prepare(`
    UPDATE usuarios SET nome = ?, papel = ?, ativo = ? WHERE id = ?
  `).run(nome ? String(nome).trim() : usuario.nome, papelFinal, ativoFinal, id)

  // Se o próprio usuário logado foi desativado, encerra a sessão dele
  if (usuarioAtual?.id === id && ativoFinal === 0) {
    usuarioAtual = null
  }

  return sanitizar(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id))
})

ipcMain.handle('rh:alterar-senha', (_, id, novaSenha) => {
  exigirAdmin()
  if (!novaSenha || String(novaSenha).length < 4) {
    throw new Error('A nova senha deve ter ao menos 4 caracteres.')
  }
  const db = getDb()
  const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(id)
  if (!usuario) {
    throw new Error('Usuário não encontrado.')
  }
  const senhaHash = bcrypt.hashSync(String(novaSenha), 10)
  db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(senhaHash, id)
  return { ok: true }
})

ipcMain.handle('rh:alterar-minha-senha', (_, senhaAtual, novaSenha) => {
  if (!usuarioAtual) {
    throw new Error('Nenhum usuário autenticado.')
  }
  if (!novaSenha || String(novaSenha).length < 4) {
    throw new Error('A nova senha deve ter ao menos 4 caracteres.')
  }

  const db = getDb()
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(usuarioAtual.id)
  const ok = bcrypt.compareSync(String(senhaAtual || ''), usuario.senha_hash)
  if (!ok) {
    throw new Error('Senha atual incorreta.')
  }

  const senhaHash = bcrypt.hashSync(String(novaSenha), 10)
  db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(senhaHash, usuarioAtual.id)
  return { ok: true }
})

module.exports = { getUsuarioAtual }
