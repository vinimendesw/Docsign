/**
 * Módulo de configurações persistidas em settings.json no userData.
 * Usado como helper por outros módulos IPC.
 */
const path = require('path')
const fs = require('fs')
const { app } = require('electron')

function getPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

function readSettings() {
  try {
    if (fs.existsSync(getPath())) return JSON.parse(fs.readFileSync(getPath(), 'utf8'))
  } catch {}
  return {}
}

function writeSettings(obj) {
  fs.writeFileSync(getPath(), JSON.stringify(obj, null, 2), 'utf8')
}

function getPastaGerados() {
  const s = readSettings()
  if (s.pastaGerados && fs.existsSync(s.pastaGerados)) return s.pastaGerados
  return path.join(app.getPath('userData'), 'gerados')
}

module.exports = { readSettings, writeSettings, getPastaGerados }
