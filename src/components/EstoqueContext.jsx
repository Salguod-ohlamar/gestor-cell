import React, { createContext, useContext, useState, useMemo } from 'react';
import { useEstoque } from './useEstoque.jsx';

const EstoqueContext = createContext(null);

export const useEstoqueContext = () => {
    const context = useContext(EstoqueContext);
    if (!context) {
        throw new Error('useEstoqueContext deve ser usado dentro de um EstoqueProvider');
    }
    return context;
};

export const EstoqueProvider = ({ children, currentUser }) => {
    const estoqueData = useEstoque(currentUser);
    const [quoteToConvert, setQuoteToConvert] = useState(null);

    const contextValue = useMemo(() => ({
        ...estoqueData,
        quoteToConvert,
        setQuoteToConvert,
    }), [estoqueData, quoteToConvert]);
    return <EstoqueContext.Provider value={contextValue}>{children}</EstoqueContext.Provider>;
};