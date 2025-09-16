# Sistema de Folha de Pagamento - Next.js

Sistema completo de gestão de folha de pagamento desenvolvido com Next.js 14, TypeScript, SQLite e Prisma ORM.

## 🚀 Funcionalidades

### 🔐 Autenticação e Segurança
- **Sistema de Login**: Autenticação segura com NextAuth.js
- **Middleware de Proteção**: Rotas protegidas automaticamente
- **Sessões Seguras**: Gerenciamento de sessões com JWT
- **Controle de Acesso**: Diferentes níveis de usuário
- **Recuperação de Senha**: Sistema completo com tokens seguros
- **Validação de Tokens**: Verificação de expiração e segurança
- **Banco de Tokens**: Armazenamento seguro de tokens de reset

### 👥 Gestão de Funcionários
- **CRUD Completo**: Cadastro, edição, visualização e exclusão
- **Validação de CPF**: Validação automática de CPF brasileiro com máscara
- **Máscara de Salário**: Formatação automática em moeda brasileira
- **Campo CBO**: Código Brasileiro de Ocupações para classificação profissional
- **Busca Inteligente**: Sistema de busca em tempo real
- **Dados Completos**: Nome, CPF, cargo, departamento, CBO, data de admissão, salário
- **Modal de Confirmação**: Interface elegante para confirmações de exclusão
- **CPF Flexível**: Permite cadastro de funcionários com mesmo CPF (recontratação)

### 💰 Holerites (Folha de Pagamento)
- **Cálculos Automáticos**: INSS, FGTS e IRRF baseados nas tabelas oficiais
- **Salário Base Editável**: Permite editar o salário base para casos específicos (funcionários admitidos no meio do mês)
- **Campos Simplificados**: Interface limpa e focada nos campos essenciais
- **Sistema de Rubricas**: Aplicação e cópia de rubricas entre funcionários
- **Descontos Personalizados**: Campo para descontos específicos com descrição
- **Plano de Saúde e Odontológico**: Gestão de benefícios
- **Exportação Individual**: PDF e CSV para cada holerite
- **Validação de Duplicatas**: Prevenção de holerites duplicados por funcionário/mês/ano
- **Sistema de Recuperação de Senha**: Reset de senha via email com tokens seguros
- **Interface Limpa**: Sem valores de referência desnecessários (ex: INSS)
- **Múltiplos Empréstimos**: Permite cadastrar vários empréstimos do mesmo tipo para um funcionário

### 📊 Folha de Pagamento (Gestão Consolidada)
- **Dashboard Executivo**: Visão geral com métricas principais
- **Geração em Lote**: Criação automática de holerites para múltiplos funcionários
- **Filtros por Período**: Mês e ano selecionáveis
- **Exportação Completa**: PDF otimizado da folha completa
- **Gestão de Status**: Controle de holerites emitidos
- **Exclusão em Lote**: Remoção de holerites por período
- **Interface Intuitiva**: Fluxo simplificado para RH
- **Relatórios Detalhados**: Cards destacados com descontos e proventos separados
- **Cards de Descontos**: INSS, IRRF, Planos de Saúde/Odontológico, Empréstimos
- **Cards de Proventos**: Salário Base, Benefícios e Totais
- **Layout Profissional**: Tabelas com alinhamento proporcional e fonte consistente

### 🧮 Gestão de Rubricas
- **Rubricas Globais**: Criação e gestão de rubricas padrão
- **Rubricas por Funcionário**: Aplicação específica com valores customizados
- **Tipos Flexíveis**: Benefícios e descontos
- **Valores Dinâmicos**: Valores fixos ou percentuais
- **Período de Vigência**: Controle de data de início e fim
- **Duplicatas Permitidas**: Mesmo nome para diferentes funcionários
- **Interface Expandível**: Visualização clara das rubricas aplicadas

### 📄 Recibos
- **Tipos Dinâmicos**: Criação e gestão de tipos de recibos personalizados
- **Valores Flexíveis**: Cálculo automático baseado em valor diário e dias
- **Paginação Inteligente**: 15 recibos por página com navegação
- **Filtros por Período**: Filtro por ano e mês
- **Estatísticas Precisas**: Totais sempre baseados no período selecionado
- **Exportação Individual**: PDF e CSV para cada recibo
- **Busca Avançada**: Sistema de busca por funcionário e tipo
- **PDF Otimizado**: Layout compacto em formato de holerite com duas vias em uma página
- **Layout Profissional**: Via da empresa e via do funcionário lado a lado
- **Cópia de Recibos**: Sistema para copiar recibos do mês anterior
- **Seleção Múltipla**: Checkbox para selecionar vários recibos
- **Exclusão em Lote**: Excluir múltiplos recibos selecionados
- **Edição Inteligente**: Campos preenchidos automaticamente ao editar
- **Headers Fixos**: Cabeçalhos que permanecem visíveis durante o scroll

### 🏢 Configurações da Empresa
- **Upload de Logo**: Sistema de upload com drag & drop
- **Dados da Empresa**: Nome, CNPJ, endereço e contatos
- **Integração Visual**: Logo exibida na sidebar e relatórios
- **Validação de Arquivos**: Suporte a imagens com validação

### 📞 Secretaria
- **Lista Telefônica**: Gestão de contatos telefônicos
- **Contatos de Clientes**: Cadastro e organização de clientes
- **Registro de Ligações**: Sistema para registrar chamadas recebidas
- **Busca Inteligente**: Filtros por nome, telefone e empresa
- **Interface Unificada**: Tabs para diferentes funcionalidades
- **CRUD Completo**: Criação, edição e exclusão de contatos

### 🎨 Interface e UX
- **Design Moderno**: Interface limpa e profissional
- **Tema Escuro/Claro**: Sistema de temas com preferência por usuário
- **Tema Personalizado**: Cores em tons de cinza e preto
- **Responsivo**: Funciona perfeitamente em mobile e desktop
- **Modais Elegantes**: Confirmações com design profissional
- **Loading States**: Feedback visual durante operações
- **Toast Notifications**: Notificações de sucesso e erro
- **Tabs Prominentes**: Interface destacada para funcionalidades principais
- **Contraste Otimizado**: Cores ajustadas para melhor legibilidade
- **Headers Fixos**: Cabeçalhos que permanecem visíveis durante o scroll

## 🛠️ Tecnologias

### Frontend
- **Next.js 14**: Framework React com App Router
- **React 18**: Biblioteca de interface
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Framework de estilos
- **Radix UI**: Componentes acessíveis
- **TanStack Query**: Gerenciamento de estado e cache
- **Lucide React**: Ícones modernos
- **next-themes**: Gerenciamento de temas escuro/claro
- **Sonner**: Sistema de notificações toast

### Backend
- **Next.js API Routes**: API integrada
- **PostgreSQL**: Banco de dados robusto e escalável
- **Prisma ORM**: Mapeamento objeto-relacional
- **NextAuth.js**: Autenticação
- **bcryptjs**: Hash de senhas
- **Sistema de Tokens**: Gerenciamento seguro de tokens de reset

### Utilitários
- **jsPDF + html2canvas**: Geração de PDFs
- **csv-writer**: Exportação CSV
- **Zod**: Validação de dados
- **date-fns**: Manipulação de datas

## 📋 Pré-requisitos

- **Node.js 18+**
- **npm ou yarn**

## 🚀 Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd folha-pagamento
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env.local
```

Edite o arquivo `.env.local`:
```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/folha_pagamento?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
NODE_ENV="development"
EMAIL_USER="your-email@domain.com"
EMAIL_APP_PASSWORD="your-app-password"
```

4. **Configure o banco de dados**
```bash
# Gerar o cliente Prisma
npx prisma generate

# Sincronizar o schema com o banco
npx prisma db push

# Popular o banco com dados iniciais
npx prisma db seed
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

6. **Acesse a aplicação**
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 👤 Usuários Padrão

Após executar o seed, você terá os seguintes usuários:

- **Admin**: usuário `admin`, senha `admin`
- **Usuário**: usuário `user`, senha `user`

## 📁 Estrutura do Projeto

```
src/
├── app/                           # App Router do Next.js
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Autenticação
│   │   ├── employees/            # Funcionários
│   │   ├── payroll/              # Holerites
│   │   ├── receipts/             # Recibos
│   │   ├── export/               # Exportações
│   │   ├── reports/              # Relatórios
│   │   └── company-settings/     # Configurações
│   ├── employees/                # Página de funcionários
│   ├── payroll/                  # Página de holerites
│   ├── rubrics/                  # Página de rubricas
│   ├── receipts/                 # Página de recibos
│   ├── secretaria/               # Página de secretaria
│   ├── users/                    # Página de usuários
│   ├── settings/                 # Página de configurações
│   ├── login/                    # Página de login
│   └── page.tsx                  # Dashboard
├── components/                    # Componentes React
│   ├── ui/                      # Componentes base da UI
│   ├── layout/                  # Componentes de layout
│   ├── employees/               # Componentes de funcionários
│   ├── payroll/                 # Componentes de holerites
│   ├── rubrics/                 # Componentes de rubricas
│   ├── receipts/                # Componentes de recibos
│   ├── secretaria/              # Componentes de secretaria
│   ├── users/                   # Componentes de usuários
│   └── dashboard/               # Componentes do dashboard
├── lib/                         # Utilitários e configurações
│   ├── auth.ts                  # Configuração do NextAuth
│   ├── prisma.ts                # Cliente Prisma
│   ├── utils.ts                 # Funções utilitárias
│   ├── formatters.ts            # Formatadores de dados
│   └── employee-rubrics.ts      # Cálculos de rubricas
├── hooks/                       # Custom hooks
├── types/                       # Definições de tipos TypeScript
└── middleware.ts                # Middleware de autenticação
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera a build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
- `npx prisma generate` - Gera o cliente Prisma
- `npx prisma db push` - Sincroniza o schema com o banco
- `npx prisma db seed` - Popula o banco com dados iniciais
- `npx prisma studio` - Abre o Prisma Studio

## 🎨 Funcionalidades Principais

### Dashboard
- **Visão Geral**: Estatísticas em tempo real
- **Filtros Anuais**: Exportação por ano selecionado
- **Ações Rápidas**: Acesso direto às principais funcionalidades
- **Métricas Financeiras**: Totais de salários, descontos e benefícios

### Gestão de Funcionários
- **Cadastro Completo**: Dados pessoais e profissionais
- **Validação de CPF**: Verificação automática de CPF válido
- **Busca Inteligente**: Filtros em tempo real
- **Modal de Confirmação**: Interface elegante para exclusões
- **Salário Médio**: Cálculo automático e exibição correta

### Holerites (Edição Individual)
- **Cálculos Automáticos**: 
  - INSS baseado nas tabelas oficiais
  - FGTS de 8% sobre salário bruto
  - IRRF editável manualmente
- **Sistema de Rubricas**: Aplicação e cópia entre funcionários
- **Campos Simplificados**: Interface focada nos essenciais
- **Descontos Personalizados**: Campo com descrição para casos específicos
- **Exportação Individual**: PDF e CSV para cada holerite
- **Validação de Duplicatas**: Prevenção de holerites duplicados

### Folha de Pagamento (Gestão Consolidada)
- **Dashboard Executivo**: Métricas principais em cards destacados
- **Geração em Lote**: Criação automática para múltiplos funcionários
- **Filtros Intuitivos**: Seleção de mês e ano
- **Exportação Completa**: PDF otimizado da folha consolidada
- **Gestão de Status**: Controle de holerites emitidos
- **Exclusão em Lote**: Remoção por período
- **Interface Guiada**: Fluxo passo a passo para RH

### Gestão de Rubricas
- **Rubricas Globais**: Criação de rubricas padrão do sistema
- **Rubricas por Funcionário**: Aplicação específica com customização
- **Tipos Flexíveis**: Benefícios (verde) e descontos (vermelho)
- **Valores Dinâmicos**: Valores fixos ou percentuais do salário
- **Período de Vigência**: Controle de data de início e fim
- **Interface Expandível**: Clique no funcionário para ver rubricas
- **Edição Inline**: Modificar rubricas existentes facilmente

### Recibos
- **Tipos Dinâmicos**: Criação e gestão de tipos personalizados
- **Paginação Inteligente**: 15 recibos por página
- **Filtros por Período**: Ano e mês selecionáveis
- **Estatísticas Precisas**: Totais baseados no período filtrado
- **Exportação Individual**: PDF e CSV para cada recibo
- **Busca Avançada**: Por funcionário e tipo de recibo
- **PDF Profissional**: Layout em formato de holerite com duas vias
- **Layout Compacto**: Via da empresa e via do funcionário em uma única página
- **Design Otimizado**: Cabeçalhos padronizados e alinhamento perfeito

### Configurações
- **Upload de Logo**: Sistema drag & drop com preview
- **Dados da Empresa**: Informações completas
- **Integração Visual**: Logo na sidebar e relatórios
- **Validação de Arquivos**: Suporte a imagens

## 🔒 Segurança

- **Autenticação Robusta**: NextAuth.js com JWT
- **Middleware de Proteção**: Rotas protegidas automaticamente
- **Validação de Dados**: Validação em frontend e backend
- **Sanitização**: Limpeza de inputs maliciosos
- **Controle de Sessão**: Gerenciamento seguro de sessões

## 📊 Banco de Dados

### Tabelas Principais
- `users` - Usuários do sistema com preferências de tema
- `employees` - Funcionários com CBO e máscaras de entrada
- `payrolls` - Holerites com cálculos automáticos e salário editável
- `receipts` - Recibos com tipos dinâmicos e cópia de mês anterior
- `receipt_types` - Tipos de recibos personalizáveis
- `payroll_rubrics` - Rubricas de folha de pagamento
- `employee_rubrics` - Rubricas aplicadas por funcionário (múltiplos empréstimos)
- `company_settings` - Configurações da empresa
- `password_reset_tokens` - Tokens seguros para recuperação de senha
- `customer_contacts` - Contatos de clientes da secretaria
- `phone_directory` - Lista telefônica da secretaria
- `call_logs` - Registro de ligações recebidas

### Relacionamentos
- Funcionários → Holerites (1:N)
- Funcionários → Recibos (1:N)
- Funcionários → Rubricas (N:N via employee_rubrics)
- Tipos de Recibos → Recibos (1:N)
- Rubricas → Aplicação em Funcionários (N:N)

## 📦 Backup e Migração

### Backup Automático
```powershell
# Execute o script de backup
.\backup-simple.ps1
```

### Migração para Novo Computador
1. **Instale Node.js** (versão 18+)
2. **Extraia o backup** em uma pasta
3. **Execute:** `INSTALAR.bat`
4. **Inicie:** `npm run dev`

### Arquivos Essenciais
- `folha_pagamento.db` - **BANCO DE DADOS (CRÍTICO)**
- `src/` - Código fonte
- `prisma/` - Schema do banco
- `package.json` - Dependências
- `.env.local` - Configurações

## 🚀 Deploy

### Produção
1. Configure as variáveis de ambiente de produção
2. Execute `npm run build`
3. Execute `npm run start`

### Variáveis de Ambiente Necessárias
```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/folha_pagamento?schema=public"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key"
NODE_ENV="production"
EMAIL_USER="your-email@domain.com"
EMAIL_APP_PASSWORD="your-app-password"
```

## 🎯 Melhorias Implementadas

### Interface e UX
- ✅ Modal de confirmação elegante em todo o sistema
- ✅ Sistema de temas escuro/claro com preferência por usuário
- ✅ Tema personalizado em tons de cinza e preto
- ✅ Interface responsiva para mobile e desktop
- ✅ Loading states e feedback visual
- ✅ Toast notifications para feedback
- ✅ Tabs com destaque visual para funcionalidades principais
- ✅ Tabelas com alinhamento proporcional e consistente
- ✅ Cards padronizados com tamanhos de fonte uniformes
- ✅ Contraste otimizado para melhor legibilidade
- ✅ Headers fixos que permanecem visíveis durante o scroll

### Funcionalidades
- ✅ Sistema de rubricas completo e funcional
- ✅ Rubricas específicas por funcionário com valores customizados
- ✅ Cálculos automáticos de INSS e FGTS
- ✅ Exportação individual de PDF e CSV
- ✅ Exportação consolidada da folha completa
- ✅ Geração em lote de holerites
- ✅ Gestão de rubricas com interface expandível
- ✅ Paginação inteligente de recibos
- ✅ Filtros por período
- ✅ Upload de logo da empresa
- ✅ CPF flexível para recontratação de funcionários
- ✅ PDF de recibos otimizado em formato de holerite
- ✅ Sistema de recuperação de senha via email
- ✅ Tokens seguros com expiração automática
- ✅ Interface limpa sem valores de referência desnecessários
- ✅ Máscaras de entrada para CPF e valores monetários
- ✅ Campo CBO para classificação profissional
- ✅ Salário base editável para casos específicos
- ✅ Múltiplos empréstimos do mesmo tipo por funcionário
- ✅ Cópia de recibos do mês anterior
- ✅ Seleção múltipla e exclusão em lote de recibos
- ✅ Edição inteligente com campos preenchidos automaticamente
- ✅ Sistema de temas com preferência por usuário

### Performance e Estabilidade
- ✅ APIs otimizadas e funcionais
- ✅ Validação de duplicatas
- ✅ Cálculos precisos e automáticos
- ✅ Sistema de cache com TanStack Query
- ✅ Tratamento de erros robusto
- ✅ Banco SQLite portável e rápido

### PDFs e Relatórios
- ✅ Layout compacto de recibos em uma página
- ✅ Duas vias (empresa e funcionário) lado a lado
- ✅ Cabeçalhos padronizados e alinhados
- ✅ Design profissional em formato de holerite
- ✅ Labels colados aos valores para melhor legibilidade
- ✅ Exportação da folha consolidada em PDF
- ✅ Layout otimizado para impressão A4
- ✅ Cards detalhados de descontos e proventos
- ✅ Separação visual entre INSS, IRRF, Planos e Benefícios
- ✅ Títulos de colunas alinhados proporcionalmente aos dados
- ✅ Fontes consistentes em todos os cards

### Segurança e Autenticação
- ✅ Sistema de recuperação de senha completo
- ✅ Tokens seguros com hash criptográfico
- ✅ Validação de expiração de tokens
- ✅ Banco de tokens com limpeza automática
- ✅ Interface de reset de senha responsiva
- ✅ Configuração de email para envio de tokens

### Backup e Portabilidade
- ✅ Script de backup automático
- ✅ Banco PostgreSQL robusto e escalável
- ✅ Migração simples para novo computador
- ✅ Instalação automática com script
- ✅ Documentação completa de migração

## 🔄 Fluxo de Trabalho Recomendado

1. **Cadastre Funcionários** na aba "Funcionários"
2. **Configure Rubricas Globais** na aba "Rubricas"
3. **Aplique Rubricas por Funcionário** na aba "Rubricas"
4. **Gere a Folha em Lote** na aba "Folha de Pagamento"
5. **Edite Holerites Individuais** se necessário
6. **Exporte a Folha Consolidada** para depósito bancário

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através dos issues do GitHub ou por email.

---

**Desenvolvido com ❤️ usando Next.js, TypeScript e PostgreSQL**

### 🎉 Sistema Totalmente Funcional e Profissional!

- ✅ **Sistema Completo** - Folha de pagamento, holerites, recibos e secretaria
- ✅ **Segurança Robusta** - Recuperação de senha e autenticação segura
- ✅ **Relatórios Detalhados** - Cards com descontos e proventos separados
- ✅ **Interface Profissional** - Layout limpo e alinhamento consistente
- ✅ **Tema Escuro/Claro** - Preferência por usuário com persistência
- ✅ **Funcionalidades Avançadas** - Cópia de recibos, seleção múltipla, edição inteligente
- ✅ **Máscaras de Entrada** - CPF e valores monetários formatados automaticamente
- ✅ **Campo CBO** - Classificação profissional brasileira
- ✅ **Múltiplos Empréstimos** - Vários empréstimos do mesmo tipo por funcionário
- ✅ **Headers Fixos** - Cabeçalhos que permanecem visíveis durante o scroll
- ✅ **Backup Automático** - Script PowerShell incluído
- ✅ **Migração Simples** - Um arquivo ZIP contém tudo
- ✅ **Banco PostgreSQL** - Robusto, escalável e profissional
- ✅ **Instalação Automática** - Script de instalação incluído
- ✅ **Documentação Completa** - Guias detalhados incluídos