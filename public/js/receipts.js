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
    if (!tbody) {
        console.error('receiptsTableBody não encontrado');
        return;
    }
    console.log('Renderizando recibos, total:', allReceipts.length);
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
    console.log('Página atual:', currentPage, 'Recibos na página:', pageReceipts.length);
    // Renderizar como cards para compatibilidade com layout existente
    tbody.innerHTML = pageReceipts.map(r => `
        <tr>
            <td colspan="6" style="padding: 0;">
                <div class="receipt-card" style="display: flex; align-items: center; padding: 1rem; border-bottom: 1px solid #e2e8f0; background: white;">
                    <div style="margin-right: 1rem;">
                        <input type="checkbox" class="receipt-checkbox" value="${r.id}" ${selectedReceipts.has(r.id) ? 'checked' : ''} style="width: 20px; height: 20px;">
                    </div>
                    <div style="flex: 1; display: flex; align-items: center; gap: 2rem;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${(r.employee_name || 'F')[0].toUpperCase()}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 1.1rem;">${r.employee_name || '-'}</div>
                            <div style="color: #666; font-size: 0.9rem;">
                                ${(r.type === 'vale_transporte' ? 'Vale Transporte' : (r.type === 'vale_alimentacao' ? 'Vale Alimentação' : 'Vale Combustível'))} • ${('0'+r.month).slice(-2)}/${r.year}
                            </div>
                            <div style="color: #888; font-size: 0.8rem;">22 dias • R$ ${(parseFloat(r.value)/22).toFixed(2)}/dia</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold; font-size: 1.2rem; color: #2d3748;">R$ ${parseFloat(r.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            <div style="color: #666; font-size: 0.8rem;">Valor total</div>
                        </div>
                        <div style="display: flex; gap: 0.5rem; margin-left: 1rem;">
                            <button onclick="editReceipt(${r.id})" class="action-btn edit-btn" title="Editar" style="background: #e6fffa; color: #008080; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer;">📋</button>
                            <button onclick="exportSingleReceiptToPdf(${r.id})" class="action-btn export-btn" title="Exportar PDF" style="background: #e6fffa; color: #008080; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer;">⬇️</button>
                            <button onclick="editReceipt(${r.id})" class="action-btn edit-btn" title="Editar" style="background: #e6fffa; color: #008080; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer;">✏️</button>
                            <button onclick="openDeleteReceiptModal(${r.id})" class="action-btn delete-btn" title="Excluir" style="background: #fed7d7; color: #e53e3e; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer;">🗑️</button>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
    console.log('HTML gerado, checkboxes encontrados:', document.querySelectorAll('.receipt-checkbox').length);
    // Checkbox listeners
    document.querySelectorAll('.receipt-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            const id = parseInt(this.value);
            if (this.checked) selectedReceipts.add(id);
            else selectedReceipts.delete(id);
            updateBulkDeleteButton();
        });
    });
    // Select all
    const selectAll = document.getElementById('selectAllReceipts');
    console.log('Select all encontrado:', !!selectAll);
    if (selectAll) {
        selectAll.checked = pageReceipts.every(r => selectedReceipts.has(r.id));
        selectAll.addEventListener('change', function() {
            if (this.checked) pageReceipts.forEach(r => selectedReceipts.add(r.id));
            else pageReceipts.forEach(r => selectedReceipts.delete(r.id));
            renderReceiptsTable();
        });
    }
    updateBulkDeleteButton();
    renderPagination(totalPages);
    console.log('Renderização concluída');
}

// Modificar loadReceipts para usar allReceipts e paginação
async function loadReceipts() {
    const tbody = document.getElementById('receiptsTableBody');
    if (!tbody) {
        console.error('receiptsTableBody não encontrado em loadReceipts');
        return;
    }
    console.log('Carregando recibos...');
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
        console.log('Recibos carregados:', receipts.length);
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
        console.error('Erro ao carregar recibos:', e);
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

// Função para atualizar visibilidade do botão de exclusão em lote
function updateBulkDeleteButton() {
    const deleteBtn = document.getElementById('deleteSelectedReceiptsBtn');
    console.log('updateBulkDeleteButton - Botão encontrado:', !!deleteBtn, 'Selecionados:', selectedReceipts.size);
    if (deleteBtn) {
        // Mostrar o botão se há itens selecionados
        deleteBtn.style.display = selectedReceipts.size > 0 ? 'inline-block' : 'none';
        console.log('Botão visível:', deleteBtn.style.display);
    }
}

// Função para abrir modal de confirmação de exclusão em lote
function deleteSelectedReceipts() {
    if (selectedReceipts.size === 0) {
        showAlert('Selecione pelo menos um recibo para excluir', 'error');
        return;
    }
    
    const modal = document.getElementById('deleteBulkReceiptsModal');
    const content = document.getElementById('deleteBulkReceiptsContent');
    content.innerHTML = `Tem certeza que deseja excluir <strong>${selectedReceipts.size}</strong> recibo(s) selecionado(s)?<br><br>Esta ação não pode ser desfeita.`;
    modal.style.display = 'flex';
    
    const confirmBtn = document.getElementById('confirmDeleteBulkReceiptsBtn');
    confirmBtn.onclick = confirmDeleteBulkReceipts;
}

// Função para fechar modal de exclusão em lote
function closeDeleteBulkReceiptsModal() {
    const modal = document.getElementById('deleteBulkReceiptsModal');
    modal.style.display = 'none';
}

// Função para confirmar exclusão em lote
async function confirmDeleteBulkReceipts() {
    if (selectedReceipts.size === 0) return;
    
    try {
        const response = await fetch('/api/receipts/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: Array.from(selectedReceipts) })
        });
        
        const result = await response.json();
        if (result.success) {
            showAlert(`${result.deletedCount} recibo(s) excluído(s) com sucesso!`, 'success');
            selectedReceipts.clear();
            loadReceipts();
        } else {
            showAlert(result.error || 'Erro ao excluir recibos', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir recibos:', error);
        showAlert('Erro ao excluir recibos', 'error');
    }
    
    closeDeleteBulkReceiptsModal();
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
window.deleteSelectedReceipts = deleteSelectedReceipts;
window.closeDeleteBulkReceiptsModal = closeDeleteBulkReceiptsModal;
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

