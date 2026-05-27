const path = require('path')
const fs = require('fs')
const { app } = require('electron')

let dbWrapper
let dbPath

// Thin wrapper that mimics better-sqlite3's synchronous API on top of sql.js
class SqlJsWrapper {
  constructor(sqlJs, dbPath) {
    this._path = dbPath
    const buffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null
    this._db = buffer ? new sqlJs.Database(buffer) : new sqlJs.Database()
  }

  pragma() {}

  exec(sql) {
    this._db.run(sql)
    this._save()
  }

  prepare(sql) {
    const self = this
    return {
      get(...args) {
        const stmt = self._db.prepare(sql)
        stmt.bind(args.flat())
        const row = stmt.step() ? stmt.getAsObject() : undefined
        stmt.free()
        return row
      },
      all(...args) {
        const result = self._db.exec(sql, args.flat())
        if (!result.length) return []
        const { columns, values } = result[0]
        return values.map(row => {
          const obj = {}
          columns.forEach((col, i) => { obj[col] = row[i] })
          return obj
        })
      },
      run(...args) {
        self._db.run(sql, args.flat())
        self._save()
        return { changes: self._db.getRowsModified() }
      },
    }
  }

  _save() {
    const data = this._db.export()
    fs.writeFileSync(this._path, Buffer.from(data))
  }
}

async function initDb() {
  const initSqlJs = require('sql.js')
  const userData = app.getPath('userData')
  dbPath = path.join(userData, 'sistema.db')

  const SQL = await initSqlJs({
    locateFile: file => {
      if (app.isPackaged) {
        // Em produção o WASM está em app.asar.unpacked/ (via asarUnpack no config do builder)
        return path.join(
          process.resourcesPath,
          'app.asar.unpacked',
          'node_modules',
          'sql.js',
          'dist',
          file
        )
      }
      // Em desenvolvimento, aponta direto para node_modules local
      return path.join(__dirname, '../../node_modules/sql.js/dist/', file)
    },
  })

  dbWrapper = new SqlJsWrapper(SQL, dbPath)

  dbWrapper._db.run(`
    CREATE TABLE IF NOT EXISTS requerimentos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      categoria TEXT,
      arquivo TEXT NOT NULL,
      campos TEXT NOT NULL,
      ativo INTEGER DEFAULT 1,
      criado_em TEXT DEFAULT (datetime('now'))
    )
  `)

  dbWrapper._db.run(`
    CREATE TABLE IF NOT EXISTS documentos_gerados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requerimento_id TEXT NOT NULL,
      dados TEXT NOT NULL,
      arquivo_gerado TEXT NOT NULL,
      gerado_em TEXT DEFAULT (datetime('now'))
    )
  `)

  dbWrapper._save()
  seedInicial()

  return dbWrapper
}


const SEEDS = [

  {
  id: 'Adiantamento_decimo',            
  nome: 'Adiantamento de Decimo Terceiro',
  categoria: 'Requerimento',
  arquivo: 'adiantamento_Decimo.docx',
  campos: [
    { id: 'NOME', label: 'Nome completo',    tipo: 'text',      obrigatorio: true  },
    { id: 'CARGO',              label: 'Tipo de Cargo',              tipo: 'select',       obrigatorio: true, opcoes: ['Comissionado', 'Efetivo']  },
    { id: 'N_CARGO',            label: 'Cargo',            tipo: 'text',      obrigatorio: true  },
    { id: 'MES',    label: 'Mês de Recebimento', tipo: 'text',      obrigatorio: true  },
    { id: 'ANO',     label: 'Ano Atual',  tipo: 'text', obrigatorio: true  },
  ],
},

  {
  id: 'Exoneracao',            
  nome: 'Exoneração',
  categoria: 'Requerimento',
  arquivo: 'exoneracao.docx',
  campos: [
    { id: 'NOME', label: 'Nome completo',    tipo: 'text',      obrigatorio: true  },
    { id: 'CPF', label: 'CPF',    tipo: 'cpf',      obrigatorio: true  },
    { id: 'CARGO', label: 'Tipo de Cargo', tipo: 'select', obrigatorio: true, opcoes: ['Comissionado', 'Efetivo']},
    { id: 'N_CARGO',            label: 'Cargo',            tipo: 'text',      obrigatorio: true  },
    { id: 'DATA_NOMEACAO',    label: 'Data de Nomeação', tipo: 'date',      obrigatorio: true  },
    { id: 'DECRETO',     label: 'Decreto de Nomeação',  tipo: 'text', obrigatorio: true  },
    { id: 'DATA_EXONERACAO',     label: 'Data da Exoneração',  tipo: 'date', obrigatorio: true  },
    { id: 'DATA_HOJE',     label: 'Data atual',  tipo: 'data_hoje', obrigatorio: true  }
  ],
},

  {
  id: 'Licenca Premio',            
  nome: 'Licença Prêmio',
  categoria: 'Requerimento',
  arquivo: 'licença_premio.docx',
  campos: [
    { id: 'NOME', label: 'Nome completo',    tipo: 'text',      obrigatorio: true  },
    { id: 'CARGO', label: 'Tipo de Cargo', tipo: 'select', obrigatorio: true, opcoes: ['Comissionado', 'Efetivo']},
    { id: 'N_CARGO',            label: 'Cargo',            tipo: 'text',      obrigatorio: true  },
    { id: 'DATA_NOMEACAO',    label: 'Data de Nomeação', tipo: 'date',      obrigatorio: true  },
    { id: 'PERIODO_AQUISITIVO',     label: 'Periodo Aquisitivo',  tipo: 'text', obrigatorio: true  },
    { id: 'DATA_INICIO',     label: 'Data de Inicio',  tipo: 'date', obrigatorio: true  },
    { id: 'DATA_HOJE',     label: 'Data atual',  tipo: 'data_hoje', obrigatorio: true  }
  ],
},

  {
  id: 'Interesse Particular',            
  nome: 'Licença por Interesse Particular',
  categoria: 'Requerimento',
  arquivo: 'Interesse_Particular.docx',
  campos: [
    { id: 'NOME', label: 'Nome completo',    tipo: 'text',      obrigatorio: true  },
    { id: 'CARGO', label: 'Tipo de Cargo', tipo: 'select', obrigatorio: true, opcoes: ['Comissionado', 'Efetivo']},
    { id: 'N_CARGO',            label: 'Cargo',            tipo: 'text',      obrigatorio: true  },
    { id: 'DATA_NOMEACAO',    label: 'Data de Nomeação', tipo: 'date',      obrigatorio: true  },
    { id: 'DECRETO',     label: 'Decreto de Nomeação',  tipo: 'text', obrigatorio: true  },
    { id: 'QUANTIDADE_ANOS',     label: 'Tempo solicitado (Anos)',  tipo: 'number', obrigatorio: true  },
    { id: 'QUANTIDADE_MESES',     label: 'Tempo solicitado (Meses)',  tipo: 'number', obrigatorio: true  },
    { id: 'DATA_INICIO',     label: 'Data de Inicio',  tipo: 'date', obrigatorio: true  },
    { id: 'DATA_HOJE',     label: 'Data atual',  tipo: 'data_hoje', obrigatorio: true  }
  ],
},

  {
  id: 'Certidao Funcional',            
  nome: 'Certidão Funcional',
  categoria: 'Certidão',
  arquivo: 'CERTIDAO_FUNCIONAL.docx',
  campos: [
    { id: 'N_PROCESSO', label: 'N° e Ano do Processo',    tipo: 'text',      obrigatorio: true  },
    { id: 'NOME', label: 'Nome completo do Requerente',    tipo: 'text',      obrigatorio: true  },
    { id: 'N_CARGO',            label: 'Cargo',            tipo: 'text',      obrigatorio: true  },
    { id: 'DATA_NOMEACAO',    label: 'Data de Nomeação', tipo: 'date',      obrigatorio: true  },
    { id: 'NIVEL',    label: 'Nível Atual', tipo: 'text',      obrigatorio: true  },
    { id: 'LETRA',    label: 'Letra', tipo: 'text',      obrigatorio: true  },
    { id: 'SUBNIVEL',    label: 'Subnível Atual', tipo: 'text',      obrigatorio: true  },
    { id: 'ANUENIO',    label: 'Quantidade de Anuênios', tipo: 'text',      obrigatorio: true  },
    { id: 'DATA_HOJE',     label: 'Data atual',  tipo: 'data_hoje', obrigatorio: true  }
  ],
},


]

function seedInicial() {
  const templatesDir = path.join(app.getPath('userData'), 'templates')

  // Em produção os seeds ficam em resources/seeds/ (extraResources).
  // Em desenvolvimento ficam em electron/assets/seeds/.
  const seedsDir = app.isPackaged
    ? path.join(process.resourcesPath, 'seeds')
    : path.join(__dirname, '../assets/seeds')

  for (const seed of SEEDS) {
    // Copia o .docx de seedsDir → userData/templates (se ainda não estiver lá)
    const origem  = path.join(seedsDir, seed.arquivo)
    const destino = path.join(templatesDir, seed.arquivo)

    if (fs.existsSync(origem) && !fs.existsSync(destino)) {
      fs.copyFileSync(origem, destino)
    }

    const existe = dbWrapper.prepare('SELECT id FROM requerimentos WHERE id = ?').get(seed.id)

    if (existe) {
      // Sincroniza campos e metadados caso a definição do seed tenha mudado
      dbWrapper.prepare(`
        UPDATE requerimentos
        SET nome = ?, categoria = ?, arquivo = ?, campos = ?
        WHERE id = ?
      `).run(seed.nome, seed.categoria, seed.arquivo, JSON.stringify(seed.campos), seed.id)
    } else {
      // Primeira instalação: insere o requerimento
      dbWrapper.prepare(
        'INSERT INTO requerimentos (id, nome, categoria, arquivo, campos) VALUES (?, ?, ?, ?, ?)'
      ).run(seed.id, seed.nome, seed.categoria, seed.arquivo, JSON.stringify(seed.campos))
    }
  }
}

function getDb() {
  return dbWrapper
}

module.exports = { initDb, getDb }
