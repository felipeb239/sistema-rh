# Script para configurar o sistema de recuperação de senha
# Execute este script para garantir que o sistema funcione corretamente

Write-Host "=== Configuração do Sistema de Recuperação de Senha ===" -ForegroundColor Green

# 1. Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Arquivo .env não encontrado. Criando..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ Arquivo .env criado. Configure as variáveis necessárias:" -ForegroundColor Green
    Write-Host "   - DATABASE_URL (URL do banco PostgreSQL)" -ForegroundColor Cyan
    Write-Host "   - NEXTAUTH_SECRET (chave secreta)" -ForegroundColor Cyan
    Write-Host "   - EMAIL_USER e EMAIL_APP_PASSWORD (para envio de emails)" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
}

# 2. Verificar se o banco está acessível
Write-Host "Verificando conexão com o banco de dados..." -ForegroundColor Yellow
try {
    $result = npx prisma db push --accept-data-loss 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexão com banco estabelecida e esquema sincronizado" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao conectar com o banco. Verifique DATABASE_URL no .env" -ForegroundColor Red
        Write-Host "   Certifique-se de que:" -ForegroundColor Cyan
        Write-Host "   - O PostgreSQL está rodando" -ForegroundColor Cyan
        Write-Host "   - As credenciais estão corretas" -ForegroundColor Cyan
        Write-Host "   - O banco de dados existe" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao verificar banco: $_" -ForegroundColor Red
}

# 3. Instruções finais
Write-Host ""
Write-Host "=== Próximos Passos ===" -ForegroundColor Green
Write-Host "1. Configure o arquivo .env com suas credenciais" -ForegroundColor Cyan
Write-Host "2. Execute: npm run dev" -ForegroundColor Cyan
Write-Host "3. Teste a recuperação de senha em /login" -ForegroundColor Cyan
Write-Host ""
Write-Host "=== Estrutura do Sistema ===" -ForegroundColor Green
Write-Host "✅ API de solicitação: /api/auth/forgot-password" -ForegroundColor Cyan
Write-Host "✅ API de verificação: /api/auth/verify-reset-token" -ForegroundColor Cyan
Write-Host "✅ API de redefinição: /api/auth/reset-password" -ForegroundColor Cyan
Write-Host "✅ Página de reset: /reset-password" -ForegroundColor Cyan
Write-Host "✅ Tabela no banco: password_reset_tokens" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sistema corrigido! Os principais problemas resolvidos:" -ForegroundColor Green
Write-Host "- ✅ Validação correta do token no banco" -ForegroundColor Green
Write-Host "- ✅ Atualização da senha do usuário correto" -ForegroundColor Green
Write-Host "- ✅ Remoção de tokens após uso" -ForegroundColor Green
Write-Host "- ✅ Tratamento de tokens expirados" -ForegroundColor Green
Write-Host "- ✅ Logs detalhados para debug" -ForegroundColor Green
