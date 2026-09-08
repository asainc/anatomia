$ErrorActionPreference = "Stop"

# Este script corrige apenas o conjunto React/RSC que precisa permanecer sincronizado.
# A decisão de manter 19.2.6 evita uma atualização desnecessária do framework e preserva
# a compatibilidade já registrada no package-lock.json entregue com o projeto.

Write-Host "Validando Node.js..."
$nodeVersion = node -p "process.versions.node"
$nodeMajor = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -lt 22) {
    throw "Node.js 22 ou superior é obrigatório. Versão encontrada: $nodeVersion"
}

Write-Host "Fixando React, React DOM e React Server DOM Webpack em 19.2.6..."
npm pkg set dependencies.react="19.2.6"
npm pkg set dependencies.react-dom="19.2.6"
npm pkg set dependencies.react-server-dom-webpack="19.2.6"

Write-Host "Atualizando somente o lockfile..."
npm install --package-lock-only --ignore-scripts --no-audit --no-fund

if (Test-Path "node_modules") {
    Write-Host "Removendo node_modules para evitar resíduos de versões anteriores..."
    Remove-Item -Recurse -Force "node_modules"
}

Write-Host "Instalando exatamente o conteúdo do package-lock.json..."
npm ci --no-audit --no-fund

Write-Host "Validando as versões resolvidas..."
npm ls react react-dom react-server-dom-webpack

Write-Host "Validando TypeScript..."
npm run check

Write-Host "Validando build..."
npm run build

Write-Host "Correção concluída com sucesso."
