// Payroll table functionality

// Remove imports since we're using global functions now
// import { formatCpf } from './utils.js';
// import { monthNames } from './constants.js';

// Variável global para armazenar holerites selecionados
let selectedPayrolls = new Set();

function renderPayrollsTable(payrolls) {
    const tbody = document.getElementById('payrollsTableBody');
    if (payrolls.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum holerite encontrado</td></tr>';
        return;
    }
    tbody.innerHTML = payrolls.map(payroll => `
        <tr>
            <td><input type="checkbox" class="payroll-checkbox" value="${payroll.id}" ${selectedPayrolls.has(payroll.id) ? 'checked' : ''}></td>
            <td>${payroll.employee_name}</td>
            <td>${window.formatCpf(payroll.cpf)}</td>
            <td>${window.monthNames[payroll.month - 1]}/${payroll.year}</td>
            <td>R$ ${parseFloat(payroll.base_salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>R$ ${parseFloat(payroll.gross_salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>R$ ${parseFloat(payroll.net_salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>
                <div class="actions">
                    <button onclick="viewPayrollDetails(${payroll.id})" class="action-btn view-btn" title="Visualizar">👁️</button>
                    <button onclick="editPayroll(${payroll.id})" class="action-btn edit-btn" title="Editar">✏️</button>
                    <button onclick="openDeletePayrollModal(${payroll.id}, '${payroll.employee_name}', '${window.monthNames[payroll.month - 1]}/${payroll.year}')" class="action-btn delete-btn" title="Excluir">🗑️</button>
                    <button onclick="exportToPdf(${payroll.id})" class="action-btn action-btn" style="background: #667eea; color: white;" title="Exportar PDF">📄</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Adicionar event listeners para checkboxes
    document.querySelectorAll('.payroll-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const id = parseInt(this.value);
            if (this.checked) {
                selectedPayrolls.add(id);
            } else {
                selectedPayrolls.delete(id);
            }
            updateBulkDeleteButton();
        });
    });
    
    // Configurar checkbox "Selecionar Todos"
    const selectAllCheckbox = document.getElementById('selectAllPayrolls');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = payrolls.length > 0 && payrolls.every(p => selectedPayrolls.has(p.id));
        selectAllCheckbox.addEventListener('change', function() {
            if (this.checked) {
                payrolls.forEach(p => selectedPayrolls.add(p.id));
            } else {
                payrolls.forEach(p => selectedPayrolls.delete(p.id));
            }
            renderPayrollsTable(payrolls); // Re-renderizar para atualizar checkboxes
        });
    }
    
    updateBulkDeleteButton();
}

function viewPayrollDetails(id) {
    const payroll = window.payrolls.find(p => p.id === id);
    if (!payroll) return;
    const details = `
        <strong>${payroll.employee_name}</strong><br>
        Período: ${window.monthNames[payroll.month - 1]}/${payroll.year}<br><br>
        <strong>Proventos:</strong><br>
        Salário Base: ${window.currency.format(payroll.base_salary)}<br>
        ${payroll.overtime_hours > 0 ? `Horas Extras: ${payroll.overtime_hours}h × ${window.currency.format(payroll.overtime_rate)} = ${window.currency.format(payroll.overtime_hours * payroll.overtime_rate)}<br>` : ''}
        ${payroll.bonuses > 0 ? `Bônus: ${window.currency.format(payroll.bonuses)}<br>` : ''}
        ${payroll.food_allowance > 0 ? `Vale Alimentação: ${window.currency.format(payroll.food_allowance)}<br>` : ''}
        ${payroll.transport_allowance > 0 ? `Vale Transporte: ${window.currency.format(payroll.transport_allowance)}<br>` : ''}
        ${payroll.other_benefits > 0 ? `Outros Benefícios: ${window.currency.format(payroll.other_benefits)}<br>` : ''}
        <br>
        <strong>Descontos:</strong><br>
        ${payroll.inss_discount > 0 ? `INSS: ${window.currency.format(payroll.inss_discount)}<br>` : ''}
        ${payroll.irrf_discount > 0 ? `IRRF: ${window.currency.format(payroll.irrf_discount)}<br>` : ''}
        ${payroll.health_insurance > 0 ? `Plano de Saúde: ${window.currency.format(payroll.health_insurance)}<br>` : ''}
        ${payroll.other_discounts > 0 ? `Outros Descontos: ${window.currency.format(payroll.other_discounts)}<br>` : ''}
        <br>
        <strong>Totais:</strong><br>
        Salário Bruto: ${window.currency.format(payroll.gross_salary)}<br>
        <strong>Salário Líquido: ${window.currency.format(payroll.net_salary)}</strong>
    `;
    document.getElementById('payrollDetailsContent').innerHTML = details;
    document.getElementById('payrollDetailsModal').style.display = 'flex';
}

function closePayrollDetailsModal() {
    document.getElementById('payrollDetailsModal').style.display = 'none';
}

function editPayroll(id) {
    const payroll = window.payrolls.find(p => p.id === id);
    if (payroll) {
        window.openPayrollModal(payroll);
    }
}

let pendingDeletePayrollId = null;
let pendingDeletePayrollInfo = null;

function openDeletePayrollModal(id, employeeName, period) {
    pendingDeletePayrollId = id;
    pendingDeletePayrollInfo = { employeeName, period };
    const modal = document.getElementById('deletePayrollModal');
    const content = document.getElementById('deletePayrollContent');
    content.innerHTML = `Tem certeza que deseja excluir o holerite de <strong>"${employeeName}"</strong> do período <strong>"${period}"</strong>?<br><br>Esta ação não pode ser desfeita.`;
    modal.style.display = 'flex';
    // Botão de confirmação
    const confirmBtn = document.getElementById('confirmDeletePayrollBtn');
    confirmBtn.onclick = confirmDeletePayroll;
}

function closeDeletePayrollModal() {
    const modal = document.getElementById('deletePayrollModal');
    modal.style.display = 'none';
    pendingDeletePayrollId = null;
    pendingDeletePayrollInfo = null;
}

async function confirmDeletePayroll() {
    if (!pendingDeletePayrollId) return;
    try {
        const response = await fetch(`/api/payrolls/${pendingDeletePayrollId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
            window.showAlert('Holerite excluído com sucesso!', 'success');
            window.loadPayrolls();
        } else {
            window.showAlert('Erro ao excluir holerite', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir holerite:', error);
        window.showAlert('Erro ao excluir holerite', 'error');
    }
    closeDeletePayrollModal();
}

async function exportToCsv() {
    const month = document.getElementById('filterMonth').value;
    const year = document.getElementById('filterYear').value;
    if (!month || !year) {
        window.showAlert('Selecione um mês e ano específicos para exportar', 'error');
        return;
    }
    try {
        const response = await fetch(`/api/export/csv?month=${month}&year=${year}`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `holerites_${month}_${year}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            window.showAlert('Arquivo CSV exportado com sucesso!', 'success');
        } else {
            window.showAlert('Erro ao exportar CSV', 'error');
        }
    } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        window.showAlert('Erro ao exportar CSV', 'error');
    }
}

async function exportToPdf(payrollId) {
    try {
        const response = await fetch(`/api/export/pdf/${payrollId}`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `holerite_${payrollId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            window.showAlert('Holerite PDF exportado com sucesso!', 'success');
        } else {
            window.showAlert('Erro ao exportar PDF', 'error');
        }
    } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        window.showAlert('Erro ao exportar PDF', 'error');
    }
}

async function loadPayrolls() {
    const month = document.getElementById('filterMonth').value;
    const year = document.getElementById('filterYear').value;
    const employeeId = document.getElementById('filterEmployee').value;
    let url = '/api/payrolls?';
    const params = [];
    if (month) params.push(`month=${month}`);
    if (year) params.push(`year=${year}`);
    if (employeeId) params.push(`employee_id=${employeeId}`);
    url += params.join('&');
    try {
        const response = await fetch(url);
        window.payrolls = await response.json();
        renderPayrollsTable(window.payrolls);
    } catch (error) {
        console.error('Erro ao carregar holerites:', error);
        window.showAlert('Erro ao carregar holerites', 'error');
    }
}

function populateEmployeeSelects(employees) {
    const selects = ['filterEmployee', 'payrollEmployee'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        if (selectId === 'filterEmployee') {
            select.innerHTML = '<option value="">Todos os funcionários</option>';
        } else {
            select.innerHTML = '<option value="">Selecione um funcionário</option>';
        }
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = employee.name;
            option.dataset.salary = employee.salary;
            select.appendChild(option);
        });
        select.value = currentValue;
    });
}

// Função para atualizar visibilidade do botão de exclusão em lote
function updateBulkDeleteButton() {
    const deleteBtn = document.getElementById('deleteSelectedPayrollsBtn');
    if (deleteBtn) {
        // Mostrar o botão se há itens selecionados
        deleteBtn.style.display = selectedPayrolls.size > 0 ? 'inline-block' : 'none';
    }
}

// Função para abrir modal de confirmação de exclusão em lote
function deleteSelectedPayrolls() {
    if (selectedPayrolls.size === 0) {
        window.showAlert('Selecione pelo menos um holerite para excluir', 'error');
        return;
    }
    
    const modal = document.getElementById('deleteBulkPayrollsModal');
    const content = document.getElementById('deleteBulkPayrollsContent');
    content.innerHTML = `Tem certeza que deseja excluir <strong>${selectedPayrolls.size}</strong> holerite(s) selecionado(s)?<br><br>Esta ação não pode ser desfeita.`;
    modal.style.display = 'flex';
    
    const confirmBtn = document.getElementById('confirmDeleteBulkPayrollsBtn');
    confirmBtn.onclick = confirmDeleteBulkPayrolls;
}

// Função para fechar modal de exclusão em lote
function closeDeleteBulkPayrollsModal() {
    const modal = document.getElementById('deleteBulkPayrollsModal');
    modal.style.display = 'none';
}

// Função para confirmar exclusão em lote
async function confirmDeleteBulkPayrolls() {
    if (selectedPayrolls.size === 0) return;
    
    try {
        const response = await fetch('/api/payrolls/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: Array.from(selectedPayrolls) })
        });
        
        const result = await response.json();
        if (result.success) {
            window.showAlert(`${result.deletedCount} holerite(s) excluído(s) com sucesso!`, 'success');
            selectedPayrolls.clear();
            window.loadPayrolls();
        } else {
            window.showAlert(result.error || 'Erro ao excluir holerites', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir holerites:', error);
        window.showAlert('Erro ao excluir holerites', 'error');
    }
    
    closeDeleteBulkPayrollsModal();
}

// Make all functions available globally
window.renderPayrollsTable = renderPayrollsTable;
window.viewPayrollDetails = viewPayrollDetails;
window.closePayrollDetailsModal = closePayrollDetailsModal;
window.editPayroll = editPayroll;
window.openDeletePayrollModal = openDeletePayrollModal;
window.closeDeletePayrollModal = closeDeletePayrollModal;
window.exportToCsv = exportToCsv;
window.exportToPdf = exportToPdf;
window.loadPayrolls = loadPayrolls;
window.populateEmployeeSelects = populateEmployeeSelects;
window.deleteSelectedPayrolls = deleteSelectedPayrolls;
window.closeDeleteBulkPayrollsModal = closeDeleteBulkPayrollsModal;
