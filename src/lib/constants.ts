// Constantes da aplicação
export const APP_CONFIG = {
  name: 'Sistema de Folha de Pagamento',
  version: '1.0.0',
  description: 'Sistema completo de gestão de folha de pagamento',
} as const

// Constantes de API
export const API_ENDPOINTS = {
  employees: '/api/employees',
  payroll: '/api/payroll',
  receipts: '/api/receipts',
  users: '/api/users',
  dashboard: '/api/dashboard',
  companySettings: '/api/company-settings',
} as const

// Constantes de query keys
export const QUERY_KEYS = {
  employees: ['employees'],
  payrolls: ['payrolls'],
  receipts: ['receipts'],
  users: ['users'],
  dashboard: ['dashboard'],
  companySettings: ['company-settings'],
} as const

// Constantes de roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const

// Constantes de status
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

// Constantes de tipos de recibo
export const RECEIPT_TYPES = {
  TRANSPORT: 'vale_transporte',
  FOOD: 'vale_alimentacao',
  FUEL: 'vale_combustivel',
} as const

// Constantes de meses
export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const

// Constantes de departamentos comuns
export const COMMON_DEPARTMENTS = [
  'Administração',
  'Recursos Humanos',
  'Financeiro',
  'Vendas',
  'Marketing',
  'Tecnologia da Informação',
  'Operações',
  'Atendimento ao Cliente',
] as const

// Constantes de cargos comuns
export const COMMON_POSITIONS = [
  'Analista',
  'Assistente',
  'Coordenador',
  'Diretor',
  'Gerente',
  'Supervisor',
  'Técnico',
  'Desenvolvedor',
  'Designer',
  'Vendedor',
] as const

// Constantes de validação
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 6,
  MIN_NAME_LENGTH: 2,
  MIN_USERNAME_LENGTH: 3,
  CPF_LENGTH: 11,
  CNPJ_LENGTH: 14,
  MAX_SALARY: 999999.99,
  MIN_SALARY: 0,
} as const

// Constantes de formatação
export const FORMAT_PATTERNS = {
  CPF: '###.###.###-##',
  CNPJ: '##.###.###/####-##',
  PHONE: '(##) #####-####',
  CEP: '#####-###',
} as const
