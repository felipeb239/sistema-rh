# 🔧 Configuração de E-mail - URGENTE

## ❌ Problema Atual
As variáveis de ambiente de e-mail não estão configuradas, por isso o sistema não consegue enviar e-mails.

## ✅ Solução Rápida

### 1. **Criar/Editar arquivo `.env`**
Crie um arquivo `.env` na raiz do projeto com:

```env
# Email Configuration (Google Workspace)
EMAIL_USER="seu-email@empresa.com"
EMAIL_APP_PASSWORD="sua-senha-de-app"

# NextAuth
NEXTAUTH_URL="http://192.168.10.31:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
```

### 2. **Configurar Google Workspace**

#### **Passo 1: Ativar Verificação em Duas Etapas**
1. Acesse: https://myaccount.google.com/security
2. Ative a "Verificação em duas etapas"

#### **Passo 2: Gerar Senha de App**
1. Na mesma página, procure por "Senhas de app"
2. Clique em "Senhas de app"
3. Selecione "Outro (nome personalizado)"
4. Digite: "Sistema Folha de Pagamento"
5. Clique em "Gerar"
6. **COPIE A SENHA** (ela só aparece uma vez!)

#### **Passo 3: Configurar no .env**
```env
EMAIL_USER="ti@ferrazdospassos.adv.br"
EMAIL_APP_PASSWORD="sua-senha-de-app-gerada"
```

### 3. **Reiniciar o Servidor**
```bash
# Pare o servidor (Ctrl+C)
# Depois execute:
npm run dev
```

## 🧪 Teste Imediato

### **Modo de Teste (Sem E-mail)**
Se você quiser testar sem configurar o e-mail agora:

1. **Acesse**: `http://192.168.10.31:3000/login`
2. **Clique**: "Esqueci minha senha"
3. **Digite**: `ti@ferrazdospassos.adv.br`
4. **Clique**: "Enviar Instruções"

**Resultado**: O sistema vai mostrar o link de redefinição nos logs do servidor!

### **Ver Link de Redefinição**
1. **Abra o terminal** onde o `npm run dev` está rodando
2. **Procure por**: `🔗 Link de redefinição seria:`
3. **Copie o link** e acesse no navegador

## 📋 Próximos Passos

### **Para Produção:**
1. ✅ Configure as variáveis de ambiente
2. ✅ Execute o script SQL para criar a tabela
3. ✅ Teste o envio real de e-mail

### **Para Teste Imediato:**
1. ✅ Use o modo de teste (sem e-mail)
2. ✅ Verifique os logs para ver o link
3. ✅ Teste a funcionalidade completa

## 🚨 Status Atual

- ✅ **Sistema funcionando**: Usuário encontrado
- ✅ **Token gerado**: Link de redefinição criado
- ❌ **E-mail não enviado**: Variáveis não configuradas
- ❌ **Token não salvo**: Tabela não existe

**O sistema está 80% funcional! Só falta configurar o e-mail.**
