# Script de Backup Simples do Sistema de Folha de Pagamento

Write-Host "=== BACKUP DO SISTEMA DE FOLHA DE PAGAMENTO ===" -ForegroundColor Green

# Criar pasta de backup com data
$backupDate = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFolder = "backup_folha_pagamento_$backupDate"

Write-Host "Criando pasta de backup: $backupFolder" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null

# 1. Backup do banco de dados
Write-Host "1. Fazendo backup do banco de dados..." -ForegroundColor Cyan
if (Test-Path "folha_pagamento.db") {
    Copy-Item "folha_pagamento.db" "$backupFolder/folha_pagamento.db"
    Write-Host "   Banco de dados copiado" -ForegroundColor Green
} else {
    Write-Host "   Banco de dados nao encontrado!" -ForegroundColor Red
}

# 2. Backup dos arquivos de configuração
Write-Host "2. Fazendo backup dos arquivos de configuracao..." -ForegroundColor Cyan
$configFiles = @(
    "package.json",
    "package-lock.json", 
    "next.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "tsconfig.json",
    ".env.local",
    ".env"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Copy-Item $file "$backupFolder/$file"
        Write-Host "   $file copiado" -ForegroundColor Green
    }
}

# 3. Backup do código fonte
Write-Host "3. Fazendo backup do codigo fonte..." -ForegroundColor Cyan
$sourceFiles = @("src", "prisma", "public")

foreach ($folder in $sourceFiles) {
    if (Test-Path $folder) {
        Copy-Item $folder "$backupFolder/$folder" -Recurse
        Write-Host "   $folder copiado" -ForegroundColor Green
    }
}

# 4. Backup de arquivos adicionais
Write-Host "4. Fazendo backup de arquivos adicionais..." -ForegroundColor Cyan
$additionalFiles = @("README.md", "server.js", "nodemon.json")

foreach ($file in $additionalFiles) {
    if (Test-Path $file) {
        Copy-Item $file "$backupFolder/$file"
        Write-Host "   $file copiado" -ForegroundColor Green
    }
}

# 5. Criar script de instalação
Write-Host "5. Criando script de instalacao..." -ForegroundColor Cyan
$installScript = @"
@echo off
echo === INSTALACAO DO SISTEMA ===
echo.
echo 1. Verificando Node.js...
node --version
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Instale em: https://nodejs.org/
    pause
    exit /b 1
)

echo 2. Instalando dependencias...
npm install

echo 3. Configurando Prisma...
npx prisma generate

echo 4. Iniciando sistema...
echo Execute: npm run dev
echo.
pause
"@

$installScript | Out-File -FilePath "$backupFolder/INSTALAR.bat" -Encoding ASCII

# 6. Comprimir backup
Write-Host "6. Comprimindo backup..." -ForegroundColor Cyan
try {
    Compress-Archive -Path $backupFolder -DestinationPath "$backupFolder.zip" -Force
    Remove-Item $backupFolder -Recurse -Force
    Write-Host "   Backup comprimido: $backupFolder.zip" -ForegroundColor Green
} catch {
    Write-Host "   Backup disponivel em: $backupFolder" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== BACKUP CONCLUIDO ===" -ForegroundColor Green
Write-Host "Arquivo: $backupFolder.zip" -ForegroundColor Yellow
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Copie o ZIP para o novo computador" -ForegroundColor White
Write-Host "2. Extraia o ZIP" -ForegroundColor White
Write-Host "3. Execute INSTALAR.bat" -ForegroundColor White
Write-Host "4. Execute: npm run dev" -ForegroundColor White
