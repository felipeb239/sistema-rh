// Contacts Management (Suppliers and Clients)
let contacts = [];
let editingContactId = null;
let deletingContactId = null;
let currentTab = 'suppliers';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadContacts();
    setupEventListeners();
    switchTab('suppliers'); // Start with suppliers tab
});

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterContacts);
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterContacts);
    }

    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

function loadContacts() {
    // Load contacts from localStorage or initialize with sample data
    const savedContacts = localStorage.getItem('contactsDirectory');
    if (savedContacts) {
        contacts = JSON.parse(savedContacts);
    } else {
        // Sample data
        contacts = [
            {
                id: 1,
                type: 'supplier',
                name: 'Fornecedor ABC Ltda',
                document: '12.345.678/0001-90',
                phone: '(11) 3333-3333',
                email: 'contato@fornecedorabc.com',
                address: 'Rua das Flores, 123',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01234-567',
                status: 'ativo',
                notes: 'Fornecedor de materiais de escritório'
            },
            {
                id: 2,
                type: 'client',
                name: 'Cliente XYZ S.A.',
                document: '98.765.432/0001-10',
                phone: '(11) 4444-4444',
                email: 'contato@clientexyz.com',
                address: 'Av. Paulista, 1000',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01310-100',
                status: 'ativo',
                notes: 'Cliente corporativo'
            }
        ];
        saveContacts();
    }
}

function saveContacts() {
    localStorage.setItem('contactsDirectory', JSON.stringify(contacts));
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (tabName === 'suppliers') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
    }
    
    // Update form type
    const typeSelect = document.getElementById('contactType');
    if (typeSelect) {
        typeSelect.value = tabName === 'suppliers' ? 'supplier' : 'client';
    }
    
    renderContactsTable();
}

function renderContactsTable() {
    const tbody = document.getElementById('contactsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    const filteredContacts = contacts.filter(contact => contact.type === currentTab);
    
    filteredContacts.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contact.name}</td>
            <td>${contact.document}</td>
            <td>${contact.phone}</td>
            <td>${contact.email || '-'}</td>
            <td>${formatAddress(contact)}</td>
            <td><span class="status-badge ${contact.status}">${getStatusLabel(contact.status)}</span></td>
            <td>
                <button onclick="editContact(${contact.id})" class="btn btn-sm btn-secondary">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteContact(${contact.id})" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function formatAddress(contact) {
    const parts = [];
    if (contact.address) parts.push(contact.address);
    if (contact.city) parts.push(contact.city);
    if (contact.state) parts.push(contact.state);
    if (contact.zipCode) parts.push(contact.zipCode);
    
    return parts.length > 0 ? parts.join(', ') : '-';
}

function getStatusLabel(status) {
    const labels = {
        'ativo': 'Ativo',
        'inativo': 'Inativo'
    };
    return labels[status] || status;
}

function filterContacts() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    const filteredContacts = contacts.filter(contact => {
        if (contact.type !== currentTab) return false;
        
        const matchesSearch = contact.name.toLowerCase().includes(searchTerm) ||
                            contact.document.includes(searchTerm) ||
                            contact.phone.includes(searchTerm) ||
                            (contact.email && contact.email.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || contact.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    renderFilteredContacts(filteredContacts);
}

function renderFilteredContacts(filteredContacts) {
    const tbody = document.getElementById('contactsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    filteredContacts.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contact.name}</td>
            <td>${contact.document}</td>
            <td>${contact.phone}</td>
            <td>${contact.email || '-'}</td>
            <td>${formatAddress(contact)}</td>
            <td><span class="status-badge ${contact.status}">${getStatusLabel(contact.status)}</span></td>
            <td>
                <button onclick="editContact(${contact.id})" class="btn btn-sm btn-secondary">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteContact(${contact.id})" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openAddContactModal() {
    editingContactId = null;
    document.getElementById('modalTitle').textContent = 'Novo Cadastro';
    document.getElementById('contactForm').reset();
    
    // Set default values based on current tab
    document.getElementById('contactType').value = currentTab === 'suppliers' ? 'supplier' : 'client';
    document.getElementById('contactStatus').value = 'ativo';
    
    document.getElementById('contactModal').style.display = 'block';
}

function editContact(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    editingContactId = contactId;
    document.getElementById('modalTitle').textContent = 'Editar Cadastro';
    
    // Fill form fields
    document.getElementById('contactType').value = contact.type;
    document.getElementById('contactStatus').value = contact.status;
    document.getElementById('contactName').value = contact.name;
    document.getElementById('contactDocument').value = contact.document;
    document.getElementById('contactPhone').value = contact.phone;
    document.getElementById('contactEmail').value = contact.email || '';
    document.getElementById('contactAddress').value = contact.address || '';
    document.getElementById('contactCity').value = contact.city || '';
    document.getElementById('contactState').value = contact.state || '';
    document.getElementById('contactZipCode').value = contact.zipCode || '';
    document.getElementById('contactNotes').value = contact.notes || '';
    
    document.getElementById('contactModal').style.display = 'block';
}

function closeContactModal() {
    document.getElementById('contactModal').style.display = 'none';
    editingContactId = null;
}

function handleContactSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const contactData = {
        type: formData.get('type'),
        status: formData.get('status'),
        name: formData.get('name'),
        document: formData.get('document'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        zipCode: formData.get('zipCode'),
        notes: formData.get('notes')
    };
    
    if (editingContactId) {
        // Update existing contact
        const index = contacts.findIndex(c => c.id === editingContactId);
        if (index !== -1) {
            contacts[index] = { ...contacts[index], ...contactData };
        }
    } else {
        // Add new contact
        const newContact = {
            ...contactData,
            id: Date.now()
        };
        contacts.push(newContact);
    }
    
    saveContacts();
    renderContactsTable();
    closeContactModal();
    
    // Show success message
    showNotification('Cadastro salvo com sucesso!', 'success');
}

function deleteContact(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    deletingContactId = contactId;
    document.getElementById('deleteContactName').textContent = contact.name;
    document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

function confirmDeleteContact() {
    if (deletingContactId) {
        contacts = contacts.filter(c => c.id !== deletingContactId);
        saveContacts();
        renderContactsTable();
        showNotification('Cadastro excluído com sucesso!', 'success');
        deletingContactId = null; // Reset the deleting ID
    }
    closeDeleteModal();
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide and remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const contactModal = document.getElementById('contactModal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (event.target === contactModal) {
        closeContactModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
}
