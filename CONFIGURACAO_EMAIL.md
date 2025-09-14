# Configuração de Email - Google Workspace

## Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Email Configuration (Google Workspace)
EMAIL_USER="seu-email@empresa.com"
EMAIL_APP_PASSWORD="sua-senha-de-app-do-google"
```

## Como Configurar o Google Workspace

### 1. Ativar Verificação em Duas Etapas
- Acesse: https://myaccount.google.com/security
- Ative a "Verificação em duas etapas" se ainda não estiver ativada

### 2. Gerar Senha de App
- Ainda na página de segurança, procure por "Senhas de app"
- Clique em "Senhas de app"
- Selecione "Outro (nome personalizado)"
- Digite um nome como "Sistema Folha de Pagamento"
- Clique em "Gerar"
- **COPIE A SENHA GERADA** - ela só aparece uma vez!

### 3. Configurar no Sistema
- Use seu e-mail do Google Workspace no `EMAIL_USER`
- Use a senha de app gerada no `EMAIL_APP_PASSWORD`

## Testando a Configuração

Após configurar, você pode testar se está funcionando:

1. Acesse a página de login
2. Clique em "Esqueci minha senha"
3. Digite um e-mail cadastrado no sistema
4. Verifique se o e-mail foi recebido

## Segurança

- **NUNCA** use sua senha normal do Google
- Use apenas senhas de app para aplicações
- Mantenha as variáveis de ambiente seguras
- Revogue senhas de app não utilizadas

## Solução de Problemas

### Erro: "Invalid login"
- Verifique se a verificação em duas etapas está ativada
- Confirme se está usando a senha de app, não a senha normal
- Verifique se o e-mail está correto

### E-mail não chega
- Verifique a pasta de spam
- Confirme se o e-mail está cadastrado no sistema
- Verifique os logs do servidor para erros

### Erro de conexão
- Verifique se as variáveis de ambiente estão corretas
- Confirme se a internet está funcionando
- Verifique se o Google Workspace permite conexões de aplicações
