import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

import { parsePrice } from './formatters.js';

const generateReceiptCode = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BC-${year}${month}${day}-${randomPart}`;
};

const initialEstoque = [
    { id: 1, nome: 'Capa Protetora Neon', categoria: 'Capas', marca: 'GShield', fornecedor: 'Fornecedor A', emEstoque: 50, qtdaMinima: 10, preco: 79.90, precoFinal: 99.90, markup: '25.03', imagem: 'https://i.zst.com.br/thumbs/12/2a/39/1588494596.jpg', historico: [], destaque: true, tempoDeGarantia: 30 },
    { id: 2, nome: 'Fone de Ouvido Cyber', categoria: 'Áudio', marca: 'JBL', fornecedor: 'Fornecedor B', emEstoque: 4, qtdaMinima: 5, preco: 199.90, precoFinal: 249.90, markup: '25.08', imagem: 'https://www.jbl.com.br/dw/image/v2/BFND_PRD/on/demandware.static/-/Sites-master-catalog/default/dwb4c84af5/1_JBL_T510BT_Product%20Image_Hero_Black.png?sw=537&sfrm=png', historico: [], destaque: true, tempoDeGarantia: 90 },
    { id: 3, nome: 'Película Stealth', categoria: 'Películas', marca: 'HPrime', fornecedor: 'Fornecedor A', emEstoque: 120, qtdaMinima: 20, preco: 59.90, precoFinal: 75.00, markup: '25.21', imagem: 'https://images.tcdn.com.br/img/img_prod/606550/pelicula_hprime_premium_curves_pro_cobre_100_da_tela_para_samsung_galaxy_s22_ultra_sm_s908_6_8_11705_1_a2657e1b305d39a387f620869a3792d4.jpg', historico: [], destaque: true, tempoDeGarantia: 7 },
    { id: 4, nome: 'Carregador Turbo Tech', categoria: 'Carregadores', marca: 'Anker', fornecedor: 'Fornecedor C', emEstoque: 75, qtdaMinima: 15, preco: 129.90, precoFinal: 159.90, markup: '23.27', imagem: 'https://d1i2p25t269xed.cloudfront.net/product/images/1694630018-41-1.jpg', historico: [], destaque: false, tempoDeGarantia: 90 },
];

const initialServicos = [
    { id: 1, servico: 'Troca de Tela iPhone 12', fornecedor: 'Fornecedor Peças A', marca: 'Apple', tipoReparo: 'Tela', tecnico: 'João Silva', preco: 300.00, precoFinal: 650.00, imagem: 'https://images.unsplash.com/photo-1603893352355-b2405a498bab?auto=format&fit=crop&w=200', markup: '116.67', destaque: true, historico: [], tempoDeGarantia: 90 },
    { id: 2, servico: 'Troca de Bateria Galaxy S21', fornecedor: 'Fornecedor Peças B', marca: 'Samsung', tipoReparo: 'Bateria', tecnico: 'Maria Souza', preco: 150.00, precoFinal: 350.00, imagem: 'https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?auto=format&fit=crop&w=200', markup: '133.33', destaque: true, historico: [], tempoDeGarantia: 90 },
];

export const PERMISSION_GROUPS = {
    products: {
        title: 'Produtos',
        permissions: {
            addProduct: { label: 'Adicionar Produto', roles: ['root', 'admin'] },
            editProduct: { label: 'Editar Produto', roles: ['root', 'admin'] },
            deleteProduct: { label: 'Excluir Produto', roles: ['root', 'admin'] },
            exportCsv: { label: 'Exportar CSV de Produtos', roles: ['root', 'admin'] },
        }
    },
    services: {
        title: 'Serviços',
        permissions: {
            addService: { label: 'Adicionar Serviço', roles: ['root', 'admin'] },
            editService: { label: 'Editar Serviço', roles: ['root', 'admin'] },
            deleteService: { label: 'Excluir Serviço', roles: ['root', 'admin'] },
        }
    },
    admin: {
        title: 'Administração',
        permissions: {
            viewDashboardCharts: { label: 'Ver Análise Gráfica', roles: ['root', 'admin'] },
            viewSalesHistory: { label: 'Ver Histórico de Vendas', roles: ['root', 'admin'] },
            viewActivityLog: { label: 'Ver Log de Atividades', roles: ['root', 'admin'] },
            manageClients: { label: 'Gerenciar Clientes', roles: ['root', 'admin'] },
        }
    },
    root: {
        title: 'Super Admin (Root)',
        permissions: {
            manageUsers: { label: 'Gerenciar Usuários', roles: ['root'] },
            resetUserPassword: { label: 'Resetar Senha', roles: ['root', 'admin'] }, // Kept for admin on vendedor
            manageBackup: { label: 'Gerenciar Backup/Restore', roles: ['root'] },
        }
    }
};

const getDefaultPermissions = (role) => {
    const permissions = {};
    Object.values(PERMISSION_GROUPS).forEach(group => {
        for (const key in group.permissions) {
            permissions[key] = group.permissions[key].roles.includes(role);
        }
    });
    return permissions;
};

const initialUsers = [
  { id: 0, email: 'root@boycell.com', password: 'root', role: 'root', name: 'Root User', permissions: getDefaultPermissions('root') },
  { id: 1, email: 'admin@boycell.com', password: 'admin', role: 'admin', name: 'Admin Boycell', permissions: getDefaultPermissions('admin') },
  { id: 2, email: 'vendedor@boycell.com', password: 'vendedor', role: 'vendedor', name: 'Vendedor Boycell', permissions: getDefaultPermissions('vendedor') },
];

const itemsPerPage = 5; // Itens por página

export const useEstoque = () => {
    // ===================================================================
    // PRODUCTS STATE
    // ===================================================================
    // Core state
    const [estoque, setEstoque] = useState(() => {
        try {
            const savedEstoque = localStorage.getItem('boycell-estoque');
            if (savedEstoque) {
                const parsed = JSON.parse(savedEstoque);
                if (Array.isArray(parsed)) {
                    // Migration step: ensure prices are numbers for backward compatibility
                    return parsed.map(p => ({
                        ...p,
                        preco: typeof p.preco === 'string' ? parsePrice(p.preco) : p.preco,
                        precoFinal: typeof p.precoFinal === 'string' ? parsePrice(p.precoFinal) : p.precoFinal,
                    }));
                }
            }
        } catch (error) {
            console.error("Erro ao carregar o estoque do localStorage:", error);
        }
        // Se o localStorage estiver vazio ou der erro, usa os dados iniciais
        return initialEstoque.map(p => ({
            ...p,
            historico: [{
                data: new Date(),
                acao: 'Registro Inicial',
                detalhes: `Produto carregado no sistema com estoque de ${p.emEstoque}.`
            }]
        }));
    });

    // State for stock value history
    const [stockValueHistory, setStockValueHistory] = useState(() => {
        try {
            const savedHistory = localStorage.getItem('boycell-stockValueHistory');
            return savedHistory ? JSON.parse(savedHistory) : [];
        } catch (error) {
            console.error("Erro ao carregar o histórico de valor do localStorage:", error);
            return [];
        }
    });

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProduct, setNewProduct] = useState({ nome: '', categoria: '', marca: '', fornecedor: '', emEstoque: '', qtdaMinima: '', preco: '', markup: '', precoFinal: '', imagem: '', destaque: true, tempoDeGarantia: '' });

    // UI states
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'ascending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    // ===================================================================
    // SERVICES STATE
    // ===================================================================
    const [servicos, setServicos] = useState(() => {
        try {
            const savedServicos = localStorage.getItem('boycell-servicos');
            if (savedServicos) {
                const parsed = JSON.parse(savedServicos);
                if (Array.isArray(parsed)) return parsed.map(s => ({
                    ...s,
                    preco: typeof s.preco === 'string' ? parsePrice(s.preco) : s.preco,
                    precoFinal: typeof s.precoFinal === 'string' ? parsePrice(s.precoFinal) : s.precoFinal,
                }));
            }
        } catch (error) {
            console.error("Erro ao carregar os serviços do localStorage:", error);
        }
        return initialServicos;
    });

    const [isAddServicoModalOpen, setIsAddServicoModalOpen] = useState(false);
    const [isEditServicoModalOpen, setIsEditServicoModalOpen] = useState(false);
    const [editingServico, setEditingServico] = useState(null);
    const [newServico, setNewServico] = useState({ servico: '', fornecedor: '', marca: '', tipoReparo: '', tecnico: '', preco: '', precoFinal: '', imagem: '', markup: '', destaque: true, tempoDeGarantia: '' });

    const [servicoSearchTerm, setServicoSearchTerm] = useState('');
    const [servicoSortConfig, setServicoSortConfig] = useState({ key: 'servico', direction: 'ascending' });
    const [servicoCurrentPage, setServicoCurrentPage] = useState(1);

    // ===================================================================
    // SALES HISTORY STATE
    // ===================================================================
    const [salesHistory, setSalesHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('boycell-salesHistory');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (error) {
            console.error("Erro ao carregar o histórico de vendas:", error);
        }
        return [];
    });

    // ===================================================================
    // ACTIVITY LOG STATE
    // ===================================================================
    const [activityLog, setActivityLog] = useState(() => {
        try {
            const saved = localStorage.getItem('boycell-activityLog');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (error) {
            console.error("Erro ao carregar o log de atividades:", error);
        }
        return [];
    });

    // ===================================================================
    // CUSTOMERS STATE
    // ===================================================================
    const [clientes, setClientes] = useState(() => {
        try {
            const saved = localStorage.getItem('boycell-clientes');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (error) {
            console.error("Erro ao carregar clientes do localStorage:", error);
        }
        return [];
    });

    // ===================================================================
    // USERS STATE
    // ===================================================================
    const [users, setUsers] = useState(() => {
        try {
            const saved = localStorage.getItem('boycell-users');
            if (saved) {
                let parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Migration logic: ensure root user exists and has latest permissions
                    const rootUserDefinition = initialUsers.find(u => u.role === 'root');
                    let rootUserInStorage = parsed.find(u => u.role === 'root');

                    if (!rootUserInStorage) {
                        // If root user is missing, add it.
                        parsed.unshift(rootUserDefinition);
                    } else {
                        // If root exists, ensure its core properties are up-to-date
                        // This prevents lockout if we change the default password or permissions object structure
                        Object.assign(rootUserInStorage, rootUserDefinition, { id: rootUserInStorage.id });
                    }

                    // Ensure all users have a permissions object for backward compatibility
                    return parsed.map(u => ({
                        ...u,
                        permissions: u.permissions || getDefaultPermissions(u.role)
                    }));
                }
            }
        } catch (error) {
            console.error("Erro ao carregar usuários do localStorage:", error);
        }
        return initialUsers;
    });

    useEffect(() => {
        try {
            localStorage.setItem('boycell-users', JSON.stringify(users));
        } catch (error) {
            console.error("Erro ao salvar usuários no localStorage:", error);
        }
    }, [users]);


    // ===================================================================
    // EFFECTS
    // ===================================================================
    // Efeito para salvar o estoque no localStorage sempre que ele for alterado
    useEffect(() => {
        try {
            localStorage.setItem('boycell-estoque', JSON.stringify(estoque));
        } catch (error) {
            console.error("Erro ao salvar o estoque no localStorage:", error);
        }
    }, [estoque]);

    // Effect to update stock value history
    useEffect(() => {
        const newTotalValue = estoque.reduce((acc, item) => acc + (parsePrice(item.preco) * (item.emEstoque || 0)), 0);

        setStockValueHistory(prevHistory => {
            const lastEntry = prevHistory[prevHistory.length - 1];
            if (!lastEntry || lastEntry.value !== newTotalValue) {
                const newEntry = { date: new Date().toISOString(), value: newTotalValue };
                return [...prevHistory, newEntry].slice(-60); // Keep last 60 entries
            }
            return prevHistory;
        });
    }, [estoque]);

    // Effect to save stock value history to localStorage
    useEffect(() => {
        if (stockValueHistory.length > 0) {
            localStorage.setItem('boycell-stockValueHistory', JSON.stringify(stockValueHistory));
        }
    }, [stockValueHistory]);

    // Efeito para salvar os serviços no localStorage
    useEffect(() => {
        try {
            localStorage.setItem('boycell-servicos', JSON.stringify(servicos));
        } catch (error) {
            console.error("Erro ao salvar os serviços no localStorage:", error);
        }
    }, [servicos]);

    // Efeito para salvar o histórico de vendas
    useEffect(() => {
        try {
            localStorage.setItem('boycell-salesHistory', JSON.stringify(salesHistory));
        } catch (error) {
            console.error("Erro ao salvar o histórico de vendas:", error);
        }
    }, [salesHistory]);

    // Efeito para salvar o log de atividades
    useEffect(() => {
        try {
            localStorage.setItem('boycell-activityLog', JSON.stringify(activityLog));
        } catch (error) {
            console.error("Erro ao salvar o log de atividades:", error);
        }
    }, [activityLog]);

    // Efeito para salvar os clientes no localStorage
    useEffect(() => {
        try {
            localStorage.setItem('boycell-clientes', JSON.stringify(clientes));
        } catch (error)
        {
            console.error("Erro ao salvar clientes no localStorage:", error);
        }
    }, [clientes]);

    // Helper function to log admin actions
    const logAdminActivity = (adminName, action, details) => {
        const newLogEntry = {
            id: Date.now(),
            timestamp: new Date(),
            admin: adminName || 'Sistema',
            action: action,
            details: details,
        };
        setActivityLog(prevLog => [newLogEntry, ...prevLog].slice(0, 500)); // Keep last 500 entries
    };

    // ===================================================================
    // PRODUCT HANDLERS
    // ===================================================================
    // Modal handlers
    const handleOpenAddModal = () => setIsAddModalOpen(true);
    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setNewProduct({ nome: '', categoria: '', marca: '', fornecedor: '', emEstoque: '', qtdaMinima: '', preco: '', markup: '', precoFinal: '', imagem: '', destaque: true, tempoDeGarantia: '' });
    };

    const handleOpenEditModal = (product) => {
        setEditingProduct({ ...product, markup: product.markup || '', imagem: product.imagem || '', historico: product.historico || [], categoria: product.categoria || '', destaque: product.destaque ?? false, tempoDeGarantia: product.tempoDeGarantia || '' });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingProduct(null);
    };

    // Form input handlers
    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        setNewProduct(prevState => {
            // Revoke old object URL to prevent memory leaks
            if (name === 'imagem' && prevState.imagem && prevState.imagem.startsWith('blob:')) {
                URL.revokeObjectURL(prevState.imagem);
            }
    
            const isFile = type === 'file';
            const isCheckbox = type === 'checkbox';
            
            // If no file is selected, keep the previous image
            const updatedValue = isCheckbox 
                ? checked 
                : (isFile ? (files[0] ? URL.createObjectURL(files[0]) : prevState.imagem) : value);
            
            const newState = { ...prevState, [name]: updatedValue };
            
            // If final price is edited manually, clear markup.
            if (name === 'precoFinal') {
                newState.markup = '';
            }

            // If a dependency of precoFinal changes, recalculate it.
            if (['preco', 'markup', 'incluirIcms'].includes(name)) {
                const preco = parseFloat(newState.preco);
                const markup = parseFloat(newState.markup);

                // Only calculate if we have a valid markup.
                if (!isNaN(preco) && !isNaN(markup) && markup >= 0) {
                    let precoFinal = preco * (1 + markup / 100);
                    if (newState.incluirIcms) {
                        precoFinal *= 1.18;
                    }
                    newState.precoFinal = precoFinal.toFixed(2);
                } else if (name === 'incluirIcms') {
                    // If checkbox is toggled but there's no markup, adjust the existing precoFinal.
                    const precoFinalValue = parseFloat(newState.precoFinal);
                    if (!isNaN(precoFinalValue)) {
                        newState.precoFinal = (checked ? precoFinalValue * 1.18 : precoFinalValue / 1.18).toFixed(2);
                    }
                }
            }
            return newState;
        });
    };

    const handleEditInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        setEditingProduct(prevState => {
            // Revoke old object URL
            if (name === 'imagem' && prevState.imagem && prevState.imagem.startsWith('blob:')) {
                URL.revokeObjectURL(prevState.imagem);
            }
    
            const isFile = type === 'file';
            const isCheckbox = type === 'checkbox';
            
            const updatedValue = isCheckbox 
                ? checked 
                : (isFile ? (files[0] ? URL.createObjectURL(files[0]) : prevState.imagem) : value);

            const newState = { ...prevState, [name]: updatedValue };
            
            // If final price is edited manually, clear markup.
            if (name === 'precoFinal') {
                newState.markup = '';
            }

            // If a dependency of precoFinal changes, recalculate it.
            if (['preco', 'markup', 'incluirIcms'].includes(name)) {
                const preco = parseFloat(newState.preco);
                const markup = parseFloat(newState.markup);

                // Only calculate if we have a valid markup.
                if (!isNaN(preco) && !isNaN(markup) && markup >= 0) {
                    let precoFinal = preco * (1 + markup / 100);
                    if (newState.incluirIcms) {
                        precoFinal *= 1.18;
                    }
                    newState.precoFinal = precoFinal.toFixed(2);
                } else if (name === 'incluirIcms') {
                    // If checkbox is toggled but there's no markup, adjust the existing precoFinal.
                    const precoFinalValue = parseFloat(newState.precoFinal);
                    if (!isNaN(precoFinalValue)) {
                        newState.precoFinal = (checked ? precoFinalValue * 1.18 : precoFinalValue / 1.18).toFixed(2);
                    }
                }
            }
            return newState;
        });
    };

    // ===================================================================
    // PRODUCT CRUD
    // ===================================================================
    // CRUD handlers
    const handleAddProduct = (e, adminName) => {
        e.preventDefault();
        if (!newProduct.nome || !newProduct.categoria || !newProduct.marca || !newProduct.fornecedor || !newProduct.emEstoque || !newProduct.qtdaMinima || !newProduct.preco || !newProduct.precoFinal) {
            toast.error('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const emEstoqueNum = parseInt(newProduct.emEstoque, 10);
        const qtdaMinimaNum = parseInt(newProduct.qtdaMinima, 10);
        if (emEstoqueNum < qtdaMinimaNum) {
            toast.error('O estoque não pode ser menor que a quantidade mínima.');
            return;
        }
        const productToAdd = {
            id: Date.now(),
            nome: newProduct.nome,
            marca: newProduct.marca,
            categoria: newProduct.categoria,
            fornecedor: newProduct.fornecedor,
            imagem: newProduct.imagem || 'https://via.placeholder.com/150',
            emEstoque: emEstoqueNum,
            qtdaMinima: qtdaMinimaNum,
            preco: parseFloat(newProduct.preco),
            destaque: newProduct.destaque,
            incluirIcms: newProduct.incluirIcms,
            markup: newProduct.markup,
            precoFinal: parseFloat(newProduct.precoFinal),
            tempoDeGarantia: parseInt(newProduct.tempoDeGarantia, 10) || 0,
            historico: [{
                data: new Date(),
                acao: 'Produto Criado',
                detalhes: `Produto "${newProduct.nome}" criado com estoque inicial de ${newProduct.emEstoque}.`
            }]
        };
        setEstoque(prevEstoque => [...prevEstoque, productToAdd]);
        logAdminActivity(adminName, 'Criação de Produto', `Produto "${productToAdd.nome}" foi criado.`);
        toast.success('Produto adicionado com sucesso!');
        handleCloseAddModal();
    };

    const handleUpdateProduct = (e, adminName) => {
        e.preventDefault();
        if (!editingProduct) return;

        const oldItem = estoque.find(item => item.id === editingProduct.id);
        if (!oldItem) return;

        const emEstoqueNum = parseInt(editingProduct.emEstoque, 10);
        const qtdaMinimaNum = parseInt(editingProduct.qtdaMinima, 10);
        if (emEstoqueNum < qtdaMinimaNum) {
            toast.error('O estoque não pode ser menor que a quantidade mínima.');
            return;
        }

        const newProductData = {
            ...editingProduct,
            imagem: editingProduct.imagem || 'https://via.placeholder.com/150',
            categoria: editingProduct.categoria,
            destaque: editingProduct.destaque,
            emEstoque: emEstoqueNum,
            qtdaMinima: qtdaMinimaNum,
            incluirIcms: editingProduct.incluirIcms,
            preco: parseFloat(editingProduct.preco),
            markup: editingProduct.markup,
            precoFinal: parseFloat(editingProduct.precoFinal),
            tempoDeGarantia: parseInt(editingProduct.tempoDeGarantia, 10) || 0
        };

        const newHistorico = [...(oldItem.historico || [])];
        const changes = [];
        const fieldsToCompare = {
            nome: 'Nome',
            marca: 'Marca',
            categoria: 'Categoria',
            destaque: 'Destaque na Home',
            fornecedor: 'Fornecedor',
            emEstoque: 'Estoque',
            qtdaMinima: 'Qtda. Mínima',
            preco: 'Preço',
            tempoDeGarantia: 'Garantia (dias)',
            precoFinal: 'Preço Final',
        };

        for (const key in fieldsToCompare) {
            const oldValue = oldItem[key];
            const newValue = newProductData[key];
            
            if (String(oldValue ?? '') !== String(newValue ?? '')) {
                const displayOld = key === 'destaque' ? (!!oldValue ? 'Sim' : 'Não') : (oldValue ?? 'N/A');
                const displayNew = key === 'destaque' ? (!!newValue ? 'Sim' : 'Não') : (newValue ?? 'N/A');

                changes.push(`${fieldsToCompare[key]} alterado de "${displayOld}" para "${displayNew}"`);
            }
        }

        if (changes.length > 0) {
            newHistorico.push({
                data: new Date(),
                acao: 'Produto Atualizado',
                detalhes: changes.join('; ')
            });
            logAdminActivity(adminName, 'Atualização de Produto', `Produto "${oldItem.nome}" atualizado: ${changes.join('; ')}.`);
        }

        const updatedEstoque = estoque.map(item => {
            if (item.id === editingProduct.id) {
                return {
                    ...newProductData,
                    historico: newHistorico
                };
            }
            return item;
        });

        setEstoque(updatedEstoque);
        toast.success('Produto atualizado com sucesso!');
        handleCloseEditModal();
    };

    const handleExcluirProduto = (idProduto, adminName) => {
        const productToDelete = estoque.find(item => item.id === idProduto);
        if (!productToDelete) return;

        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            const novoEstoque = estoque.filter(item => item.id !== idProduto);
            logAdminActivity(adminName, 'Exclusão de Produto', `Produto "${productToDelete.nome}" (ID: ${idProduto}) foi excluído.`);
            toast.success('Produto excluído com sucesso!');
            setEstoque(novoEstoque);
        }
    };

    // ===================================================================
    // PRODUCT DERIVED STATE (SORT, FILTER, PAGINATE)
    // ===================================================================
    // Sorting handler
    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Derived state calculations (filtering, sorting, pagination)
    const filteredEstoque = useMemo(() =>
        estoque.filter(item => {
            const searchMatch = (item.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
            const stockMatch = !showLowStockOnly || (Number(item.emEstoque) <= Number(item.qtdaMinima));
            return searchMatch && stockMatch;
        }), [estoque, searchTerm, showLowStockOnly]);

    const sortedEstoque = useMemo(() => {
        let sortableItems = [...filteredEstoque];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                // Sorting is simpler with numbers
                if (['preco', 'precoFinal', 'emEstoque', 'qtdaMinima'].includes(sortConfig.key)) {
                    valA = Number(valA) || 0;
                    valB = Number(valB) || 0;
                } else {
                    // Fallback for other string-based columns
                    valA = String(valA || '');
                    valB = String(valB || '');
                }
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredEstoque, sortConfig]);

    const totalPages = Math.ceil(sortedEstoque.length / itemsPerPage);

    const paginatedEstoque = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedEstoque.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedEstoque, currentPage]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);

    // ===================================================================
    // SERVICE HANDLERS
    // ===================================================================
    const handleOpenAddServicoModal = () => setIsAddServicoModalOpen(true);
    const handleCloseAddServicoModal = () => {
        setIsAddServicoModalOpen(false);
        setNewServico({ servico: '', fornecedor: '', marca: '', tipoReparo: '', tecnico: '', preco: '', precoFinal: '', imagem: '', markup: '', destaque: true });
    };

    const handleOpenEditServicoModal = (servico) => {
        setEditingServico({ ...servico, markup: servico.markup || '', destaque: servico.destaque ?? false, tempoDeGarantia: servico.tempoDeGarantia || '' });
        setIsEditServicoModalOpen(true);
    };

    const handleCloseEditServicoModal = () => {
        setIsEditServicoModalOpen(false);
        setEditingServico(null);
    };

    const handleServicoInputChange = (e) => {
        const { name, value, type, files, checked } = e.target;
        const stateSetter = isEditServicoModalOpen ? setEditingServico : setNewServico;

        stateSetter(prevState => {
            if (name === 'imagem' && prevState.imagem && prevState.imagem.startsWith('blob:')) {
                URL.revokeObjectURL(prevState.imagem);
            }
            const isCheckbox = type === 'checkbox';
            const updatedValue = isCheckbox ? checked : (type === 'file' ? (files[0] ? URL.createObjectURL(files[0]) : prevState.imagem) : value);
            
            const newState = { ...prevState, [name]: updatedValue };

            // If final price is edited manually, clear markup.
            if (name === 'precoFinal') {
                newState.markup = '';
            }

            // If a dependency of precoFinal changes, recalculate it.
            if (['preco', 'markup'].includes(name)) {
                const preco = parseFloat(newState.preco);
                const markup = parseFloat(newState.markup);

                if (!isNaN(preco) && !isNaN(markup) && markup >= 0) {
                    newState.precoFinal = (preco * (1 + markup / 100)).toFixed(2);
                }
            }
            return newState;
        });
    };

    // ===================================================================
    // SERVICE CRUD
    // ===================================================================
    const handleAddServico = (e, adminName) => {
        e.preventDefault();
        const { servico, fornecedor, marca, tipoReparo, tecnico, preco, precoFinal, tempoDeGarantia } = newServico;
        if (!servico || !fornecedor || !marca || !tipoReparo || !tecnico || !preco || !precoFinal) {
            toast.error('Por favor, preencha todos os campos.');
            return;
        }
        const servicoToAdd = {
            id: Date.now(),
            ...newServico,
            tempoDeGarantia: parseInt(tempoDeGarantia, 10) || 0,
            preco: parseFloat(preco),
            precoFinal: parseFloat(precoFinal),
            historico: [{
                data: new Date(),
                acao: 'Serviço Criado',
                detalhes: `Serviço "${newServico.servico}" criado.`
            }]
        };
        setServicos(prev => [...prev, servicoToAdd]);
        logAdminActivity(adminName, 'Criação de Serviço', `Serviço "${servicoToAdd.servico}" foi criado.`);
        toast.success('Serviço adicionado com sucesso!');
        handleCloseAddServicoModal();
    };

    const handleUpdateServico = (e, adminName) => {
        e.preventDefault();
        if (!editingServico) return;

        const oldServico = servicos.find(s => s.id === editingServico.id);
        if (!oldServico) return;

        const newServicoData = {
            ...editingServico,
            tempoDeGarantia: parseInt(editingServico.tempoDeGarantia, 10) || 0,
            preco: parseFloat(editingServico.preco),
            precoFinal: parseFloat(editingServico.precoFinal),
        };

        const newHistorico = [...(oldServico.historico || [])];
        const changes = [];
        const fieldsToCompare = {
            servico: 'Serviço', fornecedor: 'Fornecedor', marca: 'Marca',
            tipoReparo: 'Tipo de Reparo', tecnico: 'Técnico', tempoDeGarantia: 'Garantia (dias)', preco: 'Preço',
            precoFinal: 'Preço Final', destaque: 'Destaque', 
        };

        for (const key in fieldsToCompare) {
            const oldValue = oldServico[key];
            const newValue = newServicoData[key];
            if (String(oldValue ?? '') !== String(newValue ?? '')) {
                const displayOld = key === 'destaque' ? (!!oldValue ? 'Sim' : 'Não') : (oldValue ?? 'N/A');
                const displayNew = key === 'destaque' ? (!!newValue ? 'Sim' : 'Não') : (newValue ?? 'N/A');
                changes.push(`${fieldsToCompare[key]} alterado de "${displayOld}" para "${displayNew}"`);
            }
        }

        if (changes.length > 0) {
            newHistorico.push({ data: new Date(), acao: 'Serviço Atualizado', detalhes: changes.join('; ') });
            logAdminActivity(adminName, 'Atualização de Serviço', `Serviço "${oldServico.servico}" atualizado: ${changes.join('; ')}.`);
        }

        const updatedServicos = servicos.map(s =>
            s.id === editingServico.id ? { ...newServicoData, historico: newHistorico } : s
        );

        setServicos(updatedServicos);
        toast.success('Serviço atualizado com sucesso!');
        handleCloseEditServicoModal();
    };

    const handleExcluirServico = (id, adminName) => {
        const serviceToDelete = servicos.find(s => s.id === id);
        if (!serviceToDelete) return;

        if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
            setServicos(servicos.filter(s => s.id !== id));
            logAdminActivity(adminName, 'Exclusão de Serviço', `Serviço "${serviceToDelete.servico}" (ID: ${id}) foi excluído.`);
            toast.success('Serviço excluído com sucesso!');
        }
    };

    // ===================================================================
    // SERVICE DERIVED STATE (SORT, FILTER, PAGINATE)
    // ===================================================================
    const handleServicoSort = (key) => {
        let direction = 'ascending';
        if (servicoSortConfig.key === key && servicoSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setServicoSortConfig({ key, direction });
    };

    const filteredServicos = useMemo(() =>
        servicos.filter(item =>
            (item.servico || '').toLowerCase().includes(servicoSearchTerm.toLowerCase())
        ), [servicos, servicoSearchTerm]);

    const sortedServicos = useMemo(() => {
        let sortableItems = [...filteredServicos];
        if (servicoSortConfig.key) {
            sortableItems.sort((a, b) => {
                let valA = a[servicoSortConfig.key];
                let valB = b[servicoSortConfig.key];

                if (['preco', 'precoFinal'].includes(servicoSortConfig.key)) {
                    valA = Number(valA) || 0;
                    valB = Number(valB) || 0;
                } else {
                    valA = String(valA || '');
                    valB = String(valB || '');
                }

                if (valA < valB) return servicoSortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return servicoSortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredServicos, servicoSortConfig]);

    const totalServicoPages = Math.ceil(sortedServicos.length / itemsPerPage);

    const paginatedServicos = useMemo(() => {
        const startIndex = (servicoCurrentPage - 1) * itemsPerPage;
        return sortedServicos.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedServicos, servicoCurrentPage]);

    // ===================================================================
    // DASHBOARD DATA
    // ===================================================================
    // Dashboard data calculation
    const dashboardData = useMemo(() => {
        const valorTotal = estoque.reduce((acc, item) => acc + (item.preco * (item.emEstoque || 0)), 0);
        const sortedByStock = [...estoque].sort((a, b) => (a.emEstoque || 0) - (b.emEstoque || 0));
        const maisEstoque = [...sortedByStock].reverse().slice(0, 5);
        const menosEstoque = sortedByStock.slice(0, 5);
        const totalItems = estoque.reduce((acc, item) => acc + (item.emEstoque || 0), 0);

        const fornecedorDistribution = estoque.reduce((acc, item) => {
            const fornecedor = item.fornecedor || 'Não especificado';
            if (!acc[fornecedor]) {
                acc[fornecedor] = { name: fornecedor, value: 0 };
            }
            acc[fornecedor].value += 1;
            return acc;
        }, {});

        const categoriaDistribution = estoque.reduce((acc, item) => {
            const categoria = item.categoria || 'Não especificado';
            if (!acc[categoria]) {
                acc[categoria] = { name: categoria, value: 0 };
            }
            acc[categoria].value += 1;
            return acc;
        }, {});

        const totalVendas = salesHistory.reduce((acc, sale) => acc + sale.total, 0);

        const paymentMethodDistribution = salesHistory.reduce((acc, sale) => {
            const method = sale.paymentMethod || 'Não definido';
            if (!acc[method]) {
                acc[method] = { name: method, value: 0 };
            }
            acc[method].value += 1;
            return acc;
        }, {});

        const productSales = {};
        const serviceSales = {};

        salesHistory.forEach(sale => {
            sale.items.forEach(item => {
                if (item.type === 'produto') {
                    if (!productSales[item.id]) productSales[item.id] = { id: item.id, name: item.nome, quantitySold: 0 };
                    productSales[item.id].quantitySold += item.quantity;
                } else if (item.type === 'servico') {
                    if (!serviceSales[item.id]) serviceSales[item.id] = { id: item.id, name: item.servico, quantitySold: 0 };
                    serviceSales[item.id].quantitySold += item.quantity;
                }
            });
        });

        const topSellingProducts = Object.values(productSales)
            .sort((a, b) => b.quantitySold - a.quantitySold)
            .slice(0, 10);

        const topSellingServices = Object.values(serviceSales)
            .sort((a, b) => b.quantitySold - a.quantitySold)
            .slice(0, 10);

        return { 
            valorTotal, totalItems, maisEstoque, menosEstoque, 
            totalProdutos: estoque.length, fornecedorDistribution: Object.values(fornecedorDistribution), 
            categoriaDistribution: Object.values(categoriaDistribution), totalVendas, 
            numeroVendas: salesHistory.length, paymentMethodDistribution: Object.values(paymentMethodDistribution),
            topSellingProducts,
            topSellingServices
        };
    }, [estoque, salesHistory]);

    // ===================================================================
    // EXPORT & MISC
    // ===================================================================

    // CSV export handler
    const handleExportCSV = () => {
        if (sortedEstoque.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        const csvData = sortedEstoque.map(item => ({
            'Produto': item.nome,
            'Marca': item.marca,
            'Categoria': item.categoria,
            'Fornecedor': item.fornecedor,
            'Em Estoque': item.emEstoque,
            'Qtda. Mínima': item.qtdaMinima,
            'Preço': item.preco,
            'Markup (%)': item.markup,
            'Preço Final': item.precoFinal
        }));
        const csv = Papa.unparse(csvData);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'estoque_boycell.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const lowStockItems = useMemo(() =>
        estoque.filter(item => Number(item.emEstoque) <= Number(item.qtdaMinima))
        .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
    , [estoque]);

    const handleSale = (saleDetails) => {
        // 1. Validate the sale before making any changes
        for (const item of saleDetails.items) {
            if (item.type === 'produto') {
                const productInStock = estoque.find(p => p.id === item.id);
                if (!productInStock) {
                    toast.error(`Produto "${item.nome}" não foi encontrado. Venda cancelada.`);
                    return null;
                }
                const sellableStock = (Number(productInStock.emEstoque) || 0) - (Number(productInStock.qtdaMinima) || 0);
                if (item.quantity > sellableStock) {
                    toast.error(`Estoque de venda insuficiente para "${item.nome}". Venda cancelada.`);
                    return null; // Abort transaction
                }
            }
        }

        // 2. If validation passes, update the stock
        setEstoque(currentEstoque => {
            const newEstoque = [...currentEstoque];
            saleDetails.items.forEach(cartItem => {
                if (cartItem.type === 'produto') {
                    const productIndex = newEstoque.findIndex(p => p.id === cartItem.id);
                    if (productIndex !== -1) {
                        const product = newEstoque[productIndex];
                        const currentStock = Number(product.emEstoque) || 0;
                        const newStock = currentStock - cartItem.quantity;
    
                        const newHistorico = [...(product.historico || [])];
                        newHistorico.push({
                            data: new Date(),
                            acao: 'Venda Realizada',
                            detalhes: `Venda de ${cartItem.quantity} unidade(s). Estoque alterado de ${currentStock} para ${newStock}.`
                        });
    
                        newEstoque[productIndex] = { ...product, emEstoque: newStock, historico: newHistorico };
                    }
                }
            });
            return newEstoque;
        });

        // 3. Prepare customer and sale data, then update states
        const { customer, customerCpf, customerPhone, customerEmail } = saleDetails;
        const existingClient = customerCpf ? clientes.find(c => c.cpf === customerCpf) : null;
        const clienteId = existingClient ? existingClient.id : (customerCpf ? Date.now() : null);

        // Create the final sale object that will be returned and saved
        const completeSale = { ...saleDetails, id: Date.now(), receiptCode: generateReceiptCode(), clienteId };

        // 4. Add to sales history
        setSalesHistory(prevHistory => [completeSale, ...prevHistory]);

        // 5. Add or update customer if they exist
        if (clienteId) {
            setClientes(currentClientes => {
                const clientData = {
                    id: clienteId,
                    name: customer,
                    cpf: customerCpf,
                    phone: customerPhone,
                    email: customerEmail,
                    lastPurchase: new Date(),
                };
                if (existingClient) {
                    return currentClientes.map(c => c.id === clienteId ? { ...c, ...clientData } : c);
                } else {
                    return [...currentClientes, clientData];
                }
            });
        }

        return completeSale;
    };

    const handleAddUser = (newUser, adminName) => {
        if (users.some(user => user.email === newUser.email)) {
            toast.error('Este email já está cadastrado.');
            return false;
        }
        const userToAdd = { 
            ...newUser, 
            id: Date.now(), 
            role: 'vendedor', 
            permissions: getDefaultPermissions('vendedor') 
        };
        setUsers(prevUsers => [...prevUsers, userToAdd]);
        logAdminActivity(adminName, 'Criação de Usuário', `Vendedor "${newUser.name}" (${newUser.email}) foi criado.`);
        toast.success('Vendedor adicionado com sucesso!');
        return true;
    };

    const handleDeleteUser = (userId, adminName, currentUser) => {
        const userToDelete = users.find(user => user.id === userId);
        if (!userToDelete) return;

        if (userToDelete.role === 'root') {
            toast.error('O usuário root não pode ser excluído.');
            return;
        }

        if (userToDelete.role === 'admin' && currentUser.role !== 'root') {
            toast.error('Apenas o usuário root pode excluir um administrador.');
            return;
        }

        if (window.confirm(`Tem certeza que deseja excluir o usuário "${userToDelete.name}"?`)) {
            setUsers(users.filter(user => user.id !== userId));
            logAdminActivity(adminName, 'Exclusão de Usuário', `Usuário "${userToDelete.name}" (${userToDelete.email}) foi excluído.`);
            toast.success('Usuário excluído com sucesso!');
        }
    };

    const handleUpdateUser = (userId, updatedData, adminName, currentUser) => {
        let success = false;
        setUsers(currentUsers => {
            const userToUpdate = currentUsers.find(u => u.id === userId);
            if (!userToUpdate) {
                toast.error("Usuário não encontrado.");
                return currentUsers;
            }

            if (userToUpdate.role === 'root') {
                toast.error("O usuário root não pode ser editado.");
                return currentUsers;
            }

            // Prevent email collision
            if (updatedData.email && currentUsers.some(u => u.email === updatedData.email && u.id !== userId)) {
                toast.error("Este email já está em uso por outro usuário.");
                return currentUsers;
            }

            const changes = [];
            if (userToUpdate.name !== updatedData.name) changes.push(`Nome alterado de "${userToUpdate.name}" para "${updatedData.name}"`);
            if (userToUpdate.email !== updatedData.email) changes.push(`Email alterado de "${userToUpdate.email}" para "${updatedData.email}"`);
            if (updatedData.password && updatedData.password.trim() !== '') changes.push('Senha foi alterada');
            if (currentUser.role === 'root' && JSON.stringify(userToUpdate.permissions) !== JSON.stringify(updatedData.permissions)) {
                changes.push('Permissões foram alteradas');
            }

            const updatedUsers = currentUsers.map(user => {
                if (user.id === userId) {
                    const newUserData = { ...user, name: updatedData.name, email: updatedData.email };
                    if (updatedData.password && updatedData.password.trim() !== '') {
                        newUserData.password = updatedData.password;
                    }
                    // Only root can change permissions
                    if (currentUser.role === 'root' && updatedData.permissions) {
                        newUserData.permissions = updatedData.permissions;
                    }
                    return newUserData;
                }
                return user;
            });
            if (changes.length > 0) {
                logAdminActivity(adminName, 'Atualização de Usuário', `Dados do usuário "${userToUpdate.name}" atualizados: ${changes.join('; ')}.`);
            }
            toast.success("Usuário atualizado com sucesso!");
            success = true;
            return updatedUsers;
        });
        return success;
    };

    const handleUpdateCliente = (clienteId, updatedData, adminName) => {
        let success = false;
        setClientes(currentClientes => {
            const clienteToUpdate = currentClientes.find(c => c.id === clienteId);
            if (!clienteToUpdate) {
                toast.error("Cliente não encontrado.");
                return currentClientes;
            }

            // Prevent CPF collision
            if (updatedData.cpf && currentClientes.some(c => c.cpf === updatedData.cpf && c.id !== clienteId)) {
                toast.error("Este CPF/CNPJ já está em uso por outro cliente.");
                return currentClientes;
            }

            const updatedClientes = currentClientes.map(cliente =>
                cliente.id === clienteId ? { ...cliente, ...updatedData } : cliente
            );

            logAdminActivity(adminName, 'Atualização de Cliente', `Dados do cliente "${clienteToUpdate.name}" foram atualizados.`);
            toast.success("Cliente atualizado com sucesso!");
            success = true;
            return updatedClientes;
        });
        return success;
    };

    const handleDeleteCliente = (clienteId, adminName) => {
        const clienteToDelete = clientes.find(c => c.id === clienteId);
        if (!clienteToDelete) return;

        if (window.confirm(`Tem certeza que deseja excluir o cliente "${clienteToDelete.name}"? Esta ação não pode ser desfeita.`)) {
            setClientes(clientes.filter(c => c.id !== clienteId));
            logAdminActivity(adminName, 'Exclusão de Cliente', `Cliente "${clienteToDelete.name}" (CPF: ${clienteToDelete.cpf}) foi excluído.`);
            toast.success('Cliente excluído com sucesso!');
        }
    };

    const handleResetUserPassword = (userId, adminName, currentUser) => {
        const userToReset = users.find(user => user.id === userId);
        if (!userToReset) {
            toast.error('Usuário não encontrado.');
            return;
        }

        if (userToReset.role === 'root') {
            toast.error('Não é possível resetar a senha do usuário root.');
            return;
        }

        if (userToReset.role === 'admin' && currentUser.role !== 'root') {
            toast.error('Apenas o usuário root pode resetar a senha de um administrador.');
            return;
        }

        if (window.confirm(`Tem certeza que deseja resetar a senha de "${userToReset.name}"? Uma nova senha será gerada.`)) {
            // Gera uma senha aleatória simples para este exemplo
            const newPassword = Math.random().toString(36).slice(-8);

            setUsers(currentUsers =>
                currentUsers.map(user =>
                    user.id === userId ? { ...user, password: newPassword } : user
                )
            );
            logAdminActivity(adminName, 'Reset de Senha', `A senha do usuário "${userToReset.name}" foi resetada.`);
            toast.success(`Senha de ${userToReset.name} resetada para: "${newPassword}"`, {
                duration: 10000, // Mantém o toast por mais tempo para o admin copiar
            });
        }
    };

    const handlePasswordRecovery = (email, name) => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.name.toLowerCase() === name.toLowerCase());

        if (user) {
            // Em um aplicativo real, aqui você enviaria um e-mail.
            // Para este exemplo, vamos apenas exibir um toast de sucesso.
            console.log(`Recuperação de senha para ${user.email}: a senha é "${user.password}"`);
            toast.success(`Um e-mail com a senha foi enviado para ${email}.`);
            return true;
        } else {
            toast.error('Nenhum usuário encontrado com este e-mail e nome.');
            return false;
        }
    };

    return {
        estoque,
        servicos,
        // Products
        paginatedEstoque,
        dashboardData,
        sortConfig,
        handleSort,
        handleExcluirProduto,
        searchTerm,
        setSearchTerm,
        showLowStockOnly,
        setShowLowStockOnly,
        currentPage,
        setCurrentPage,
        totalPages,
        isAddModalOpen,
        handleOpenAddModal,
        handleCloseAddModal,
        newProduct,
        handleInputChange,
        handleAddProduct,
        isEditModalOpen,
        handleOpenEditModal,
        handleCloseEditModal,
        editingProduct,
        handleEditInputChange,
        handleUpdateProduct,
        handleExportCSV,
        lowStockItems,
        stockValueHistory,
        // Services
        paginatedServicos,
        servicoSortConfig,
        handleServicoSort,
        handleExcluirServico,
        servicoSearchTerm,
        setServicoSearchTerm,
        servicoCurrentPage,
        setServicoCurrentPage,
        totalServicoPages,
        isAddServicoModalOpen,
        handleOpenAddServicoModal,
        handleCloseAddServicoModal,
        newServico,
        isEditServicoModalOpen,
        handleOpenEditServicoModal,
        handleCloseEditServicoModal,
        editingServico,
        handleServicoInputChange,
        handleAddServico,
        handleUpdateServico,
        handleSale,
        salesHistory,
        // Users
        users,
        handleAddUser,
        handleDeleteUser,
        handleUpdateUser,
        handleResetUserPassword,
        handlePasswordRecovery,
        // Clientes
        clientes,
        handleUpdateCliente,
        handleDeleteCliente,
        activityLog,
    };
};