const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const { pathToFileURL } = require('url')

const isDev = !app.isPackaged

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    title: 'Docsign',
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // pathToFileURL lida corretamente com barras e espaços no Windows
    const indexPath = path.join(__dirname, '../dist/index.html')
    mainWindow.loadURL(pathToFileURL(indexPath).href)
  }

  // ── Context menu (botão direito) com Recortar / Copiar / Colar ──
  mainWindow.webContents.on('context-menu', (_e, params) => {
    const { isEditable, selectionText, editFlags } = params
    const temSelecao = selectionText.trim().length > 0

    // Só exibe o menu se estiver em campo editável ou houver texto selecionado
    if (!isEditable && !temSelecao) return

    const menu = Menu.buildFromTemplate([
      {
        label: 'Recortar',
        role: 'cut',
        enabled: isEditable && editFlags.canCut && temSelecao,
      },
      {
        label: 'Copiar',
        role: 'copy',
        enabled: editFlags.canCopy && temSelecao,
      },
      {
        label: 'Colar',
        role: 'paste',
        enabled: isEditable && editFlags.canPaste,
      },
      { type: 'separator' },
      {
        label: 'Selecionar tudo',
        role: 'selectAll',
        enabled: isEditable,
      },
    ])

    menu.popup({ window: mainWindow })
  })

  // Exibe erro se o HTML não carregar (caminho errado, arquivo ausente etc.)
  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDesc) => {
    console.error('did-fail-load:', errorCode, errorDesc)
    mainWindow.webContents.executeJavaScript(`
      document.body.innerHTML =
        '<div style="font-family:sans-serif;padding:40px;color:#c00">' +
        '<h2>Falha ao carregar a interface</h2>' +
        '<p>Código: ${errorCode} — ${errorDesc}</p>' +
        '</div>'
    `).catch(() => {})
  })
}

function ensureDirectories() {
  const userData = app.getPath('userData')
  const dirs = [
    path.join(userData, 'templates'),
    path.join(userData, 'gerados'),
  ]
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  })
}

// Garante uma única instância rodando por vez. O banco (sql.js) é carregado
// inteiro em memória e salvo por sobrescrita completa do arquivo — duas
// instâncias concorrentes fariam a última a salvar apagar silenciosamente
// as mudanças da outra (ex: um login cadastrado "sumindo").
const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    // Remove o menu nativo (barra de menus) em todas as plataformas
    Menu.setApplicationMenu(null)

    ensureDirectories()

    try {
      const { initDb } = require('./ipc/db')
      await initDb()
      require('./ipc/templates')
      require('./ipc/documentos')
      require('./ipc/configuracoes')
      require('./ipc/usuarios')
    } catch (err) {
      console.error('Erro na inicialização:', err)
      // Abre a janela mesmo assim; o erro aparecerá via dialog após a janela abrir
      app.once('browser-window-created', () => {
        dialog.showErrorBox(
          'Erro ao inicializar o sistema',
          `Não foi possível carregar o banco de dados.\n\n${err?.message ?? err}\n\n` +
          'Verifique se o aplicativo foi instalado corretamente e tente novamente.'
        )
      })
    }

    // createWindow é chamado SEMPRE — nunca deixa a tela em branco sem motivo
    createWindow()

    // Configura auto-update (apenas em produção)
    setupAutoUpdater()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}

// ── AUTO-UPDATE ──────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  // Só funciona em produção (app empacotado)
  if (isDev) return

  const { autoUpdater } = require('electron-updater')

  autoUpdater.autoDownload = true        // baixa em segundo plano automaticamente
  autoUpdater.autoInstallOnAppQuit = true // instala ao fechar se já baixou

  autoUpdater.on('update-available', (info) => {
    console.log('Atualização disponível:', info.version)
    mainWindow?.webContents.send('update:available', {
      version: info.version,
      releaseNotes: info.releaseNotes ?? '',
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update:progress', {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Download concluído:', info.version)
    mainWindow?.webContents.send('update:downloaded', {
      version: info.version,
    })
  })

  autoUpdater.on('error', (err) => {
    console.error('Erro no auto-updater:', err?.message ?? err)
  })

  // Verifica após 4 s para não bloquear a inicialização
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => {
      console.error('Falha ao verificar atualizações:', err?.message ?? err)
    })
  }, 4000)

  // IPC: renderer pede para instalar agora
  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall(false, true)
  })
}
