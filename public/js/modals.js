// Modal functionality

function openPayrollModal(payroll = null) {
    const modal = document.getElementById('payrollModal');
    const title = document.getElementById('payrollModalTitle');
    const form = document.getElementById('payrollForm');
    
    if (payroll) {
        // Edit mode
        title.textContent = 'Editar Holerite';
        window.editingPayrollId = payroll.id;
        window.fillPayrollForm(payroll);
    } else {
        // Create mode
        title.textContent = 'Novo Holerite';
        window.editingPayrollId = null;
        form.reset();
        window.setCurrentMonth();
        window.calculateTotals();
    }
    
    modal.style.display = 'flex';
}

function closePayrollModal() {
    const modal = document.getElementById('payrollModal');
    modal.style.display = 'none';
    window.editingPayrollId = null;
    document.getElementById('payrollForm').reset();
}

// Make functions available globally
window.openPayrollModal = openPayrollModal;
window.closePayrollModal = closePayrollModal;
