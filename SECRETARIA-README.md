# Secretaria - Novas Funcionalidades

## Visão Geral
Foram adicionadas duas novas funcionalidades ao sistema de Folha de Pagamento na categoria **Secretaria**:

1. **Lista Telefônica** - Gerenciamento de contatos telefônicos
2. **Cadastro** - Cadastro de fornecedores e clientes

## Estrutura do Menu

### Categoria: Secretaria
- **Lista Telefônica** (`phone-directory.html`)
- **Cadastro** (`contacts.html`)

## Funcionalidades Implementadas

### 1. Lista Telefônica (`phone-directory.html`)

#### Características:
- Cadastro de contatos com informações básicas
- Categorização por tipo (Funcionário, Fornecedor, Cliente, Outro)
- Busca e filtros por categoria
- CRUD completo (Criar, Ler, Atualizar, Deletar)
- Armazenamento local (localStorage)

#### Campos do Formulário:
- Nome (obrigatório)
- Telefone (obrigatório)
- Email
- Categoria (obrigatório)
- Departamento
- Empresa
- Observações

#### Funcionalidades:
- ✅ Adicionar novo contato
- ✅ Editar contato existente
- ✅ Excluir contato
- ✅ Busca por nome, telefone ou email
- ✅ Filtro por categoria
- ✅ Tabela responsiva
- ✅ Modais para formulários

### 2. Cadastro (`contacts.html`)

#### Características:
- Sistema de abas para separar Fornecedores e Clientes
- Cadastro completo com informações de endereço
- Status ativo/inativo
- CRUD completo
- Armazenamento local (localStorage)

#### Campos do Formulário:
- Tipo de Contato (Fornecedor/Cliente)
- Status (Ativo/Inativo)
- Nome/Razão Social (obrigatório)
- CNPJ/CPF (obrigatório)
- Telefone (obrigatório)
- Email
- Endereço completo (Endereço, Cidade, Estado, CEP)
- Observações

#### Funcionalidades:
- ✅ Abas para Fornecedores e Clientes
- ✅ Adicionar novo cadastro
- ✅ Editar cadastro existente
- ✅ Excluir cadastro
- ✅ Busca por nome, documento, telefone ou email
- ✅ Filtro por status
- ✅ Tabela responsiva
- ✅ Modais para formulários

## Arquivos Criados/Modificados

### Novos Arquivos:
- `public/phone-directory.html` - Página da Lista Telefônica
- `public/contacts.html` - Página de Cadastro
- `public/js/phoneDirectory.js` - JavaScript da Lista Telefônica
- `public/js/contacts.js` - JavaScript do Cadastro

### Arquivos Modificados:
- `public/sidebar.html` - Adicionada categoria Secretaria
- `public/style.css` - Estilos para menu com subcategorias, abas e badges
- `public/js/main.js` - Funcionalidade do menu expansível

## Estilos CSS Adicionados

### Menu com Subcategorias:
- `.nav-section` - Container da seção
- `.nav-section-header` - Cabeçalho clicável
- `.nav-submenu` - Submenu expansível
- `.sub-nav-btn` - Botões do submenu

### Abas:
- `.tabs` - Container das abas
- `.tab-btn` - Botões das abas
- `.tab-btn.active` - Aba ativa

### Badges:
- `.category-badge` - Badges de categoria
- `.status-badge` - Badges de status
- Cores diferentes para cada categoria/status

### Notificações:
- `.notification` - Sistema de notificações
- Animações de entrada/saída
- Cores por tipo (success, error, info, warning)

## Responsividade

### Desktop (>900px):
- Menu lateral completo com texto
- Subcategorias visíveis

### Tablet (≤900px):
- Menu lateral compacto
- Ícones apenas (texto oculto)
- Subcategorias funcionais

### Mobile (≤600px):
- Menu horizontal
- Layout adaptado para telas pequenas

## Armazenamento de Dados

### Lista Telefônica:
- Chave: `phoneDirectory`
- Estrutura: Array de objetos com informações de contatos

### Cadastro:
- Chave: `contactsDirectory`
- Estrutura: Array de objetos com informações completas de fornecedores/clientes

## Como Usar

### Acessar as Funcionalidades:
1. No menu lateral, clicar em "Secretaria"
2. O submenu se expandirá mostrando as duas opções
3. Clicar em "Lista Telefônica" ou "Cadastro"

### Navegação:
- **Lista Telefônica**: Gerenciar contatos telefônicos gerais
- **Cadastro**: Gerenciar fornecedores e clientes com informações completas

### Funcionalidades Comuns:
- Botão "Novo" para adicionar registros
- Tabela com busca e filtros
- Botões de edição e exclusão em cada linha
- Modais para formulários
- Confirmação para exclusões

## Tecnologias Utilizadas

- **HTML5** - Estrutura das páginas
- **CSS3** - Estilos e responsividade
- **JavaScript ES6+** - Funcionalidades e interações
- **Font Awesome** - Ícones
- **localStorage** - Armazenamento local dos dados

## Compatibilidade

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Dispositivos móveis
- ✅ Tablets

## Próximas Melhorias Sugeridas

1. **Integração com banco de dados** - Substituir localStorage por SQLite
2. **Exportação de dados** - CSV, PDF
3. **Importação em lote** - Planilhas Excel
4. **Histórico de alterações** - Log de modificações
5. **Backup automático** - Sincronização de dados
6. **Validação de CNPJ/CPF** - Verificação automática
7. **Integração com APIs** - CEP, validação de documentos
8. **Relatórios** - Estatísticas e análises
