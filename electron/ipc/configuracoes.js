const { ipcMain, dialog, app, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { readSettings, writeSettings, getPastaGerados } = require('./settings')

function configAtual() {
  const s = readSettings()
  return {
    pastaGerados: getPastaGerados(),
    personalizada: !!s.pastaGerados,
  }
}

ipcMain.handle('rh:ler-configuracoes', () => configAtual())

ipcMain.handle('rh:escolher-pasta-gerados', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Escolher pasta para documentos gerados',
    properties: ['openDirectory', 'createDirectory'],
  })
  if (result.canceled || !result.filePaths.length) return null

  const pasta = result.filePaths[0]
  fs.mkdirSync(pasta, { recursive: true })

  const s = readSettings()
  writeSettings({ ...s, pastaGerados: pasta })

  return configAtual()
})

ipcMain.handle('rh:resetar-pasta-gerados', () => {
  const s = readSettings()
  delete s.pastaGerados
  writeSettings(s)
  const padrao = path.join(app.getPath('userData'), 'gerados')
  fs.mkdirSync(padrao, { recursive: true })
  return configAtual()
})

ipcMain.handle('rh:abrir-pasta-gerados', () => {
  shell.openPath(getPastaGerados())
  return { ok: true }
})
