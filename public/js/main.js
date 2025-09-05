// Main JavaScript file for the application
// Secretaria menu functionality

// Setup do menu da Secretaria
function setupSecretariaMenu() {
    // Função já está sendo chamada pelo onclick no HTML
}

function toggleSecretariaMenu() {
    const secretariaSection = document.querySelector('.nav-section');
    if (secretariaSection) {
        secretariaSection.classList.toggle('expanded');
    }
}

// Export functions to global scope for onclick attributes
window.toggleSecretariaMenu = toggleSecretariaMenu;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    setupSecretariaMenu(); // Setup do menu da Secretaria
});
