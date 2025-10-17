import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

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
            viewProductHistory: { label: 'Visualizar Histórico do Produto', roles: ['root', 'admin'] },
        }
    },
    services: {
        title: 'Serviços',
        permissions: {
            addService: { label: 'Adicionar Serviço', roles: ['root', 'admin'] },
            editService: { label: 'Editar Serviço', roles: ['root', 'admin'] },
            deleteService: { label: 'Excluir Serviço', roles: ['root', 'admin'] },
            viewServiceHistory: { label: 'Visualizar Histórico do Serviço', roles: ['root', 'admin'] },
        }
    },
    siteContent: {
        title: 'Conteúdo do Site',
        permissions: {
            manageBanners: { label: 'Gerenciar Banners', roles: ['root', 'admin'] },
        }
    },
    admin: {
        title: 'Administração',
        permissions: {
            viewDashboardCharts: { label: 'Ver Análise Gráfica', roles: ['root'] },
            viewSalesHistory: { label: 'Ver Histórico de Vendas', roles: ['root', 'admin'] },
            viewUserSalesReport: { label: 'Ver Relatório por Vendedor', roles: ['root', 'admin'] },
            viewDreReport: { label: 'Ver DRE Simplificado', roles: ['root', 'admin'] },
            viewActivityLog: { label: 'Ver Log de Atividades', roles: ['root'] },
            manageClients: { label: 'Gerenciar Clientes', roles: ['root', 'admin'] },
        }
    },
    root: {
        title: 'Super Admin (Root)',
        permissions: {
            manageUsers: { label: 'Gerenciar Usuários', roles: ['root'] },
            resetUserPassword: { label: 'Resetar Senha', roles: ['root'] },
            manageBackup: { label: 'Gerenciar Backup/Restore', roles: ['root'] },
            manageTheme: { label: 'Alterar Tema do Site', roles: ['root'] },
        }
    }
};

export const getDefaultPermissions = (role) => {
    const permissions = {};
    Object.values(PERMISSION_GROUPS).forEach(group => {
        for (const key in group.permissions) {
            if (role === 'root') {
                permissions[key] = true;
            } else {
                permissions[key] = group.permissions[key].roles.includes(role);
            }
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

export const useEstoque = (currentUser) => {
    // ===================================================================
    // PRODUCTS STATE
    // ===================================================================
    const [estoque, setEstoque] = useState([]); // Inicia como um array vazio
    const [loadingEstoque, setLoadingEstoque] = useState(true); // Estado de carregamento

    const API_URL = import.meta.env.VITE_API_URL || '';

    // Efeito para buscar os produtos da API quando o componente montar
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoadingEstoque(true);
                const response = await fetch(`${API_URL}/api/products`);
                if (!response.ok) {
                    throw new Error('Falha ao buscar produtos do servidor');
                }
                const data = await response.json();
                // Garante que os campos numéricos sejam do tipo correto
                const parsedData = data.map(p => ({
                    ...p,
                    preco: parseFloat(p.preco) || 0,
                    precoFinal: parseFloat(p.precoFinal) || 0,
                    emEstoque: parseInt(p.emEstoque, 10) || 0,
                    qtdaMinima: parseInt(p.qtdaMinima, 10) || 0,
                }));
                setEstoque(parsedData);
            } catch (error) {
                console.error("Erro ao buscar produtos da API:", error);
                console.log('Info: Não foi possível carregar os produtos. Isso pode ocorrer se não houver produtos cadastrados ou por um erro de conexão.');
            } finally {
                setLoadingEstoque(false);
            }
        };

        fetchProducts();
    }, []); // O array vazio [] garante que isso rode apenas uma vez

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

    const [isSubmitting, setIsSubmitting] = useState(false);
    // ===================================================================
    // SERVICES STATE
    // ===================================================================
    const [servicos, setServicos] = useState([]);
    const [loadingServicos, setLoadingServicos] = useState(true);

    useEffect(() => {
        const fetchServicos = async () => {
            try {
                setLoadingServicos(true);
                const response = await fetch(`${API_URL}/api/services`);
                if (!response.ok) throw new Error('Falha ao buscar serviços do servidor');
                const data = await response.json();
                // Garante que os campos numéricos sejam do tipo correto
                const parsedData = data.map(s => ({
                    ...s,
                    preco: parseFloat(s.preco) || 0,
                    precoFinal: parseFloat(s.precoFinal) || 0,
                }));
                setServicos(parsedData);
            } catch (error) {
                console.error("Erro ao buscar serviços da API:", error);
                console.log('Info: Não foi possível carregar os serviços. Isso pode ocorrer se não houver serviços cadastrados ou por um erro de conexão.');
            } finally {
                setLoadingServicos(false);
            }
        };
        fetchServicos();
    }, []);

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
    const [salesHistory, setSalesHistory] = useState([]);

    useEffect(() => {
        const fetchSalesHistory = async () => {
            try {
                const token = localStorage.getItem('boycell-token');
                if (!token) {
                    setSalesHistory([]); // Limpa o histórico se não houver token
                    return;
                }
                const response = await fetch(`${API_URL}/api/sales`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar histórico de vendas.');
                const data = await response.json();
                setSalesHistory(data);
            } catch (error) {
                console.error("Erro ao buscar histórico de vendas da API:", error);
                toast.error('Não foi possível carregar o histórico de vendas.');
                setSalesHistory([]); // Limpa em caso de erro
            }
        };
        if (currentUser) { // Só busca se o usuário estiver logado
            fetchSalesHistory();
        } else {
            setSalesHistory([]); // Limpa o histórico no logout
        }
    }, [currentUser]); // Re-executa quando o usuário muda

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
    const [clientes, setClientes] = useState([]);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const token = localStorage.getItem('boycell-token');
                if (!token) {
                    setClientes([]); // Limpa clientes se não houver token
                    return;
                }
                const response = await fetch(`${API_URL}/api/clients`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar clientes.');
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Falha ao buscar clientes.');
                }
                const data = await response.json();
                setClientes(data);
            } catch (error) {
                console.error("Erro ao buscar clientes da API:", error);
                console.log('Info: Não foi possível carregar os clientes. Isso pode ocorrer se não houver clientes cadastrados ou por um erro de conexão.');
                setClientes([]); // Limpa em caso de erro
            }
        };
        if (currentUser) { // Só busca se o usuário estiver logado
            fetchClients();
        } else {
            setClientes([]); // Limpa clientes no logout
        }
    }, [currentUser]); // Re-executa quando o usuário muda

    // ===================================================================
    // USERS STATE
    // ===================================================================
    const [users, setUsers] = useState([]); // Start with empty array

    // Effect to fetch users from API
    useEffect(() => {
        const fetchUsers = async (token) => {
            try {
                const response = await fetch(`${API_URL}/api/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar usuários.');
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error("Erro ao buscar usuários da API:", error);
                toast.error('Não foi possível carregar os usuários.');
            }
        };

        const token = localStorage.getItem('boycell-token');
        if (currentUser && token) {
            // Vendedores não precisam e não podem buscar a lista de todos os usuários.
            // Apenas usuários com permissão de gerenciar outros usuários devem buscar a lista.
            if (currentUser.permissions?.manageUsers) {
                fetchUsers(token);
            }
        }

    }, [currentUser]);

    // ===================================================================
    // BANNERS STATE
    // ===================================================================
    const [banners, setBanners] = useState([]);

    useEffect(() => {
        const fetchBanners = async () => {
            if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'root')) {
                try {
                    const token = localStorage.getItem('boycell-token');
                    const response = await fetch(`${API_URL}/api/banners/all`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Falha ao buscar banners.');
                    const data = await response.json();
                    setBanners(data);
                } catch (error) {
                    console.error("Erro ao buscar banners para o admin:", error);
                    toast.error('Não foi possível carregar os banners.');
                }
            }
        };
        fetchBanners();
    }, [currentUser]);

    // ===================================================================
    // EFFECTS
    // ===================================================================
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

    // Efeito para salvar o log de atividades
    useEffect(() => {
        try {
            localStorage.setItem('boycell-activityLog', JSON.stringify(activityLog));
        } catch (error) {
            console.error("Erro ao salvar o log de atividades:", error);
        }
    }, [activityLog]);

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

        if (type === 'file' && files && files[0]) {
            const file = files[0];
            const compressAndSetImage = async () => {
                const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
                try {
                    const compressedFile = await imageCompression(file, options);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setNewProduct(prevState => ({ ...prevState, imagem: reader.result }));
                    };
                    reader.readAsDataURL(compressedFile);
                } catch (error) {
                    console.error('Erro ao comprimir imagem:', error);
                    toast.error('Falha ao processar a imagem. Tente uma imagem menor ou de outro formato.');
                }
            };
            compressAndSetImage();
            return;
        }

        setNewProduct(prevState => {
            const isCheckbox = type === 'checkbox';
            const updatedValue = isCheckbox ? checked : value;
            
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
                    newState.precoFinal = Math.round(precoFinal * 100) / 100;
                } else if (name === 'incluirIcms') {
                    // If checkbox is toggled but there's no markup, adjust the existing precoFinal.
                    const precoFinalValue = parseFloat(newState.precoFinal);
                    if (!isNaN(precoFinalValue)) {
                        newState.precoFinal = Math.round((checked ? precoFinalValue * 1.18 : precoFinalValue / 1.18) * 100) / 100;
                    }
                }
            }
            return newState;
        });
    };

    const handleEditInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === 'file' && files && files[0]) {
            const file = files[0];
            const compressAndSetImage = async () => {
                const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
                try {
                    const compressedFile = await imageCompression(file, options);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setEditingProduct(prevState => ({ ...prevState, imagem: reader.result }));
                    };
                    reader.readAsDataURL(compressedFile);
                } catch (error) {
                    console.error('Erro ao comprimir imagem:', error);
                    toast.error('Falha ao processar a imagem. Tente uma imagem menor ou de outro formato.');
                }
            };
            compressAndSetImage();
            return;
        }

        setEditingProduct(prevState => {
            const isCheckbox = type === 'checkbox';
            const updatedValue = isCheckbox ? checked : value;

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
                    newState.precoFinal = Math.round(precoFinal * 100) / 100;
                } else if (name === 'incluirIcms') {
                    // If checkbox is toggled but there's no markup, adjust the existing precoFinal.
                    const precoFinalValue = parseFloat(newState.precoFinal);
                    if (!isNaN(precoFinalValue)) {
                        newState.precoFinal = Math.round((checked ? precoFinalValue * 1.18 : precoFinalValue / 1.18) * 100) / 100;
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
    const handleAddProduct = async (e, adminName) => {
        e.preventDefault();
        if (!newProduct.nome || !newProduct.categoria || !newProduct.marca || !newProduct.fornecedor || !newProduct.emEstoque || !newProduct.qtdaMinima || !newProduct.preco || !newProduct.precoFinal) {
            toast.error('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
    
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`${API_URL}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newProduct,
                    emEstoque: parseInt(newProduct.emEstoque, 10),
                    qtdaMinima: parseInt(newProduct.qtdaMinima, 10),
                    preco: parseFloat(newProduct.preco),
                    precoFinal: parseFloat(newProduct.precoFinal),
                    tempoDeGarantia: parseInt(newProduct.tempoDeGarantia, 10) || 0,
                })
            });
    
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao adicionar produto.');
    
            setEstoque(prevEstoque => [...prevEstoque, data]);
            logAdminActivity(adminName, 'Criação de Produto', `Produto "${data.nome}" foi criado.`);

            toast.success('Produto adicionado com sucesso!');
            handleCloseAddModal();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateProduct = async (e, adminName) => {
        e.preventDefault();
        if (!editingProduct) return;
    
        const oldItem = estoque.find(item => item.id === editingProduct.id);
        if (!oldItem) return;
    
        const newHistorico = [...(oldItem.historico || [])];
        const changes = [];
        const fieldsToCompare = {
            nome: 'Nome', marca: 'Marca', categoria: 'Categoria', destaque: 'Destaque na Home',
            fornecedor: 'Fornecedor', emEstoque: 'Estoque', qtdaMinima: 'Qtda. Mínima',
            preco: 'Preço', tempoDeGarantia: 'Garantia (dias)', precoFinal: 'Preço Final',
        };
    
        for (const key in fieldsToCompare) {
            const oldValue = oldItem[key];
            const newValue = editingProduct[key];
            if (String(oldValue ?? '') !== String(newValue ?? '')) {
                const displayOld = key === 'destaque' ? (!!oldValue ? 'Sim' : 'Não') : (oldValue ?? 'N/A');
                const displayNew = key === 'destaque' ? (!!newValue ? 'Sim' : 'Não') : (newValue ?? 'N/A');
                changes.push(`${fieldsToCompare[key]} alterado de "${displayOld}" para "${displayNew}"`);
            }
        }
    
        if (changes.length > 0) {
            newHistorico.push({ data: new Date(), acao: 'Produto Atualizado', detalhes: changes.join('; ') });
            logAdminActivity(adminName, 'Atualização de Produto', `Produto "${oldItem.nome}" atualizado: ${changes.join('; ')}.`);
        }
    
        const productToUpdate = {
            ...editingProduct,
            emEstoque: parseInt(editingProduct.emEstoque, 10),
            qtdaMinima: parseInt(editingProduct.qtdaMinima, 10),
            preco: parseFloat(editingProduct.preco),
            precoFinal: parseFloat(editingProduct.precoFinal),
            tempoDeGarantia: parseInt(editingProduct.tempoDeGarantia, 10) || 0,
            historico: newHistorico,
        };
    
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`${API_URL}/api/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(productToUpdate)
            });
    
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao atualizar produto.');
    
            setEstoque(currentEstoque => currentEstoque.map(item => (item.id === editingProduct.id ? data : item)));
            toast.success('Produto atualizado com sucesso!');
            handleCloseEditModal();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleExcluirProduto = async (idProduto, adminName) => {
        const productToDelete = estoque.find(item => item.id === idProduto);
        if (!productToDelete) return;

        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            try {
                const token = localStorage.getItem('boycell-token');
                const response = await fetch(`${API_URL}/api/products/${idProduto}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
    
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Erro ao excluir produto.');
    
                setEstoque(currentEstoque => currentEstoque.filter(item => item.id !== idProduto));
                logAdminActivity(adminName, 'Exclusão de Produto', `Produto "${productToDelete.nome}" (ID: ${idProduto}) foi excluído.`);
                toast.success(data.message);
            } catch (error) {
                toast.error(error.message);
            }
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
    
        if (type === 'file' && files && files[0]) {
            const file = files[0];
            const compressAndSetImage = async () => {
                const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
                try {
                    const compressedFile = await imageCompression(file, options);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        stateSetter(prevState => ({ ...prevState, imagem: reader.result }));
                    };
                    reader.readAsDataURL(compressedFile);
                } catch (error) {
                    console.error('Erro ao comprimir imagem:', error);
                    toast.error('Falha ao processar a imagem. Tente uma imagem menor ou de outro formato.');
                }
            };
            compressAndSetImage();
            return;
        }
    
        stateSetter(prevState => {
            const isCheckbox = type === 'checkbox';
            const updatedValue = isCheckbox ? checked : value;
            
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
                    newState.precoFinal = Math.round((preco * (1 + markup / 100)) * 100) / 100;
                }
            }
            return newState;
        });
    };

    // ===================================================================
    // SERVICE CRUD HANDLERS
    // ===================================================================
    const handleAddServico = async (e, adminName) => {
        e.preventDefault();
        if (!newServico.servico || !newServico.fornecedor || !newServico.marca || !newServico.tipoReparo || !newServico.tecnico || !newServico.preco || !newServico.precoFinal) {
            toast.error('Por favor, preencha todos os campos.');
            return;
        }
    
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`${API_URL}/api/services`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newServico,
                    preco: parseFloat(newServico.preco),
                    precoFinal: parseFloat(newServico.precoFinal),
                    tempoDeGarantia: parseInt(newServico.tempoDeGarantia, 10) || 0,
                })
            });
    
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao adicionar serviço.');
    
            setServicos(prev => [...prev, data]);
            logAdminActivity(adminName, 'Criação de Serviço', `Serviço "${data.servico}" foi criado.`);
            toast.success('Serviço adicionado com sucesso!');
            handleCloseAddServicoModal();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleUpdateServico = async (e, adminName) => {
        e.preventDefault();
        if (!editingServico) return;
    
        const oldServico = servicos.find(s => s.id === editingServico.id);
        if (!oldServico) return;
    
        const newHistorico = [...(oldServico.historico || [])];
        const changes = [];
        const fieldsToCompare = {
            servico: 'Serviço', fornecedor: 'Fornecedor', marca: 'Marca',
            tipoReparo: 'Tipo de Reparo', tecnico: 'Técnico', tempoDeGarantia: 'Garantia (dias)',
            preco: 'Preço', precoFinal: 'Preço Final', destaque: 'Destaque',
        };
    
        for (const key in fieldsToCompare) {
            const oldValue = oldServico[key];
            const newValue = editingServico[key];
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
    
        const serviceToUpdate = {
            ...editingServico,
            tempoDeGarantia: parseInt(editingServico.tempoDeGarantia, 10) || 0,
            preco: parseFloat(editingServico.preco),
            precoFinal: parseFloat(editingServico.precoFinal),
            historico: newHistorico,
        };
    
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`${API_URL}/api/services/${editingServico.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(serviceToUpdate)
            });
    
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao atualizar serviço.');
    
            setServicos(currentServicos => currentServicos.map(s => (s.id === editingServico.id ? data : s)));
            toast.success('Serviço atualizado com sucesso!');
            handleCloseEditServicoModal();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleExcluirServico = async (id, adminName) => {
        const serviceToDelete = servicos.find(s => s.id === id);
        if (!serviceToDelete) return;

        if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
            try {
                const token = localStorage.getItem('boycell-token');
                const response = await fetch(`${API_URL}/api/services/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
    
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Erro ao excluir serviço.');
    
                setServicos(currentServicos => currentServicos.filter(s => s.id !== id));
                logAdminActivity(adminName, 'Exclusão de Serviço', `Serviço "${serviceToDelete.servico}" (ID: ${id}) foi excluído.`);
                toast.success(data.message);
            } catch (error) {
                toast.error(error.message);
            }
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
        const valorTotal = estoque.reduce((acc, item) => {
            const custo = parseFloat(item.preco) || 0;
            return acc + (custo * (item.emEstoque || 0));
        }, 0);
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

        const totalVendas = salesHistory.reduce((acc, sale) => acc + Number(sale.total || 0), 0);

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

    const handleSale = async (saleDetails) => {
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`${API_URL}/api/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(saleDetails)
            });
    
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao finalizar a venda.');
    
            // Update frontend state after successful sale
            // 1. Update sales history
            setSalesHistory(prevHistory => [data, ...prevHistory]);
    
            // 2. Update stock
            setEstoque(currentEstoque => {
                const newEstoque = [...currentEstoque];
                data.items.forEach(cartItem => {
                    if (cartItem.type === 'produto') {
                        const productIndex = newEstoque.findIndex(p => p.id === cartItem.id);
                        if (productIndex !== -1) {
                            const product = newEstoque[productIndex];
                            const newStock = (Number(product.emEstoque) || 0) - cartItem.quantity;
                            newEstoque[productIndex] = { ...product, emEstoque: newStock };
                        }
                    }
                });
                return newEstoque;
            });
    
            // 3. Update clients list
            setClientes(currentClientes => {
                const existingClient = currentClientes.find(c => c.id === data.clienteId);
                const clientData = { id: data.clienteId, name: data.customer, cpf: data.customerCpf, phone: data.customerPhone, email: data.customerEmail, lastPurchase: data.date };
                if (existingClient) {
                    return currentClientes.map(c => c.id === data.clienteId ? { ...c, ...clientData } : c);
                } else {
                    return [...currentClientes, clientData];
                }
            });
    
            return data; // Return the complete sale object from the backend
        } catch (error) {
            toast.error(error.message);
            return null;
        }
    };

    const handleAddUser = async (newUser, adminName) => {
        try {
            const token = localStorage.getItem('boycell-token');
            if (!token) {
                toast.error('Não autorizado. Faça login novamente.');
                return false;
            }

            const response = await fetch(`${API_URL}/api/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao criar usuário.');
            }

            setUsers(prevUsers => [...prevUsers, data]);
            logAdminActivity(adminName, 'Criação de Usuário', `Vendedor "${data.name}" (${data.email}) foi criado.`);
            toast.success('Vendedor adicionado com sucesso!');
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const handleDeleteUser = async (userId, adminName, currentUser) => {
        const userToDelete = users.find(user => user.id === userId);
        if (!userToDelete) return;

        // Frontend validation for quick feedback
        if (userToDelete.role === 'root') {
            toast.error('O usuário root não pode ser excluído.');
            return;
        }
        if (userToDelete.role === 'admin' && currentUser.role !== 'root') {
            toast.error('Apenas o usuário root pode excluir um administrador.');
            return;
        }

        if (window.confirm(`Tem certeza que deseja excluir o usuário "${userToDelete.name}"?`)) {
            try {
                const token = localStorage.getItem('boycell-token');
                const response = await fetch(`${API_URL}/api/users/${userId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Erro ao excluir usuário.');

                setUsers(currentUsers => currentUsers.filter(user => user.id !== userId));
                logAdminActivity(adminName, 'Exclusão de Usuário', `Usuário "${userToDelete.name}" (${userToDelete.email}) foi excluído.`);
                toast.success(data.message);
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    const handleUpdateUser = async (userId, updatedData, adminName, currentUser) => {
        try {
            const token = localStorage.getItem('boycell-token');
            // Remove password from body if it's empty
            const body = { ...updatedData };
            if (!body.password) delete body.password;

            const response = await fetch(`${API_URL}/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao atualizar usuário.');

            setUsers(currentUsers => currentUsers.map(user => (user.id === userId ? data : user)));

            const oldUser = users.find(u => u.id === userId);
            const changes = [];
            if (oldUser.name !== data.name) changes.push(`Nome alterado de "${oldUser.name}" para "${data.name}"`);
            if (oldUser.email !== data.email) changes.push(`Email alterado de "${oldUser.email}" para "${data.email}"`);
            if (updatedData.password) changes.push('Senha foi alterada');
            if (currentUser.role === 'root' && JSON.stringify(oldUser.permissions) !== JSON.stringify(data.permissions)) {
                changes.push('Permissões foram alteradas');
            }
            if (changes.length > 0) {
                logAdminActivity(adminName, 'Atualização de Usuário', `Dados do usuário "${oldUser.name}" atualizados: ${changes.join('; ')}.`);
            }

            toast.success("Usuário atualizado com sucesso!");
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const handleUpdateCliente = async (clienteId, updatedData, adminName) => {
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`${API_URL}/api/clients/${clienteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao atualizar cliente.');

            setClientes(currentClientes =>
                currentClientes.map(cliente => (cliente.id === clienteId ? data : cliente))
            );

            logAdminActivity(adminName, 'Atualização de Cliente', `Dados do cliente "${data.name}" foram atualizados.`);
            toast.success("Cliente atualizado com sucesso!");
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const handleDeleteCliente = async (clienteId, adminName) => {
        const clienteToDelete = clientes.find(c => c.id === clienteId);
        if (!clienteToDelete) return;

        if (window.confirm('vc perdera os dados do cliente e todo o historico pertencente a ele, será irrecuperavel!!! tem certeza?')) {
            try {
                const token = localStorage.getItem('boycell-token');
                const response = await fetch(`${API_URL}/api/clients/${clienteId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Erro ao excluir cliente.');

                setClientes(currentClientes => currentClientes.filter(c => c.id !== clienteId));
                // Também remove o histórico de vendas do cliente do estado local para atualizar os gráficos.
                if (clienteToDelete.cpf) {
                    setSalesHistory(currentHistory => 
                        currentHistory.filter(sale => sale.customerCpf !== clienteToDelete.cpf)
                    );
                }
                logAdminActivity(adminName, 'Exclusão de Cliente', `Cliente "${clienteToDelete.name}" (CPF: ${clienteToDelete.cpf}) foi excluído.`);
                toast.success(data.message);
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    const handleBackup = () => {
        try {
            const backupData = {
                estoque,
                servicos,
                users,
                salesHistory,
                clientes,
                activityLog,
                stockValueHistory: JSON.parse(localStorage.getItem('boycell-stockValueHistory') || '[]'),
                columns: JSON.parse(localStorage.getItem('boycell-columns') || 'null'),
                servicosColumns: JSON.parse(localStorage.getItem('boycell-servicos-columns') || 'null'),
                chartsConfig: JSON.parse(localStorage.getItem('boycell-chartsConfig') || 'null'),
            };

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `backup-boycell-${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('Backup realizado com sucesso!');
        } catch (error) {
            console.error("Erro ao criar backup:", error);
            toast.error('Ocorreu um erro ao criar o backup.');
        }
    };

    const handleRestore = (fileContent) => {
        try {
            const restoredData = JSON.parse(fileContent);
            
            // AVISO: Esta é uma restauração local e não afeta o banco de dados.
            // Uma restauração completa exigiria endpoints de API para cada tipo de dado.
            Object.keys(restoredData).forEach(key => {
                localStorage.setItem(`boycell-${key}`, JSON.stringify(restoredData[key]));
            });

            toast.success('Dados restaurados localmente! A aplicação será recarregada.');
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error("Erro ao restaurar backup:", error);
            toast.error('Arquivo de backup inválido ou corrompido.');
        }
    };

    const handleResetUserPassword = async (userId, adminName, currentUser) => {
        const userToReset = users.find(user => user.id === userId);
        if (!userToReset) {
            toast.error('Usuário não encontrado.');
            return;
        }

        // Validações no frontend para feedback rápido
        if (userToReset.role === 'root') {
            toast.error('Não é possível resetar a senha do usuário root.');
            return;
        }
        if (userToReset.role === 'admin' && currentUser.role !== 'root') {
            toast.error('Apenas o usuário root pode resetar a senha de um administrador.');
            return;
        }

        if (window.confirm(`Tem certeza que deseja resetar a senha de "${userToReset.name}"? Uma nova senha será gerada.`)) {
            try {
                const token = localStorage.getItem('boycell-token');
                const response = await fetch(`${API_URL}/api/users/${userId}/reset-password`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Erro ao resetar senha.');

                const { newPassword } = data;
                logAdminActivity(adminName, 'Reset de Senha', `A senha do usuário "${userToReset.name}" foi resetada.`);
                toast.success(`Senha de ${userToReset.name} resetada para: "${newPassword}"`, {
                    duration: 10000,
                });
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    const handlePasswordRecovery = async (email, name) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/recover`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao solicitar recuperação.');

            toast.success(data.message);
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const handleAddBanner = async (newBannerData, adminName) => {
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`${API_URL}/api/banners`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newBannerData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao adicionar banner.');
            setBanners(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
            logAdminActivity(adminName, 'Criação de Banner', `Banner "${data.title || 'Novo'}" foi criado.`);
            toast.success('Banner adicionado com sucesso!');
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const handleUpdateBanner = async (bannerId, bannerData, adminName) => {
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`${API_URL}/api/banners/${bannerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(bannerData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao atualizar banner.');
            setBanners(prev => prev.map(b => b.id === bannerId ? data : b).sort((a, b) => a.sort_order - b.sort_order));
            logAdminActivity(adminName, 'Atualização de Banner', `Banner "${data.title || 'ID: '+bannerId}" foi atualizado.`);
            toast.success('Banner atualizado com sucesso!');
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const handleDeleteBanner = async (bannerId, adminName) => {
        if (!window.confirm('Tem certeza que deseja excluir este banner?')) return;
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`${API_URL}/api/banners/${bannerId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao excluir banner.');
            setBanners(prev => prev.filter(b => b.id !== bannerId));
            logAdminActivity(adminName, 'Exclusão de Banner', `Banner com ID ${bannerId} foi excluído.`);
            toast.success(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const hasAdminAccessPermission = useMemo(() => {
        if (!currentUser) return false;
        // Root e Admin sempre têm acesso
        if (currentUser.role === 'root' || currentUser.role === 'admin') return true;
        if (!currentUser.permissions) return false;

        // Lista de permissões que garantem acesso ao painel de administração
        const adminAccessPermissions = [
            ...Object.keys(PERMISSION_GROUPS.admin.permissions),
            ...Object.keys(PERMISSION_GROUPS.root.permissions),
            ...Object.keys(PERMISSION_GROUPS.siteContent.permissions),
            'manageClients' // Adicionado explicitamente caso esteja em outro grupo
        ];

        // Verifica se o usuário tem pelo menos uma dessas permissões
        return adminAccessPermissions.some(permissionKey => 
            !!currentUser.permissions[permissionKey]
        );
    }, [currentUser]);

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
        handleBackup,
        handleRestore,
        // Banners
        isSubmitting,
        banners,
        handleAddBanner,
        handleUpdateBanner,
        handleDeleteBanner,
        hasAdminAccessPermission, // Exporta a nova função
    };
};