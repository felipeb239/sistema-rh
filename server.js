const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const PDFDocument = require('pdfkit');
const multer = require('multer');
const { currency } = require('./public/utils/currency');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'folha-pagamento-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Inicializar banco de dados
const db = new sqlite3.Database('folha_pagamento.db');

// Criar tabelas
db.serialize(() => {
    // Primeiro, criar a tabela users básica se não existir
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

    // Migração: Adicionar novas colunas se não existirem
    db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.log('Erro ao adicionar coluna role:', err.message);
        }
    });

    db.run(`ALTER TABLE users ADD COLUMN name TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.log('Erro ao adicionar coluna name:', err.message);
        }
    });

    db.run(`ALTER TABLE users ADD COLUMN email TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.log('Erro ao adicionar coluna email:', err.message);
        }
    });

    db.run(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.log('Erro ao adicionar coluna status:', err.message);
        }
    });

    // Tabela de funcionários
    db.run(`CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cpf TEXT,
        position TEXT,
        department TEXT,
        hire_date DATE,
        salary DECIMAL(10,2),
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabela de holerites
    db.run(`CREATE TABLE IF NOT EXISTS payrolls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        month INTEGER,
        year INTEGER,
        base_salary DECIMAL(10,2),
        overtime_hours DECIMAL(5,2) DEFAULT 0,
        overtime_rate DECIMAL(10,2) DEFAULT 0,
        bonuses DECIMAL(10,2) DEFAULT 0,
        food_allowance DECIMAL(10,2) DEFAULT 0,
        transport_allowance DECIMAL(10,2) DEFAULT 0,
        other_benefits DECIMAL(10,2) DEFAULT 0,
        inss_discount DECIMAL(10,2) DEFAULT 0,
        irrf_discount DECIMAL(10,2) DEFAULT 0,
        health_insurance DECIMAL(10,2) DEFAULT 0,
        other_discounts DECIMAL(10,2) DEFAULT 0,
        gross_salary DECIMAL(10,2),
        net_salary DECIMAL(10,2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees (id)
    )`);

    // Tabela de configurações da empresa
    db.run(`CREATE TABLE IF NOT EXISTS company_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT,
        cnpj TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Inserir/ajustar usuário admin padrão
    setTimeout(() => {
        db.get('SELECT id FROM users WHERE username = "admin"', (err, row) => {
            if (!err && !row) {
                db.run(`INSERT INTO users (username, password, role, name, email, status) VALUES (?, ?, ?, ?, ?, ?)`,
                    ['admin', 'admin', 'admin', 'Administrador', 'admin@empresa.com', 'active'],
                    (err) => {
                        if (err) console.log('Erro ao criar usuário admin:', err.message);
                        else console.log('Usuário admin criado com sucesso');
                    });
            } else if (!err && row) {
                db.run(`UPDATE users SET role = 'admin', name = 'Administrador', email = 'admin@empresa.com', status = 'active' WHERE username = 'admin' AND (role IS NULL OR role = '')`);
            }
        });
    }, 100);

    db.run(`CREATE TABLE IF NOT EXISTS cargos (nome TEXT UNIQUE)`);

    // ====== TABELA DE RECIBOS (atualizada) ======
    db.run(`CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        type TEXT, -- 'vale_transporte' ou 'vale_alimentacao'
        month INTEGER,
        year INTEGER,
        daily_value DECIMAL(10,2),
        days INTEGER,
        value DECIMAL(10,2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees (id)
    )`);

    // Tabela de alertas
    db.run(`CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Middleware de autenticação
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

// Middleware para verificar se é admin
function requireAdmin(req, res, next) {
    if (req.session.userId && req.session.userRole === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
    }
}

// Rotas de autenticação
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ? AND password = ? AND status = "active"',
        [username, password],
        (err, user) => {
            if (err) {
                res.status(500).json({ error: 'Erro no servidor' });
                return;
            }

            if (user) {
                req.session.userId = user.id;
                req.session.userName = user.name;
                req.session.userRole = user.role;
                req.session.userEmail = user.email;
                res.json({
                    success: true,
                    user: {
                        id: user.id,
                        name: user.name,
                        role: user.role,
                        email: user.email
                    }
                });
            } else {
                res.status(401).json({ error: 'Usuário ou senha inválidos' });
            }
        });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Rota para obter informações do usuário logado
app.get('/api/user-info', requireAuth, (req, res) => {
    res.json({
        id: req.session.userId,
        name: req.session.userName,
        role: req.session.userRole,
        email: req.session.userEmail
    });
});

// Rotas de gerenciamento de usuários (apenas admin)
app.get('/api/users', requireAdmin, (req, res) => {
    db.all('SELECT id, username, name, email, role, status FROM users ORDER BY id DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Erro ao buscar usuários' });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/users', requireAdmin, (req, res) => {
    const { username, password, name, email, role } = req.body;

    db.run(`INSERT INTO users (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)`,
        [username, password, name, email, role],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    res.status(400).json({ error: 'Nome de usuário já existe' });
                } else {
                    res.status(500).json({ error: 'Erro ao criar usuário' });
                }
                return;
            }
            res.json({ id: this.lastID, success: true });
        });
});

app.put('/api/users/:id', requireAdmin, (req, res) => {
    const { name, email, role, status } = req.body;
    const { id } = req.params;

    db.run(`UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?`,
        [name, email, role, status, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: 'Erro ao atualizar usuário' });
                return;
            }
            res.json({ success: true });
        });
});

app.delete('/api/users/:id', requireAdmin, (req, res) => {
    const { id } = req.params;

    // Não permitir excluir o próprio usuário
    if (parseInt(id) === req.session.userId) {
        res.status(400).json({ error: 'Não é possível excluir seu próprio usuário' });
        return;
    }

    db.run('UPDATE users SET status = "inactive" WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: 'Erro ao desativar usuário' });
            return;
        }
        res.json({ success: true });
    });
});

// Rotas de configurações da empresa (todos os usuários autenticados)
app.get('/api/company-settings', requireAuth, (req, res) => {
    db.get('SELECT * FROM company_settings ORDER BY id DESC LIMIT 1', (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Erro ao buscar configurações' });
            return;
        }
        res.json(row || {});
    });
});

app.post('/api/company-settings', requireAuth, (req, res) => {
    const {
        company_name, cnpj, address, city, state, zip_code,
        phone, email, website
    } = req.body;

    // Primeiro, verificar se já existe configuração
    db.get('SELECT id FROM company_settings LIMIT 1', (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Erro ao verificar configurações' });
            return;
        }

        if (row) {
            // Atualizar configuração existente
            db.run(`UPDATE company_settings SET 
                company_name = ?, cnpj = ?, address = ?, city = ?, state = ?,
                zip_code = ?, phone = ?, email = ?, website = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [company_name, cnpj, address, city, state, zip_code, phone, email, website, row.id],
                function (err) {
                    if (err) {
                        res.status(500).json({ error: 'Erro ao atualizar configurações' });
                        return;
                    }
                    res.json({ success: true, message: 'Configurações atualizadas com sucesso' });
                });
        } else {
            // Criar nova configuração
            db.run(`INSERT INTO company_settings 
                (company_name, cnpj, address, city, state, zip_code, phone, email, website)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [company_name, cnpj, address, city, state, zip_code, phone, email, website],
                function (err) {
                    if (err) {
                        res.status(500).json({ error: 'Erro ao salvar configurações' });
                        return;
                    }
                    res.json({ success: true, message: 'Configurações salvas com sucesso' });
                });
        }
    });
});

// Rotas de funcionários
app.get('/api/employees', requireAuth, (req, res) => {
    db.all('SELECT * FROM employees WHERE status = "active" ORDER BY name', (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Erro ao buscar funcionários' });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/employees', requireAuth, (req, res) => {
    const { name, cpf, position, department, hire_date, salary } = req.body;

    // SIMPLES: Apenas inserir o funcionário - SEM NENHUMA VERIFICAÇÃO DE DUPLICIDADE
    db.run(`INSERT INTO employees (name, cpf, position, department, hire_date, salary) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [name, cpf, position, department, hire_date, salary],
        function (err) {
            if (err) {
                // Se der erro de constraint, simplesmente ignorar e inserir com CPF modificado
                if (err.message.includes('UNIQUE constraint failed')) {
                    console.log('Constraint UNIQUE detectada, inserindo com CPF modificado...');
                    
                    // Inserir com CPF modificado para evitar constraint
                    const modifiedCpf = cpf + '_' + Date.now();
                    db.run(`INSERT INTO employees (name, cpf, position, department, hire_date, salary) 
                            VALUES (?, ?, ?, ?, ?, ?)`,
                        [name, modifiedCpf, position, department, hire_date, salary],
                        function (err) {
                            if (err) {
                                console.error('Erro ao cadastrar funcionário:', err);
                                res.status(500).json({ error: 'Erro ao cadastrar funcionário' });
                                return;
                            }
                            addAlert('employee', `Funcionário ${name} cadastrado (CPF modificado para evitar duplicidade).`);
                            res.json({ id: this.lastID, success: true });
                        });
                } else {
                    console.error('Erro ao cadastrar funcionário:', err);
                    res.status(500).json({ error: 'Erro ao cadastrar funcionário' });
                    return;
                }
            } else {
                addAlert('employee', `Funcionário ${name} cadastrado.`);
                res.json({ id: this.lastID, success: true });
            }
        });
});

app.put('/api/employees/:id', requireAuth, (req, res) => {
    const { name, cpf, position, department, hire_date, salary } = req.body;
    const { id } = req.params;

    db.run(`UPDATE employees SET name = ?, cpf = ?, position = ?, department = ?, 
            hire_date = ?, salary = ? WHERE id = ?`,
        [name, cpf, position, department, hire_date, salary, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: 'Erro ao atualizar funcionário' });
                return;
            }
            res.json({ success: true });
        });
});

app.delete('/api/employees/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    db.get('SELECT name FROM employees WHERE id = ?', [id], (err, row) => {
        db.run('UPDATE employees SET status = "inactive" WHERE id = ?', [id], function (err2) {
            if (err2) {
                res.status(500).json({ error: 'Erro ao excluir funcionário' });
                return;
            }
            if (row && row.name) {
                addAlert('employee', `Funcionário ${row.name} excluído.`);
            }
            res.json({ success: true });
        });
    });
});

// Rotas de holerites
app.get('/api/payrolls', requireAuth, (req, res) => {
    const { month, year, employee_id } = req.query;

    let query = `SELECT p.*, e.name as employee_name, e.cpf, e.position 
                 FROM payrolls p 
                 JOIN employees e ON p.employee_id = e.id 
                 WHERE 1=1`;
    let params = [];

    if (month) {
        query += ' AND p.month = ?';
        params.push(month);
    }
    if (year) {
        query += ' AND p.year = ?';
        params.push(year);
    }
    if (employee_id) {
        query += ' AND p.employee_id = ?';
        params.push(employee_id);
    }

    query += ' ORDER BY p.year DESC, p.month DESC, e.name';

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Erro ao buscar holerites' });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/payrolls', requireAuth, (req, res) => {
    const {
        employee_id, month, year, base_salary, overtime_hours, overtime_rate,
        bonuses, food_allowance, transport_allowance, other_benefits,
        inss_discount, irrf_discount, health_insurance, other_discounts
    } = req.body;

    // Calcular salário bruto e líquido
    const overtimePay = parseFloat(overtime_hours || 0) * parseFloat(overtime_rate || 0);
    const totalBenefits = parseFloat(bonuses || 0) + parseFloat(food_allowance || 0) + parseFloat(transport_allowance || 0) + parseFloat(other_benefits || 0);
    const gross_salary = parseFloat(base_salary) + overtimePay + totalBenefits;

    const totalDiscounts = parseFloat(inss_discount || 0) + parseFloat(irrf_discount || 0) + parseFloat(health_insurance || 0) + parseFloat(other_discounts || 0);
    const net_salary = gross_salary - totalDiscounts;

    db.run(`INSERT INTO payrolls (
        employee_id, month, year, base_salary, overtime_hours, overtime_rate,
        bonuses, food_allowance, transport_allowance, other_benefits,
        inss_discount, irrf_discount, health_insurance, other_discounts,
        gross_salary, net_salary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [employee_id, month, year, base_salary, overtime_hours, overtime_rate,
            bonuses, food_allowance, transport_allowance, other_benefits,
            inss_discount, irrf_discount, health_insurance, other_discounts,
            gross_salary, net_salary],
        function (err) {
            if (err) {
                res.status(500).json({ error: 'Erro ao criar holerite' });
                return;
            }
            res.json({ id: this.lastID, success: true });
        });
});

app.put('/api/payrolls/:id', requireAuth, (req, res) => {
    const {
        base_salary, overtime_hours, overtime_rate, bonuses, food_allowance,
        transport_allowance, other_benefits, inss_discount, irrf_discount,
        health_insurance, other_discounts
    } = req.body;
    const { id } = req.params;

    // Recalcular salários
    const overtimePay = parseFloat(overtime_hours || 0) * parseFloat(overtime_rate || 0);
    const totalBenefits = parseFloat(bonuses || 0) + parseFloat(food_allowance || 0) + parseFloat(transport_allowance || 0) + parseFloat(other_benefits || 0);
    const gross_salary = parseFloat(base_salary) + overtimePay + totalBenefits;

    const totalDiscounts = parseFloat(inss_discount || 0) + parseFloat(irrf_discount || 0) + parseFloat(health_insurance || 0) + parseFloat(other_discounts || 0);
    const net_salary = gross_salary - totalDiscounts;

    db.run(`UPDATE payrolls SET 
        base_salary = ?, overtime_hours = ?, overtime_rate = ?, bonuses = ?,
        food_allowance = ?, transport_allowance = ?, other_benefits = ?,
        inss_discount = ?, irrf_discount = ?, health_insurance = ?, other_discounts = ?,
        gross_salary = ?, net_salary = ?
        WHERE id = ?`,
        [base_salary, overtime_hours, overtime_rate, bonuses, food_allowance,
            transport_allowance, other_benefits, inss_discount, irrf_discount,
            health_insurance, other_discounts, gross_salary, net_salary, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: 'Erro ao atualizar holerite' });
                return;
            }
            res.json({ success: true });
        });
});

app.delete('/api/payrolls/:id', requireAuth, (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM payrolls WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: 'Erro ao excluir holerite' });
            return;
        }
        res.json({ success: true });
    });
});

// Exclusão em lote de holerites
app.post('/api/payrolls/bulk-delete', requireAuth, (req, res) => {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Lista de IDs inválida' });
    }
    
    // Validar se todos os IDs são números
    const validIds = ids.filter(id => !isNaN(parseInt(id)) && parseInt(id) > 0);
    if (validIds.length !== ids.length) {
        return res.status(400).json({ error: 'IDs inválidos encontrados' });
    }
    
    const placeholders = validIds.map(() => '?').join(',');
    const query = `DELETE FROM payrolls WHERE id IN (${placeholders})`;
    
    db.run(query, validIds, function (err) {
        if (err) {
            res.status(500).json({ error: 'Erro ao excluir holerites' });
            return;
        }
        
        addAlert('payroll', `${this.changes} holerite(s) excluído(s) em lote`);
        res.json({ 
            success: true, 
            deletedCount: this.changes,
            message: `${this.changes} holerite(s) excluído(s) com sucesso`
        });
    });
});

// Dashboard - gastos mensais
app.get('/api/dashboard/monthly-expenses', requireAuth, (req, res) => {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    db.all(`SELECT month, SUM(net_salary) as total_expenses 
            FROM payrolls 
            WHERE year = ? 
            GROUP BY month 
            ORDER BY month`,
        [currentYear],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: 'Erro ao buscar gastos mensais' });
                return;
            }
            res.json(rows);
        });
});

// Exportar CSV
app.get('/api/export/csv', requireAuth, (req, res) => {
    const { month, year } = req.query;

    db.all(`SELECT p.*, e.name as employee_name, e.cpf, e.position 
            FROM payrolls p 
            JOIN employees e ON p.employee_id = e.id 
            WHERE p.month = ? AND p.year = ?
            ORDER BY e.name`,
        [month, year],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: 'Erro ao exportar CSV' });
                return;
            }

            // Adicionar cabeçalho com informações da empresa
            const csvContent = `"FOLHA DE PAGAMENTO - SUA EMPRESA"\n"Período: ${month}/${year}"\n"Data de Geração: ${new Date().toLocaleDateString('pt-BR')}"\n\n`;

            const csvWriter = createCsvWriter({
                path: 'temp_payroll.csv',
                header: [
                    { id: 'employee_name', title: 'Nome' },
                    { id: 'cpf', title: 'CPF' },
                    { id: 'position', title: 'Cargo' },
                    { id: 'base_salary', title: 'Salário Base' },
                    { id: 'gross_salary', title: 'Salário Bruto' },
                    { id: 'net_salary', title: 'Salário Líquido' }
                ]
            });

            // Escrever cabeçalho personalizado primeiro
            fs.writeFileSync('temp_payroll.csv', csvContent);

            // Anexar dados CSV
            const csvWriterAppend = createCsvWriter({
                path: 'temp_payroll.csv',
                header: [
                    { id: 'employee_name', title: 'Nome' },
                    { id: 'cpf', title: 'CPF' },
                    { id: 'position', title: 'Cargo' },
                    { id: 'base_salary', title: 'Salário Base' },
                    { id: 'gross_salary', title: 'Salário Bruto' },
                    { id: 'net_salary', title: 'Salário Líquido' }
                ],
                append: true
            });

            csvWriterAppend.writeRecords(rows).then(() => {
                res.download('temp_payroll.csv', `holerites_${month}_${year}.csv`, (err) => {
                    if (!err) {
                        fs.unlinkSync('temp_payroll.csv');
                    }
                });
            });
        });
});

// Exportar PDF (BLOCO ÚNICO SEM SOBREPOSIÇÃO)
app.get('/api/export/pdf/:payrollId', requireAuth, (req, res) => {
    const { payrollId } = req.params;

    // Buscar dados do holerite e configurações da empresa
    const getPayrollData = `SELECT p.*, e.name as employee_name, e.cpf, e.position 
                           FROM payrolls p 
                           JOIN employees e ON p.employee_id = e.id 
                           WHERE p.id = ?`;

    const getCompanyData = `SELECT * FROM company_settings ORDER BY id DESC LIMIT 1`;

    db.get(getPayrollData, [payrollId], (err, payrollRow) => {
        if (err || !payrollRow) {
            res.status(404).json({ error: 'Holerite não encontrado' });
            return;
        }

        db.get(getCompanyData, (err, companyRow) => {
            if (err) {
                console.log('Erro ao buscar dados da empresa:', err.message);
                companyRow = {}; // Continuar sem dados da empresa
            }

            const doc = new PDFDocument({ margin: 20, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=holerite_${payrollRow.employee_name}_${payrollRow.month}_${payrollRow.year}.pdf`);
            doc.pipe(res);

            // Funções auxiliares
            const getRef = () => `${getMonthName(payrollRow.month)}/${payrollRow.year}`;

            // Cabeçalho EMPREGADOR
            doc.fontSize(8).font('Helvetica-Bold');
            doc.text('EMPREGADOR', 30, 30);
            doc.font('Helvetica').fontSize(8);
            doc.text((companyRow && companyRow.company_name) || 'Nome', 30, 40);
            doc.text((companyRow && companyRow.address) || 'Endereço', 30, 50);
            doc.text('CNPJ: ' + (companyRow && companyRow.cnpj ? formatCnpj(companyRow.cnpj) : ''), 30, 60);

            // Título e referência
            doc.font('Helvetica-Bold').fontSize(12);
            doc.text('Recibo de Pagamento de Salário', 250, 30, { align: 'left' });
            doc.font('Helvetica').fontSize(8);
            doc.text('Referente ao Mês / Ano', 420, 50);
            doc.text(getRef(), 420, 60);

            // Caixa do cabeçalho
            doc.rect(25, 25, 550, 50).stroke();

            // Linha com código, nome, CBO, função
            doc.rect(25, 75, 550, 25).stroke();
            doc.font('Helvetica-Bold').fontSize(8);
            doc.text('CÓDIGO', 30, 80);
            doc.text('NOME DO FUNCIONÁRIO', 80, 80);
            doc.text('CBO', 350, 80);
            doc.text('FUNÇÃO', 400, 80);
            doc.font('Helvetica').fontSize(8);
            doc.text(pad(payrollRow.employee_id, 5), 30, 90, { width: 50 });
            doc.text(payrollRow.employee_name, 90, 90, { width: 250 });
            doc.text('', 355, 90, { width: 45 });
            doc.text(payrollRow.position || '', 410, 90, { width: 155 });
            // ===== Tabela principal (ÚNICO BLOCO) =====
            const tableStartY = 110;
            const rowH = 18;
            const tableX = 25;
            const tableW = 550;

            // Colunas: Cód.(40) | Descrição(180) | Referência(70) | Proventos(120) | Descontos(120)
            const col = {
                codX: 30, codW: 40,
                descX: 70, descW: 180,
                refX: 250, refW: 70,
                provX: 320, provW: 120,
                descvX: 440, descvW: 120
            };

            // Construir lista única: proventos (lado Proventos) e descontos (lado Descontos)
            const items = [];
            if (payrollRow.base_salary > 0) items.push({ cod: '0001', desc: 'SALÁRIO BASE', ref: '', proventos: payrollRow.base_salary, descontos: 0 });
            if (payrollRow.overtime_hours > 0) items.push({ cod: '0400', desc: 'HORAS EXTRAS', ref: String(payrollRow.overtime_hours).replace('.', ','), proventos: payrollRow.overtime_hours * payrollRow.overtime_rate, descontos: 0 });
            if (payrollRow.bonuses > 0) items.push({ cod: '0440', desc: 'BONIFICAÇÕES', ref: '', proventos: payrollRow.bonuses, descontos: 0 });
            if (payrollRow.food_allowance > 0) items.push({ cod: '0450', desc: 'VALE ALIMENTAÇÃO', ref: '', proventos: payrollRow.food_allowance, descontos: 0 });
            if (payrollRow.transport_allowance > 0) items.push({ cod: '0451', desc: 'VALE TRANSPORTE', ref: '', proventos: payrollRow.transport_allowance, descontos: 0 });
            if (payrollRow.other_benefits > 0) items.push({ cod: '0499', desc: 'OUTROS BENEFÍCIOS', ref: '', proventos: payrollRow.other_benefits, descontos: 0 });

            if (payrollRow.health_insurance > 0) items.push({ cod: '3405', desc: 'PLANO DE SAÚDE TITULAR', ref: '', proventos: 0, descontos: payrollRow.health_insurance });
            if (payrollRow.inss_discount > 0) items.push({ cod: '2801', desc: 'INSS', ref: '11,67', proventos: 0, descontos: payrollRow.inss_discount });
            if (payrollRow.irrf_discount > 0) items.push({ cod: '2804', desc: 'IRRF', ref: '27,50', proventos: 0, descontos: payrollRow.irrf_discount });
            if (payrollRow.other_discounts > 0) items.push({ cod: '2899', desc: 'OUTROS DESCONTOS', ref: '', proventos: 0, descontos: payrollRow.other_discounts });

            // Preencher linhas vazias até um mínimo estético
            const minRows = 6;
            while (items.length < minRows) items.push({ cod: '', desc: '', ref: '', proventos: 0, descontos: 0 });

            const tableHeight = rowH * (items.length + 1);
            // Borda externa e linha do cabeçalho
            doc.rect(tableX, tableStartY, tableW, tableHeight).stroke();
            doc.moveTo(tableX, tableStartY + rowH).lineTo(tableX + tableW, tableStartY + rowH).stroke();

            // Cabeçalho
            doc.font('Helvetica-Bold').fontSize(8);
            doc.text('Cód.', col.codX, tableStartY + 5, { width: col.codW });
            doc.text('Descrição', col.descX, tableStartY + 5, { width: col.descW });
            doc.text('Referência', col.refX, tableStartY + 5, { width: col.refW });
            doc.text('Proventos', col.provX, tableStartY + 5, { width: col.provW, align: 'right' });
            doc.text('Descontos', col.descvX, tableStartY + 5, { width: col.descvW, align: 'right' });

            // Linhas
            let y = tableStartY + rowH;
            doc.font('Helvetica').fontSize(7);
            items.forEach((it) => {
                doc.text(it.cod || '', col.codX, y + 5, { width: col.codW });
                doc.text(it.desc || '', col.descX, y + 5, { width: col.descW, ellipsis: true });
                doc.text(it.ref || '', col.refX, y + 5, { width: col.refW });
                doc.text(it.proventos ? currency.format(it.proventos) : '', col.provX, y + 5, { width: col.provW, align: 'right' });
                doc.text(it.descontos ? currency.format(it.descontos) : '', col.descvX, y + 5, { width: col.descvW, align: 'right' });
                y += rowH;
            });

            // Totais (alinhados)
            const totalY = tableStartY + tableHeight + 10;
            doc.font('Helvetica-Bold').fontSize(9);
            doc.text('Total dos Vencimentos:', 320, totalY);
            doc.text(currency.format(payrollRow.gross_salary), 420, totalY, { width: 70, align: 'right' });
            doc.text('Total dos Descontos:', 320, totalY + 15);
            doc.text(currency.format(payrollRow.gross_salary - payrollRow.net_salary), 420, totalY + 15, { width: 70, align: 'right' });
            doc.font('Helvetica-Bold').fontSize(9);
            doc.text('Líquido a Receber:', 320, totalY + 35);
            doc.text(currency.format(payrollRow.net_salary), 420, totalY + 35, { width: 70, align: 'right' });

            // Rodapé (bases/assinatura)
            let rodapeY = totalY + 65;
            doc.font('Helvetica').fontSize(7);
            doc.text('Salário Base:', 30, rodapeY);
            doc.text('Base Calc. INSS:', 130, rodapeY);
            doc.text('Base Calc. FGTS:', 230, rodapeY);
            doc.text('FGTS do Mês:', 330, rodapeY);
            doc.text('Base Calc. IRRF:', 430, rodapeY);
            doc.text('Dep. IRRF:', 530, rodapeY);
            rodapeY += 10;
            doc.text(currency.format(payrollRow.base_salary), 30, rodapeY);
            doc.text(currency.format(payrollRow.base_salary), 130, rodapeY);
            doc.text(currency.format(payrollRow.base_salary), 230, rodapeY);
            doc.text(currency.format(payrollRow.base_salary * 0.08), 330, rodapeY);
            doc.text(currency.format(payrollRow.base_salary), 430, rodapeY);
            doc.text('01', 530, rodapeY);

            rodapeY += 20;
            doc.font('Helvetica').fontSize(7);
            doc.text(''); // se quiser um espaçozinho
            doc.text('Declaro ter recebido a importância líquida discriminada neste recibo', 30, rodapeY);

            rodapeY += 20;

            // --- DATA antes dos traços (mesma linha) ---
            const dataX = 30;                 // onde começa o bloco de data
            const dataLabel = 'DATA ';        // rótulo (pode por "DATA: " se preferir)
            doc.font('Helvetica').fontSize(7);
            doc.text(dataLabel, dataX, rodapeY);          // escreve "DATA "
            const labelW = doc.widthOfString(dataLabel);  // mede a largura do rótulo

            // máscara/traços logo após o rótulo
            const dataMask = '_____/_____/______';
            doc.text(dataMask, dataX + labelW + 2, rodapeY);  // +2 é um pequeno espaçamento


            // ----- Assinatura (como você já tinha) -----
            const assX = 350;
            const assMask = '_______________________________';
            doc.text(assMask, assX, rodapeY);

            // mantém o rótulo abaixo e centralizado na linha
            const assW = doc.widthOfString(assMask);
            const lblW = doc.widthOfString('ASSINATURA');
            doc.text('ASSINATURA', assX + (assW - lblW) / 2, rodapeY + 10);


            doc.end();

            // Função local para pad
            function pad(num, size) {
                let s = num + '';
                while (s.length < size) s = '0' + s;
                return s;
            }
        });
    });
});

// Função para formatar CNPJ
function formatCnpj(cnpj) {
    if (!cnpj) return '';
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return cnpj;
    return cleanCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Função para obter nome do mês
function getMonthName(month) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1] || 'Mês';
}

// Função auxiliar para último dia do mês
function getLastDayOfMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

// Rota principal
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

app.post('/api/upload-logo', requireAuth, upload.single('logo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado.' });
    }
    // Aceitar PNG mesmo se o mimetype vier em maiúsculo
    const mimetype = req.file.mimetype.toLowerCase();
    if (mimetype !== 'image/png') {
        return res.status(400).json({ success: false, error: 'Apenas arquivos PNG são permitidos.' });
    }
    const assetsDir = path.join(__dirname, 'public', 'assets');
    const pngPath = path.join(assetsDir, 'logo-placeholder.png');
    const pdfPngPath = path.join(assetsDir, 'logo.png');
    fs.writeFile(pngPath, req.file.buffer, (err) => {
        if (err) return res.status(500).json({ success: false, error: 'Erro ao salvar logo.' });
        fs.writeFile(pdfPngPath, req.file.buffer, () => {});
        // Remove SVG e JPG
        fs.unlink(path.join(assetsDir, 'logo-placeholder.svg'), () => {});
        fs.unlink(path.join(assetsDir, 'logo-placeholder.jpg'), () => {});
        res.json({ success: true });
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Acesse também via IP da máquina na porta ${PORT}`);
    console.log('Usuário padrão: admin / Senha: admin');
});


// ========= Exportar vários holerites (ZIP) =========
const archiver = require('archiver');
app.get('/api/export/pdf/batch', requireAuth, (req, res) => {
    const { month, year, employee_id } = req.query;
    if (!month || !year) return res.status(400).json({ error: 'Informe month e year' });

    let query = `SELECT p.*, e.name as employee_name, e.cpf, e.position 
                 FROM payrolls p JOIN employees e ON p.employee_id = e.id 
                 WHERE p.month = ? AND p.year = ?`;
    const params = [month, year];
    if (employee_id) { query += ' AND p.employee_id = ?'; params.push(employee_id); }
    query += ' ORDER BY e.name';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar holerites' });
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Nenhum holerite encontrado' });

        db.get('SELECT * FROM company_settings ORDER BY id DESC LIMIT 1', (err2, companyRow) => {
            if (err2) companyRow = {};

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=holerites_${month}_${year}.zip`);
            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.on('error', () => res.status(500).end());
            archive.pipe(res);

            rows.forEach((row) => {
                const nameSafe = (row.employee_name || 'funcionario').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
                const pdfName = `holerite_${nameSafe}_${row.month}_${row.year}.pdf`;

                const { PassThrough } = require('stream');
                const stream = new PassThrough();
                archive.append(stream, { name: pdfName });

                // ==== Gera PDF para cada row (layout semelhante ao PDF único) ====
                const doc = new PDFDocument({ margin: 20, size: 'A4' });
                doc.pipe(stream);

                // Cabeçalho simples
                doc.fontSize(8).font('Helvetica-Bold').text('EMPREGADOR', 30, 30);
                doc.font('Helvetica').fontSize(8);
                doc.text((companyRow && companyRow.company_name) || 'Nome', 30, 40);
                doc.text((companyRow && companyRow.address) || 'Endereço', 30, 50);
                doc.text('CNPJ: ' + (companyRow && companyRow.cnpj ? (companyRow.cnpj) : ''), 30, 60);
                doc.font('Helvetica-Bold').fontSize(12).text('Recibo de Pagamento de Salário', 250, 30, { align: 'left' });
                doc.font('Helvetica').fontSize(8).text('Referente ao Mês / Ano', 420, 40)
                    .text((['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][row.month - 1] || '') + '/' + row.year, 420, 50);
                doc.rect(25, 25, 550, 50).stroke();

                doc.rect(25, 75, 550, 25).stroke();
                doc.font('Helvetica-Bold').fontSize(8);
                doc.text('CÓDIGO', 30, 80);
                doc.text('NOME DO FUNCIONÁRIO', 90, 80);
                doc.text('CBO', 355, 80);
                doc.text('FUNÇÃO', 410, 80);
                doc.font('Helvetica').fontSize(8);
                doc.text(String(row.employee_id).padStart(5, '0'), 30, 90, { width: 50 });
                doc.text(row.employee_name || '', 90, 90, { width: 250 });
                doc.text('', 355, 90, { width: 45 });
                doc.text(row.position || '', 410, 90, { width: 155 });

                // Tabela resumida (um único bloco, 6 linhas mín)
                const tableStartY = 110, rowH = 18, tableX = 25, tableW = 550;
                const col = { codX: 30, codW: 40, descX: 70, descW: 180, refX: 250, refW: 70, provX: 320, provW: 120, descvX: 440, descvW: 120 };
                const fmt = (v) => 'R$ ' + parseFloat(v || 0).toFixed(2).replace('.', ',');
                const items = [];
                if (row.base_salary > 0) items.push({ cod: '0001', desc: 'SALÁRIO BASE', ref: '', prov: row.base_salary, descv: 0 });
                if (row.overtime_hours > 0) items.push({ cod: '0400', desc: 'HORAS EXTRAS', ref: String(row.overtime_hours).replace('.', ','), prov: row.overtime_hours * row.overtime_rate, descv: 0 });
                if (row.bonuses > 0) items.push({ cod: '0440', desc: 'BONIFICAÇÕES', ref: '', prov: row.bonuses, descv: 0 });
                if (row.food_allowance > 0) items.push({ cod: '0450', desc: 'VALE ALIMENTAÇÃO', ref: '', prov: row.food_allowance, descv: 0 });
                if (row.transport_allowance > 0) items.push({ cod: '0451', desc: 'VALE TRANSPORTE', ref: '', prov: row.transport_allowance, descv: 0 });
                if (row.other_benefits > 0) items.push({ cod: '0499', desc: 'OUTROS BENEFÍCIOS', ref: '', prov: row.other_benefits, descv: 0 });
                if (row.health_insurance > 0) items.push({ cod: '3405', desc: 'PLANO DE SAÚDE TITULAR', ref: '', prov: 0, descv: row.health_insurance });
                if (row.inss_discount > 0) items.push({ cod: '2801', desc: 'INSS', ref: '11,67', prov: 0, descv: row.inss_discount });
                if (row.irrf_discount > 0) items.push({ cod: '2804', desc: 'IRRF', ref: '27,50', prov: 0, descv: row.irrf_discount });
                if (row.other_discounts > 0) items.push({ cod: '2899', desc: 'OUTROS DESCONTOS', ref: '', prov: 0, descv: row.other_discounts });
                while (items.length < 6) items.push({});

                const tableHeight = rowH * (items.length + 1);
                doc.rect(tableX, tableStartY, tableW, tableHeight).stroke();
                doc.moveTo(tableX, tableStartY + rowH).lineTo(tableX + tableW, tableStartY + rowH).stroke();
                doc.font('Helvetica-Bold').fontSize(8);
                doc.text('Cód.', col.codX, tableStartY + 5, { width: col.codW });
                doc.text('Descrição', col.descX, tableStartY + 5, { width: col.descW });
                doc.text('Referência', col.refX, tableStartY + 5, { width: col.refW });
                doc.text('Proventos', col.provX, tableStartY + 5, { width: col.provW, align: 'right' });
                doc.text('Descontos', col.descvX, tableStartY + 5, { width: col.descvW, align: 'right' });
                let y = tableStartY + rowH;
                doc.font('Helvetica').fontSize(7);
                items.forEach(it => {
                    doc.text(it.cod || '', col.codX, y + 5, { width: col.codW });
                    doc.text(it.desc || '', col.descX, y + 5, { width: col.descW, ellipsis: true });
                    doc.text(it.ref || '', col.refX, y + 5, { width: col.refW });
                    doc.text(it.prov ? fmt(it.prov) : '', col.provX, y + 5, { width: col.provW, align: 'right' });
                    doc.text(it.descv ? fmt(it.descv) : '', col.descvX, y + 5, { width: col.descvW, align: 'right' });
                    y += rowH;
                });

                // Totais
                const totalY = tableStartY + tableHeight + 10;
                doc.font('Helvetica-Bold').fontSize(9);
                doc.text('Total dos Vencimentos:', 320, totalY);
                doc.text(fmt(row.gross_salary), 420, totalY, { width: 70, align: 'right' });
                doc.text('Total dos Descontos:', 320, totalY + 15);
                doc.text(fmt(row.gross_salary - row.net_salary), 420, totalY + 15, { width: 70, align: 'right' });
                doc.fontSize(10).text('Líquido a Receber:', 320, totalY + 35);
                doc.rect(420, totalY + 32, 90, 20).stroke();
                doc.fontSize(13).text(fmt(row.net_salary), 420, totalY + 35, { width: 90, align: 'center' });

                // Rodapé simples
                const footerY = 780;
                doc.moveTo(25, footerY - 15).lineTo(575, footerY - 15).stroke();
                doc.font('Helvetica').fontSize(7).text('Documento gerado eletronicamente em ' + new Date().toLocaleString('pt-BR') + '. Válido sem assinatura.', 25, footerY - 10, { width: 550, align: 'center' });

                doc.end();
            });

            archive.finalize();
        });
    });
});

// Rotas de cargos
app.get('/api/cargos', requireAuth, (req, res) => {
    db.all('SELECT nome FROM cargos ORDER BY nome', (err, rows) => {
        if (err) return res.status(500).json([]);
        res.json(rows.map(r => r.nome));
    });
});

app.post('/api/cargos', requireAuth, (req, res) => {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
    db.run('INSERT OR IGNORE INTO cargos (nome) VALUES (?)', [nome], err => {
        if (err) return res.status(500).json({ error: 'Erro ao adicionar cargo' });
        res.json({ success: true });
    });
});

app.put('/api/cargos/:nome', requireAuth, (req, res) => {
    const nomeAntigo = req.params.nome;
    const { novoNome } = req.body;
    if (!novoNome) return res.status(400).json({ error: 'Novo nome obrigatório' });
    db.run('UPDATE cargos SET nome = ? WHERE nome = ?', [novoNome, nomeAntigo], function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao editar cargo' });
        res.json({ success: true });
    });
});

app.delete('/api/cargos/:nome', requireAuth, (req, res) => {
    const nome = req.params.nome;
    db.run('DELETE FROM cargos WHERE nome = ?', [nome], err => {
        if (err) return res.status(500).json({ error: 'Erro ao remover cargo' });
        res.json({ success: true });
    });
});

// ====== ROTAS DE RECIBOS ======
// Listar recibos
app.get('/api/receipts', requireAuth, (req, res) => {
    let { year, month } = req.query;
    let where = [];
    let params = [];
    if (year) {
        where.push('r.year = ?');
        params.push(year);
    }
    if (month) {
        where.push('r.month = ?');
        params.push(month);
    }
    let query = `SELECT r.*, e.name as employee_name FROM receipts r
                 JOIN employees e ON r.employee_id = e.id`;
    if (where.length) {
        query += ' WHERE ' + where.join(' AND ');
    }
    query += ' ORDER BY r.year DESC, CAST(r.month AS INTEGER) DESC, r.created_at DESC, r.id DESC, e.name';
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json([]);
        res.json(rows);
    });
});
// Criar recibo (atualizado)
app.post('/api/receipts', requireAuth, (req, res) => {
    const { employee_id, type, month, year, daily_value, days, value } = req.body;
    db.get('SELECT name FROM employees WHERE id = ?', [employee_id], (err, row) => {
        db.run(`INSERT INTO receipts (employee_id, type, month, year, daily_value, days, value)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [employee_id, type, month, year, daily_value, days, value],
            function (err2) {
                if (err2) {
                    res.status(500).json({ error: 'Erro ao cadastrar recibo' });
                    return;
                }
                if (row && row.name) {
                    addAlert('recibo', `Recibo emitido para ${row.name} (${month}/${year})`);
                }
                res.json({ id: this.lastID, success: true });
            });
    });
});
// Editar recibo
app.put('/api/receipts/:id', requireAuth, (req, res) => {
    const { employee_id, type, month, year, daily_value, days, value } = req.body;
    const { id } = req.params;
    db.run(`UPDATE receipts SET employee_id = ?, type = ?, month = ?, year = ?, daily_value = ?, days = ?, value = ? WHERE id = ?`,
        [employee_id, type, month, year, daily_value, days, value, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: 'Erro ao atualizar recibo' });
                return;
            }
            addAlert('recibo', `Recibo editado para ${req.body.employee_name} em ${req.body.month}/${req.body.year}`);
            res.json({ success: true });
        });
});
// Exportar recibos para CSV (selecionados)
app.post('/api/receipts/export/csv', requireAuth, (req, res) => {
    let ids = [];
    if (req.body && req.body.ids) ids = req.body.ids;
    let query = `SELECT r.*, e.name as employee_name FROM receipts r JOIN employees e ON r.employee_id = e.id`;
    if (ids.length) {
        query += ` WHERE r.id IN (${ids.map(() => '?').join(',')})`;
    }
    query += ' ORDER BY r.year DESC, r.month DESC, e.name';
    db.all(query, ids, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao exportar CSV' });
        const csvWriter = createCsvWriter({
            path: 'temp_receipts.csv',
            header: [
                { id: 'employee_name', title: 'Funcionário' },
                { id: 'type', title: 'Tipo' },
                { id: 'month', title: 'Mês' },
                { id: 'year', title: 'Ano' },
                { id: 'value', title: 'Valor' }
            ]
        });
        csvWriter.writeRecords(rows).then(() => {
            res.download('temp_receipts.csv', 'recibos.csv', (err) => {
                if (!err) fs.unlinkSync('temp_receipts.csv');
            });
            addAlert('recibo', `Exportação de recibos em CSV realizada`);
        });
    });
});
// Exportar recibos para PDF (selecionados)
app.post('/api/receipts/export/pdf', requireAuth, (req, res) => {
    let ids = [];
    if (req.body && req.body.ids) ids = req.body.ids;
    let query = `SELECT r.*, e.name as employee_name, e.position FROM receipts r JOIN employees e ON r.employee_id = e.id`;
    if (ids.length) {
        query += ` WHERE r.id IN (${ids.map(() => '?').join(',')})`;
    }
    query += ' ORDER BY r.year DESC, CAST(r.month AS INTEGER) DESC, r.created_at DESC, r.id DESC, e.name';
    db.all(query, ids, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao exportar PDF' });
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=recibos.pdf');
        doc.pipe(res);
        function getLastDayOfMonth(year, month) {
            return new Date(year, month, 0).getDate();
        }
        function renderReceipt(doc, r, via, offsetY) {
            // Logo no topo esquerdo
            let logoY = offsetY;
            let logoPath = path.join(__dirname, 'public', 'assets', 'logo-receipt.png');
            let logoWidth = 160;
            let logoHeight = 60;
            try {
                doc.image(logoPath, 60, logoY, { width: logoWidth, height: logoHeight });
            } catch(e){
                doc.fontSize(10).fillColor('red').text('LOGO NÃO ENCONTRADA: logo-receipt.png', 60, logoY + 20);
                doc.fillColor('black');
            }
            // Título alinhado à direita, na mesma linha da logo
            let titulo = 'RECIBO DE VALE TRANSPORTE';
            if (r.type === 'vale_alimentacao') titulo = 'RECIBO DE VALE ALIMENTAÇÃO';
            if (r.type === 'vale_combustivel') titulo = 'RECIBO DE AUXILIO COMBUSTÍVEL';
            doc.fontSize(16).font('Helvetica-Bold').text(
                titulo,
                60 + logoWidth + 20, logoY + 10, { align: 'left', width: doc.page.width - (60 + logoWidth + 60) }
            );
            // Indicação da via
            doc.fontSize(10).font('Helvetica-Oblique').text(
                via === 'funcionario' ? 'Via do Funcionário' : 'Via da Empresa',
                60 + logoWidth + 20, logoY + 35, { align: 'left', width: doc.page.width - (60 + logoWidth + 60) }
            );
            // Informações do funcionário em linhas separadas
            let infoY = logoY + logoHeight + 20;
            doc.fontSize(11).font('Helvetica');
            doc.text(`Nome: ${r.employee_name}`, 60, infoY);
            doc.text(`Cargo: ${r.position || ''}`, 60, infoY + 18);
            doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 60, infoY + 36);
            // Tabela de valores
            const valorDiario = parseFloat(r.daily_value) || 0;
            const dias = parseInt(r.days) || 0;
            const total = parseFloat(r.value) || 0;
            const tableY = infoY + 65;
            doc.fontSize(11).font('Helvetica-Bold');
            doc.text('Valor diário', 60, tableY);
            doc.text('Qtd. dias x valor diário', 220, tableY);
            doc.text('Valor total', 420, tableY);
            doc.font('Helvetica');
            doc.text(valorDiario.toLocaleString('pt-BR', {minimumFractionDigits:2}), 60, tableY+18);
            doc.text(`${dias} x ${valorDiario.toLocaleString('pt-BR', {minimumFractionDigits:2})}`, 220, tableY+18);
            doc.text(total.toLocaleString('pt-BR', {minimumFractionDigits:2}), 420, tableY+18);
            // Texto do recibo
            const lastDay = getLastDayOfMonth(r.year, r.month);
            const periodo = `01/${('0'+r.month).slice(-2)}/${r.year} a ${lastDay}/${('0'+r.month).slice(-2)}/${r.year}`;
            let texto = '';
            if (r.type === 'vale_transporte') {
                texto = `Recebi, de Ferraz dos Passos, a quantidade de Vale transporte acima discriminada para minha utilização no decorrer do período de ${periodo}`;
            } else if (r.type === 'vale_alimentacao') {
                texto = `Recebi, de Ferraz dos Passos, o valor de Vale Alimentação referente ao período de ${periodo}`;
            } else if (r.type === 'vale_combustivel') {
                texto = `Recebi, de Ferraz dos Passos, a quantidade de Auxilio combustível acima discriminada para minha utilização no decorrer do período de ${periodo}`;
            }
            doc.moveDown();
            doc.fontSize(11).font('Helvetica').text(texto, 60, tableY+50, { width: doc.page.width-120, align: 'left' });
            // Espaço para assinatura
            let assinaturaY = tableY + 110;
            const assinaturaWidth = 180;
            const assinaturaX = (doc.page.width - assinaturaWidth) / 2;
            // 'Brasília...' alinhado à esquerda
            doc.text('Brasília, ...... de ......................... de ..........', 60, assinaturaY, { align: 'left' });
            // Linha de assinatura desenhada (não texto)
            const linhaY = assinaturaY + 35;
            doc.moveTo(assinaturaX, linhaY).lineTo(assinaturaX + assinaturaWidth, linhaY).stroke();
            // Nome centralizado exatamente abaixo da linha, com espaçamento
            const nome = r.employee_name;
            const nomeFontSize = 11;
            doc.fontSize(nomeFontSize).font('Helvetica-Bold');
            const nomeWidth = doc.widthOfString(nome);
            const nomeX = doc.page.width/2 - nomeWidth/2;
            doc.text(nome, nomeX, linhaY + 7);
            doc.fontSize(11).font('Helvetica'); // reset font
        }
        rows.forEach((r, idx) => {
            if (idx > 0) doc.addPage();
            // Via do Funcionário (offset padrão)
            renderReceipt(doc, r, 'funcionario', 30);
            // Linha tracejada separadora
            doc.moveTo(40, 420).dash(5, { space: 5 }).lineTo(doc.page.width-40, 420).stroke();
            doc.undash();
            // Via da Empresa (offset mais abaixo)
            renderReceipt(doc, r, 'empresa', 440);
        });
        doc.end();
        addAlert('recibo', `Exportação de recibos em PDF realizada`);
    });
});

// Excluir recibo
app.delete('/api/receipts/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    db.get('SELECT e.name, r.month, r.year FROM receipts r JOIN employees e ON r.employee_id = e.id WHERE r.id = ?', [id], (err, row) => {
        db.run('DELETE FROM receipts WHERE id = ?', [id], function (err2) {
            if (err2) {
                res.status(500).json({ error: 'Erro ao excluir recibo' });
                return;
            }
            if (row && row.name) {
                addAlert('recibo', `Recibo excluído de ${row.name} (${row.month}/${row.year})`);
            }
            res.json({ success: true });
        });
    });
});

// Exclusão em lote de recibos
app.post('/api/receipts/bulk-delete', requireAuth, (req, res) => {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Lista de IDs inválida' });
    }
    
    // Validar se todos os IDs são números
    const validIds = ids.filter(id => !isNaN(parseInt(id)) && parseInt(id) > 0);
    if (validIds.length !== ids.length) {
        return res.status(400).json({ error: 'IDs inválidos encontrados' });
    }
    
    const placeholders = validIds.map(() => '?').join(',');
    const query = `DELETE FROM receipts WHERE id IN (${placeholders})`;
    
    db.run(query, validIds, function (err) {
        if (err) {
            res.status(500).json({ error: 'Erro ao excluir recibos' });
            return;
        }
        
        addAlert('recibo', `${this.changes} recibo(s) excluído(s) em lote`);
        res.json({ 
            success: true, 
            deletedCount: this.changes,
            message: `${this.changes} recibo(s) excluído(s) com sucesso`
        });
    });
});

// Função utilitária para registrar alertas
function addAlert(type, message) {
    db.run('INSERT INTO alerts (type, message) VALUES (?, ?)', [type, message], function() {
        // Após inserir, remove os alertas antigos mantendo só os 10 mais recentes
        db.run('DELETE FROM alerts WHERE id NOT IN (SELECT id FROM alerts ORDER BY created_at DESC, id DESC LIMIT 10)');
    });
}

app.get('/api/alerts', requireAuth, (req, res) => {
    db.all('SELECT * FROM alerts ORDER BY created_at DESC, id DESC LIMIT 10', [], (err, rows) => {
        if (err) return res.status(500).json([]);
        res.json(rows);
    });
});

app.delete('/api/alerts', requireAuth, (req, res) => {
    db.run('DELETE FROM alerts', [], function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao limpar alertas' });
        res.json({ success: true });
    });
});

