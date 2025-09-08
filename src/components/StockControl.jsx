import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, LogOut, PlusCircle, Search, ArrowUp, ArrowDown, Edit, DollarSign, Package, FileDown, ChevronLeft, ChevronRight, GripVertical, Printer, Eye, EyeOff, ChevronUpSquare, ChevronDownSquare, History, Trash2, Layers, ShoppingCart, TrendingUp, ShoppingBag, Banknote, LayoutDashboard, Users, KeyRound, ListChecks, Mail, Send, RefreshCw, Upload, Download, UserCog } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Label, AreaChart, Area } from 'recharts';
import { Toaster, toast } from 'react-hot-toast';
import Modal from './Modal.jsx'; // Importa o componente Modal
import ReciboVenda from './ReciboVenda.jsx';
import { PERMISSION_GROUPS } from './useEstoque.jsx';

// ===================================================================
// DEFINIÇÃO DAS COLUNAS DA TABELA
// ===================================================================
const fallbackInitialColumns = [
  { id: 'imagem', label: 'Imagem', sortable: false, align: 'left', printable: false },
  { id: 'nome', label: 'Produto', sortable: true, align: 'left' },
  { id: 'categoria', label: 'Categoria', sortable: true, align: 'left' },
  { id: 'marca', label: 'Marca', sortable: true, align: 'left' },
  { id: 'fornecedor', label: 'Fornecedor', sortable: true, align: 'left' },
  { id: 'emEstoque', label: 'Em Estoque', sortable: true, align: 'left' },
  { id: 'qtdaMinima', label: 'Qtda. Mínima', sortable: true, align: 'left' },
  { id: 'tempoDeGarantia', label: 'Garantia (dias)', sortable: true, align: 'left' },
  { id: 'preco', label: 'Preço', sortable: true, align: 'left' },
  { id: 'precoFinal', label: 'Preço Final', sortable: true, align: 'left', printable: false },
  { id: 'acoes', label: 'Ações', sortable: false, align: 'right', printable: false },
];

const servicosFallbackColumns = [
  { id: 'imagem', label: 'Imagem', sortable: false, align: 'left' },
  { id: 'servico', label: 'Serviço', sortable: true, align: 'left' },
  { id: 'fornecedor', label: 'Fornecedor', sortable: true, align: 'left' },
  { id: 'marca', label: 'Marca', sortable: true, align: 'left' },
  { id: 'tipoReparo', label: 'Tipo de Reparo', sortable: true, align: 'left' },
  { id: 'tecnico', label: 'Técnico', sortable: true, align: 'left' },
  { id: 'tempoDeGarantia', label: 'Garantia (dias)', sortable: true, align: 'left' },
  { id: 'preco', label: 'Preço', sortable: true, align: 'left' },
  { id: 'precoFinal', label: 'Preço Final', sortable: true, align: 'left' },
  { id: 'acoes', label: 'Ações', sortable: false, align: 'right' },
];

// ===================================================================
// COMPONENTES DO DASHBOARD
// ===================================================================
const DashboardCard = ({ icon, title, value, colorClass, isToggleable, showValue, onToggle }) => {
  const Icon = icon;
  return (
    <div className={`bg-gray-900 p-6 rounded-2xl shadow-xl flex items-center gap-6 border-l-4 ${colorClass}`}>
      <Icon size={32} className="text-gray-400 flex-shrink-0" />
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-white">{value}</p>
          {isToggleable && (
            <button onClick={onToggle} className="text-gray-500 hover:text-white" title={showValue ? "Ocultar Valor" : "Mostrar Valor"}>
              {showValue ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ChartContainer = ({ title, show, onToggle, children, onDragStart, onDragEnter, onDragEnd }) => (
  <div 
    className="bg-gray-800/50 p-6 rounded-xl flex flex-col transition-shadow duration-300 shadow-lg hover:shadow-cyan-500/20"
    draggable
    onDragStart={onDragStart}
    onDragEnter={onDragEnter}
    onDragEnd={onDragEnd}
    onDragOver={(e) => e.preventDefault()}
  >
    <div className="flex justify-between items-center mb-4 cursor-move group">
      <div className="flex items-center gap-2">
        <GripVertical size={20} className="text-gray-500 group-hover:text-cyan-400 transition-colors" />
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
      <button onClick={onToggle} className="text-gray-400 hover:text-white">
        {show ? <ChevronUpSquare size={20} /> : <ChevronDownSquare size={20} />}
      </button>
    </div>
    {show && <div className="h-80 flex-grow">{children}</div>}
  </div>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#d0ed57', '#ffc658'];

// ===================================================================
// PÁGINA DE CONTROLE DE ESTOQUE
// ===================================================================
const EstoquePage = ({ 
  onLogout, 
  onNavigateToVendas, 
  onNavigateToClientes,
  currentUser,
  // Props from useEstoque hook, passed from App.jsx
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
  salesHistory,
  users,
  handleAddUser,
  handleDeleteUser,
  handleUpdateUser,
  handleResetUserPassword,
  activityLog,
}) => {
  // ===================================================================
  // STATE & REFS
  // ===================================================================
  // Modal States
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isServiceHistoryModalOpen, setIsServiceHistoryModalOpen] = useState(false);
  const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSalesHistoryModalOpen, setIsSalesHistoryModalOpen] = useState(false);
  const [isChartsModalOpen, setIsChartsModalOpen] = useState(false);
  
  // Data States
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [viewingServiceHistory, setViewingServiceHistory] = useState(null);
  const [reprintingSale, setReprintingSale] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null);

  // UI, Filter & Config States
  const [logActionFilter, setLogActionFilter] = useState('');
  const [logAdminFilter, setLogAdminFilter] = useState('');
  const [columns, setColumns] = useState(() => {
    try {
      const savedColumns = localStorage.getItem('boycell-columns');
      return savedColumns ? JSON.parse(savedColumns) : fallbackInitialColumns;
    } catch (error) {
      console.error("Failed to parse columns from localStorage", error);
      return fallbackInitialColumns;
    }
  });
  const [servicosColumns, setServicosColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('boycell-servicos-columns');
      return saved ? JSON.parse(saved) : servicosFallbackColumns;
    } catch (error) {
      console.error("Failed to parse servicos columns from localStorage", error);
      return servicosFallbackColumns;
    }
  });
  const [showTotalValue, setShowTotalValue] = useState(false);
  const [renderCharts, setRenderCharts] = useState(false);
  const [salesHistoryStartDate, setSalesHistoryStartDate] = useState('');
  const [salesHistorySearchTerm, setSalesHistorySearchTerm] = useState('');
  const [salesHistoryEndDate, setSalesHistoryEndDate] = useState('');
  const [salesChartPeriod, setSalesChartPeriod] = useState('day'); // 'day', 'week', 'month'

  // Chart Configuration
  const initialChartsConfig = [
    { id: 'evolution', title: 'Evolução do Valor do Estoque (Custo)', visible: true, width: 'full' },
    { id: 'salesPeriod', title: 'Vendas por Período', visible: true, width: 'full' },
    { id: 'topSellingProducts', title: 'Top 10 Produtos Mais Vendidos (Unidades)', visible: true, width: 'full' },
    { id: 'topSellingServices', title: 'Top 10 Serviços Mais Realizados', visible: true, width: 'full' },
    { id: 'topStock', title: 'Top 5 - Mais Estoque', visible: true, width: 'half' },
    { id: 'lowStock', title: 'Top 5 - Menos Estoque', visible: true, width: 'half' },
    { id: 'category', title: 'Distribuição por Categoria', visible: true, width: 'half' },
    { id: 'supplier', title: 'Distribuição por Fornecedor', visible: true, width: 'half' },
    { id: 'payment', title: 'Formas de Pagamento (Vendas)', visible: true, width: 'half' },
  ];
  const [chartsConfig, setChartsConfig] = useState(() => {
    try {
      const savedConfig = localStorage.getItem('boycell-chartsConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        if (Array.isArray(parsedConfig) && parsedConfig.every(c => c.id && c.title)) {
            const savedIds = new Set(parsedConfig.map(c => c.id));
            const newCharts = initialChartsConfig.filter(c => !savedIds.has(c.id));
            return [...parsedConfig, ...newCharts];
        }
      }
    } catch (error) {
      console.error("Failed to load chart config from localStorage", error);
    }
    return initialChartsConfig;
  });

  // Refs
  const restoreInputRef = useRef(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const chartDragItem = useRef(null);
  const chartDragOverItem = useRef(null);

  // ===================================================================
  // MEMOIZED VALUES
  // ===================================================================
  const logActions = useMemo(() => {
    if (!activityLog) return [];
    return [...new Set(activityLog.map(log => log.action))].sort();
  }, [activityLog]);
  const logAdmins = useMemo(() => {
      if (!activityLog) return [];
      return [...new Set(activityLog.map(log => log.admin))].sort();
  }, [activityLog]);
  const filteredActivityLog = useMemo(() => {
      if (!activityLog) return [];
      return activityLog.filter(log => {
          const actionMatch = logActionFilter ? log.action === logActionFilter : true;
          const adminMatch = logAdminFilter ? log.admin === logAdminFilter : true;
          return actionMatch && adminMatch;
      });
  }, [activityLog, logActionFilter, logAdminFilter]);
  const filteredSalesHistory = useMemo(() => {
    if (!Array.isArray(salesHistory)) return [];
    const lowerCaseSearchTerm = salesHistorySearchTerm.toLowerCase();

    return salesHistory.filter(sale => {
        if (!sale || !sale.date) return false;
        const saleDate = new Date(sale.date);
        if (isNaN(saleDate.getTime())) return false;
        
        if (salesHistoryStartDate) {
            const [year, month, day] = salesHistoryStartDate.split('-').map(Number);
            const startDate = new Date(year, month - 1, day);
            if (saleDate < startDate) {
                return false;
            }
        }
        if (salesHistoryEndDate) {
            const [year, month, day] = salesHistoryEndDate.split('-').map(Number);
            const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
            if (saleDate > endDate) {
                return false;
            }
        }

        if (lowerCaseSearchTerm) {
            const customerMatch = (sale.customer || '').toLowerCase().includes(lowerCaseSearchTerm);
            const cpfMatch = (sale.customerCpf || '').toLowerCase().includes(lowerCaseSearchTerm);
            const itemsMatch = sale.items.some(item => 
                (item.nome || item.servico || '').toLowerCase().includes(lowerCaseSearchTerm)
            );
            if (!customerMatch && !cpfMatch && !itemsMatch) {
                return false;
            }
        }

        return true;
    });
  }, [salesHistory, salesHistoryStartDate, salesHistoryEndDate, salesHistorySearchTerm]);
  const salesHistorySummary = useMemo(() => {
    if (!filteredSalesHistory || filteredSalesHistory.length === 0) {
        return { total: 0, count: 0 };
    }
    const total = filteredSalesHistory.reduce((acc, sale) => acc + (sale.total || 0), 0);
    return { total, count: filteredSalesHistory.length };
  }, [filteredSalesHistory]);
  const salesByPeriodData = useMemo(() => {
    if (!salesHistory || salesHistory.length === 0) return [];
    const getWeekStartDate = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(new Date(date.setDate(diff)).setHours(0, 0, 0, 0)).toISOString().split('T')[0];
    };
    const groupedData = salesHistory.reduce((acc, sale) => {
        const saleDate = new Date(sale.date);
        if (isNaN(saleDate.getTime())) return acc;
        let key = '';
        if (salesChartPeriod === 'day') {
            key = saleDate.toISOString().split('T')[0];
        } else if (salesChartPeriod === 'week') {
            key = getWeekStartDate(saleDate);
        } else { // month
            key = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        }
        if (!acc[key]) { acc[key] = { period: key, total: 0 }; }
        acc[key].total += sale.total;
        return acc;
    }, {});
    return Object.values(groupedData).sort((a, b) => new Date(a.period) - new Date(b.period));
  }, [salesHistory, salesChartPeriod]);

  // ===================================================================
  // EFFECTS
  // ===================================================================
  useEffect(() => {
    localStorage.setItem('boycell-columns', JSON.stringify(columns));
  }, [columns]);
  useEffect(() => {
    localStorage.setItem('boycell-servicos-columns', JSON.stringify(servicosColumns));
  }, [servicosColumns]);
  useEffect(() => {
    try {
        localStorage.setItem('boycell-chartsConfig', JSON.stringify(chartsConfig));
    } catch (error) {
        console.error("Failed to save chart config to localStorage", error);
    }
  }, [chartsConfig]);
  useEffect(() => {
    const checkAndShowReport = () => {
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth(); // 0-11
        const year = today.getFullYear();
        let reportKey = '';
        let startDate = '';
        let endDate = '';
        let reportTitle = '';
        // Relatório da primeira quinzena (exibido no dia 16)
        if (day === 16) {
            reportKey = `reportShown_${year}-${month}_first_half`;
            if (localStorage.getItem(reportKey)) return;
            startDate = new Date(year, month, 1).toISOString().split('T')[0];
            endDate = new Date(year, month, 15).toISOString().split('T')[0];
            reportTitle = `Relatório da 1ª Quinzena (1 a 15/${month + 1})`;
        }
        // Relatório da segunda quinzena (exibido no dia 1 do mês seguinte)
        else if (day === 1) {
            const prevMonthDate = new Date(year, month, 0); // Último dia do mês anterior
            reportKey = `reportShown_${prevMonthDate.getFullYear()}-${prevMonthDate.getMonth()}_second_half`;
            if (localStorage.getItem(reportKey)) return;
            startDate = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 16).toISOString().split('T')[0];
            endDate = prevMonthDate.toISOString().split('T')[0];
            reportTitle = `Relatório da 2ª Quinzena (16 a ${prevMonthDate.getDate()}/${prevMonthDate.getMonth() + 1})`;
        }
        if (reportKey) {
            toast.info(`${reportTitle} sendo exibido.`, { duration: 6000, icon: '🗓️' });
            setSalesHistoryStartDate(startDate);
            setSalesHistoryEndDate(endDate);
            handleOpenSalesHistoryModal();
            localStorage.setItem(reportKey, 'true');
        }
    };
    const timer = setTimeout(() => {
        if (currentUser?.role === 'admin' || currentUser?.role === 'root') {
            checkAndShowReport();
        }
    }, 2000); // Atraso de 2s para não ser intrusivo
    return () => clearTimeout(timer);
  }, [currentUser]);
  useEffect(() => {
    const afterPrint = () => {
      document.body.classList.remove('print-mode-recibo');
      document.body.classList.remove('print-mode-compra-imediata');
    };
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);

  // ===================================================================
  // HANDLERS & HELPER FUNCTIONS
  // ===================================================================
  const canManageUser = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    if (targetUser.role === 'root') return false; // Cannot manage root
    if (currentUser.role === 'root') return true; // Root can manage admin and vendedor
    if (currentUser.role === 'admin' && targetUser.role === 'vendedor') return true; // Admin can manage vendedor
    return false;
  };

  const handleOpenUserManagementModal = () => setIsUserManagementModalOpen(true);
  const handleCloseUserManagementModal = () => setIsUserManagementModalOpen(false);

  const handleOpenAddUserModal = () => setIsAddUserModalOpen(true);
  const handleCloseAddUserModal = () => {
    setIsAddUserModalOpen(false);
    setNewUserData({ name: '', email: '', password: '' });
  };
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUserData(prev => ({ ...prev, [name]: value }));
  };
  const handleAddNewUser = (e) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }
    const success = handleAddUser(newUserData, currentUser.name);
    if (success) {
      handleCloseAddUserModal();
    }
  };
  const handleOpenEditUserModal = (user) => {
    setEditingUser({ ...user, password: '' }); // Clear password for security
    setIsEditUserModalOpen(true);
  };
  const handleCloseEditUserModal = () => {
    setIsEditUserModalOpen(false);
    setEditingUser(null);
  };
  const handleEditUserChange = (e) => {
    const { name, value } = e.target;
    setEditingUser(prev => ({ ...prev, [name]: value }));
  };
  const handleUpdateUserSubmit = (e) => {
    e.preventDefault();
    if (!editingUser || !editingUser.name || !editingUser.email) {
      toast.error('Nome e email são obrigatórios.');
      return;
    }
    const success = handleUpdateUser(editingUser.id, editingUser, currentUser.name, currentUser);
    if (success) {
      handleCloseEditUserModal();
    }
  };
  const handleOpenServiceHistoryModal = (service) => {
    setViewingServiceHistory(service);
    setIsServiceHistoryModalOpen(true);
  };

  const handleCloseServiceHistoryModal = () => {
    setIsServiceHistoryModalOpen(false);
    setViewingServiceHistory(null);
  };
  const handleOpenReprintModal = (sale) => {
    setReprintingSale(sale);
  };
  const handleCloseReprintModal = () => {
    setReprintingSale(null);
  };
  const handlePrintRecibo = () => {
    document.body.classList.add('print-mode-recibo');
    window.print();
  };
  const handleEmailRecibo = () => {
    if (!reprintingSale) return;

    const { items, subtotal, discountPercentage, discountValue, total, date, customer, customerCpf, customerPhone, customerEmail, receiptCode } = reprintingSale;

    let emailBody = `Olá, ${customer || 'cliente'},\n\nObrigado pela sua compra na Boycell!\n\n`;
    emailBody += `Detalhes da Venda:\n`;
    if (receiptCode) emailBody += `Código da Venda: ${receiptCode}\n`;
    if (customer) emailBody += `Cliente: ${customer}\n`;
    if (customerCpf) emailBody += `CPF/CNPJ: ${customerCpf}\n`;
    if (customerPhone) emailBody += `Telefone: ${customerPhone}\n`;
    emailBody += `Data: ${new Date(date).toLocaleString('pt-BR')}\n\n`;
    emailBody += `Itens:\n`;
    items.forEach(item => {
        const itemSubtotal = (parsePrice(item.precoFinal) * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        emailBody += `- ${item.nome || item.servico} (x${item.quantity}) - ${itemSubtotal}\n`;
        if (item.tempoDeGarantia > 0) {
            const dataGarantia = new Date(date);
            dataGarantia.setDate(dataGarantia.getDate() + item.tempoDeGarantia);
            emailBody += `  Garantia até: ${dataGarantia.toLocaleDateString('pt-BR')}\n`;
        }
    });
    emailBody += `\nSubtotal: ${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    if (discountPercentage > 0) {
        emailBody += `Desconto (${discountPercentage}%): -${discountValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    }
    emailBody += `\nTotal: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n`;
    emailBody += `Atenciosamente,\nEquipe Boycell`;

    const subject = `Seu Comprovante de Compra - Boycell (Cód: ${receiptCode || 'N/A'})`;
    const mailtoLink = `mailto:${customerEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    window.open(mailtoLink, '_blank');
  };
  const handleWhatsAppRecibo = () => {
      if (!reprintingSale) return;
      const { items, subtotal, discountPercentage, discountValue, total, date, customer, customerCpf, customerPhone, receiptCode } = reprintingSale;
      let whatsAppText = `*Comprovante de Compra - Boycell*\n\n`;
      if (receiptCode) whatsAppText += `*Cód. Venda:* ${receiptCode}\n`;
      if (customer) whatsAppText += `*Cliente:* ${customer}\n`;
      if (customerCpf) whatsAppText += `*CPF/CNPJ:* ${customerCpf}\n`;
      if (customerPhone) whatsAppText += `*Telefone:* ${customerPhone}\n`;
      whatsAppText += `*Data:* ${new Date(date).toLocaleString('pt-BR')}\n\n*Itens:*\n`;
      items.forEach(item => {
          const itemSubtotal = (parsePrice(item.precoFinal) * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          whatsAppText += `- ${item.nome || item.servico} (x${item.quantity}) - ${itemSubtotal}\n`;
          if (item.tempoDeGarantia > 0) {
            const dataGarantia = new Date(date);
            dataGarantia.setDate(dataGarantia.getDate() + item.tempoDeGarantia);
            whatsAppText += `  _Garantia até: ${dataGarantia.toLocaleDateString('pt-BR')}_\n`;
          }
      });
      whatsAppText += `\n*Subtotal:* ${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
      if (discountPercentage > 0) {
        whatsAppText += `*Desconto (${discountPercentage}%):* -${discountValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
      }
      whatsAppText += `\n*TOTAL:* ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n_Obrigado pela sua preferência!_`;
      
      const sanitizedPhone = customerPhone ? customerPhone.replace(/\D/g, '') : '';
      window.open(`https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(whatsAppText)}`, '_blank');
  };
  const handleBackup = () => {
    try {
        const backupData = {};
        const keysToBackup = [
            'boycell-estoque',
            'boycell-servicos',
            'boycell-users',
            'boycell-salesHistory',
            'boycell-activityLog',
            'boycell-stockValueHistory',
            'boycell-columns',
            'boycell-servicos-columns'
        ];

        keysToBackup.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                // We don't need to parse and re-stringify, just get the string
                backupData[key] = JSON.parse(data);
            }
        });

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
  const handleRestoreClick = () => {
      restoreInputRef.current.click();
  };
  const handleRestore = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      if (!window.confirm('Tem certeza que deseja restaurar os dados? TODOS os dados atuais serão substituídos por aqueles do arquivo de backup. Esta ação é irreversível.')) {
          event.target.value = null; // Reset file input
          return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = e.target.result;
              const restoredData = JSON.parse(json);
              
              Object.keys(restoredData).forEach(key => {
                  localStorage.setItem(key, JSON.stringify(restoredData[key]));
              });

              toast.success('Dados restaurados com sucesso! A aplicação será recarregada.');
              setTimeout(() => {
                  window.location.reload();
              }, 2000);

          } catch (error) {
              console.error("Erro ao restaurar backup:", error);
              toast.error('Arquivo de backup inválido ou corrompido.');
          } finally {
              event.target.value = null; // Reset file input
          }
      };
      reader.readAsText(file);
  };
  const handleDragStart = (e, index) => {
    dragItem.current = index;
    e.currentTarget.classList.add('bg-gray-700');
  };
  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };
  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('bg-gray-700');
    const newColumns = [...columns];
    const draggedItem = newColumns.splice(dragItem.current, 1)[0];
    newColumns.splice(dragOverItem.current, 0, draggedItem);
    dragItem.current = null;
    dragOverItem.current = null;
    setColumns(newColumns);
  };
  const handleChartDragStart = (e, index) => {
    chartDragItem.current = index;
    e.currentTarget.style.opacity = '0.5';
  };
  const handleChartDragEnter = (e, index) => {
    chartDragOverItem.current = index;
  };
  const handleChartDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    const newChartsConfig = [...chartsConfig];
    const draggedItemContent = newChartsConfig.splice(chartDragItem.current, 1)[0];
    newChartsConfig.splice(chartDragOverItem.current, 0, draggedItemContent);
    chartDragItem.current = null;
    chartDragOverItem.current = null;
    setChartsConfig(newChartsConfig);
  };
  const handleToggleChartVisibility = (id) => {
    setChartsConfig(prevConfig => prevConfig.map(chart => chart.id === id ? { ...chart, visible: !chart.visible } : chart));
  };
  const handlePrintCompraImediata = () => {
    document.body.classList.add('print-mode-compra-imediata');
    window.print();
  };
  const handleOpenHistoryModal = (product) => {
    setViewingHistory(product);
    setIsHistoryModalOpen(true);
  };
  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setViewingHistory(null);
  };
  const handleOpenSalesHistoryModal = () => setIsSalesHistoryModalOpen(true);
  const handleCloseSalesHistoryModal = () => setIsSalesHistoryModalOpen(false);
  const handleOpenChartsModal = () => {
    setIsChartsModalOpen(true);
    // Delay rendering to ensure modal container is sized correctly for the charts
    setTimeout(() => setRenderCharts(true), 50);
  };
  const handleCloseChartsModal = () => {
    setRenderCharts(false); // Reset for next time
    setIsChartsModalOpen(false);
  };

  const actionButtonClasses = "w-full inline-flex items-center justify-start gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg transition-colors duration-300 text-sm";

  // ===================================================================
  // RENDER
  // ===================================================================
  return (
    <div className="bg-gray-950 text-gray-100 min-h-screen font-sans leading-relaxed">
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <input type="file" ref={restoreInputRef} onChange={handleRestore} accept=".json" className="hidden" />
      <div id="recibo-printable-area" className="hidden">
        <ReciboVenda saleDetails={reprintingSale} />
      </div>
      <div id="compra-imediata-printable" className="p-8 bg-white text-black hidden">
        <div className="flex justify-between items-start mb-8">
          <h1 className="text-3xl font-bold">COMPRA IMEDIATA</h1>
          <div className="w-48 h-24 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500">
            <p className="text-sm">Espaço para Logo</p>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b-2 border-black">
            <tr>
              {columns.filter(c => c.printable !== false && c.id !== 'precoFinal').map(col => (
                <th key={col.id} className="p-2 font-bold">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lowStockItems.map(item => (
              <tr key={item.id} className="border-b border-gray-200">
                {columns.filter(c => c.printable !== false && c.id !== 'precoFinal').map(col => <td key={col.id} className="p-2">{item[col.id]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <main id="estoque-non-printable-area" className="container mx-auto px-4 py-8 md:py-16">
        {/* Cabeçalho da página com título e botões de navegação */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-white">Controle de Estoque</h1>
          <div>
            <button onClick={onNavigateToVendas} className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mr-4" title="Página de Vendas">
              <ShoppingCart size={20} />
              <span className="hidden sm:inline">Página de Vendas</span>
            </button>
            <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors mr-4" title="Ver Site">
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Ver Site</span>
            </a>
            <button onClick={onLogout} className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors ml-2" title="Sair">
              <LogOut size={20} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Painéis de Ação */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Painel de Produtos */}
            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border-t-4 border-green-500">
                <h3 className="text-xl font-semibold text-green-400 mb-4">Produtos</h3>
                <div className="flex flex-col gap-3">
                    {currentUser.permissions?.addProduct && (
                        <button onClick={handleOpenAddModal} className={actionButtonClasses}>
                            <PlusCircle size={18} /> Adicionar Produto
                        </button>
                    )}
                    {currentUser.permissions?.exportCsv && (
                        <button onClick={handleExportCSV} className={actionButtonClasses}>
                            <FileDown size={18} /> Exportar CSV de Produtos
                        </button>
                    )}
                    <button onClick={handlePrintCompraImediata} className={actionButtonClasses}>
                        <Printer size={18} /> Imprimir Lista de Compra
                    </button>
                </div>
            </div>

            {/* Painel de Serviços */}
            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border-t-4 border-blue-500">
                <h3 className="text-xl font-semibold text-blue-400 mb-4">Serviços</h3>
                <div className="flex flex-col gap-3">
                    {currentUser.permissions?.addService && (
                        <button onClick={handleOpenAddServicoModal} className={actionButtonClasses}>
                            <PlusCircle size={18} /> Adicionar Serviço
                        </button>
                    )}
                </div>
            </div>

            {/* Painel de Administração */}
            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border-t-4 border-purple-500">
                <h3 className="text-xl font-semibold text-purple-400 mb-4">Administração</h3>
                <div className="flex flex-col gap-3">
                    {currentUser.permissions?.manageUsers && (
                        <>
                            <button onClick={handleOpenAddUserModal} className={actionButtonClasses}>
                                <PlusCircle size={18} /> Adicionar Usuário
                            </button>
                            <button onClick={handleOpenUserManagementModal} className={actionButtonClasses}>
                                <Users size={18} /> Listar/Gerenciar Usuários
                            </button>
                        </>
                    )}
                    {currentUser.permissions?.manageClients && (
                        <button onClick={onNavigateToClientes} className={actionButtonClasses}>
                            <UserCog size={18} /> Gerenciar Clientes
                        </button>
                    )}
                    {currentUser.permissions?.viewDashboardCharts && (
                        <button onClick={handleOpenChartsModal} className={actionButtonClasses}>
                            <LayoutDashboard size={18} /> Análise Gráfica
                        </button>
                    )}
                    {currentUser.permissions?.viewActivityLog && (
                        <button onClick={() => setIsActivityLogModalOpen(true)} className={actionButtonClasses}>
                            <ListChecks size={18} /> Log de Atividades
                        </button>
                    )}
                    {currentUser.permissions?.viewSalesHistory && (
                        <button onClick={handleOpenSalesHistoryModal} className={actionButtonClasses}>
                            <History size={18} /> Histórico de Vendas
                        </button>
                    )}
                    {currentUser.permissions?.manageBackup && (
                        <>
                            <button onClick={handleBackup} className={actionButtonClasses}>
                                <Download size={18} /> Fazer Backup
                            </button>
                            <button onClick={handleRestoreClick} className={actionButtonClasses}>
                                <Upload size={18} /> Restaurar Backup
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Card principal que contém a tabela */}
        <div className="bg-gray-900 p-8 rounded-2xl shadow-xl">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h2 className="text-2xl font-semibold text-green-400">Produtos Cadastrados</h2>
          </div>

          {/* Barra de Busca */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={20} className="text-gray-500" />
              </span>
              <input
                type="text"
                placeholder="Buscar produto por nome..."
                className="w-full p-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={() => setShowLowStockOnly(!showLowStockOnly)}
                className="form-checkbox h-5 w-5 text-green-500 bg-gray-800 border-gray-700 rounded focus:ring-green-500"
              />
              <span className="text-gray-300">Mostrar apenas estoque baixo</span>
            </label>
          </div>

          {/* Tabela de produtos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-700">
                <tr>
                  {columns.map((col, index) => (
                    <th 
                      key={col.id} 
                      className={`p-4 font-semibold text-${col.align} cursor-move group ${col.printable === false ? 'printable-hidden' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical size={16} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {col.sortable ? (
                          <button onClick={() => handleSort(col.id)} className="flex items-center hover:text-green-400 transition-colors">
                            {col.label}
                            {sortConfig.key === col.id && (sortConfig.direction === 'ascending' ? <ArrowUp size={16} className="ml-2" /> : <ArrowDown size={16} className="ml-2" />)}
                          </button>
                        ) : (
                          <span>{col.label}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedEstoque.length > 0 ? paginatedEstoque.map((item) => {
                  const isLowStock = item.emEstoque <= item.qtdaMinima;
                  return (
                  <tr 
                    key={item.id} 
                    className={`border-b border-gray-800 transition-colors ${isLowStock ? 'bg-red-950/40 hover:bg-red-950/60' : 'hover:bg-gray-800/50'}`}
                  >
                    {columns.map(col => {
                      switch (col.id) {
                        case 'imagem':
                          return <td key={col.id} className="p-2 printable-hidden"><img src={item.imagem || 'https://via.placeholder.com/40'} alt={item.nome} className="w-12 h-12 object-cover rounded-md bg-gray-700" /></td>;
                        case 'nome':
                          return <td key={col.id} className="p-4 font-medium">{item.nome}</td>;
                        case 'emEstoque':
                          return <td key={col.id} className={`p-4 font-semibold ${isLowStock ? 'text-red-400' : ''}`}>{item.emEstoque}</td>;
                        case 'preco':
                          return <td key={col.id} className="p-4">{item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>;
                        case 'precoFinal':
                          return <td key={col.id} className={`p-4 ${col.printable === false ? 'printable-hidden' : ''}`}>{item.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>;
                        case 'acoes':
                          return (
                            <td key={col.id} className="p-4 text-right printable-hidden">
                              <div className="flex items-center justify-end gap-4">
                                <button onClick={() => handleOpenHistoryModal(item)} className="text-purple-400 hover:text-purple-300 transition-colors" title="Ver Histórico">
                                  <History size={18} />
                                </button>
                                {currentUser.permissions?.editProduct && (
                                  <button onClick={() => handleOpenEditModal(item)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Editar Produto">
                                    <Edit size={18} />
                                  </button>
                                )}
                                {currentUser.permissions?.deleteProduct && (
                                  <button onClick={() => handleExcluirProduto(item.id, currentUser.name)} className="text-red-400 hover:text-red-300 transition-colors" title="Excluir Produto">
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        default:
                          return <td key={col.id} className={`p-4 ${col.printable === false ? 'printable-hidden' : ''}`}>{item[col.id]}</td>;
                      }
                    })}
                  </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={columns.filter(c => c.printable !== false).length} className="p-8 text-center text-gray-500">Nenhum produto encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginação */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center no-print">
              <span className="text-sm text-gray-400">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"><ChevronLeft size={20} /></button>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"><ChevronRight size={20} /></button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Seção de Serviços */}
      <main className="container mx-auto px-4 py-8 md:py-16 pt-0">
        <div className="bg-gray-900 p-8 rounded-2xl shadow-xl">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-2xl font-semibold text-blue-400">Serviços Cadastrados</h2>
            </div>

            {/* Barra de Busca para Serviços */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 no-print">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search size={20} className="text-gray-500" />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar serviço por nome..."
                        className="w-full p-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={servicoSearchTerm}
                        onChange={(e) => setServicoSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabela de Serviços */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-700">
                        <tr>
                            {servicosColumns.map((col) => (
                                <th key={col.id} className={`p-4 font-semibold text-${col.align}`}>
                                    <div className="flex items-center gap-2">
                                        {col.sortable ? (
                                            <button onClick={() => handleServicoSort(col.id)} className="flex items-center hover:text-blue-400 transition-colors">
                                                {col.label}
                                                {servicoSortConfig.key === col.id && (servicoSortConfig.direction === 'ascending' ? <ArrowUp size={16} className="ml-2" /> : <ArrowDown size={16} className="ml-2" />)}
                                            </button>
                                        ) : (
                                            <span>{col.label}</span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedServicos.length > 0 ? paginatedServicos.map((item) => (
                            <tr key={item.id} className="border-b border-gray-800 transition-colors hover:bg-gray-800/50">
                                {servicosColumns.map(col => {
                                    switch (col.id) {
                                        case 'imagem':
                                            return <td key={col.id} className="p-2"><img src={item.imagem || 'https://via.placeholder.com/40'} alt={item.servico} className="w-12 h-12 object-cover rounded-md bg-gray-700" /></td>;
                                        case 'preco':
                                            return <td key={col.id} className="p-4">{item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>;
                                        case 'precoFinal':
                                            return <td key={col.id} className="p-4">{item.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>;
                                        case 'servico':
                                            return <td key={col.id} className="p-4 font-medium">{item.servico}</td>;
                                        case 'acoes':
                                            return (
                                                <td key={col.id} className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-4">
                                                        <button onClick={() => handleOpenServiceHistoryModal(item)} className="text-purple-400 hover:text-purple-300 transition-colors" title="Ver Histórico">
                                                            <History size={18} />
                                                        </button>
                                                        {currentUser.permissions?.editService && (
                                                          <button onClick={() => handleOpenEditServicoModal(item)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Editar Serviço">
                                                              <Edit size={18} />
                                                          </button>
                                                        )}
                                                        {currentUser.permissions?.deleteService && (
                                                          <button onClick={() => handleExcluirServico(item.id, currentUser.name)} className="text-red-400 hover:text-red-300 transition-colors" title="Excluir Serviço">
                                                              <Trash2 size={18} />
                                                          </button>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        default:
                                            return <td key={col.id} className="p-4">{item[col.id]}</td>;
                                    }
                                })}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={servicosColumns.length} className="p-8 text-center text-gray-500">Nenhum serviço encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Controles de Paginação para Serviços */}
            {totalServicoPages > 1 && (
                <div className="mt-6 flex justify-between items-center no-print">
                    <span className="text-sm text-gray-400">
                        Página {servicoCurrentPage} de {totalServicoPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setServicoCurrentPage(prev => Math.max(prev - 1, 1))} disabled={servicoCurrentPage === 1} className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"><ChevronLeft size={20} /></button>
                        <button onClick={() => setServicoCurrentPage(prev => Math.min(prev + 1, totalServicoPages))} disabled={servicoCurrentPage === totalServicoPages} className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"><ChevronRight size={20} /></button>
                    </div>
                </div>
            )}
        </div>
      </main>

      {/* =================================================================== */}
      {/* MODALS */}
      {/* =================================================================== */}

      {/* Modal para Adicionar Novo Produto */}
      <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal}>
        <h2 className="text-2xl font-bold text-center text-green-400 mb-6">Adicionar Novo Produto</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" onSubmit={(e) => handleAddProduct(e, currentUser.name)}>
          <div className="md:col-span-2">
            <label htmlFor="nome" className="block text-sm font-medium text-gray-300">Nome do Produto</label>
            <input id="nome" name="nome" type="text" value={newProduct.nome} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label htmlFor="categoria" className="block text-sm font-medium text-gray-300">Categoria</label>
            <input id="categoria" name="categoria" type="text" placeholder="Ex: Capas" value={newProduct.categoria} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label htmlFor="marca" className="block text-sm font-medium text-gray-300">Marca</label>
            <input id="marca" name="marca" type="text" value={newProduct.marca} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label htmlFor="fornecedor" className="block text-sm font-medium text-gray-300">Fornecedor</label>
            <input id="fornecedor" name="fornecedor" type="text" value={newProduct.fornecedor} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label htmlFor="emEstoque" className="block text-sm font-medium text-gray-300">Em Estoque</label>
            <input id="emEstoque" name="emEstoque" type="number" value={newProduct.emEstoque} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label htmlFor="qtdaMinima" className="block text-sm font-medium text-gray-300">Qtda. Mínima</label>
            <input id="qtdaMinima" name="qtdaMinima" type="number" value={newProduct.qtdaMinima} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label htmlFor="tempoDeGarantia" className="block text-sm font-medium text-gray-300">Garantia (dias)</label>
            <input id="tempoDeGarantia" name="tempoDeGarantia" type="number" value={newProduct.tempoDeGarantia} onChange={handleInputChange} placeholder="Ex: 90" className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="imagem" className="block text-sm font-medium text-gray-300">Imagem do Produto</label>
            <input id="imagem" name="imagem" type="file" accept="image/*" onChange={handleInputChange} className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer" />
            {newProduct.imagem && (
              <img src={newProduct.imagem} alt="Pré-visualização" className="mt-4 w-24 h-24 object-cover rounded-lg shadow-md" />
            )}
          </div>
          <div className="md:col-span-2 flex items-center p-3 bg-gray-800/50 rounded-lg">
            <label htmlFor="destaque" className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-300">
              <input id="destaque" name="destaque" type="checkbox" checked={newProduct.destaque} onChange={handleInputChange} className="form-checkbox h-5 w-5 text-green-500 bg-gray-800 border-gray-700 rounded focus:ring-green-500" />
              Mostrar produto na página inicial
            </label>
          </div>
          <hr className="md:col-span-2 border-gray-700 my-2" />
          <div>
            <label htmlFor="preco" className="block text-sm font-medium text-gray-300">Preço de Custo</label>
            <input id="preco" name="preco" type="number" step="0.01" placeholder="79.90" value={newProduct.preco} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label htmlFor="markup" className="block text-sm font-medium text-gray-300">Markup (%)</label>
            <input id="markup" name="markup" type="number" step="0.01" placeholder="Ex: 25" value={newProduct.markup} onChange={handleInputChange} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="precoFinal" className="block text-sm font-medium text-gray-300">Preço Final</label>
            <input id="precoFinal" name="precoFinal" type="number" step="0.01" value={newProduct.precoFinal} onChange={handleInputChange} required disabled={!!newProduct.markup} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed" />
          </div>
          <div className="md:col-span-2 flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <label htmlFor="incluirIcms" className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-300">
              <input id="incluirIcms" name="incluirIcms" type="checkbox" checked={newProduct.incluirIcms} onChange={handleInputChange} className="form-checkbox h-5 w-5 text-green-500 bg-gray-800 border-gray-700 rounded focus:ring-green-500" />
              Incluir ICMS no Preço Final
            </label>
            <span className="text-sm font-bold text-gray-400 bg-gray-700 px-3 py-1 rounded-full">ICMS: 18%</span>
          </div>
          <button 
            type="submit" 
            className="w-full md:col-span-2 mt-4 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-300"
          >
            Salvar Produto
          </button>
        </form>
      </Modal>

      {/* Modal para Editar Produto */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal}>
        <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">Editar Produto</h2>
        {editingProduct && (
          <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" onSubmit={(e) => handleUpdateProduct(e, currentUser.name)}>
            <div className="md:col-span-2">
              <label htmlFor="edit-nome" className="block text-sm font-medium text-gray-300">Nome do Produto</label>
              <input id="edit-nome" name="nome" type="text" value={editingProduct.nome} onChange={handleEditInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="edit-categoria" className="block text-sm font-medium text-gray-300">Categoria</label>
              <input id="edit-categoria" name="categoria" type="text" value={editingProduct.categoria} onChange={handleEditInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="edit-marca" className="block text-sm font-medium text-gray-300">Marca</label>
              <input id="edit-marca" name="marca" type="text" value={editingProduct.marca} onChange={handleEditInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="edit-fornecedor" className="block text-sm font-medium text-gray-300">Fornecedor</label>
              <input id="edit-fornecedor" name="fornecedor" type="text" value={editingProduct.fornecedor} onChange={handleEditInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="edit-emEstoque" className="block text-sm font-medium text-gray-300">Em Estoque</label>
              <input id="edit-emEstoque" name="emEstoque" type="number" value={editingProduct.emEstoque} onChange={handleEditInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="edit-qtdaMinima" className="block text-sm font-medium text-gray-300">Qtda. Mínima</label>
              <input id="edit-qtdaMinima" name="qtdaMinima" type="number" value={editingProduct.qtdaMinima} onChange={handleEditInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="edit-tempoDeGarantia" className="block text-sm font-medium text-gray-300">Garantia (dias)</label>
              <input id="edit-tempoDeGarantia" name="tempoDeGarantia" type="number" value={editingProduct.tempoDeGarantia} onChange={handleEditInputChange} placeholder="Ex: 90" className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="edit-imagem" className="block text-sm font-medium text-gray-300">Imagem do Produto</label>
              <input id="edit-imagem" name="imagem" type="file" accept="image/*" onChange={handleEditInputChange} className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
              {editingProduct.imagem && (
                <img src={editingProduct.imagem} alt="Pré-visualização" className="mt-4 w-24 h-24 object-cover rounded-lg shadow-md" />
              )}
            </div>
            <div className="md:col-span-2 flex items-center p-3 bg-gray-800/50 rounded-lg">
              <label htmlFor="edit-destaque" className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-300">
                <input id="edit-destaque" name="destaque" type="checkbox" checked={editingProduct.destaque} onChange={handleEditInputChange} className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-700 rounded focus:ring-blue-500" />
                Mostrar produto na página inicial
              </label>
            </div>
            <hr className="md:col-span-2 border-gray-700 my-2" />
            <div>
              <label htmlFor="edit-preco" className="block text-sm font-medium text-gray-300">Preço de Custo</label>
              <input id="edit-preco" name="preco" type="number" step="0.01" value={editingProduct.preco} onChange={handleEditInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="edit-markup" className="block text-sm font-medium text-gray-300">Markup (%)</label>
              <input id="edit-markup" name="markup" type="number" step="0.01" placeholder="Ex: 25" value={editingProduct.markup} onChange={handleEditInputChange} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="edit-precoFinal" className="block text-sm font-medium text-gray-300">Preço Final</label>
              <input id="edit-precoFinal" name="precoFinal" type="number" step="0.01" value={editingProduct.precoFinal} onChange={handleEditInputChange} required disabled={!!editingProduct.markup} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed" />
            </div>
            <div className="md:col-span-2 flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <label htmlFor="edit-incluirIcms" className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-300">
                <input id="edit-incluirIcms" name="incluirIcms" type="checkbox" checked={editingProduct.incluirIcms} onChange={handleEditInputChange} className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-700 rounded focus:ring-blue-500" />
                Incluir ICMS no Preço Final
              </label>
              <span className="text-sm font-bold text-gray-400 bg-gray-700 px-3 py-1 rounded-full">ICMS: 18%</span>
            </div>
            <button type="submit" className="w-full md:col-span-2 mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-300">
              Salvar Alterações
            </button>
          </form>
        )}
      </Modal>

      {/* Modal para Histórico do Produto */}
      <Modal isOpen={isHistoryModalOpen} onClose={handleCloseHistoryModal}>
        {viewingHistory && (
          <>
            <h2 className="text-2xl font-bold text-center text-purple-400 mb-2">Histórico de Alterações</h2>
            <p className="text-center text-lg font-semibold text-white mb-6">{viewingHistory.nome}</p>
            <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
              {viewingHistory.historico && viewingHistory.historico.length > 0 ? (
                [...viewingHistory.historico].reverse().map((entry, index) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg border-l-4 border-purple-500">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-md font-bold text-purple-300">{entry.acao}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(entry.data).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <p className="text-sm text-gray-200 whitespace-pre-wrap">{entry.detalhes.replaceAll('; ', '\n')}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum histórico encontrado para este produto.</p>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Modal para Histórico de Vendas */}
      <Modal isOpen={isSalesHistoryModalOpen} onClose={handleCloseSalesHistoryModal} size="xl">
        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-6">Histórico de Vendas</h2>
        
        {/* Filtros de Data */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6 p-4 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
                <label htmlFor="startDate" className="text-sm font-medium text-gray-300">De:</label>
                <input 
                    type="date" 
                    id="startDate"
                    value={salesHistoryStartDate}
                    onChange={e => setSalesHistoryStartDate(e.target.value)}
                    className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-sm"
                />
            </div>
            <div className="flex items-center gap-2">
                <label htmlFor="endDate" className="text-sm font-medium text-gray-300">Até:</label>
                <input 
                    type="date" 
                    id="endDate"
                    value={salesHistoryEndDate}
                    onChange={e => setSalesHistoryEndDate(e.target.value)}
                    className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-sm"
                />
            </div>
            <button 
                onClick={() => {
                    setSalesHistoryStartDate('');
                    setSalesHistoryEndDate('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
                Limpar Filtros
            </button>
        </div>

        <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={20} className="text-gray-500" />
            </span>
            <input
                type="text"
                placeholder="Buscar por cliente, CPF ou produto..."
                className="w-full p-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={salesHistorySearchTerm}
                onChange={(e) => setSalesHistorySearchTerm(e.target.value)}
            />
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
            {filteredSalesHistory.length > 0 ? (
                filteredSalesHistory.map(sale => (
                    <div key={sale.id} className="p-4 bg-gray-800 rounded-lg border-l-4 border-yellow-500">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-grow">
                                <p className="text-sm text-gray-400">{new Date(sale.date).toLocaleString('pt-BR')}</p>
                                {sale.receiptCode && <p className="text-xs text-gray-500 font-mono">Cód: {sale.receiptCode}</p>}
                                <p className="text-lg font-bold text-yellow-300">Total: {sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                {sale.customer && <p className="text-sm text-gray-300">Cliente: <span className="font-medium">{sale.customer}</span></p>}
                                <p className="text-sm text-gray-300">Pagamento: <span className="font-semibold text-yellow-200">{sale.paymentMethod}</span></p>
                                {sale.vendedor && <p className="text-sm text-gray-300">Vendedor: <span className="font-medium">{sale.vendedor}</span></p>}
                            </div>
                            <div className="flex-shrink-0">
                                <button onClick={() => handleOpenReprintModal(sale)} className="inline-flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs font-medium rounded-full transition-colors">
                                    <RefreshCw size={14} />
                                    Reimprimir
                                </button>
                            </div>
                        </div>
                        <div className="border-t border-gray-700 pt-2">
                            <p className="text-sm font-semibold mb-1 text-gray-200">Itens:</p>
                            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                                {sale.items.map(item => (<li key={`${item.type}-${item.id}`}>{item.nome || item.servico} (x{item.quantity})</li>))}
                            </ul>
                        </div>
                    </div>
                ))
            ) : (<p className="text-center text-gray-500 py-16">Nenhuma venda encontrada para o período selecionado.</p>)}
        </div>
      </Modal>

      {/* Modal para Gerenciar Usuários */}
      <Modal isOpen={isUserManagementModalOpen} onClose={handleCloseUserManagementModal} size="lg">
        <h2 className="text-2xl font-bold text-center text-purple-400 mb-6">Gerenciar Usuários</h2>
        {/* Lista de usuários existentes */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Usuários Cadastrados</h3>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {users.map(user => {
              const showManagementButtons = canManageUser(user);
              const userRoleClass = user.role === 'root' ? 'bg-red-500 text-white' : (user.role === 'admin' ? 'bg-green-500 text-black' : 'bg-blue-500 text-white');
              return (
                <div key={user.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">{user.name}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${userRoleClass}`}>{user.role}</span>
                    {showManagementButtons && (<>
                      {currentUser.permissions?.resetUserPassword && user.role === 'vendedor' && (
                        <button onClick={() => handleResetUserPassword(user.id, currentUser.name, currentUser)} className="text-yellow-400 hover:text-yellow-300 transition-colors" title="Resetar Senha">
                          <KeyRound size={18} />
                        </button>
                      )}
                      <button onClick={() => handleOpenEditUserModal(user)} className="text-blue-400 hover:text-blue-300 transition-colors" title={`Editar ${user.role === 'admin' ? 'Administrador' : 'Vendedor'}`}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteUser(user.id, currentUser.name, currentUser)} className="text-red-400 hover:text-red-300 transition-colors" title={`Excluir ${user.role === 'admin' ? 'Administrador' : 'Vendedor'}`}><Trash2 size={18} /></button>
                    </>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Modal para Editar Usuário */}
      <Modal isOpen={isEditUserModalOpen} onClose={handleCloseEditUserModal} size="xl">
        <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">Editar Usuário</h2>
        {editingUser && (
          <form className="space-y-4" onSubmit={handleUpdateUserSubmit}>
            <div>
              <label htmlFor="edit-user-name" className="block text-sm font-medium text-gray-300">Nome</label>
              <input id="edit-user-name" name="name" type="text" value={editingUser.name} onChange={handleEditUserChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="edit-user-email" className="block text-sm font-medium text-gray-300">Email</label>
              <input id="edit-user-email" name="email" type="email" value={editingUser.email} onChange={handleEditUserChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="edit-user-password" className="block text-sm font-medium text-gray-300">Nova Senha (Opcional)</label>
              <input id="edit-user-password" name="password" type="password" value={editingUser.password} onChange={handleEditUserChange} placeholder="Deixe em branco para não alterar" className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {currentUser.role === 'root' && editingUser.role !== 'root' && (
                <div className="mt-4">
                    <h4 className="text-lg font-semibold text-white mb-2">Permissões</h4>
                    <div className="space-y-6 p-4 bg-gray-800/50 rounded-lg max-h-80 overflow-y-auto">
                        {Object.values(PERMISSION_GROUPS).map((group, groupIndex) => (
                            <div key={group.title}>
                                <h5 className="text-md font-semibold text-white mb-3">{group.title}</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                    {Object.entries(group.permissions).map(([key, { label }]) => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!editingUser.permissions?.[key]}
                                                onChange={(e) => {
                                                    const { checked } = e.target;
                                                    setEditingUser(prev => ({
                                                        ...prev,
                                                        permissions: { ...(prev.permissions || {}), [key]: checked }
                                                    }));
                                                }}
                                                className="form-checkbox h-4 w-4 text-blue-500 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-300">{label}</span>
                                        </label>
                                    ))}
                                </div>
                                {groupIndex < Object.values(PERMISSION_GROUPS).length - 1 && (
                                    <hr className="border-gray-700 mt-4" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <button type="submit" className="w-full mt-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Salvar Alterações
            </button>
          </form>
        )}
      </Modal>

      {/* Modal para Adicionar Usuário */}
      <Modal isOpen={isAddUserModalOpen} onClose={handleCloseAddUserModal}>
        <h2 className="text-2xl font-bold text-center text-purple-400 mb-6">Adicionar Novo Usuário</h2>
        <form className="space-y-4" onSubmit={handleAddNewUser}>
            <div>
                <label htmlFor="user-name" className="block text-sm font-medium text-gray-300">Nome</label>
                <input id="user-name" name="name" type="text" value={newUserData.name} onChange={handleNewUserChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
                <label htmlFor="user-email" className="block text-sm font-medium text-gray-300">Email</label>
                <input id="user-email" name="email" type="email" value={newUserData.email} onChange={handleNewUserChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
                <label htmlFor="user-password" className="block text-sm font-medium text-gray-300">Senha</label>
                <input id="user-password" name="password" type="password" value={newUserData.password} onChange={handleNewUserChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <button type="submit" className="w-full mt-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
                Adicionar Usuário
            </button>
        </form>
      </Modal>

      {/* Modal para Adicionar Novo Serviço */}
      <Modal isOpen={isAddServicoModalOpen} onClose={handleCloseAddServicoModal}>
        <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">Adicionar Novo Serviço</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" onSubmit={(e) => handleAddServico(e, currentUser.name)}>
          <div className="md:col-span-2">
            <label htmlFor="servico-add-servico" className="block text-sm font-medium text-gray-300">Nome do Serviço</label>
            <input id="servico-add-servico" name="servico" type="text" value={newServico.servico} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="servico-add-fornecedor" className="block text-sm font-medium text-gray-300">Fornecedor (Peças)</label>
            <input id="servico-add-fornecedor" name="fornecedor" type="text" value={newServico.fornecedor} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="servico-add-marca" className="block text-sm font-medium text-gray-300">Marca do Aparelho</label>
            <input id="servico-add-marca" name="marca" type="text" value={newServico.marca} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="servico-add-tipoReparo" className="block text-sm font-medium text-gray-300">Tipo de Reparo</label>
            <input id="servico-add-tipoReparo" name="tipoReparo" type="text" value={newServico.tipoReparo} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="servico-add-tecnico" className="block text-sm font-medium text-gray-300">Técnico Responsável</label>
            <input id="servico-add-tecnico" name="tecnico" type="text" value={newServico.tecnico} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="servico-add-garantia" className="block text-sm font-medium text-gray-300">Garantia (dias)</label>
            <input id="servico-add-garantia" name="tempoDeGarantia" type="number" value={newServico.tempoDeGarantia} onChange={handleServicoInputChange} placeholder="Ex: 90" className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="servico-add-imagem" className="block text-sm font-medium text-gray-300">Imagem</label>
            <input id="servico-add-imagem" name="imagem" type="file" accept="image/*" onChange={handleServicoInputChange} className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
            {newServico.imagem && <img src={newServico.imagem} alt="Pré-visualização" className="mt-4 w-24 h-24 object-cover rounded-lg shadow-md" />}
          </div>
          <div className="md:col-span-2 flex items-center p-3 bg-gray-800/50 rounded-lg">
            <label htmlFor="servico-destaque" className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-300">
              <input id="servico-destaque" name="destaque" type="checkbox" checked={newServico.destaque} onChange={handleServicoInputChange} className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-700 rounded focus:ring-blue-500" />
              Mostrar serviço na página inicial
            </label>
          </div>
          <hr className="md:col-span-2 border-gray-700 my-2" />
          <div>
            <label htmlFor="servico-add-preco" className="block text-sm font-medium text-gray-300">Preço de Custo</label>
            <input id="servico-add-preco" name="preco" type="number" step="0.01" value={newServico.preco} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: 300.00" />
          </div>
          <div>
            <label htmlFor="servico-add-markup" className="block text-sm font-medium text-gray-300">Markup (%)</label>
            <input id="servico-add-markup" name="markup" type="number" step="0.01" placeholder="Ex: 100" value={newServico.markup} onChange={handleServicoInputChange} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="servico-add-precoFinal" className="block text-sm font-medium text-gray-300">Preço Final (Cobrado)</label>
            <input id="servico-add-precoFinal" name="precoFinal" type="number" step="0.01" value={newServico.precoFinal} onChange={handleServicoInputChange} required disabled={!!newServico.markup} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed" />
          </div>
          <button type="submit" className="w-full md:col-span-2 mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-300">
            Salvar Serviço
          </button>
        </form>
      </Modal>

      {/* Modal para Editar Serviço */}
      <Modal isOpen={isEditServicoModalOpen} onClose={handleCloseEditServicoModal}>
        <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">Editar Serviço</h2>
        {editingServico && (
          <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" onSubmit={(e) => handleUpdateServico(e, currentUser.name)}>
            <div className="md:col-span-2">
              <label htmlFor="servico-edit-servico" className="block text-sm font-medium text-gray-300">Nome do Serviço</label>
              <input id="servico-edit-servico" name="servico" type="text" value={editingServico.servico} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="servico-edit-fornecedor" className="block text-sm font-medium text-gray-300">Fornecedor (Peças)</label>
              <input id="servico-edit-fornecedor" name="fornecedor" type="text" value={editingServico.fornecedor} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="servico-edit-marca" className="block text-sm font-medium text-gray-300">Marca do Aparelho</label>
              <input id="servico-edit-marca" name="marca" type="text" value={editingServico.marca} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="servico-edit-tipoReparo" className="block text-sm font-medium text-gray-300">Tipo de Reparo</label>
              <input id="servico-edit-tipoReparo" name="tipoReparo" type="text" value={editingServico.tipoReparo} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="servico-edit-tecnico" className="block text-sm font-medium text-gray-300">Técnico Responsável</label>
              <input id="servico-edit-tecnico" name="tecnico" type="text" value={editingServico.tecnico} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="servico-edit-garantia" className="block text-sm font-medium text-gray-300">Garantia (dias)</label>
              <input id="servico-edit-garantia" name="tempoDeGarantia" type="number" value={editingServico.tempoDeGarantia} onChange={handleServicoInputChange} placeholder="Ex: 90" className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="servico-edit-imagem" className="block text-sm font-medium text-gray-300">Imagem</label>
              <input id="servico-edit-imagem" name="imagem" type="file" accept="image/*" onChange={handleServicoInputChange} className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
              {editingServico.imagem && <img src={editingServico.imagem} alt="Pré-visualização" className="mt-4 w-24 h-24 object-cover rounded-lg shadow-md" />}
            </div>
            <div className="md:col-span-2 flex items-center p-3 bg-gray-800/50 rounded-lg">
              <label htmlFor="servico-edit-destaque" className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-300">
                <input id="servico-edit-destaque" name="destaque" type="checkbox" checked={editingServico.destaque} onChange={handleServicoInputChange} className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-700 rounded focus:ring-blue-500" />
                Mostrar serviço na página inicial
              </label>
            </div>
            <hr className="md:col-span-2 border-gray-700 my-2" />
            <div>
              <label htmlFor="servico-edit-preco" className="block text-sm font-medium text-gray-300">Preço de Custo</label>
              <input id="servico-edit-preco" name="preco" type="number" step="0.01" value={editingServico.preco} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: 300.00" />
            </div>
            <div>
              <label htmlFor="servico-edit-markup" className="block text-sm font-medium text-gray-300">Markup (%)</label>
              <input id="servico-edit-markup" name="markup" type="number" step="0.01" placeholder="Ex: 100" value={editingServico.markup} onChange={handleServicoInputChange} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="servico-edit-precoFinal" className="block text-sm font-medium text-gray-300">Preço Final (Cobrado)</label>
              <input id="servico-edit-precoFinal" name="precoFinal" type="number" step="0.01" value={editingServico.precoFinal} onChange={handleServicoInputChange} required disabled={!!editingServico.markup} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed" />
            </div>
            <button type="submit" className="w-full md:col-span-2 mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-300">
              Salvar Alterações
            </button>
          </form>
        )}
      </Modal>

      {/* Modal para Análise Gráfica */}
      <Modal isOpen={isChartsModalOpen} onClose={handleCloseChartsModal} size="2xl">
        <h2 className="text-2xl font-bold text-center text-cyan-400 mb-6">Análise Gráfica</h2>
        {renderCharts ? (
          <div className="max-h-[80vh] overflow-y-auto p-2">
            <div className="bg-gray-900/50 p-6 rounded-2xl mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Resumo Geral</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  <DashboardCard 
                    icon={DollarSign} 
                    title="Valor Total do Estoque"
                    value={showTotalValue ? dashboardData.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ####,##'}
                    colorClass="border-green-500"
                    isToggleable={true}
                    showValue={showTotalValue}
                    onToggle={() => setShowTotalValue(!showTotalValue)}
                  />
                  <DashboardCard icon={TrendingUp} title="Total Faturado" value={dashboardData.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} colorClass="border-yellow-500" />
                  <DashboardCard icon={ShoppingBag} title="Número de Vendas" value={dashboardData.numeroVendas} colorClass="border-pink-500" />
                  <DashboardCard icon={Package} title="Total de Itens no Estoque" value={dashboardData.totalItems} colorClass="border-blue-500" />
                  <DashboardCard icon={Layers} title="Produtos Diferentes" value={dashboardData.totalProdutos} colorClass="border-purple-500" />
                </div>
            </div>

            <div className="flex flex-wrap gap-8">
              {chartsConfig.map((chart, index) => {
                const chartWidthClass = chart.width === 'full' ? 'w-full' : 'w-full lg:w-[calc(50%-1rem)]';
                let chartContent = null;

                switch(chart.id) {
                  case 'evolution':
                    chartContent = <AreaChart data={stockValueHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis dataKey="date" tickFormatter={(timeStr) => new Date(timeStr).toLocaleDateString('pt-BR')} stroke="#A0AEC0" /><YAxis stroke="#A0AEC0" tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} /><Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} labelStyle={{ color: '#E2E8F0' }} formatter={(value) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), "Valor"]} /><Legend /><Area type="monotone" dataKey="value" stroke="#38B2AC" fill="#38B2AC" fillOpacity={0.3} name="Valor do Estoque" /></AreaChart>;
                    break;
                  case 'salesPeriod':
                    chartContent = <><div className="flex justify-center gap-2 mb-4"><button onClick={() => setSalesChartPeriod('day')} className={`px-3 py-1 text-sm rounded-full transition-colors ${salesChartPeriod === 'day' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Dia</button><button onClick={() => setSalesChartPeriod('week')} className={`px-3 py-1 text-sm rounded-full transition-colors ${salesChartPeriod === 'week' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Semana</button><button onClick={() => setSalesChartPeriod('month')} className={`px-3 py-1 text-sm rounded-full transition-colors ${salesChartPeriod === 'month' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Mês</button></div><ResponsiveContainer width="100%" height="85%"><BarChart data={salesByPeriodData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis dataKey="period" stroke="#A0AEC0" tickFormatter={(str) => { if (salesChartPeriod === 'month') return new Date(str + '-02').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }); return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); }} minTickGap={20} /><YAxis stroke="#A0AEC0" tickFormatter={(value) => `R$${value >= 1000 ? `${value/1000}k` : value}`} /><Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} labelStyle={{ color: '#E2E8F0' }} formatter={(value) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), "Total Vendido"]} labelFormatter={(label) => { if (salesChartPeriod === 'month') return new Date(label + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); if (salesChartPeriod === 'week') return `Semana de ${new Date(label).toLocaleDateString('pt-BR', { dateStyle: 'short' })}`; return new Date(label).toLocaleDateString('pt-BR', { dateStyle: 'long' }); }} /><Legend wrapperStyle={{ paddingTop: '20px' }} /><Bar dataKey="total" fill="#FF8042" name="Total Vendido" /></BarChart></ResponsiveContainer></>;
                    break;
                  case 'topSellingProducts':
                    chartContent = <BarChart data={dashboardData.topSellingProducts} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis type="number" stroke="#A0AEC0" allowDecimals={false} /><YAxis dataKey="name" type="category" stroke="#A0AEC0" width={120} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} labelStyle={{ color: '#E2E8F0' }} formatter={(value) => [value, "Unidades Vendidas"]} /><Bar dataKey="quantitySold" fill="#d0ed57" name="Unidades Vendidas" /></BarChart>;
                    break;
                  case 'topSellingServices':
                    chartContent = <BarChart data={dashboardData.topSellingServices} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis type="number" stroke="#A0AEC0" allowDecimals={false} /><YAxis dataKey="name" type="category" stroke="#A0AEC0" width={120} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} labelStyle={{ color: '#E2E8F0' }} formatter={(value) => [value, "Vezes Realizado"]} /><Bar dataKey="quantitySold" fill="#8884d8" name="Vezes Realizado" /></BarChart>;
                    break;
                  case 'topStock':
                    chartContent = <BarChart data={dashboardData.maisEstoque} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis type="number" stroke="#A0AEC0" /><YAxis dataKey="nome" type="category" stroke="#A0AEC0" width={100} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} labelStyle={{ color: '#E2E8F0' }} formatter={(value) => [value, "Estoque"]} /><Bar dataKey="emEstoque" fill="#8884d8" name="Em Estoque" /></BarChart>;
                    break;
                  case 'lowStock':
                    chartContent = <BarChart data={dashboardData.menosEstoque} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis type="number" stroke="#A0AEC0" /><YAxis dataKey="nome" type="category" stroke="#A0AEC0" width={100} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} labelStyle={{ color: '#E2E8F0' }} formatter={(value) => [value, "Estoque"]} /><Bar dataKey="emEstoque" fill="#82ca9d" name="Em Estoque" /></BarChart>;
                    break;
                  case 'category':
                    chartContent = <PieChart><Pie data={dashboardData.categoriaDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{dashboardData.categoriaDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} /><Legend /></PieChart>;
                    break;
                  case 'supplier':
                    chartContent = <PieChart><Pie data={dashboardData.fornecedorDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{dashboardData.fornecedorDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} /><Legend /></PieChart>;
                    break;
                  case 'payment':
                    chartContent = <PieChart><Pie data={dashboardData.paymentMethodDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{dashboardData.paymentMethodDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} /><Legend /></PieChart>;
                    break;
                  default:
                    chartContent = null;
                }

                return (
                  <div key={chart.id} className={chartWidthClass}>
                    <ChartContainer
                      title={chart.title}
                      show={chart.visible}
                      onToggle={() => handleToggleChartVisibility(chart.id)}
                      onDragStart={(e) => handleChartDragStart(e, index)}
                      onDragEnter={(e) => handleChartDragEnter(e, index)}
                      onDragEnd={handleChartDragEnd}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        {chartContent}
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center p-16 text-gray-400">Carregando gráficos...</div>
        )}
      </Modal>

      {/* Modal para Log de Atividades */}
      <Modal isOpen={isActivityLogModalOpen} onClose={() => setIsActivityLogModalOpen(false)} size="2xl">
        <h2 className="text-2xl font-bold text-center text-orange-400 mb-6">Log de Atividades do Administrador</h2>
        
        {/* Filtros */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6 p-4 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
                <label htmlFor="logActionFilter" className="text-sm font-medium text-gray-300">Ação:</label>
                <select 
                    id="logActionFilter"
                    value={logActionFilter}
                    onChange={e => setLogActionFilter(e.target.value)}
                    className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-sm"
                >
                    <option value="">Todas as Ações</option>
                    {logActions.map(action => <option key={action} value={action}>{action}</option>)}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <label htmlFor="logAdminFilter" className="text-sm font-medium text-gray-300">Admin:</label>
                <select 
                    id="logAdminFilter"
                    value={logAdminFilter}
                    onChange={e => setLogAdminFilter(e.target.value)}
                    className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-sm"
                >
                    <option value="">Todos os Admins</option>
                    {logAdmins.map(admin => <option key={admin} value={admin}>{admin}</option>)}
                </select>
            </div>
            <button 
                onClick={() => {
                    setLogActionFilter('');
                    setLogAdminFilter('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
                Limpar Filtros
            </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
            {filteredActivityLog && filteredActivityLog.length > 0 ? (
                filteredActivityLog.map(log => (
                    <div key={log.id} className="p-3 bg-gray-800 rounded-lg border-l-4 border-orange-500">
                        <div className="flex justify-between items-center text-sm mb-1">
                            <p className="font-bold text-orange-300">{log.action}</p>
                            <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString('pt-BR')}</p>
                        </div>
                        <p className="text-sm text-gray-300">
                            <span className="font-semibold">{log.admin}</span>: {log.details}
                        </p>
                    </div>
                ))
            ) : (
                <p className="text-center text-gray-500 py-16">Nenhum registro de atividade encontrado com os filtros atuais.</p>
            )}
        </div>
      </Modal>

      {/* Modal para Reimprimir Recibo */}
      <Modal isOpen={reprintingSale !== null} onClose={handleCloseReprintModal}>
          {reprintingSale && (
              <>
                  <h2 className="text-2xl font-bold text-center text-blue-400 mb-4">Reimpressão de Recibo</h2>
                  <div className="bg-white rounded-lg overflow-y-auto max-h-[60vh]">
                      <ReciboVenda saleDetails={reprintingSale} />
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4">
                      <button onClick={handleWhatsAppRecibo} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full transition-colors">
                          <Send size={18} /> Enviar por WhatsApp
                      </button>
                      <button onClick={handleEmailRecibo} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-full transition-colors">
                          <Mail size={18} /> Enviar por Email
                      </button>
                      <button onClick={handlePrintRecibo} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors">
                          <Printer size={18} /> Imprimir / Salvar PDF
                      </button>
                  </div>
              </>
          )}
      </Modal>
    </div>
  );
};

export default EstoquePage;
