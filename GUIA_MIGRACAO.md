# 📋 GUIA COMPLETO DE MIGRAÇÃO DO SISTEMA

## 🎯 Como levar o sistema para outro computador

### 📦 **OPÇÃO 1: BACKUP AUTOMÁTICO (RECOMENDADO)**

#### **Passo 1: Fazer Backup no Computador Atual**

1. **Abra o PowerShell como Administrador**
2. **Navegue até a pasta do projeto:**
   ```powershell
   cd "C:\Users\FP-0001\Documents\folha-pagamento"
   ```

3. **Execute o script de backup:**
   ```powershell
   .\backup-system.ps1
   ```

4. **Aguarde a conclusão** - O script irá:
   - ✅ Fazer backup do banco de dados
   - ✅ Copiar todos os arquivos de código
   - ✅ Salvar configurações
   - ✅ Criar script de instalação automática
   - ✅ Comprimir tudo em um arquivo ZIP

#### **Passo 2: Transportar o Backup**

1. **Copie o arquivo `backup_folha_pagamento_YYYY-MM-DD_HH-mm-ss.zip`**
2. **Use um dos métodos:**
   - 📱 **Pendrive/USB**
   - ☁️ **Google Drive/OneDrive**
   - 📧 **Email (se o arquivo for pequeno)**
   - 🔗 **Transferência por rede local**

#### **Passo 3: Instalação no Novo Computador**

1. **Instale o Node.js** (versão 18 ou superior):
   - Acesse: https://nodejs.org/
   - Baixe a versão LTS
   - Execute o instalador

2. **Extraia o backup** em uma pasta (ex: `C:\folha-pagamento`)

3. **Execute o script de instalação:**
   ```cmd
   INSTALAR.bat
   ```

4. **Inicie o sistema:**
   ```cmd
   npm run dev
   ```

---

### 🔧 **OPÇÃO 2: BACKUP MANUAL**

#### **Arquivos Essenciais para Copiar:**

```
folha-pagamento/
├── 📁 src/                    # Código fonte completo
├── 📁 prisma/                 # Schema do banco de dados
├── 📁 public/                 # Arquivos estáticos
├── 📄 folha_pagamento.db      # BANCO DE DADOS (MAIS IMPORTANTE!)
├── 📄 package.json            # Dependências
├── 📄 next.config.js          # Configuração do Next.js
├── 📄 tailwind.config.js      # Configuração do Tailwind
├── 📄 tsconfig.json           # Configuração do TypeScript
├── 📄 .env.local              # Variáveis de ambiente
├── 📄 server.js               # Servidor customizado
└── 📄 README.md               # Documentação
```

#### **Passo a Passo Manual:**

1. **Copie TODA a pasta do projeto**
2. **No novo computador:**
   ```cmd
   cd "caminho\para\folha-pagamento"
   npm install
   npx prisma generate
   npm run dev
   ```

---

### ⚠️ **IMPORTANTE: Verificações**

#### **Antes de Fazer Backup:**
- ✅ Sistema está funcionando normalmente
- ✅ Todos os dados estão salvos
- ✅ Não há erros no console

#### **Após Instalação no Novo Computador:**
- ✅ Node.js instalado corretamente
- ✅ Banco de dados carregado (`folha_pagamento.db`)
- ✅ Sistema inicia sem erros
- ✅ Dados dos funcionários aparecem
- ✅ Export de PDF funciona

---

### 🚨 **SOLUÇÃO DE PROBLEMAS**

#### **Erro: "Node.js não encontrado"**
```cmd
# Instalar Node.js
# Baixar de: https://nodejs.org/
```

#### **Erro: "Dependências não instaladas"**
```cmd
npm install
```

#### **Erro: "Prisma não configurado"**
```cmd
npx prisma generate
npx prisma db push
```

#### **Banco de dados não carrega:**
1. Verifique se `folha_pagamento.db` está na pasta raiz
2. Execute: `npx prisma db push`

#### **Sistema não inicia:**
```cmd
# Limpar cache e reinstalar
rm -rf node_modules
rm -rf .next
npm install
npm run dev
```

---

### 📊 **ESTRUTURA DO BANCO DE DADOS**

O banco de dados SQLite (`folha_pagamento.db`) contém:

- **👥 Funcionários** - Dados pessoais e profissionais
- **💰 Holerites** - Folhas de pagamento geradas
- **📋 Rubricas** - Configurações de benefícios/descontos
- **🏢 Configurações** - Dados da empresa
- **👤 Usuários** - Contas de acesso ao sistema

**⚠️ CRÍTICO:** Sem este arquivo, todos os dados serão perdidos!

---

### 💡 **DICAS IMPORTANTES**

#### **Para Backup Regular:**
- Execute o script de backup semanalmente
- Mantenha backups em locais diferentes
- Teste a restauração periodicamente

#### **Para Migração:**
- Use sempre o script automático
- Verifique se o Node.js está atualizado
- Teste todas as funcionalidades após migração

#### **Segurança:**
- O banco SQLite é portável e seguro
- Não precisa de servidor de banco separado
- Backup completo em um único arquivo

---

### 🎯 **CHECKLIST DE MIGRAÇÃO**

#### **No Computador Atual:**
- [ ] Sistema funcionando
- [ ] Backup executado com sucesso
- [ ] Arquivo ZIP criado
- [ ] Backup copiado para transporte

#### **No Novo Computador:**
- [ ] Node.js instalado
- [ ] Backup extraído
- [ ] Script de instalação executado
- [ ] Sistema iniciado (`npm run dev`)
- [ ] Dados carregados corretamente
- [ ] Funcionalidades testadas

---

### 📞 **SUPORTE**

Se encontrar problemas:

1. **Verifique os logs** no console
2. **Execute os comandos** de solução de problemas
3. **Verifique se todos os arquivos** foram copiados
4. **Teste em ambiente limpo** se necessário

**O sistema é totalmente portável e deve funcionar em qualquer computador com Node.js!** 🚀
