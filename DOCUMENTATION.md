# Docsign — Documentação Técnica

> **Versão atual:** 1.0.6  
> **Última atualização:** Maio 2025  
> **Status:** Ativo

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Objetivos](#2-objetivos)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Arquitetura](#4-arquitetura)
5. [Estrutura de Diretórios](#5-estrutura-de-diretórios)
6. [Modelo de Dados](#6-modelo-de-dados)
7. [Funcionalidades](#7-funcionalidades)
8. [Tipos de Campo Suportados](#8-tipos-de-campo-suportados)
9. [Como Adicionar um Modelo Pré-carregado (Seed)](#9-como-adicionar-um-modelo-pré-carregado-seed)
10. [Guia de Uso](#10-guia-de-uso)
11. [Como Rodar em Desenvolvimento](#11-como-rodar-em-desenvolvimento)
12. [Build e Distribuição](#12-build-e-distribuição)
13. [Atualizações Automáticas](#13-atualizações-automáticas)
14. [Configurações do Usuário](#14-configurações-do-usuário)
15. [Modelos Pré-carregados (Seeds)](#15-modelos-pré-carregados-seeds)
16. [Limitações Conhecidas](#16-limitações-conhecidas)

---

## 1. Visão Geral

**Docsign** (nome interno: *RHdoc*) é uma aplicação desktop para **automação da geração de documentos institucionais de RH**. O sistema permite importar modelos `.docx` com placeholders no formato `{{CAMPO}}`, preenchê-los via formulário guiado ou por ingestão de dados em lote via JSON, e exportar documentos finais prontos para impressão — tudo sem depender de serviços externos ou internet.

O aplicativo foi desenvolvido para uso em **departamentos de RH de órgãos públicos ou empresas** que lidam com alto volume de documentos recorrentes e padronizados (requerimentos, certidões, licenças, etc.).

---

## 2. Objetivos

| Objetivo | Descrição |
|---|---|
| **Eliminar retrabalho manual** | Substituir o preenchimento manual de documentos Word por um fluxo de formulário estruturado |
| **Padronização** | Garantir que todos os documentos sigam exatamente o modelo aprovado |
| **Geração em lote** | Permitir a criação de dezenas de documentos a partir de um único arquivo JSON |
| **Operação offline** | Funcionar sem internet, sem servidor e sem dependência de nuvem |
| **Auto-atualização** | Distribuir novas versões automaticamente via GitHub Releases |

---

## 3. Stack Tecnológica

### Runtime e Empacotamento

| Tecnologia | Versão | Função |
|---|---|---|
| [Electron](https://electronjs.org) | ^31.0.0 | Shell nativo desktop (Windows) |
| [electron-builder](https://www.electron.build) | ^24.13.3 | Empacotamento e geração do instalador `.exe` (NSIS) |
| [electron-updater](https://www.electron.build/auto-update) | ^6.8.3 | Auto-update via GitHub Releases |

### Frontend

| Tecnologia | Versão | Função |
|---|---|---|
| [React](https://react.dev) | ^18.3.1 | UI declarativa baseada em componentes |
| [Vite](https://vitejs.dev) | ^5.3.1 | Bundler e servidor de desenvolvimento |
| [Tailwind CSS](https://tailwindcss.com) | ^3.4.4 | Estilização utilitária |

### Processamento de Documentos

| Tecnologia | Versão | Função |
|---|---|---|
| [docxtemplater](https://docxtemplater.com) | ^3.49.0 | Renderização de modelos `.docx` com substituição de placeholders |
| [PizZip](https://github.com/open-xml-templating/pizzip) | ^3.1.7 | Leitura e escrita do formato ZIP interno do `.docx` |

### Banco de Dados

| Tecnologia | Versão | Função |
|---|---|---|
| [sql.js](https://sql.js.org) | ^1.12.0 | SQLite compilado para WebAssembly — banco local sem instalação de dependências nativas |

### Utilitários

| Tecnologia | Função |
|---|---|
| [uuid](https://github.com/uuidjs/uuid) | Geração de IDs únicos para modelos importados |
| [concurrently](https://github.com/open-cli-tools/concurrently) | Execução paralela de Vite + Electron em desenvolvimento |
| [wait-on](https://github.com/jeffbski/wait-on) | Aguarda o servidor Vite estar disponível antes de abrir o Electron |

---

## 4. Arquitetura

O Docsign segue o padrão **multi-processo do Electron** com isolamento estrito entre camadas:

```
┌──────────────────────────────────────────────────────┐
│                   PROCESSO PRINCIPAL (main)           │
│                   electron/main.js                    │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  ipc/db.js  │  │ipc/templates │  │ipc/documentos│ │
│  │  (sql.js)   │  │     .js      │  │     .js      │ │
│  └─────────────┘  └──────────────┘  └─────────────┘ │
│  ┌─────────────┐  ┌──────────────┐                   │
│  │ipc/configur │  │ipc/settings  │                   │
│  │  acoes.js   │  │     .js      │                   │
│  └─────────────┘  └──────────────┘                   │
└───────────────────────┬──────────────────────────────┘
                        │ IPC (contextIsolation)
                        │ via preload.js → window.rh.*
                        │
┌──────────────────────────────────────────────────────┐
│                 PROCESSO RENDERER (React)             │
│                 src/ (Vite + React 18)                │
│                                                       │
│  Painel │ Formulario │ Gerenciador │ GeracaoEmMassa  │
│  Historico │ Configuracoes                            │
└──────────────────────────────────────────────────────┘
```

**Princípios de segurança aplicados:**
- `contextIsolation: true` — o renderer não tem acesso direto ao Node.js
- `nodeIntegration: false` — APIs do Node bloqueadas no renderer
- Toda comunicação passa pelo `preload.js` via `contextBridge`, exposta em `window.rh`

---

## 5. Estrutura de Diretórios

```
Docsign/
├── electron/                    # Processo principal (Node.js)
│   ├── main.js                  # Entry point do Electron
│   ├── preload.js               # Bridge segura entre main e renderer
│   ├── assets/
│   │   └── seeds/               # Modelos .docx pré-instalados
│   └── ipc/
│       ├── db.js                # Inicialização do SQLite + seeds
│       ├── templates.js         # CRUD de requerimentos/modelos
│       ├── documentos.js        # Geração de documentos e histórico
│       ├── configuracoes.js     # Configurações do usuário
│       └── settings.js          # Leitura/escrita de settings.json
│
├── src/                         # Processo renderer (React)
│   ├── App.jsx                  # Layout principal + navegação + auto-update UI
│   ├── main.jsx                 # Entry point React
│   ├── index.css                # Estilos globais
│   ├── pages/
│   │   ├── Painel.jsx           # Tela inicial com cards de requerimentos
│   │   ├── Formulario.jsx       # Formulário de preenchimento individual
│   │   ├── Gerenciador.jsx      # CRUD de modelos
│   │   ├── GeracaoEmMassa.jsx   # Geração batch via JSON
│   │   ├── Historico.jsx        # Log de documentos gerados
│   │   └── Configuracoes.jsx    # Pasta de saída e assinatura
│   └── components/
│       ├── CampoInput.jsx       # Renderizador dinâmico de campo por tipo
│       ├── RequerimentoCard.jsx # Card individual no painel
│       └── Toast.jsx            # Notificação temporária
│
├── electron-builder.config.js   # Configuração de build/distribuição
├── vite.config.js               # Configuração do bundler
├── tailwind.config.js
├── package.json
└── build-win.js                 # Script customizado de build para Windows
```

**Diretórios criados em runtime** (dentro do `userData` do Electron, ex: `%APPDATA%\RHdoc\`):

```
userData/
├── sistema.db        # Banco SQLite (gerenciado pelo sql.js)
├── settings.json     # Configurações do usuário (pasta de saída, assinatura)
├── templates/        # Modelos .docx (seeds + importados pelo usuário)
└── gerados/          # Documentos gerados (padrão; configurável)
```

---

## 6. Modelo de Dados

### Tabela `requerimentos`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | TEXT PK | Identificador único do modelo |
| `nome` | TEXT | Nome exibido na interface |
| `categoria` | TEXT | Agrupamento (ex: "Requerimento", "Certidão") |
| `arquivo` | TEXT | Nome do arquivo `.docx` em `userData/templates/` |
| `campos` | TEXT | JSON com definição dos campos do formulário |
| `ativo` | INTEGER | Soft-delete: `1` = ativo, `0` = arquivado |
| `criado_em` | TEXT | Data/hora de criação (UTC) |

### Tabela `documentos_gerados`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INTEGER PK | Auto-incremento |
| `requerimento_id` | TEXT | FK para `requerimentos.id` |
| `dados` | TEXT | JSON com os valores preenchidos no momento da geração |
| `arquivo_gerado` | TEXT | Caminho absoluto do `.docx` gerado |
| `gerado_em` | TEXT | Data/hora de geração (UTC) |

### Estrutura de `campos` (JSON)

Cada campo no array `campos` segue este schema:

```json
{
  "id": "NOME_PLACEHOLDER",
  "label": "Rótulo exibido no formulário",
  "tipo": "text | textarea | number | date | data_hoje | boolean | cpf | select | checkbox",
  "obrigatorio": true,
  "opcoes": ["Opção A", "Opção B"]
}
```

---

## 7. Funcionalidades

### 7.1 Painel

Tela inicial que lista todos os requerimentos ativos em cards. Exibe contador de modelos ativos na badge da navegação. Acesso direto ao formulário de preenchimento com um clique.

### 7.2 Formulário de Preenchimento

- Renderiza dinamicamente os campos definidos no modelo
- Validação de campos obrigatórios antes da geração
- Auto-preenchimento da data atual em campos do tipo `data_hoje`
- Preenchimento automático de assinatura configurada nas preferências
- Após geração: botões para **abrir** o arquivo no Word ou **imprimir** diretamente (Windows, via PowerShell `Start-Process -Verb Print`)
- Datas são automaticamente convertidas de `YYYY-MM-DD` → `DD/MM/AAAA` no documento final

### 7.3 Geração em Massa

- Seleciona o modelo desejado
- Cola ou importa um array JSON com N registros
- Validação de JSON em tempo real (feedback imediato de erros de sintaxe)
- Botão **"Ver modelo"**: gera automaticamente um JSON de exemplo com 2 registros preenchidos com valores ilustrativos para o modelo selecionado
- Importação de arquivo `.json` via dialog nativo
- Barra de progresso durante a geração
- Relatório final com status de sucesso/falha por registro

### 7.4 Gerenciador de Modelos

- Importar novos modelos `.docx` via dialog de arquivo
- Definir nome, categoria e campos do formulário
- Editar modelos existentes
- Arquivar (soft-delete) modelos sem perder histórico
- Reativar modelos arquivados

### 7.5 Histórico

- Lista os últimos 200 documentos gerados (todos os modelos)
- Exibe nome do funcionário, modelo usado, data/hora de geração
- Indicação visual quando o arquivo gerado foi movido ou deletado
- Reabertura do documento diretamente do histórico

### 7.6 Configurações

- **Pasta de saída**: escolher diretório customizado para salvar os documentos gerados (padrão: `userData/gerados/`). Opção de restaurar para o padrão.
- **Assinatura**: nome da assinatura padrão que é injetado automaticamente em modelos que possuem o campo configurado como `campoAssinaturaId`.
- Botão para abrir a pasta de saída no Explorer

### 7.7 Auto-Update

- Verifica atualizações automaticamente ao iniciar (apenas builds de produção)
- Banner não intrusivo na interface informando download em andamento (com percentual)
- Segundo banner ao concluir o download: botões "Instalar agora" ou "Mais tarde"
- Publicação e verificação via **GitHub Releases**

---

## 8. Tipos de Campo Suportados

| Tipo | Componente renderizado | Observações |
|---|---|---|
| `text` | `<input type="text">` | Campo de texto livre |
| `textarea` | `<textarea>` | Texto multilinha |
| `number` | `<input type="number">` | Valor numérico |
| `date` | `<input type="date">` | Seletor de data; convertido para `DD/MM/AAAA` no .docx |
| `data_hoje` | `<input type="date">` readonly | Preenchido automaticamente com a data atual |
| `boolean` | `<input type="checkbox">` | Convertido para "Sim" / "Não" no .docx |
| `cpf` | `<input>` com máscara | Formato `000.000.000-00` |
| `select` | `<select>` | Lista de opções definidas em `opcoes[]` |
| `checkbox` | Múltiplos checkboxes | Retorna array de selecionados |

### Referência completa por tipo

**`text`**
Texto livre de linha única. Aceita qualquer string. No .docx o valor é inserido exatamente como digitado.
```json
{ "id": "NOME", "label": "Nome completo", "tipo": "text", "obrigatorio": true }
```

**`textarea`**
Texto longo multilinha. Útil para observações ou justificativas. Quebras de linha são preservadas no documento (docxtemplater com `linebreaks: true`).
```json
{ "id": "JUSTIFICATIVA", "label": "Justificativa", "tipo": "textarea", "obrigatorio": false }
```

**`number`**
Campo numérico. O valor é inserido no .docx como string (sem formatação monetária ou de pontuação automática).
```json
{ "id": "QUANTIDADE_ANOS", "label": "Anos solicitados", "tipo": "number", "obrigatorio": true }
```

**`date`**
Seletor de data nativo do sistema. O usuário escolhe no formato local; internamente o valor é armazenado como `YYYY-MM-DD` e convertido para `DD/MM/AAAA` ao renderizar o .docx.
```json
{ "id": "DATA_NOMEACAO", "label": "Data de Nomeação", "tipo": "date", "obrigatorio": true }
```

**`data_hoje`**
Igual a `date`, mas preenchido automaticamente com a data atual ao abrir o formulário. Ainda pode ser editado pelo usuário.
```json
{ "id": "DATA_HOJE", "label": "Data atual", "tipo": "data_hoje", "obrigatorio": true }
```

**`boolean`**
Renderiza como checkbox único. O valor `true` vira a string `"Sim"` no .docx; `false` vira `"Não"`.
```json
{ "id": "POSSUI_DEPENDENTES", "label": "Possui dependentes?", "tipo": "boolean", "obrigatorio": false }
```

**`cpf`**
Campo de texto com máscara aplicada no formato `000.000.000-00`. O valor é inserido no documento com a máscara.
```json
{ "id": "CPF", "label": "CPF", "tipo": "cpf", "obrigatorio": true }
```

**`select`**
Lista suspensa com opções fixas definidas no array `opcoes`. O valor selecionado é inserido literalmente no .docx. Obrigatório incluir `opcoes` na definição do campo.
```json
{
  "id": "CARGO",
  "label": "Tipo de Cargo",
  "tipo": "select",
  "obrigatorio": true,
  "opcoes": ["Comissionado", "Efetivo"]
}
```

**`checkbox`**
Grupo de checkboxes onde múltiplas opções podem ser selecionadas. Retorna um array de strings com os valores marcados. Requer `opcoes[]`.
```json
{
  "id": "BENEFICIOS",
  "label": "Benefícios solicitados",
  "tipo": "checkbox",
  "obrigatorio": false,
  "opcoes": ["Vale Transporte", "Vale Refeição", "Plano de Saúde"]
}
```

> **Como os valores de `checkbox` chegam ao .docx:** o array é convertido para string via `join(', ')` antes da substituição. Ex: `"Vale Transporte, Vale Refeição"`.

---

## 9. Como Adicionar um Modelo Pré-carregado (Seed)

Seeds são modelos instalados automaticamente com a aplicação e sincronizados a cada atualização. Siga os passos abaixo para adicionar um novo.

### Passo 1 — Criar o arquivo .docx

Crie o documento Word com os placeholders no formato `{{ID_DO_CAMPO}}`. Os IDs devem ser escritos em maiúsculo sem espaços (convenção do projeto).

Exemplo de conteúdo do modelo:
```
Eu, {{NOME}}, portador do CPF {{CPF}}, ocupante do cargo {{N_CARGO}},
venho por meio deste requerer...
                          Data: {{DATA_HOJE}}
```

Salve o arquivo com um nome descritivo em snake_case, por exemplo: `nome_do_documento.docx`.

### Passo 2 — Adicionar o .docx à pasta de seeds

Copie o arquivo para:
```
electron/assets/seeds/nome_do_documento.docx
```

### Passo 3 — Registrar o seed em `electron/ipc/db.js`

Abra o arquivo `electron/ipc/db.js` e adicione um novo objeto ao array `SEEDS`:

```js
{
  id: 'Id_Unico_Do_Modelo',        // Identificador único (sem espaços, sem acentos)
  nome: 'Nome Exibido na Interface',
  categoria: 'Requerimento',         // ou 'Certidão', ou qualquer categoria nova
  arquivo: 'nome_do_documento.docx', // deve bater exatamente com o nome do arquivo em seeds/
  campos: [
    { id: 'NOME',     label: 'Nome completo', tipo: 'text',      obrigatorio: true  },
    { id: 'CPF',      label: 'CPF',           tipo: 'cpf',       obrigatorio: true  },
    { id: 'N_CARGO',  label: 'Cargo',         tipo: 'text',      obrigatorio: true  },
    { id: 'DATA_HOJE',label: 'Data atual',    tipo: 'data_hoje', obrigatorio: true  },
  ],
},
```

> **Regra importante:** o `id` de cada campo deve ser idêntico ao placeholder usado no .docx (ex: campo com `id: 'NOME'` substitui `{{NOME}}` no modelo).

### Passo 4 — Verificar o comportamento de sync

O Docsign **sobrescreve** os arquivos .docx dos seeds a cada inicialização, copiando de `seeds/` para `userData/templates/`. Isso garante que correções no modelo cheguem automaticamente com updates.

Se o seed já existe no banco (`id` já registrado), os metadados (`nome`, `categoria`, `arquivo`, `campos`) são atualizados via `UPDATE`. O histórico de documentos gerados **não é afetado**.

### Passo 5 — Testar em desenvolvimento

```bash
npm run dev
```

O novo modelo deve aparecer no Painel após a inicialização. Se não aparecer, verifique:
- O `id` no array `SEEDS` é único e não conflita com outro seed
- O nome do arquivo em `arquivo:` bate exatamente com o arquivo em `electron/assets/seeds/`
- Os `id` dos campos correspondem aos placeholders `{{...}}` no .docx

### Passo 6 — Incluir no build de produção

O `electron-builder.config.js` já está configurado para empacotar toda a pasta `electron/assets/seeds/` como `extraResources`. Nenhuma alteração adicional é necessária — basta fazer o build normalmente:

```bash
npm run build
```

---

## 10. Guia de Uso

### 9.1 Criar um novo modelo

1. Crie um arquivo `.docx` com os placeholders no formato `{{NOME_DO_CAMPO}}` (ex: `{{NOME}}`, `{{DATA_HOJE}}`)
2. Acesse **Gerenciar modelos → Importar**
3. Selecione o arquivo `.docx`
4. Defina o nome, categoria e os campos do formulário (um para cada placeholder)
5. Salve — o modelo aparecerá no Painel

### 9.2 Gerar um documento individual

1. No **Painel**, clique no card do requerimento desejado
2. Preencha os campos do formulário
3. Clique em **Gerar documento**
4. Use os botões **Abrir** ou **Imprimir** para o próximo passo

### 9.3 Gerar documentos em lote

1. Acesse **Geração em massa**
2. Selecione o modelo
3. Clique em **Ver modelo** para obter o JSON de exemplo com os campos corretos
4. Cole o JSON preenchido com todos os registros (ou importe um arquivo `.json`)
5. Clique em **Gerar todos**
6. Consulte o relatório de resultados

### 9.4 Formato do JSON para geração em massa

O JSON deve ser um array de objetos. Cada chave deve corresponder ao `id` de um campo do modelo:

```json
[
  {
    "NOME": "Maria Silva",
    "CARGO": "Efetivo",
    "N_CARGO": "Professora",
    "DATA_HOJE": "2025-05-28"
  },
  {
    "NOME": "João Santos",
    "CARGO": "Comissionado",
    "N_CARGO": "Diretor",
    "DATA_HOJE": "2025-05-28"
  }
]
```

---

## 11. Como Rodar em Desenvolvimento

### Pré-requisitos

- Node.js 18+ (recomendado LTS)
- npm 9+
- Windows (o build de produção é exclusivo para Windows x64)

### Instalação

```bash
git clone https://github.com/vinimendesw/Docsign.git
cd Docsign
npm install
```

### Iniciar em modo desenvolvimento

```bash
npm run dev
```

Isso executa em paralelo:
- `vite` — servidor de desenvolvimento React em `http://localhost:5173`
- `electron .` — janela Electron apontando para o servidor Vite (com DevTools aberto)

> **Nota:** Em desenvolvimento, o banco de dados e os arquivos de configuração são salvos no `userData` do sistema (ex: `%APPDATA%\RHdoc\` no Windows).

---

## 12. Build e Distribuição

```bash
npm run build
```

O script `build-win.js` executa:
1. `vite build` — compila o React para `dist/`
2. `electron-builder` — empacota tudo em `release/`

**Saída em `release/`:**
- `RHdoc Setup 1.0.6.exe` — instalador NSIS para Windows x64
- `RHdoc Setup 1.0.6.exe.blockmap` + `latest.yml` — artefatos necessários para o auto-update

**Configurações do instalador (NSIS):**
- Instalação por usuário (sem necessidade de administrador)
- Permite escolher o diretório de instalação
- Cria atalho na área de trabalho e no Menu Iniciar
- Desinstalação **não remove** os dados do usuário (`%APPDATA%\RHdoc\`)

---

## 13. Atualizações Automáticas

O Docsign usa `electron-updater` com publicação no **GitHub Releases**.

### Configuração (`electron-builder.config.js`)

```js
publish: {
  provider: 'github',
  owner: 'vinimendesw',
  repo: 'Docsign',
  releaseType: 'release',
}
```

### Fluxo de release

1. Incrementar a `version` no `package.json`
2. Executar `npm run build`
3. Criar uma release no GitHub e fazer upload dos artefatos de `release/`
4. Os clientes verificam o `latest.yml` e fazem o download em background

> O auto-update **não funciona em modo desenvolvimento** (`isDev = !app.isPackaged`).

---

## 14. Configurações do Usuário

Armazenadas em `%APPDATA%\RHdoc\settings.json`:

```json
{
  "pastaGerados": "C:\\Users\\Usuario\\Documentos\\Docs RH",
  "assinatura": "VINICIUS ALEXANDRE RODRIGUES MENDES"
}
```

| Chave | Tipo | Padrão | Descrição |
|---|---|---|---|
| `pastaGerados` | string | `userData/gerados/` | Pasta onde os documentos gerados são salvos |
| `assinatura` | string | `""` | Nome de assinatura injetado automaticamente em modelos compatíveis |

---

## 15. Modelos Pré-carregados (Seeds)

O sistema instala automaticamente os seguintes documentos na primeira execução (e sincroniza em updates):

| ID | Nome | Categoria |
|---|---|---|
| `Adiantamento_decimo` | Adiantamento de Décimo Terceiro | Requerimento |
| `Exoneracao` | Exoneração | Requerimento |
| `Licenca Premio` | Licença Prêmio | Requerimento |
| `Interesse Particular` | Licença por Interesse Particular | Requerimento |
| `Certidao Funcional` | Certidão Funcional | Certidão |
| `Abertura de conta` | Abertura de Conta | Requerimento |

Os arquivos `.docx` dos seeds estão em `electron/assets/seeds/` (dev) ou `resources/seeds/` (produção).

> **Comportamento de sync:** a cada inicialização, os modelos de seed são sobrescritos a partir dos arquivos empacotados. Isso garante que correções nos modelos cheguem automaticamente com os updates da aplicação.

---

## 16. Limitações Conhecidas

| Limitação | Detalhes |
|---|---|
| **Windows only** | O build e o instalador são configurados exclusivamente para Windows x64. A impressão via `Start-Process -Verb Print` é exclusiva do PowerShell/Windows |
| **Sem autenticação** | Não há controle de acesso ou perfis de usuário; qualquer pessoa com acesso ao computador tem acesso total |
| **Banco local** | O banco SQLite fica no `userData` do usuário. Não há sincronização entre máquinas ou backup automático |
| **Impressão sem preview** | A impressão envia diretamente para a impressora padrão via PowerShell sem abrir uma prévia |
| **sql.js em WASM** | Por usar sql.js (SQLite em WebAssembly) em vez de better-sqlite3, operações de escrita exigem serialização manual do banco a cada operação. Pode apresentar lentidão com volumes muito altos de documentos |
| **Histórico limitado** | O histórico exibe no máximo os 200 documentos mais recentes |
