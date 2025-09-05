// Payroll form functionality

function setupForm() {
    document.getElementById('payrollForm').addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payrollData = {};
    // Lista de campos numéricos
    const numericFields = [
        'base_salary', 'overtime_hours', 'overtime_rate', 'bonuses',
        'other_benefits',
        'inss_discount', 'irrf_discount', 'health_insurance', 'other_discounts'
    ];
    for (let [key, value] of formData.entries()) {
        if (key !== 'id') {
            // Converter campos numéricos para número
            if (numericFields.includes(key)) {
                payrollData[key] = parseFloat(value) || 0;
            } else {
                payrollData[key] = value;
            }
        }
    }
    try {
        let response;
        if (window.editingPayrollId) {
            response = await fetch(`/api/payrolls/${window.editingPayrollId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payrollData)
            });
        } else {
            response = await fetch('/api/payrolls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payrollData)
            });
        }
        const result = await response.json();
        if (result.success) {
            window.showAlert(window.editingPayrollId ? 'Holerite atualizado com sucesso!' : 'Holerite criado com sucesso!', 'success');
            window.closePayrollModal();
            window.loadPayrolls();
        } else {
            window.showAlert(result.error || 'Erro ao salvar holerite', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar holerite:', error);
        window.showAlert('Erro ao salvar holerite', 'error');
    }
}

function fillPayrollForm(payroll) {
    document.getElementById('payrollId').value = payroll.id;
    document.getElementById('payrollEmployee').value = payroll.employee_id;
    document.getElementById('payrollMonth').value = payroll.month;
    document.getElementById('payrollYear').value = payroll.year;
    document.getElementById('baseSalary').value = payroll.base_salary;
    document.getElementById('overtimeHours').value = payroll.overtime_hours || 0;
    document.getElementById('overtimeRate').value = payroll.overtime_rate || 0;
    document.getElementById('bonuses').value = payroll.bonuses || 0;
    document.getElementById('otherBenefits').value = payroll.other_benefits || 0;
    document.getElementById('inssDiscount').value = payroll.inss_discount || 0;
    document.getElementById('irrfDiscount').value = payroll.irrf_discount || 0;
    document.getElementById('healthInsurance').value = payroll.health_insurance || 0;
    document.getElementById('otherDiscounts').value = payroll.other_discounts || 0;
    window.calculateTotals();
}

function setCurrentMonth() {
    const currentMonth = new Date().getMonth() + 1;
    document.getElementById('filterMonth').value = currentMonth;
    document.getElementById('payrollMonth').value = currentMonth;
}

function calculateTotals() {
    const baseSalary = parseFloat(document.getElementById('baseSalary').value) || 0;
    const overtimeHours = parseFloat(document.getElementById('overtimeHours').value) || 0;
    const overtimeRate = parseFloat(document.getElementById('overtimeRate').value) || 0;
    const bonuses = parseFloat(document.getElementById('bonuses').value) || 0;
    const otherBenefits = parseFloat(document.getElementById('otherBenefits').value) || 0;
    const inssDiscount = parseFloat(document.getElementById('inssDiscount').value) || 0;
    const irrfDiscount = parseFloat(document.getElementById('irrfDiscount').value) || 0;
    const healthInsurance = parseFloat(document.getElementById('healthInsurance').value) || 0;
    const otherDiscounts = parseFloat(document.getElementById('otherDiscounts').value) || 0;
    const overtimePay = overtimeHours * overtimeRate;
    const totalBenefits = bonuses + otherBenefits;
    const grossSalary = baseSalary + overtimePay + totalBenefits;
    const totalDiscounts = inssDiscount + irrfDiscount + healthInsurance + otherDiscounts;
    const netSalary = grossSalary - totalDiscounts;
    document.getElementById('grossSalaryDisplay').textContent =
        'R$ ' + grossSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById('netSalaryDisplay').textContent =
        'R$ ' + netSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function loadEmployeeSalary() {
    const select = document.getElementById('payrollEmployee');
    const selectedOption = select.options[select.selectedIndex];
    if (selectedOption && selectedOption.dataset.salary) {
        document.getElementById('baseSalary').value = selectedOption.dataset.salary;
        window.calculateTotals();
    }
}

async function loadEmployees() {
    try {
        const response = await fetch('/api/employees');
        const employees = await response.json();
        window.populateEmployeeSelects(employees);
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
        window.showAlert('Erro ao carregar funcionários', 'error');
    }
}

function setupNumericInputs() {
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) this.value = 0;
        });
    });
}

// Make all functions available globally
window.setupForm = setupForm;
window.handleFormSubmit = handleFormSubmit;
window.fillPayrollForm = fillPayrollForm;
window.setCurrentMonth = setCurrentMonth;
window.calculateTotals = calculateTotals;
window.loadEmployeeSalary = loadEmployeeSalary;
window.loadEmployees = loadEmployees;
window.setupNumericInputs = setupNumericInputs;
