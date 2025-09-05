// Phone Directory Management
let contacts = [];
let editingContactId = null;
let deletingContactId = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadContacts();
    setupEventListeners();
});

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterContacts);
    }

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterContacts);
    }

    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

function loadContacts() {
    // Load contacts from localStorage or initialize with sample data
    const savedContacts = localStorage.getItem('phoneDirectory');
    if (savedContacts) {
        contacts = JSON.parse(savedContacts);
    } else {
        // Sample data
        contacts = [
            {
                id: 1,
                name: 'João Silva',
                phone: '(11) 99999-9999',
                email: 'joao@empresa.com',
                category: 'funcionario',
                department: 'TI',
                company: 'Empresa ABC',
                notes: 'Desenvolvedor Senior'
            },
            {
                id: 2,
                name: 'Maria Santos',
                phone: '(11) 88888-8888',
                email: 'maria@empresa.com',
                category: 'funcionario',
                department: 'RH',
                company: 'Empresa ABC',
                notes: 'Analista de RH'
            }
        ];
        saveContacts();
    }
    renderContactsTable();
}

function saveContacts() {
    localStorage.setItem('phoneDirectory', JSON.stringify(contacts));
}

function renderContactsTable() {
    const tbody = document.getElementById('contactsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    contacts.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contact.name}</td>
            <td>${contact.phone}</td>
            <td>${contact.email || '-'}</td>
            <td><span class="category-badge ${contact.category}">${getCategoryLabel(contact.category)}</span></td>
            <td>${contact.department || '-'}</td>
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

function getCategoryLabel(category) {
    const labels = {
        'funcionario': 'Funcionário',
        'fornecedor': 'Fornecedor',
        'cliente': 'Cliente',
        'outro': 'Outro'
    };
    return labels[category] || category;
}

function filterContacts() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    
    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = contact.name.toLowerCase().includes(searchTerm) ||
                            contact.phone.includes(searchTerm) ||
                            (contact.email && contact.email.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !categoryFilter || contact.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
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
            <td>${contact.phone}</td>
            <td>${contact.email || '-'}</td>
            <td><span class="category-badge ${contact.category}">${getCategoryLabel(contact.category)}</span></td>
            <td>${contact.department || '-'}</td>
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
    document.getElementById('modalTitle').textContent = 'Novo Contato';
    document.getElementById('contactForm').reset();
    document.getElementById('contactModal').style.display = 'block';
}

function editContact(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    editingContactId = contactId;
    document.getElementById('modalTitle').textContent = 'Editar Contato';
    
    // Fill form fields
    document.getElementById('contactName').value = contact.name;
    document.getElementById('contactPhone').value = contact.phone;
    document.getElementById('contactEmail').value = contact.email || '';
    document.getElementById('contactCategory').value = contact.category;
    document.getElementById('contactDepartment').value = contact.department || '';
    document.getElementById('contactCompany').value = contact.company || '';
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
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        category: formData.get('category'),
        department: formData.get('department'),
        company: formData.get('company'),
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
    showNotification('Contato salvo com sucesso!', 'success');
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
        showNotification('Contato excluído com sucesso!', 'success');
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
