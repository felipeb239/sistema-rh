# Sistema de Folha de Pagamento - Next.js

Sistema completo de gestão de folha de pagamento desenvolvido com Next.js 14, TypeScript, PostgreSQL e Prisma ORM.

## 🚀 Funcionalidades

### 🔐 Autenticação e Segurança
- **Sistema de Login**: Autenticação segura com NextAuth.js
- **Middleware de Proteção**: Rotas protegidas automaticamente
- **Sessões Seguras**: Gerenciamento de sessões com JWT
- **Controle de Acesso**: Diferentes níveis de usuário

### 👥 Gestão de Funcionários
- **CRUD Completo**: Cadastro, edição, visualização e exclusão
- **Validação de CPF**: Validação automática de CPF brasileiro
- **Busca Inteligente**: Sistema de busca em tempo real
- **Dados Completos**: Nome, CPF, cargo, departamento, data de admissão, salário
- **Modal de Confirmação**: Interface elegante para confirmações de exclusão
- **CPF Flexível**: Permite cadastro de funcionários com mesmo CPF (recontratação)

### 💰 Holerites (Folha de Pagamento)
- **Cálculos Automáticos**: INSS, FGTS e IRRF baseados nas tabelas oficiais de 2024
- **Salário Base Automático**: Preenchido automaticamente com o salário do funcionário
- **Campos Simplificados**: Interface limpa e focada nos campos essenciais
- **Sistema de Rubricas**: Aplicação e cópia de rubricas entre funcionários
- **Descontos Personalizados**: Campo para descontos específicos com descrição
- **Plano de Saúde e Odontológico**: Gestão de benefícios
- **Exportação Individual**: PDF e CSV para cada holerite
- **Validação de Duplicatas**: Prevenção de holerites duplicados por funcionário/mês/ano

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

### 📊 Dashboard e Relatórios
- **Visão Geral**: Estatísticas em tempo real do sistema
- **Filtros Anuais**: Exportação de relatórios por ano
- **Exportação em Massa**: PDF e CSV para todos os dados
- **Gráficos Interativos**: Visualização de dados financeiros
- **Métricas de Performance**: Indicadores de uso do sistema

### 🏢 Configurações da Empresa
- **Upload de Logo**: Sistema de upload com drag & drop
- **Dados da Empresa**: Nome, CNPJ, endereço e contatos
- **Integração Visual**: Logo exibida na sidebar e relatórios
- **Validação de Arquivos**: Suporte a imagens com validação

### 🎨 Interface e UX
- **Design Moderno**: Interface limpa e profissional
- **Tema Personalizado**: Cores em tons de cinza e preto
- **Responsivo**: Funciona perfeitamente em mobile e desktop
- **Modais Elegantes**: Confirmações com design profissional
- **Loading States**: Feedback visual durante operações
- **Toast Notifications**: Notificações de sucesso e erro

## 🛠️ Tecnologias

### Frontend
- **Next.js 14**: Framework React com App Router
- **React 18**: Biblioteca de interface
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Framework de estilos
- **Radix UI**: Componentes acessíveis
- **TanStack Query**: Gerenciamento de estado e cache
- **Lucide React**: Ícones modernos

### Backend
- **Next.js API Routes**: API integrada
- **PostgreSQL**: Banco de dados relacional
- **Prisma ORM**: Mapeamento objeto-relacional
- **NextAuth.js**: Autenticação
- **bcryptjs**: Hash de senhas

### Utilitários
- **PDFKit**: Geração de PDFs
- **csv-writer**: Exportação CSV
- **Zod**: Validação de dados
- **date-fns**: Manipulação de datas

## 📋 Pré-requisitos

- **Node.js 18+**
- **PostgreSQL 13+**
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

3. **Configure o banco de dados**
```bash
# Crie um banco PostgreSQL
createdb folha_pagamento
```

4. **Configure as variáveis de ambiente**
```bash
cp env.example .env.local
```

Edite o arquivo `.env.local`:
```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/folha_pagamento?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
NODE_ENV="development"
```

5. **Configure o banco de dados**
```bash
# Gerar o cliente Prisma
npx prisma generate

# Sincronizar o schema com o banco
npx prisma db push

# Popular o banco com dados iniciais
npx prisma db seed
```

6. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

7. **Acesse a aplicação**
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
│   │   └── company-settings/     # Configurações
│   ├── employees/                # Página de funcionários
│   ├── payroll/                  # Página de holerites
│   ├── receipts/                 # Página de recibos
│   ├── settings/                 # Página de configurações
│   ├── login/                    # Página de login
│   └── page.tsx                  # Dashboard
├── components/                    # Componentes React
│   ├── ui/                      # Componentes base da UI
│   ├── layout/                  # Componentes de layout
│   ├── employees/               # Componentes de funcionários
│   ├── payroll/                 # Componentes de holerites
│   ├── receipts/                # Componentes de recibos
│   └── dashboard/               # Componentes do dashboard
├── lib/                         # Utilitários e configurações
│   ├── auth.ts                  # Configuração do NextAuth
│   ├── prisma.ts                # Cliente Prisma
│   ├── utils.ts                 # Funções utilitárias
│   └── formatters.ts            # Formatadores de dados
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

### Holerites
- **Cálculos Automáticos**: 
  - INSS baseado nas tabelas oficiais de 2024
  - FGTS de 8% sobre salário bruto
  - IRRF editável manualmente
- **Sistema de Rubricas**: Aplicação e cópia entre funcionários
- **Campos Simplificados**: Interface focada nos essenciais
- **Descontos Personalizados**: Campo com descrição para casos específicos
- **Exportação Individual**: PDF e CSV para cada holerite
- **Validação de Duplicatas**: Prevenção de holerites duplicados

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
- `users` - Usuários do sistema
- `employees` - Funcionários
- `payrolls` - Holerites com cálculos automáticos
- `receipts` - Recibos com tipos dinâmicos
- `receipt_types` - Tipos de recibos personalizáveis
- `payroll_rubrics` - Rubricas de folha de pagamento
- `company_settings` - Configurações da empresa

### Relacionamentos
- Funcionários → Holerites (1:N)
- Funcionários → Recibos (1:N)
- Tipos de Recibos → Recibos (1:N)
- Rubricas → Aplicação em Holerites (N:N)

## 🚀 Deploy

### Produção
1. Configure as variáveis de ambiente de produção
2. Execute `npm run build`
3. Execute `npm run start`

### Variáveis de Ambiente Necessárias
```env
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key"
NODE_ENV="production"
```

## 🎯 Melhorias Implementadas

### Interface e UX
- ✅ Modal de confirmação elegante em todo o sistema
- ✅ Tema personalizado em tons de cinza e preto
- ✅ Interface responsiva para mobile e desktop
- ✅ Loading states e feedback visual
- ✅ Toast notifications para feedback

### Funcionalidades
- ✅ Sistema de rubricas funcional
- ✅ Cópia de rubricas entre funcionários
- ✅ Cálculos automáticos de INSS e FGTS
- ✅ Exportação individual de PDF e CSV
- ✅ Paginação inteligente de recibos
- ✅ Filtros por período
- ✅ Upload de logo da empresa
- ✅ CPF flexível para recontratação de funcionários
- ✅ PDF de recibos otimizado em formato de holerite

### Performance e Estabilidade
- ✅ APIs otimizadas e funcionais
- ✅ Validação de duplicatas
- ✅ Cálculos precisos e automáticos
- ✅ Sistema de cache com TanStack Query
- ✅ Tratamento de erros robusto

### PDFs e Relatórios
- ✅ Layout compacto de recibos em uma página
- ✅ Duas vias (empresa e funcionário) lado a lado
- ✅ Cabeçalhos padronizados e alinhados
- ✅ Design profissional em formato de holerite
- ✅ Labels colados aos valores para melhor legibilidade

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