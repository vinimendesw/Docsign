module.exports = {
  appId: 'com.rh.sistema-requerimentos',
  productName: 'Docsign',
  copyright: 'Copyright © 2025',

  directories: {
    output: 'release',
  },

  // ── Publicação no GitHub Releases (para auto-update) ──────────────────────
  // Troque owner e repo pelo seu usuário/organização e repositório do GitHub.
  // Para publicar: node build-win.js --publish   (ou npm run release)
  publish: {
    provider: 'github',
    owner: 'vinimendesw',   // ← substitua pelo seu usuário do GitHub
    repo: 'Docsign',   // ← substitua pelo nome do repositório
    releaseType: 'release',
  },

  // node_modules NÃO precisa ser listado aqui.
  // O electron-builder inclui automaticamente só o que está em "dependencies"
  // no package.json (sql.js, docxtemplater, pizzip, uuid).
  files: [
    'dist/**/*',
    'electron/**/*',
    '!electron/assets/seeds/**',
  ],

  // sql-wasm.wasm precisa ficar fora do .asar para ser lido em runtime
  asarUnpack: [
    'node_modules/sql.js/dist/*.wasm',
  ],

  // Templates .docx padrão copiados para resources/seeds/
  extraResources: [
    {
      from: 'electron/assets/seeds',
      to: 'seeds',
      filter: ['**/*.docx'],
    },
  ],

  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    //icon: 'electron/assets/icon.ico', 
  },

  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Docsign',
    language: '1046',
    deleteAppDataOnUninstall: false,
  },
}
