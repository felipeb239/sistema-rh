// Popula o select de funcionários
async function populateEmployees() {
    const select = document.getElementById('receiptEmployee');
    select.innerHTML = '<option value="">Selecione um funcionário</option>';
    try {
        const response = await fetch('/api/employees');
        const employees = await response.json();
        employees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = emp.name;
            select.appendChild(option);
        });
    } catch (e) {
        select.innerHTML = '<option value="">Erro ao carregar funcionários</option>';
    }
}

// Popula o select de anos
function populateYears() {
    const select = document.getElementById('receiptYear');
    const currentYear = new Date().getFullYear();
    select.innerHTML = '';
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    }
    select.value = currentYear;
}

let editingReceiptId = null;

// Função para editar recibo (protótipo: apenas alerta)
window.editReceipt = function(id) {
    fetch(`/api/receipts`)
        .then(res => res.json())
        .then(receipts => {
            const r = receipts.find(r => r.id === id);
            if (!r) return showAlert('Recibo não encontrado', 'error');
            editingReceiptId = id;
            document.getElementById('receiptEmployee').value = r.employee_id;
            document.getElementById('receiptType').value = r.type;
            document.getElementById('receiptMonth').value = r.month;
            document.getElementById('receiptYear').value = r.year;
            document.getElementById('receiptDailyValue').value = r.daily_value || '';
            document.getElementById('receiptDays').value = r.days || '';
            document.getElementById('receiptValue').value = r.value || '';
            // Scroll para o topo do formulário
            document.getElementById('receiptForm').scrollIntoView({ behavior: 'smooth' });
        });
};

// Salva recibo
async function handleReceiptFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    // Padronizar números
    data.daily_value = parseFloat((data.daily_value || '').toString().replace(',', '.')) || 0;
    data.days = parseInt(data.days) || 0;
    data.value = parseFloat((data.value || '').toString().replace(',', '.')) || 0;
    try {
        let response;
        if (editingReceiptId) {
            response = await fetch(`/api/receipts/${editingReceiptId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            response = await fetch('/api/receipts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        const result = await response.json();
        if (result.success) {
            showAlert(editingReceiptId ? 'Recibo atualizado com sucesso!' : 'Recibo cadastrado com sucesso!', 'success');
            loadReceipts();
            e.target.reset();
            editingReceiptId = null;
        } else {
            showAlert(result.error || 'Erro ao salvar recibo', 'error');
        }
    } catch (error) {
        showAlert('Erro ao salvar recibo', 'error');
    }
}

let receiptFilters = { year: '', month: '' };
let selectedReceipts = new Set();

function populateFilterYears() {
    const select = document.getElementById('filterYear');
    if (!select) return;
    const currentYear = new Date().getFullYear();
    select.innerHTML = '<option value="">Todos</option>';
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    }
    select.value = currentYear;
}

// Adicionar filtros de funcionário e tipo
receiptFilters.employee = '';
receiptFilters.type = '';

// Preencher select de funcionários para filtro
async function populateFilterEmployees() {
    const select = document.getElementById('filterEmployee');
    if (!select) return;
    select.innerHTML = '<option value="">Todos</option>';
    try {
        const response = await fetch('/api/employees');
        const employees = await response.json();
        employees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = emp.name;
            select.appendChild(option);
        });
    } catch (e) {
        select.innerHTML = '<option value="">Erro ao carregar funcionários</option>';
    }
}

// Paginação
let currentPage = 1;
const receiptsPerPage = 15;
let allReceipts = [];

function renderPagination(totalPages) {
    const container = document.getElementById('receiptsPagination');
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return;
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Anterior';
    prevBtn.disabled = currentPage === 1;
    prevBtn.className = 'btn btn-secondary';
    prevBtn.onclick = () => { currentPage--; renderReceiptsTable(); };
    container.appendChild(prevBtn);
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = 'btn btn-secondary' + (i === currentPage ? ' active' : '');
        pageBtn.onclick = () => { currentPage = i; renderReceiptsTable(); };
        container.appendChild(pageBtn);
    }
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Próxima';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.className = 'btn btn-secondary';
    nextBtn.onclick = () => { currentPage++; renderReceiptsTable(); };
    container.appendChild(nextBtn);
}

// Modificar renderReceiptsTable para aplicar filtros de funcionário e tipo
function renderReceiptsTable() {
    const tbody = document.getElementById('receiptsTableBody');
    let filteredReceipts = allReceipts;
    if (receiptFilters.employee) {
        filteredReceipts = filteredReceipts.filter(r => String(r.employee_id) === String(receiptFilters.employee));
    }
    if (receiptFilters.type) {
        filteredReceipts = filteredReceipts.filter(r => r.type === receiptFilters.type);
    }
    if (!filteredReceipts.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum recibo cadastrado</td></tr>';
        renderPagination(1);
        return;
    }
    const totalPages = Math.ceil(filteredReceipts.length / receiptsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * receiptsPerPage;
    const end = start + receiptsPerPage;
    const pageReceipts = filteredReceipts.slice(start, end);
    tbody.innerHTML = pageReceipts.map(r => `
        <tr>
            <td><input type="checkbox" class="receipt-checkbox" value="${r.id}" ${selectedReceipts.has(r.id) ? 'checked' : ''}></td>
            <td>${r.employee_name || '-'}</td>
            <td>${(r.type === 'vale_transporte' ? 'Vale Transporte' : (r.type === 'vale_alimentacao' ? 'Vale Alimentação' : 'Vale Combustível'))}</td>
            <td>${('0'+r.month).slice(-2)}/${r.year}</td>
            <td>R$ ${parseFloat(r.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>
                <button class="action-btn edit-btn" title="Editar" onclick="editReceipt(${r.id})">✏️</button>
                <button class="action-btn delete-btn" title="Excluir" onclick="openDeleteReceiptModal(${r.id})">🗑️</button>
                <button class="action-btn export-btn" title="Exportar PDF" onclick="exportSingleReceiptToPdf(${r.id})">📄</button>
            </td>
        </tr>
    `).join('');
    // Checkbox listeners
    document.querySelectorAll('.receipt-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            const id = parseInt(this.value);
            if (this.checked) selectedReceipts.add(id);
            else selectedReceipts.delete(id);
        });
    });
    // Select all
    const selectAll = document.getElementById('selectAllReceipts');
    if (selectAll) {
        selectAll.checked = pageReceipts.every(r => selectedReceipts.has(r.id));
        selectAll.addEventListener('change', function() {
            if (this.checked) pageReceipts.forEach(r => selectedReceipts.add(r.id));
            else pageReceipts.forEach(r => selectedReceipts.delete(r.id));
            renderReceiptsTable();
        });
    }
    renderPagination(totalPages);
}

// Modificar loadReceipts para usar allReceipts e paginação
async function loadReceipts() {
    const tbody = document.getElementById('receiptsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Carregando recibos...</td></tr>';
    try {
        let url = '/api/receipts';
        const params = [];
        if (receiptFilters.year) params.push(`year=${receiptFilters.year}`);
        if (receiptFilters.month) params.push(`month=${receiptFilters.month}`);
        if (receiptFilters.employee) params.push(`employee_id=${receiptFilters.employee}`);
        if (receiptFilters.type) params.push(`type=${receiptFilters.type}`);
        if (params.length) url += '?' + params.join('&');
        const response = await fetch(url);
        const receipts = await response.json();
        // Ordenar apenas por data de criação (mais novo primeiro)
        receipts.sort((a, b) => {
            if (b.created_at && a.created_at) {
                return new Date(b.created_at) - new Date(a.created_at);
            }
            return b.id - a.id;
        });
        allReceipts = receipts;
        currentPage = 1;
        renderReceiptsTable();
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Erro ao carregar recibos</td></tr>';
        allReceipts = [];
        renderPagination(1);
    }
}

// Atualizar filtros ao clicar em Filtrar
function setupReceiptFilters() {
    populateFilterYears();
    populateFilterEmployees();
    document.getElementById('filterBtn').addEventListener('click', () => {
        receiptFilters.year = document.getElementById('filterYear').value;
        receiptFilters.month = document.getElementById('filterMonth').value;
        receiptFilters.employee = document.getElementById('filterEmployee').value;
        receiptFilters.type = document.getElementById('filterType').value;
        selectedReceipts.clear(); // Limpa seleção ao filtrar
        currentPage = 1;
        renderReceiptsTable();
    });
}

// Exportar apenas selecionados
async function exportReceiptsToCsv() {
    if (!selectedReceipts.size) return showAlert('Selecione ao menos um recibo para exportar!', 'error');
    try {
        const response = await fetch('/api/receipts/export/csv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: Array.from(selectedReceipts) })
        });
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recibos.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showAlert('Arquivo CSV exportado com sucesso!', 'success');
        } else {
            showAlert('Erro ao exportar CSV', 'error');
        }
    } catch (e) {
        showAlert('Erro ao exportar CSV', 'error');
    }
}

async function exportReceiptsToPdf() {
    if (!selectedReceipts.size) return showAlert('Selecione ao menos um recibo para exportar!', 'error');
    try {
        const response = await fetch('/api/receipts/export/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: Array.from(selectedReceipts) })
        });
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recibos.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showAlert('Arquivo PDF exportado com sucesso!', 'success');
        } else {
            showAlert('Erro ao exportar PDF', 'error');
        }
    } catch (e) {
        showAlert('Erro ao exportar PDF', 'error');
    }
}

let pendingDeleteReceiptId = null;
let pendingDeleteReceiptInfo = null;

window.openDeleteReceiptModal = function(id) {
    pendingDeleteReceiptId = id;
    // Buscar dados do recibo para exibir no modal
    const r = allReceipts.find(r => r.id === id);
    let info = '';
    if (r) {
        info = `<strong>${r.employee_name || '-'}</strong> - <strong>${(r.type === 'vale_transporte' ? 'Vale Transporte' : (r.type === 'vale_alimentacao' ? 'Vale Alimentação' : 'Vale Combustível'))}</strong> <br>Período: <strong>${('0'+r.month).slice(-2)}/${r.year}</strong>`;
    }
    const modal = document.getElementById('deleteReceiptModal');
    const content = document.getElementById('deleteReceiptContent');
    content.innerHTML = `Tem certeza que deseja excluir este recibo?<br><br>${info}<br><br>Esta ação não pode ser desfeita.`;
    modal.style.display = 'flex';
    document.getElementById('confirmDeleteReceiptBtn').onclick = confirmDeleteReceipt;
};

window.closeDeleteReceiptModal = function() {
    const modal = document.getElementById('deleteReceiptModal');
    modal.style.display = 'none';
    pendingDeleteReceiptId = null;
    pendingDeleteReceiptInfo = null;
};

async function confirmDeleteReceipt() {
    if (!pendingDeleteReceiptId) return;
    try {
        const response = await fetch(`/api/receipts/${pendingDeleteReceiptId}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            showAlert('Recibo excluído com sucesso!', 'success');
            loadReceipts();
        } else {
            showAlert(result.error || 'Erro ao excluir recibo', 'error');
        }
    } catch (e) {
        showAlert('Erro ao excluir recibo', 'error');
    }
    window.closeDeleteReceiptModal();
}

// Adicionar função para exportar PDF de um recibo individual
window.exportSingleReceiptToPdf = async function(id) {
    try {
        const response = await fetch('/api/receipts/export/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [id] })
        });
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recibo_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showAlert('Recibo exportado em PDF!', 'success');
        } else {
            showAlert('Erro ao exportar PDF', 'error');
        }
    } catch (e) {
        showAlert('Erro ao exportar PDF', 'error');
    }
}

// Alerta simples
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertContainer.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Atualiza o valor total automaticamente para vale transporte
function setupReceiptFormCalc() {
    const typeSelect = document.getElementById('receiptType');
    const dailyInput = document.getElementById('receiptDailyValue');
    const daysInput = document.getElementById('receiptDays');
    const valueInput = document.getElementById('receiptValue');

    function updateValue() {
        const daily = parseFloat((dailyInput.value || '').replace(',', '.')) || 0;
        const days = parseInt(daysInput.value) || 0;
        valueInput.value = (daily * days).toFixed(2);
        valueInput.readOnly = true;
    }
    typeSelect.addEventListener('change', updateValue);
    dailyInput.addEventListener('input', updateValue);
    daysInput.addEventListener('input', updateValue);
}

// Função para carregar alertas dinâmicos
async function loadAlerts() {
    const ul = document.getElementById('recentAlerts');
    if (!ul) return;
    ul.innerHTML = '<li>Carregando alertas...</li>';
    try {
        const res = await fetch('/api/alerts');
        const alerts = await res.json();
        if (!alerts.length) {
            ul.innerHTML = '<li>Nenhum alerta recente</li>';
            return;
        }
        ul.innerHTML = alerts.map(a => `<li>${a.message}</li>`).join('');
    } catch {
        ul.innerHTML = '<li>Erro ao carregar alertas</li>';
    }
}

// Inicialização
window.exportReceiptsToCsv = exportReceiptsToCsv;
window.exportReceiptsToPdf = exportReceiptsToPdf;
window.logout = function() {
    fetch('/api/logout', { method: 'POST' })
        .then(() => window.location.href = '/login.html');
};
document.addEventListener('DOMContentLoaded', () => {
    // Ajuste responsivo: limitar grid para 4 colunas em telas grandes
    const formRow = document.querySelector('.form-row');
    if (formRow) {
        formRow.style.gridTemplateColumns = 'repeat(4, minmax(180px, 1fr))';
    }
    populateEmployees();
    populateYears();
    loadReceipts();
    document.getElementById('receiptForm').addEventListener('submit', handleReceiptFormSubmit);
    setupReceiptFormCalc();
    setupReceiptFilters();
    loadAlerts();
    setInterval(loadAlerts, 15000);
});

