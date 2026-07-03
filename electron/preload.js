const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('rh', {
  // Templates / Requerimentos
  listarRequerimentos: () => ipcRenderer.invoke('rh:listar-requerimentos'),
  importarTemplate: () => ipcRenderer.invoke('rh:importar-template'),
  salvarRequerimento: (dados) => ipcRenderer.invoke('rh:salvar-requerimento', dados),
  excluirRequerimento: (id) => ipcRenderer.invoke('rh:excluir-requerimento', id),
  toggleRequerimento: (id, ativo) => ipcRenderer.invoke('rh:toggle-requerimento', id, ativo),

  // Geração de documentos
  gerarDocumento: (requerimentoId, dados) => ipcRenderer.invoke('rh:gerar-documento', requerimentoId, dados),
  abrirDocumento: (caminho) => ipcRenderer.invoke('rh:abrir-documento', caminho),
  imprimirDocumento: (caminho) => ipcRenderer.invoke('rh:imprimir-documento', caminho),

  // Histórico
  listarHistorico: () => ipcRenderer.invoke('rh:listar-historico'),
  listarDocumentosGerados: (requerimentoId) => ipcRenderer.invoke('rh:listar-documentos-gerados', requerimentoId),

  // Configurações
  lerConfiguracoes: () => ipcRenderer.invoke('rh:ler-configuracoes'),
  escolherPastaGerados: () => ipcRenderer.invoke('rh:escolher-pasta-gerados'),
  resetarPastaGerados: () => ipcRenderer.invoke('rh:resetar-pasta-gerados'),
  abrirPastaGerados: () => ipcRenderer.invoke('rh:abrir-pasta-gerados'),
  salvarAssinatura: (assinatura) => ipcRenderer.invoke('rh:salvar-assinatura', assinatura),

  // Login de acesso
  temLoginCadastrado: () => ipcRenderer.invoke('rh:tem-login-cadastrado'),
  cadastrarLogin: (login, senha) => ipcRenderer.invoke('rh:cadastrar-login', { login, senha }),
  validarLogin: (login, senha) => ipcRenderer.invoke('rh:validar-login', { login, senha }),

  // Atualizações automáticas
  onUpdateAvailable:  (cb) => ipcRenderer.on('update:available',  (_, info) => cb(info)),
  onUpdateProgress:   (cb) => ipcRenderer.on('update:progress',   (_, prog) => cb(prog)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update:downloaded', (_, info) => cb(info)),
  installUpdate: () => ipcRenderer.invoke('update:install'),
})
