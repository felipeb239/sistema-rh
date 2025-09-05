// Currency utility functions

const currency = {
    format: (value) => Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value),
}

// Make available globally for browser environment
if (typeof window !== 'undefined') {
    window.currency = currency;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { currency };
}