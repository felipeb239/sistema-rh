# Sistema de Recuperação de Senha

## Funcionalidades Implementadas

### 1. Interface de Login
- ✅ Link "Esqueci minha senha" na página de login
- ✅ Modal para inserir e-mail de recuperação
- ✅ Validação de e-mail em tempo real

### 2. APIs Criadas
- ✅ `POST /api/auth/forgot-password` - Solicitar redefinição de senha
- ✅ `POST /api/auth/reset-password` - Redefinir senha com token
- ✅ `GET /api/auth/verify-reset-token` - Verificar validade do token

### 3. Página de Redefinição
- ✅ `/reset-password` - Página para redefinir senha
- ✅ Validação de token antes de permitir redefinição
- ✅ Interface para inserir nova senha
- ✅ Confirmação de senha
- ✅ Mostrar/ocultar senha

### 4. Sistema de E-mail
- ✅ Integração com Google Workspace
- ✅ Template HTML responsivo
- ✅ Template de texto simples
- ✅ Configuração via variáveis de ambiente

## Como Usar

### Para o Usuário
1. Na página de login, clique em "Esqueci minha senha"
2. Digite seu e-mail cadastrado no sistema
3. Verifique sua caixa de entrada (e spam)
4. Clique no link do e-mail recebido
5. Digite sua nova senha
6. Confirme a nova senha
7. Faça login com a nova senha

### Para o Administrador
1. Configure as variáveis de ambiente (veja CONFIGURACAO_EMAIL.md)
2. Execute a migração do banco de dados
3. Teste o sistema com um usuário cadastrado

## Segurança

- ✅ Tokens expiram em 24 horas
- ✅ Tokens são únicos e aleatórios
- ✅ Tokens são removidos após uso
- ✅ Validação de usuário ativo
- ✅ Senhas são criptografadas
- ✅ E-mails não revelam informações sensíveis

## Configuração Necessária

### 1. Variáveis de Ambiente
```env
EMAIL_USER="seu-email@empresa.com"
EMAIL_APP_PASSWORD="sua-senha-de-app"
```

### 2. Banco de Dados
Execute o script SQL em `migrations/add-password-reset-tokens.sql`

### 3. Google Workspace
Siga as instruções em `CONFIGURACAO_EMAIL.md`

## Estrutura do Banco

### Tabela: password_reset_tokens
- `id` - Identificador único
- `email` - E-mail do usuário (único)
- `token` - Token de redefinição (único)
- `expires_at` - Data de expiração
- `created_at` - Data de criação

## Fluxo de Funcionamento

1. **Solicitação**: Usuário clica em "Esqueci minha senha"
2. **Validação**: Sistema verifica se e-mail existe e usuário está ativo
3. **Token**: Gera token único com expiração de 24h
4. **E-mail**: Envia e-mail com link de redefinição
5. **Redefinição**: Usuário acessa link e define nova senha
6. **Limpeza**: Token é removido após uso

## Testando o Sistema

### Teste Manual
1. Acesse `/login`
2. Clique em "Esqueci minha senha"
3. Digite um e-mail válido cadastrado
4. Verifique o e-mail recebido
5. Clique no link
6. Redefina a senha
7. Faça login com a nova senha

### Teste de Segurança
- ✅ Token expira após 24h
- ✅ Token é removido após uso
- ✅ E-mail inexistente não gera erro
- ✅ Token inválido é rejeitado
- ✅ Usuário inativo é rejeitado

## Solução de Problemas

### E-mail não chega
- Verifique configuração do Google Workspace
- Confirme se e-mail está cadastrado
- Verifique pasta de spam

### Token inválido
- Verifique se token não expirou
- Confirme se token não foi usado
- Verifique se usuário está ativo

### Erro de configuração
- Verifique variáveis de ambiente
- Confirme se banco de dados está configurado
- Verifique logs do servidor
