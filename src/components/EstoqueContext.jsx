import React, { createContext, useContext, useMemo } from 'react';
import { useEstoque } from './useEstoque.jsx';
import { usePersistedState } from './usePersistedState.js';

const EstoqueContext = createContext(null);

export const useEstoqueContext = () => {
    const context = useContext(EstoqueContext);
    if (!context) {
        throw new Error('useEstoqueContext deve ser usado dentro de um EstoqueProvider');
    }
    return context;
};

export const EstoqueProvider = ({ children }) => {
    // O Provider agora gerencia o currentUser e o disponibiliza no contexto
    const [currentUser] = usePersistedState('boycell-currentUser', null);
    const estoqueData = useEstoque();

    // Usamos useMemo para garantir que o valor do contexto só mude quando necessário
    const contextValue = useMemo(() => ({
        ...estoqueData,
        currentUser, // Adicionamos o currentUser ao valor do contexto
    }), [estoqueData, currentUser]);

    return <EstoqueContext.Provider value={contextValue}>{children}</EstoqueContext.Provider>;
};