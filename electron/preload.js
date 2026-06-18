const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('rh', {
  // Autenticação
  login: (login, senha) => ipcRenderer.invoke('rh:login', login, senha),
  logout: () => ipcRenderer.invoke('rh:logout'),
  usuarioAtual: () => ipcRenderer.invoke('rh:usuario-atual'),
  listarUsuarios: () => ipcRenderer.invoke('rh:listar-usuarios'),
  criarUsuario: (dados) => ipcRenderer.invoke('rh:criar-usuario', dados),
  atualizarUsuario: (id, dados) => ipcRenderer.invoke('rh:atualizar-usuario', id, dados),
  alterarSenha: (id, novaSenha) => ipcRenderer.invoke('rh:alterar-senha', id, novaSenha),
  alterarMinhaSenha: (senhaAtual, novaSenha) => ipcRenderer.invoke('rh:alterar-minha-senha', senhaAtual, novaSenha),

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

  // Geração em massa
  modeloJsonEmMassa: (requerimentoId) => ipcRenderer.invoke('rh:modelo-json-em-massa', requerimentoId),
  importarJson: () => ipcRenderer.invoke('rh:importar-json'),
  gerarDocumentosEmMassa: (requerimentoId, registros) => ipcRenderer.invoke('rh:gerar-documentos-em-massa', requerimentoId, registros),

  // Configurações
  lerConfiguracoes: () => ipcRenderer.invoke('rh:ler-configuracoes'),
  escolherPastaGerados: () => ipcRenderer.invoke('rh:escolher-pasta-gerados'),
  resetarPastaGerados: () => ipcRenderer.invoke('rh:resetar-pasta-gerados'),
  abrirPastaGerados: () => ipcRenderer.invoke('rh:abrir-pasta-gerados'),
  salvarAssinatura: (assinatura) => ipcRenderer.invoke('rh:salvar-assinatura', assinatura),

  // Atualizações automáticas
  onUpdateAvailable:  (cb) => ipcRenderer.on('update:available',  (_, info) => cb(info)),
  onUpdateProgress:   (cb) => ipcRenderer.on('update:progress',   (_, prog) => cb(prog)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update:downloaded', (_, info) => cb(info)),
  installUpdate: () => ipcRenderer.invoke('update:install'),
})
