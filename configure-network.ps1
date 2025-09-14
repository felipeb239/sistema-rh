# Script para configurar acesso de outras máquinas
Write-Host "Configurando sistema para acesso de outras máquinas..." -ForegroundColor Green

# Backup do .env atual
Copy-Item .env .env.backup -Force
Write-Host "Backup do .env criado em .env.backup" -ForegroundColor Yellow

# Obter IP da máquina
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"} | Select-Object -First 1).IPAddress
Write-Host "IP detectado: $ip" -ForegroundColor Cyan

# Criar novo .env com configuração de rede
@"
DATABASE_URL="postgresql://postgres:admin@localhost:5432/folha_pagamento?schema=public"
NEXTAUTH_URL="http://$ip`:3000"
NEXTAUTH_SECRET="folha-pagamento-secret-key-2024"
NODE_ENV="development"
HOST="0.0.0.0"
PORT="3000"
"@ | Out-File -FilePath .env -Encoding UTF8

Write-Host "Arquivo .env atualizado com IP: $ip" -ForegroundColor Green
Write-Host "Agora você pode acessar o sistema de outras máquinas usando:" -ForegroundColor Cyan
Write-Host "http://$ip`:3000" -ForegroundColor White -BackgroundColor Blue
Write-Host ""
Write-Host "Para voltar ao localhost, execute:" -ForegroundColor Yellow
Write-Host "copy .env.backup .env" -ForegroundColor White
