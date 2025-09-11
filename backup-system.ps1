# Script de Backup do Sistema de Folha de Pagamento
# Execute este script para fazer backup completo do sistema

Write-Host "=== BACKUP DO SISTEMA DE FOLHA DE PAGAMENTO ===" -ForegroundColor Green
Write-Host ""

# Criar pasta de backup com data
$backupDate = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFolder = "backup_folha_pagamento_$backupDate"

Write-Host "Criando pasta de backup: $backupFolder" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null

# 1. Backup do banco de dados
Write-Host "1. Fazendo backup do banco de dados..." -ForegroundColor Cyan
if (Test-Path "folha_pagamento.db") {
    Copy-Item "folha_pagamento.db" "$backupFolder/folha_pagamento.db"
    Write-Host "   ✅ Banco de dados copiado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Banco de dados não encontrado!" -ForegroundColor Red
}

# 2. Backup dos arquivos de configuração
Write-Host "2. Fazendo backup dos arquivos de configuração..." -ForegroundColor Cyan
$configFiles = @(
    "package.json",
    "package-lock.json", 
    "next.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "tsconfig.json",
    "eslint.config.mjs",
    ".env.local",
    ".env",
    "env.example"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Copy-Item $file "$backupFolder/$file"
        Write-Host "   ✅ $file copiado" -ForegroundColor Green
    }
}

# 3. Backup do código fonte (excluindo node_modules e .next)
Write-Host "3. Fazendo backup do código fonte..." -ForegroundColor Cyan
$sourceFiles = @(
    "src",
    "prisma",
    "public"
)

foreach ($folder in $sourceFiles) {
    if (Test-Path $folder) {
        Copy-Item $folder "$backupFolder/$folder" -Recurse
        Write-Host "   ✅ $folder copiado" -ForegroundColor Green
    }
}

# 4. Backup de arquivos adicionais
Write-Host "4. Fazendo backup de arquivos adicionais..." -ForegroundColor Cyan
$additionalFiles = @(
    "README.md",
    "SECRETARIA-README.md",
    "LOGO-INSTRUCOES.md",
    "MIGRACAO_RUBRICAS_FUNCIONARIOS.md",
    "server.js",
    "nodemon.json"
)

foreach ($file in $additionalFiles) {
    if (Test-Path $file) {
        Copy-Item $file "$backupFolder/$file"
        Write-Host "   ✅ $file copiado" -ForegroundColor Green
    }
}

# 5. Criar arquivo de informações do backup
Write-Host "5. Criando arquivo de informações..." -ForegroundColor Cyan
$backupInfo = @"
BACKUP DO SISTEMA DE FOLHA DE PAGAMENTO
=====================================

Data do Backup: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
Sistema: Windows $(Get-ComputerInfo | Select-Object -ExpandProperty WindowsProductName)
Usuário: $env:USERNAME
Diretório Original: $(Get-Location)

ARQUIVOS INCLUÍDOS:
- Banco de dados: folha_pagamento.db
- Código fonte: src/, prisma/, public/
- Configurações: package.json, next.config.js, etc.
- Documentação: README.md, etc.

PARA RESTAURAR NO NOVO COMPUTADOR:
1. Instalar Node.js (versão 18 ou superior)
2. Copiar todos os arquivos para o novo computador
3. Executar: npm install
4. Executar: npx prisma generate
5. Executar: npm run dev

OBSERVAÇÕES:
- O banco de dados SQLite é portável e não precisa de instalação adicional
- Certifique-se de que o Node.js está instalado no novo computador
- As variáveis de ambiente (.env.local) podem precisar ser ajustadas
"@

$backupInfo | Out-File -FilePath "$backupFolder/BACKUP_INFO.txt" -Encoding UTF8

# 6. Criar script de instalação
Write-Host "6. Criando script de instalação..." -ForegroundColor Cyan
$installScript = @"
@echo off
echo === INSTALACAO DO SISTEMA DE FOLHA DE PAGAMENTO ===
echo.

echo 1. Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

echo 2. Instalando dependencias...
npm install

echo 3. Configurando Prisma...
npx prisma generate

echo 4. Verificando banco de dados...
if exist "folha_pagamento.db" (
    echo Banco de dados encontrado!
) else (
    echo AVISO: Banco de dados nao encontrado!
    echo Execute: npx prisma db push
)

echo.
echo === INSTALACAO CONCLUIDA ===
echo Execute: npm run dev
echo.
pause
"@

$installScript | Out-File -FilePath "$backupFolder/INSTALAR.bat" -Encoding ASCII

# 7. Comprimir backup (opcional)
Write-Host "7. Comprimindo backup..." -ForegroundColor Cyan
try {
    Compress-Archive -Path $backupFolder -DestinationPath "$backupFolder.zip" -Force
    Remove-Item $backupFolder -Recurse -Force
    Write-Host "   ✅ Backup comprimido: $backupFolder.zip" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Não foi possível comprimir. Backup disponível em: $backupFolder" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== BACKUP CONCLUÍDO ===" -ForegroundColor Green
Write-Host "Localização: $(Get-Location)\$backupFolder" -ForegroundColor Yellow
Write-Host ""

Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Copie o backup para um pendrive ou nuvem" -ForegroundColor White
Write-Host "2. No novo computador, extraia o backup" -ForegroundColor White
Write-Host "3. Execute o arquivo INSTALAR.bat" -ForegroundColor White
Write-Host "4. Execute: npm run dev" -ForegroundColor White
Write-Host ""

Read-Host "Pressione Enter para continuar"
