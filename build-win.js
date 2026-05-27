/**
 * Script de build para Windows.
 * Remove variáveis de certificado do ambiente para que o electron-builder
 * não tente baixar o winCodeSign (que falha por permissão de symlinks).
 */
const { execSync } = require('child_process')

// Garante que NENHUMA variável de certificado esteja definida
delete process.env.WIN_CSC_LINK
delete process.env.WIN_CSC_KEY_PASSWORD
delete process.env.CSC_LINK
delete process.env.CSC_KEY_PASSWORD
// Desabilita auto-descoberta de certificados no Windows Certificate Store
process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false'

console.log('→ Building frontend (Vite)...')
execSync('npx vite build', { stdio: 'inherit' })

console.log('→ Packaging Electron app...')
execSync('npx electron-builder --win --x64 --config electron-builder.config.js', { stdio: 'inherit' })

console.log('\n✓ Build concluído! Instalador em: release/')
