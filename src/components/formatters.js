export const parsePrice = (priceStr) => {
    if (typeof priceStr !== 'string' && typeof priceStr !== 'number') return 0;
    if (typeof priceStr === 'number') return priceStr;
    // Handles formats like "R$ 1.234,56" and "R$ 79,90"
    return parseFloat(priceStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
};

export const validateCPF = (cpf) => {
    if (typeof cpf !== 'string') return false;
    // Allow CNPJ format as well, basic validation for length
    const cleaned = cpf.replace(/[^\d]+/g, '');
    if (cleaned.length === 14) return true; // Basic CNPJ validation

    if (cleaned.length !== 11 || !!cleaned.match(/(\d)\1{10}/)) return false;
    
    const digits = cleaned.split('').map(el => +el);
    
    const rest = (count) => (
        (digits.slice(0, count-12)
            .reduce((soma, el, index) => (soma + el * (count - index)), 0) * 10) % 11
    ) % 10;

    return rest(10) === digits[9] && rest(11) === digits[10];
};

export const validatePhone = (phone) => {
    if (typeof phone !== 'string') return false;
    const cleaned = phone.replace(/\D/g, '');
    // Basic validation for Brazilian mobile numbers (DDD + 9 + 8 digits) or landlines (DDD + 8 digits)
    return cleaned.length === 11 || cleaned.length === 10;
};