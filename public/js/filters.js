// Filter functionality

function populateYearSelects() {
    const currentYear = new Date().getFullYear();
    const yearSelects = ['filterYear', 'payrollYear'];
    
    yearSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '';
            
            // Adicionar opções para os últimos 5 anos e próximos 2 anos
            for (let year = currentYear - 5; year <= currentYear + 2; year++) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                select.appendChild(option);
            }
            
            // Definir ano atual como padrão se não houver valor selecionado
            if (!currentValue || currentValue === '') {
                select.value = currentYear;
            } else {
                select.value = currentValue;
            }
        }
    });
}

// Make function available globally
window.populateYearSelects = populateYearSelects;
