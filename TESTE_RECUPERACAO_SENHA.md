# 🧪 Teste de Recuperação de Senha

## Passos para Testar

### 1. **Verificar Configuração de E-mail**
Acesse: `http://localhost:3000/api/test-email`

Isso vai mostrar se as variáveis de ambiente estão configuradas.

### 2. **Testar Envio de E-mail (Versão Temporária)**
Acesse: `http://localhost:3000/api/auth/forgot-password-temp`

**Método POST com este JSON:**
```json
{
  "email": "seu-email@teste.com"
}
```

### 3. **Testar na Interface**
1. Acesse: `http://localhost:3000/login`
2. Clique em "Esqueci minha senha"
3. Digite um e-mail qualquer
4. Clique em "Enviar Instruções"

## Verificações Importantes

### ✅ **Variáveis de Ambiente**
Certifique-se de que seu arquivo `.env` contém:
```env
EMAIL_USER="seu-email@empresa.com"
EMAIL_APP_PASSWORD="sua-senha-de-app"
NEXTAUTH_URL="http://localhost:3000"
```

### ✅ **Banco de Dados**
Execute o script `criar-tabela-tokens.sql` no seu banco PostgreSQL.

### ✅ **Logs do Servidor**
Abra o terminal onde o servidor está rodando e observe os logs quando testar.

## Possíveis Resultados

### ✅ **Sucesso**
- E-mail é enviado
- Mensagem de sucesso aparece
- Logs mostram "E-mail enviado com sucesso"

### ❌ **Erro de Configuração**
- Mensagem: "Configuração de e-mail não encontrada"
- **Solução**: Verificar variáveis de ambiente

### ❌ **Erro de Autenticação**
- Mensagem: "Invalid login"
- **Solução**: Verificar senha de app do Google

### ❌ **Erro de Rede**
- Mensagem: "Connection timeout"
- **Solução**: Verificar conexão com internet

## Próximos Passos

1. **Execute os testes acima**
2. **Me informe qual erro aparece**
3. **Vou ajudar a resolver o problema específico**

## URLs de Teste

- **Teste de configuração**: `GET /api/test-email`
- **Teste de envio**: `POST /api/auth/forgot-password-temp`
- **Interface de login**: `GET /login`
