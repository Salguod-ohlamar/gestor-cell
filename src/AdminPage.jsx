import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, LogOut, PlusCircle, Search, Edit, DollarSign, Package, FileDown, ChevronLeft, ChevronRight, GripVertical, Printer, Eye, EyeOff, ChevronUpSquare, ChevronDownSquare, History, Trash2, Layers, ShoppingCart, TrendingUp, ShoppingBag, Banknote, LayoutDashboard, Users, KeyRound, ListChecks, Mail, Send, RefreshCw, Upload, Download, UserCog, Settings, Image as ImageIcon, TrendingUp as TrendingUpIcon, Sun, Moon, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Label, AreaChart, Area } from 'recharts';
import { Toaster, toast } from 'react-hot-toast';
import Modal from './components/Modal.jsx';
import ReciboVenda from './components/ReciboVenda.jsx';
import BannerManager from './components/BannerManager.jsx';
import FaqRegras from './components/FaqRegras.jsx';
import { useEstoqueContext } from './components/EstoqueContext.jsx';
import { useTheme } from './components/ThemeContext.jsx';
import RelatorioVendasMensal from './components/RelatorioVendasMensal.jsx';
import RelatorioVendasUsuario from './components/RelatorioVendasUsuario.jsx';
import DreReport from './components/DreReport.jsx';
import { PERMISSION_GROUPS, getDefaultPermissions } from './components/useEstoque.jsx';

// Dashboard components can be moved to their own file later
const DashboardCard = ({ icon, title, value, colorClass, isToggleable, showValue, onToggle }) => {
  const Icon = icon;
  return (
    <div className={`bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl flex items-center gap-6 border-l-4 ${colorClass}`}>
      <Icon size={32} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {isToggleable && (
            <button onClick={onToggle} className="text-gray-500 hover:text-gray-900 dark:hover:text-white" title={showValue ? "Ocultar Valor" : "Mostrar Valor"}>
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
    className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-xl flex flex-col transition-shadow duration-300 shadow-lg hover:shadow-cyan-500/20"
    draggable={true}
    onDragStart={onDragStart}
    onDragEnter={onDragEnter}
    onDragEnd={onDragEnd}
    onDragOver={(e) => e.preventDefault()}
  >
    <div className="flex justify-between items-center mb-4 cursor-move group">
      <div className="flex items-center gap-2">
        <GripVertical size={20} className="text-gray-500 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <button onClick={onToggle} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
        {show ? <ChevronUpSquare size={20} /> : <ChevronDownSquare size={20} />}
      </button>
    </div>
    {show && <div className="h-80 flex-grow">{children}</div>}
  </div>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#d0ed57', '#ffc658'];

const AdminPage = ({ onLogout, currentUser }) => {

    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const {
        dashboardData,
        salesHistory,
        users,
        handleAddUser,
        handleDeleteUser,
        handleUpdateUser,
        handleResetUserPassword,
        activityLog,
        handleBackup,
        handleRestore,
        stockValueHistory,
        banners,
        handleAddBanner,
        handleUpdateBanner,
        handleDeleteBanner,
    } = useEstoqueContext();
    const hasStockPermission = useMemo(() => currentUser?.permissions?.editProduct || currentUser?.permissions?.addProduct || currentUser?.permissions?.deleteProduct || ['admin', 'root', 'vendedor'].includes(currentUser.role), [currentUser]);

    // State and handlers that were in StockControl.jsx
    const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState(false);
    const [isSalesHistoryModalOpen, setIsSalesHistoryModalOpen] = useState(false);
    const [isUserSalesReportModalOpen, setIsUserSalesReportModalOpen] = useState(false);
    const [isDreModalOpen, setIsDreModalOpen] = useState(false);
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
    const [isChartsModalOpen, setIsChartsModalOpen] = useState(false);
    const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', title: 'Vendedor' });
    const [editingUser, setEditingUser] = useState(null);
    const [reprintingSale, setReprintingSale] = useState(null);
    const [monthlySalesReport, setMonthlySalesReport] = useState(null);
    const [logActionFilter, setLogActionFilter] = useState('');
    const [logAdminFilter, setLogAdminFilter] = useState('');
    const [showTotalValue, setShowTotalValue] = useState(false);
    const [renderCharts, setRenderCharts] = useState(false);
    const [salesHistoryStartDate, setSalesHistoryStartDate] = useState('');
    const [salesHistoryCurrentPage, setSalesHistoryCurrentPage] = useState(1);
    const salesHistoryItemsPerPage = 4;
    const [salesHistorySearchTerm, setSalesHistorySearchTerm] = useState('');
    const [salesHistoryEndDate, setSalesHistoryEndDate] = useState('');
    const [salesChartPeriod, setSalesChartPeriod] = useState('day');
    const [userSalesReportData, setUserSalesReportData] = useState(null);
    const [userSalesReportUserId, setUserSalesReportUserId] = useState('');
    const [userSalesReportStartDate, setUserSalesReportStartDate] = useState('');
    const [userSalesReportEndDate, setUserSalesReportEndDate] = useState('');
    const [loadingUserSalesReport, setLoadingUserSalesReport] = useState(false);
    const restoreInputRef = useRef(null);
    const [dreStartDate, setDreStartDate] = useState('');
    const [dreEndDate, setDreEndDate] = useState('');
    const [dreData, setDreData] = useState(null);
    const [loadingDre, setLoadingDre] = useState(false);
    const [reportMonth, setReportMonth] = useState(new Date().getMonth());
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const chartDragItem = useRef(null);
    const chartDragOverItem = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || '';

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

    useEffect(() => {
        try {
            localStorage.setItem('boycell-chartsConfig', JSON.stringify(chartsConfig));
        } catch (error) {
            console.error("Failed to save chart config to localStorage", error);
        }
    }, [chartsConfig]);

    useEffect(() => {
        const afterPrint = () => {
            document.body.classList.remove('print-mode-thermal');
            document.body.classList.remove('print-mode-recibo');
            document.body.classList.remove('print-mode-monthly-report');
            document.body.classList.remove('print-mode-dre-report');
            document.body.classList.remove('print-mode-user-sales-report');
        };

        window.addEventListener('afterprint', afterPrint);

        return () => window.removeEventListener('afterprint', afterPrint);
    }, []);

    const canManageUser = (targetUser) => {
        if (!currentUser || !targetUser || !currentUser.permissions?.manageUsers) return false;
        // Ninguém pode gerenciar o usuário root.
        if (targetUser.role === 'root') return false;
        // O root pode gerenciar qualquer um (exceto ele mesmo).
        if (currentUser.role === 'root') return true;
        // Outros usuários com a permissão só não podem gerenciar o root.
        return true;
    };

    const handleOpenUserManagementModal = () => setIsUserManagementModalOpen(true);
    const handleCloseUserManagementModal = () => setIsUserManagementModalOpen(false);
    const handleOpenAddUserModal = () => setIsAddUserModalOpen(true);
    const handleCloseAddUserModal = () => {
        setIsAddUserModalOpen(false);
        setNewUserData({ name: '', email: '', password: '', title: 'Vendedor' });
    };
    const handleNewUserChange = (e) => {
        const { name, value } = e.target;
        setNewUserData(prev => ({ ...prev, [name]: value }));
    };
    const handleAddNewUser = async (e) => {
        e.preventDefault();
        if (!newUserData.name || !newUserData.email || !newUserData.password || !newUserData.title) {
            toast.error('Por favor, preencha todos os campos: Nome, Email, Senha e Título.');
            return;
        }
        const success = await handleAddUser(newUserData, currentUser.name);
        if (success) {
            handleCloseAddUserModal();
        }
    };
    const handleOpenEditUserModal = (user) => {
        setEditingUser({ ...user, password: '' });
        setIsEditUserModalOpen(true);
    };
    const handleCloseEditUserModal = () => {
        setIsEditUserModalOpen(false);
        setEditingUser(null);
    };
    const handleEditUserChange = (e) => {
        const { name, value } = e.target;
        setEditingUser(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'role') {
                newState.permissions = getDefaultPermissions(value);
            }
            return newState;
        });
    };
    const handleUpdateUserSubmit = async (e) => {
        e.preventDefault();
        if (!editingUser || !editingUser.name || !editingUser.email) {
            toast.error('Nome e email são obrigatórios.');
            return;
        }
        const success = await handleUpdateUser(editingUser.id, editingUser, currentUser.name, currentUser);
        if (success) {
            handleCloseEditUserModal();
        }
    };

    const handleOpenSalesHistoryModal = () => {
        setSalesHistoryCurrentPage(1);
        setIsSalesHistoryModalOpen(true);
    };
    const handleCloseSalesHistoryModal = () => setIsSalesHistoryModalOpen(false);

    const handleOpenChartsModal = () => {
        setIsChartsModalOpen(true);
        setTimeout(() => setRenderCharts(true), 50);
    };
    const handleCloseChartsModal = () => {
        setRenderCharts(false);
        setIsChartsModalOpen(false);
    };

    const handleRestoreClick = () => {
        restoreInputRef.current.click();
    };

    const handleFileRestore = (event) => {
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

    const handlePrintMonthlyReport = () => {
        const selectedDate = new Date(reportYear, reportMonth, 1);
        const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthlySales = salesHistory.filter(sale => {
            if (!sale || !sale.date) return false;
            const saleDate = new Date(sale.date);
            return saleDate >= startOfMonth && saleDate <= endOfMonth;
        });

        if (monthlySales.length === 0) {
            toast.error("Nenhuma venda encontrada para o período selecionado.");
            return;
        }
        //faz a somatoria do total vendido no mês
        const totalVendido = monthlySales.reduce((acc, sale) => acc + Number(sale.total || 0), 0);
        const totalVendas = monthlySales.length;
        const totalsByPaymentMethod = monthlySales.reduce((acc, sale) => {
            const method = sale.paymentMethod || 'Indefinido';
            const total = Number(sale.total || 0);
            if (!acc[method]) {
                acc[method] = { total: 0, count: 0 };
            }
            acc[method].total += total;
            acc[method].count += 1;
            return acc;
        }, {});

        setMonthlySalesReport({
            sales: monthlySales.sort((a, b) => new Date(a.date) - new Date(b.date)),
            month: selectedDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
            totalVendido,
            totalVendas,
            totalsByPaymentMethod,
        });

        setTimeout(() => {
            document.body.classList.add('print-mode-monthly-report');
            window.print();
        }, 100);
    };

    const handleGenerateUserSalesReport = async () => {
        if (!userSalesReportUserId || !userSalesReportStartDate || !userSalesReportEndDate) {
            toast.error('Por favor, selecione o vendedor e o período.');
            return;
        }
        setLoadingUserSalesReport(true);
        setUserSalesReportData(null);
        try {
            const token = localStorage.getItem('boycell-token');
            const user = users.find(u => u.id == userSalesReportUserId);
            if (!user) {
                toast.error('Vendedor não encontrado.');
                setLoadingUserSalesReport(false);
                return;
            }
    
            const response = await fetch(`${API_URL}/api/reports/sales-by-user?userId=${userSalesReportUserId}&startDate=${userSalesReportStartDate}&endDate=${userSalesReportEndDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao gerar o relatório.');
            }
            
            if (data.sales.length === 0) {
                toast.error('Nenhuma venda encontrada para este vendedor no período selecionado.');
                setUserSalesReportData(null);
            } else {
                setUserSalesReportData({
                    ...data,
                    user: user.name,
                    period: { start: userSalesReportStartDate, end: userSalesReportEndDate },
                });
            }
        } catch (error) {
            toast.error(error.message);
            setUserSalesReportData(null);
        } finally {
            setLoadingUserSalesReport(false);
        }
    };

    const handlePrintUserSalesReport = () => {
        if (!userSalesReportData) {
            toast.error("Gere um relatório antes de imprimir.");
            return;
        }
        setTimeout(() => {
            document.body.classList.add('print-mode-user-sales-report');
            window.print();
        }, 100);
    };

    const handleGenerateDreReport = async () => {
        if (!dreStartDate || !dreEndDate) {
            toast.error('Por favor, selecione as datas de início e fim.');
            return;
        }
        setLoadingDre(true);
        setDreData(null);
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`${API_URL}/api/reports/dre?startDate=${dreStartDate}&endDate=${dreEndDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao gerar o relatório DRE.');
            }
            setDreData(data);
        } catch (error) {
            toast.error(error.message);
            setDreData(null);
        } finally {
            setLoadingDre(false);
        }
    };

    const handlePrintDre = () => {
        if (!dreData) {
            toast.error("Gere um relatório antes de imprimir.");
            return;
        }
        setTimeout(() => {
            document.body.classList.add('print-mode-dre-report');
            window.print();
        }, 100);
    };

    const handleOpenReprintModal = (sale) => setReprintingSale(sale);
    const handleCloseReprintModal = () => setReprintingSale(null);

    const handlePrintRecibo = () => {
        document.body.classList.add('print-mode-recibo');
        window.print();
    };

    const handlePrintThermalRecibo = () => {
        document.body.classList.add('print-mode-thermal');
        window.print();
    };

    const handleWhatsAppRecibo = () => {
        if (!reprintingSale) return;
        const { items, subtotal, discountPercentage, discountValue, total, date, customer, customerCpf, customerPhone, receiptCode } = reprintingSale;
        let whatsAppText = `*Comprovante de Compra - Boycell*\n\n*Cód. Venda:* ${receiptCode}\n*Cliente:* ${customer}\n*CPF/CNPJ:* ${customerCpf}\n*Data:* ${new Date(date).toLocaleString('pt-BR')}\n\n*Itens:*\n`;
        items.forEach(item => {
            const itemSubtotal = (item.precoFinal * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            whatsAppText += `- ${item.nome || item.servico} (x${item.quantity}) - ${itemSubtotal}\n`;
            if (item.tempoDeGarantia > 0) {
                const dataGarantia = new Date(date);
                dataGarantia.setDate(dataGarantia.getDate() + item.tempoDeGarantia);
                whatsAppText += `  _Garantia até: ${dataGarantia.toLocaleDateString('pt-BR')}_\n`;
            }
        });
        whatsAppText += `\n*Subtotal:* ${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
        if (discountPercentage > 0) whatsAppText += `*Desconto (${discountPercentage}%):* -${discountValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
        whatsAppText += `\n*TOTAL:* ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n_Obrigado pela sua preferência!_`;
        const sanitizedPhone = customerPhone ? customerPhone.replace(/\D/g, '') : '';
        window.open(`https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(whatsAppText)}`, '_blank');
    };

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
                if (saleDate < startDate) return false;
            }
            if (salesHistoryEndDate) {
                const [year, month, day] = salesHistoryEndDate.split('-').map(Number);
                const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
                if (saleDate > endDate) return false;
            }

            if (lowerCaseSearchTerm) {
                const customerMatch = (sale.customer || '').toLowerCase().includes(lowerCaseSearchTerm);
                const cpfMatch = (sale.customerCpf || '').toLowerCase().includes(lowerCaseSearchTerm);
                const itemsMatch = sale.items.some(item => 
                    (item.nome || item.servico || '').toLowerCase().includes(lowerCaseSearchTerm)
                );
                if (!customerMatch && !cpfMatch && !itemsMatch) return false;
            }

            return true;
        });
    }, [salesHistory, salesHistoryStartDate, salesHistoryEndDate, salesHistorySearchTerm]);

    useEffect(() => {
        setSalesHistoryCurrentPage(1);
    }, [salesHistoryStartDate, salesHistoryEndDate, salesHistorySearchTerm]);

    const salesHistoryTotalPages = Math.ceil(filteredSalesHistory.length / salesHistoryItemsPerPage);

    const paginatedSalesHistory = useMemo(() => {
        if (filteredSalesHistory.length === 0) return [];
        const startIndex = (salesHistoryCurrentPage - 1) * salesHistoryItemsPerPage;
        return filteredSalesHistory.slice(startIndex, startIndex + salesHistoryItemsPerPage);
    }, [filteredSalesHistory, salesHistoryCurrentPage]);


    const salesByPeriodData = useMemo(() => {
        if (!salesHistory || salesHistory.length === 0) return [];
        const getWeekStartDate = (d) => {
            const date = new Date(d); // Cria uma nova instância para não modificar a original
            const day = date.getUTCDay(); // Usa getUTCDay para consistência
            const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1); // Ajuste para a semana começar na segunda-feira
            return new Date(date.setUTCDate(diff)).toISOString().split('T')[0];
        };
        const groupedData = salesHistory.reduce((acc, sale) => {
            const saleDate = new Date(sale.date);
            if (isNaN(saleDate.getTime())) return acc; // Re-adiciona a verificação de data inválida
            let key;
            if (salesChartPeriod === 'day') {
                key = saleDate.toISOString().split('T')[0];
            } else if (salesChartPeriod === 'week') {
                key = getWeekStartDate(saleDate);
            } else { // month
                key = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
            }
            if (!acc[key]) { acc[key] = { period: key, total: 0 }; }
            acc[key].total += Number(sale.total || 0);
            return acc;
        }, {});
        return Object.values(groupedData).sort((a, b) => new Date(a.period) - new Date(b.period));
    }, [salesHistory, salesChartPeriod]);

    const actionButtonClasses = "w-full inline-flex items-center justify-start gap-3 px-4 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors duration-300 text-sm";

    return (
        <div className="bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen font-sans leading-relaxed">
            <Toaster position="top-right" toastOptions={{ className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white', style: { background: 'transparent', boxShadow: 'none' } }} />
            <input type="file" ref={restoreInputRef} onChange={handleFileRestore} accept=".json" className="hidden" />
            <div id="recibo-printable-area" className="hidden">
                <ReciboVenda saleDetails={reprintingSale} />
            </div>
            <div id="monthly-report-printable-area" className="hidden">
                <RelatorioVendasMensal reportData={monthlySalesReport} />
            </div>
            <div id="user-sales-report-printable-area" className="hidden">
                <RelatorioVendasUsuario reportData={userSalesReportData} />
            </div>
            <div id="dre-report-printable-area" className="hidden">
                <DreReport reportData={dreData} />
            </div>

            <main id="admin-non-printable-area" className="container mx-auto px-4 py-8 md:py-16">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Painel de Administração</h1>
                    <div>
                        {hasStockPermission && (
                            <button onClick={() => navigate('/estoque')} className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors mr-4" title="Voltar ao Estoque">
                                <ArrowLeft size={20} />
                                <span className="hidden sm:inline">Voltar ao Estoque</span>
                            </button>
                        )}
                        <button onClick={onLogout} className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors ml-2" title="Sair">
                            <LogOut size={20} />
                            <span className="hidden sm:inline">Sair</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {/* Painel de Administração */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border-t-4 border-purple-500 md:col-span-1 lg:col-span-1">
                        <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-4">Gerenciamento</h3>
                        <div className="flex flex-col gap-3">
                            {currentUser?.permissions?.manageUsers && (
                                <>
                                    <button onClick={handleOpenAddUserModal} className={actionButtonClasses}>
                                        <PlusCircle size={18} /> Adicionar Usuário
                                    </button>
                                    <button onClick={handleOpenUserManagementModal} className={actionButtonClasses}>
                                        <Users size={18} /> Listar/Gerenciar Usuários
                                    </button>
                                </>
                            )}
                            {currentUser?.permissions?.manageClients && (
                                <button onClick={() => navigate('/clientes')} className={actionButtonClasses}>
                                    <UserCog size={18} /> Gerenciar Clientes
                                </button>
                            )}
                        </div>
                    </div>

                    {currentUser?.permissions?.manageBanners && (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border-t-4 border-green-500 md:col-span-1 lg:col-span-1">
                            <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">Conteúdo do Site</h3>
                            <div className="flex flex-col gap-3">
                                <button onClick={() => setIsBannerModalOpen(true)} className={actionButtonClasses}>
                                    <ImageIcon size={18} /> Gerenciar Banners
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border-t-4 border-cyan-500 md:col-span-1 lg:col-span-1">
                        <h3 className="text-xl font-semibold text-cyan-600 dark:text-cyan-400 mb-4">Relatórios e Dados</h3>
                        <div className="flex flex-col gap-3">
                            {currentUser?.permissions?.viewDashboardCharts && (
                                <button onClick={handleOpenChartsModal} className={actionButtonClasses}>
                                    <LayoutDashboard size={18} /> Análise Gráfica
                                </button>
                            )}
                            {currentUser?.permissions?.viewActivityLog && (
                                <button onClick={() => setIsActivityLogModalOpen(true)} className={actionButtonClasses}>
                                    <ListChecks size={18} /> Log de Atividades
                                </button>
                            )}
                            {currentUser?.permissions?.viewSalesHistory && (
                                <button onClick={handleOpenSalesHistoryModal} className={actionButtonClasses}>
                                    <History size={18} /> Histórico de Vendas
                                </button>
                            )}
                            {currentUser?.permissions?.viewUserSalesReport && (
                                <button onClick={() => setIsUserSalesReportModalOpen(true)} className={actionButtonClasses}>
                                    <Users size={18} /> Relatório por Vendedor
                                </button>
                            )}
                            {currentUser?.permissions?.viewDreReport && (
                                <button onClick={() => setIsDreModalOpen(true)} className={actionButtonClasses}>
                                    <TrendingUpIcon size={18} /> DRE Simplificado
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border-t-4 border-yellow-500 md:col-span-2 lg:col-span-1">
                        <h3 className="text-xl font-semibold text-yellow-600 dark:text-yellow-400 mb-4">Sistema</h3>
                        <div className="flex flex-col gap-3">
                            {currentUser?.permissions?.manageTheme && (
                                <button onClick={toggleTheme} className={actionButtonClasses}>
                                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} Alterar para Tema {theme === 'dark' ? 'Claro' : 'Escuro'}
                                </button>
                            )}
                            {currentUser?.permissions?.manageBackup && (
                                <>
                                    <button onClick={handleBackup} className={actionButtonClasses}>
                                        <Download size={18} /> Fazer Backup (Local)
                                    </button>
                                    <button onClick={handleRestoreClick} className={actionButtonClasses}>
                                        <Upload size={18} /> Restaurar Backup (Local)
                                    </button>
                                </>
                            )}
                            {/* Botão para abrir o FAQ */}
                            <button onClick={() => setIsFaqModalOpen(true)} className={actionButtonClasses}>
                                <HelpCircle size={18} /> FAQ - Regras de Negócio
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* MODALS */}
            <Modal isOpen={isBannerModalOpen} onClose={() => setIsBannerModalOpen(false)} size="2xl">
                <BannerManager 
                    banners={banners}
                    onAdd={handleAddBanner}
                    onUpdate={handleUpdateBanner}
                    onDelete={handleDeleteBanner}
                    currentUser={currentUser}
                />
            </Modal>

            <Modal isOpen={isFaqModalOpen} onClose={() => setIsFaqModalOpen(false)} size="lg">
                <FaqRegras />
            </Modal>

            <Modal isOpen={isUserSalesReportModalOpen} onClose={() => setIsUserSalesReportModalOpen(false)} size="xl">
                <h2 className="text-2xl font-bold text-center text-cyan-600 dark:text-cyan-400 mb-6">Relatório de Vendas por Vendedor</h2>
                <div className="flex flex-wrap items-center justify-center gap-4 mb-6 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <label htmlFor="userSelect" className="text-sm font-medium text-gray-700 dark:text-gray-300">Vendedor:</label>
                        <select
                            id="userSelect"
                            value={userSalesReportUserId}
                            onChange={e => setUserSalesReportUserId(e.target.value)}
                            className="p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                        >
                            <option value="">Selecione um vendedor</option>
                            {users.filter(u => u.role !== 'root').map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="userSaleStartDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">De:</label>
                        <input 
                            type="date" 
                            id="userSaleStartDate"
                            value={userSalesReportStartDate}
                            onChange={e => setUserSalesReportStartDate(e.target.value)}
                            className="p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="userSaleEndDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Até:</label>
                        <input 
                            type="date" 
                            id="userSaleEndDate"
                            value={userSalesReportEndDate}
                            onChange={e => setUserSalesReportEndDate(e.target.value)}
                            className="p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                        />
                    </div>
                    <button onClick={handleGenerateUserSalesReport} disabled={loadingUserSalesReport} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-500">
                        {loadingUserSalesReport ? 'Gerando...' : 'Gerar Relatório'}
                    </button>
                    <button onClick={handlePrintUserSalesReport} disabled={!userSalesReportData} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-500">
                        <Printer size={16} /> Imprimir
                    </button>
                </div>

                <div className="bg-white rounded-lg overflow-y-auto max-h-[60vh]"><RelatorioVendasUsuario reportData={userSalesReportData} /></div>
            </Modal>

            <Modal isOpen={isUserManagementModalOpen} onClose={handleCloseUserManagementModal} size="lg">
                <h2 className="text-2xl font-bold text-center text-purple-600 dark:text-purple-400 mb-6">Gerenciar Usuários</h2>
                <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Usuários Cadastrados</h3>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {users.map(user => {
                            const showManagementButtons = canManageUser(user);
                            const userRoleClass = user.role === 'root' ? 'bg-red-500 text-white' : (user.role === 'admin' ? 'bg-green-500 text-black' : 'bg-blue-500 text-white');
                            return (
                                <div key={user.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name} <span className="text-xs text-gray-500 dark:text-gray-400">({user.title || user.role})</span></p>
                                        <p className="text-sm text-gray-400">{user.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${userRoleClass}`}>{user.title || user.role}</span>
                                        {showManagementButtons && (<>
                                            {currentUser.permissions?.resetUserPassword && user.role === 'vendedor' && (
                                            <button onClick={() => handleResetUserPassword(user.id, currentUser.name, currentUser)} className="text-yellow-400 hover:text-yellow-300 transition-colors" title="Resetar Senha">
                                                    <KeyRound size={18} />
                                                </button>
                                            )}
                                        <button onClick={() => handleOpenEditUserModal(user)} className="text-blue-400 hover:text-blue-300 transition-colors" title={`Editar ${user.role === 'admin' ? 'Administrador' : 'Vendedor'}`}>
                                                <Edit size={18} />
                                            </button>
                                        <button onClick={async () => await handleDeleteUser(user.id, currentUser.name, currentUser)} className="text-red-400 hover:text-red-300 transition-colors" title={`Excluir ${user.role === 'admin' ? 'Administrador' : 'Vendedor'}`}><Trash2 size={18} /></button>
                                        </>)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isEditUserModalOpen} onClose={handleCloseEditUserModal} size="xl">
                <h2 className="text-2xl font-bold text-center text-blue-600 dark:text-blue-400 mb-6">Editar Usuário</h2>
                {editingUser && (
                    <form className="space-y-4" onSubmit={handleUpdateUserSubmit}>
                        <div>
                            <label htmlFor="edit-user-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                            <input id="edit-user-name" name="name" type="text" value={editingUser.name} onChange={handleEditUserChange} required className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="edit-user-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input id="edit-user-email" name="email" type="email" value={editingUser.email} onChange={handleEditUserChange} required className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="edit-user-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nova Senha (Opcional)</label>
                            <input id="edit-user-password" name="password" type="password" value={editingUser.password} onChange={handleEditUserChange} placeholder="Deixe em branco para não alterar" className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        {currentUser.role === 'root' && editingUser.role !== 'root' && (
                            <div>
                                <label htmlFor="edit-user-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título do Cargo</label>
                                <input
                                    id="edit-user-title"
                                    name="title"
                                    type="text"
                                    value={editingUser.title || ''}
                                    onChange={handleEditUserChange}
                                    placeholder="Ex: Gerente, Supervisor"
                                    className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                        {currentUser.role === 'root' && editingUser.role !== 'root' ? (
                            <div className="mt-4">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Permissões</h4>
                                <div className="space-y-6 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg max-h-80 overflow-y-auto">
                                    {Object.values(PERMISSION_GROUPS).map((group, groupIndex) => (
                                        <div key={group.title}>
                                            <h5 className="text-md font-semibold text-gray-900 dark:text-white mb-3">{group.title}</h5>
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
                                                            className="form-checkbox h-4 w-4 text-blue-500 bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {groupIndex < Object.values(PERMISSION_GROUPS).length - 1 && (
                                                <hr className="border-gray-300 dark:border-gray-700 mt-4" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        <button type="submit" className="w-full mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                            Salvar Alterações
                        </button>
                    </form>
                )}
            </Modal>

            <Modal isOpen={isAddUserModalOpen} onClose={handleCloseAddUserModal}>
                <h2 className="text-2xl font-bold text-center text-purple-600 dark:text-purple-400 mb-6">Adicionar Novo Usuário</h2>
                <form className="space-y-4" onSubmit={handleAddNewUser}>
                    <div>
                        <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                        <input id="user-name" name="name" type="text" value={newUserData.name} onChange={handleNewUserChange} required className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                        <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input id="user-email" name="email" type="email" value={newUserData.email} onChange={handleNewUserChange} required className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                        <label htmlFor="user-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                        <input id="user-password" name="password" type="password" value={newUserData.password} onChange={handleNewUserChange} required className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="user-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título do Cargo (Apelido)</label>
                        <input
                            id="user-title"
                            name="title"
                            type="text"
                            value={newUserData.title} onChange={handleNewUserChange} required
                            className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Ex: Vendedor, Gerente" />
                    </div>
                    <button type="submit" className="w-full mt-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
                        Adicionar Usuário
                    </button>
                </form>
            </Modal>

            <Modal isOpen={isDreModalOpen} onClose={() => setIsDreModalOpen(false)} size="xl">
                <h2 className="text-2xl font-bold text-center text-green-600 dark:text-green-400 mb-6">DRE Simplificado</h2>
                <div className="flex flex-wrap items-center justify-center gap-4 mb-6 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <label htmlFor="dreStartDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">De:</label>
                        <input 
                            type="date" 
                            id="dreStartDate"
                            value={dreStartDate}
                            onChange={e => setDreStartDate(e.target.value)}
                            className="p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="dreEndDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Até:</label>
                        <input 
                            type="date" 
                            id="dreEndDate"
                            value={dreEndDate}
                            onChange={e => setDreEndDate(e.target.value)}
                            className="p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                        />
                    </div>
                    <button onClick={handleGenerateDreReport} disabled={loadingDre} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-500">
                        {loadingDre ? 'Gerando...' : 'Gerar Relatório'}
                    </button>
                    <button onClick={handlePrintDre} disabled={!dreData} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-500">
                        <Printer size={16} /> Imprimir
                    </button>
                </div>

                <div className="bg-white rounded-lg overflow-y-auto max-h-[60vh]">
                    {loadingDre ? (<p className="text-center text-gray-500 py-10">Carregando dados do relatório...</p>) : (<DreReport reportData={dreData} />)}
                </div>
            </Modal>

            <Modal isOpen={isActivityLogModalOpen} onClose={() => setIsActivityLogModalOpen(false)} size="2xl">
                <h2 className="text-2xl font-bold text-center text-orange-600 dark:text-orange-400 mb-6">Log de Atividades do Administrador</h2>
                <div className="flex flex-wrap items-center justify-center gap-4 mb-6 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <label htmlFor="logActionFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Ação:</label>
                        <select 
                            id="logActionFilter"
                            value={logActionFilter}
                            onChange={e => setLogActionFilter(e.target.value)}
                            className="p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                        >
                            <option value="">Todas as Ações</option>
                            {logActions.map(action => <option key={action} value={action}>{action}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="logAdminFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin:</label>
                        <select 
                            id="logAdminFilter"
                            value={logAdminFilter}
                            onChange={e => setLogAdminFilter(e.target.value)}
                            className="p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
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
                            <div key={log.id} className="p-3 bg-gray-200 dark:bg-gray-800 rounded-lg border-l-4 border-orange-500">
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <p className="font-bold text-orange-600 dark:text-orange-300">{log.action}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleString('pt-BR')}</p>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">{log.admin}</span>: {log.details}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-16">Nenhum registro de atividade encontrado com os filtros atuais.</p>
                    )}
                </div>
            </Modal>

            <Modal isOpen={isSalesHistoryModalOpen} onClose={handleCloseSalesHistoryModal} size="md">
                <h2 className="text-2xl font-bold text-center text-yellow-600 dark:text-yellow-400 mb-6">Histórico de Vendas</h2>
                <div className="space-y-6">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Filtrar por Período</h4>
                        <div className="flex flex-wrap gap-4 items-end">
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">De:</label>
                                <input type="date" id="startDate" value={salesHistoryStartDate} onChange={e => setSalesHistoryStartDate(e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Até:</label>
                                <input type="date" id="endDate" value={salesHistoryEndDate} onChange={e => setSalesHistoryEndDate(e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm" />
                            </div>
                            <button onClick={() => { setSalesHistoryStartDate(''); setSalesHistoryEndDate(''); }} className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg transition-colors">
                                Limpar Datas
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Imprimir Relatório Mensal</h4>
                        <div className="flex flex-wrap gap-4 items-end">
                            <div>
                                <label htmlFor="reportMonth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mês:</label>
                                <select id="reportMonth" value={reportMonth} onChange={e => setReportMonth(Number(e.target.value))} className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">
                                    {Array.from({ length: 12 }, (_, i) => (<option key={i} value={i}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="reportYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ano:</label>
                                <select id="reportYear" value={reportYear} onChange={e => setReportYear(Number(e.target.value))} className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">
                                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (<option key={year} value={year}>{year}</option>))}
                                </select>
                            </div>
                            <button onClick={handlePrintMonthlyReport} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded-lg transition-colors">
                                <Printer size={16} /> Imprimir
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative mb-6">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search size={20} className="text-gray-500" />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por cliente, CPF ou produto..."
                        className="w-full p-3 pl-10 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        value={salesHistorySearchTerm}
                        onChange={(e) => setSalesHistorySearchTerm(e.target.value)}
                    />
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                    {paginatedSalesHistory.length > 0 ? (
                        paginatedSalesHistory.map(sale => (
                            <div key={sale.id} className="p-4 bg-gray-200 dark:bg-gray-800 rounded-lg border-l-4 border-yellow-500">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-grow">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(sale.date).toLocaleString('pt-BR')}</p>
                                        {sale.receiptCode && <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">Cód: {sale.receiptCode}</p>}
                                        <p className="text-lg font-bold text-yellow-600 dark:text-yellow-300">Total: {sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        {sale.customer && <p className="text-sm text-gray-700 dark:text-gray-300">Cliente: <span className="font-medium">{sale.customer}</span></p>}
                                        <p className="text-sm text-gray-700 dark:text-gray-300">Pagamento: <span className="font-semibold text-yellow-700 dark:text-yellow-200">{sale.paymentMethod}</span></p>
                                        {sale.vendedor && <p className="text-sm text-gray-700 dark:text-gray-300">Vendedor: <span className="font-medium">{sale.vendedor}</span></p>}
                                    </div>
                                    <div className="flex-shrink-0">
                                        <button onClick={() => handleOpenReprintModal(sale)} className="inline-flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs font-medium rounded-full transition-colors">
                                            <RefreshCw size={14} />
                                            Reimprimir
                                        </button>
                                    </div>
                                </div>
                                <div className="border-t border-gray-300 dark:border-gray-700 pt-2">
                                    <p className="text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">Itens:</p>
                                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                        {sale.items.map(item => (<li key={`${item.type}-${item.id}`}>{item.nome || item.servico} (x{item.quantity})</li>))}
                                    </ul>
                                </div>
                            </div>
                        ))
                    ) : (<p className="text-center text-gray-500 py-16">Nenhuma venda encontrada para o período selecionado.</p>)}
                </div>
                {salesHistoryTotalPages > 1 && (
                    <div className="mt-6 flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Página {salesHistoryCurrentPage} de {salesHistoryTotalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setSalesHistoryCurrentPage(prev => Math.max(prev - 1, 1))} disabled={salesHistoryCurrentPage === 1} className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronLeft size={20} /></button>
                            <button onClick={() => setSalesHistoryCurrentPage(prev => Math.min(prev + 1, salesHistoryTotalPages))} disabled={salesHistoryCurrentPage === salesHistoryTotalPages} className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronRight size={20} /></button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isChartsModalOpen} onClose={handleCloseChartsModal} size="2xl">
                <h2 className="text-2xl font-bold text-center text-cyan-600 dark:text-cyan-400 mb-6">Análise Gráfica</h2>
                {renderCharts ? (
                <div className="max-h-[80vh] overflow-y-auto p-2">
                    <div className="bg-gray-200 dark:bg-gray-900/50 p-6 rounded-2xl mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Resumo Geral</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        <DashboardCard 
                            icon={DollarSign} 
                            title="Valor Total do Estoque"
                            value={showTotalValue ? dashboardData.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'R$ ####,##'}
                            colorClass="border-green-500"
                            isToggleable={true}
                            showValue={showTotalValue}
                            onToggle={() => setShowTotalValue(!showTotalValue)}
                        />
                        <DashboardCard icon={TrendingUp} title="Total Faturado" value={Number(dashboardData.totalVendas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })} colorClass="border-yellow-500" />
                        <DashboardCard icon={ShoppingBag} title="Número de Vendas" value={dashboardData.numeroVendas} colorClass="border-pink-500" />
                        <DashboardCard icon={Package} title="Total de Itens no Estoque" value={dashboardData.totalItems} colorClass="border-blue-500" />
                        <DashboardCard icon={Layers} title="Produtos Diferentes" value={dashboardData.totalProdutos} colorClass="border-purple-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {chartsConfig.map((chart, index) => {
                        const chartWidthClass = chart.width === 'full' ? 'w-full' : 'w-full lg:w-[calc(50%-1rem)]';
                        let chartContent = null;

                        switch(chart.id) {
                        case 'evolution':
                            chartContent = <AreaChart data={stockValueHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#4A5568" : "#E2E8F0"} /><XAxis dataKey="date" tickFormatter={(timeStr) => new Date(timeStr).toLocaleDateString('pt-BR')} stroke={theme === 'dark' ? "#A0AEC0" : "#4A5568"} /><YAxis stroke={theme === 'dark' ? "#A0AEC0" : "#4A5568"} tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} /><Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#4A5568' : '#CBD5E0'}` }} labelStyle={{ color: theme === 'dark' ? '#E2E8F0' : '#1A202C' }} formatter={(value) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), "Valor"]} /><Legend /><Area type="monotone" dataKey="value" stroke="#38B2AC" fill="#38B2AC" fillOpacity={0.3} name="Valor do Estoque" /></AreaChart>;
                            break;
                        case 'salesPeriod':
                            chartContent = <><div className="flex justify-center gap-2 mb-4"><button onClick={() => setSalesChartPeriod('day')} className={`px-3 py-1 text-sm rounded-full transition-colors ${salesChartPeriod === 'day' ? 'bg-cyan-600 text-white' : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'}`}>Dia</button><button onClick={() => setSalesChartPeriod('week')} className={`px-3 py-1 text-sm rounded-full transition-colors ${salesChartPeriod === 'week' ? 'bg-cyan-600 text-white' : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'}`}>Semana</button><button onClick={() => setSalesChartPeriod('month')} className={`px-3 py-1 text-sm rounded-full transition-colors ${salesChartPeriod === 'month' ? 'bg-cyan-600 text-white' : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'}`}>Mês</button></div><ResponsiveContainer width="100%" height="85%"><BarChart data={salesByPeriodData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#4A5568" : "#E2E8F0"} /><XAxis dataKey="period" stroke={theme === 'dark' ? "#A0AEC0" : "#4A5568"} tickFormatter={(str) => { if (salesChartPeriod === 'month') return new Date(str + '-02').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }); return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); }} minTickGap={20} /><YAxis stroke={theme === 'dark' ? "#A0AEC0" : "#4A5568"} tickFormatter={(value) => `R$${value >= 1000 ? `${value/1000}k` : value}`} /><Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#4A5568' : '#CBD5E0'}` }} labelStyle={{ color: theme === 'dark' ? '#E2E8F0' : '#1A202C' }} formatter={(value) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), "Total Vendido"]} labelFormatter={(label) => { if (salesChartPeriod === 'month') return new Date(label + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); if (salesChartPeriod === 'week') return `Semana de ${new Date(label).toLocaleDateString('pt-BR', { dateStyle: 'short' })}`; return new Date(label).toLocaleDateString('pt-BR', { dateStyle: 'long' }); }} /><Legend wrapperStyle={{ paddingTop: '20px' }} /><Bar dataKey="total" fill="#FF8042" name="Total Vendido" /></BarChart></ResponsiveContainer></>;
                            break;
                        case 'topSellingProducts':
                            chartContent = <BarChart data={dashboardData.topSellingProducts} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#4A5568" : "#E2E8F0"} /><XAxis type="number" stroke={theme === 'dark' ? "#A0AEC0" : "#4A5568"} allowDecimals={false} /><YAxis dataKey="name" type="category" stroke={theme === 'dark' ? "#A0AEC0" : "#4A5568"} width={120} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#4A5568' : '#CBD5E0'}` }} labelStyle={{ color: theme === 'dark' ? '#E2E8F0' : '#1A202C' }} formatter={(value) => [value, "Unidades Vendidas"]} /><Bar dataKey="quantitySold" fill="#d0ed57" name="Unidades Vendidas" /></BarChart>;
                            break;
                        case 'topSellingServices':
                            chartContent = <BarChart data={dashboardData.topSellingServices} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#4A5568" : "#E2E8F0"} /><XAxis type="number" stroke={theme === 'dark' ? "#A0AEC0" : "#4A5568"} allowDecimals={false} /><YAxis dataKey="name" type="category" stroke={theme === 'dark' ? "#A0AEC0" : "#4A5568"} width={120} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#4A5568' : '#CBD5E0'}` }} labelStyle={{ color: theme === 'dark' ? '#E2E8F0' : '#1A202C' }} formatter={(value) => [value, "Vezes Realizado"]} /><Bar dataKey="quantitySold" fill="#8884d8" name="Vezes Realizado" /></BarChart>;
                            break;
                        case 'topStock':
                            chartContent = <BarChart data={dashboardData.maisEstoque} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#4A5568" : "#E2E8F0"} /><XAxis type="number" stroke={theme === 'dark' ? "#A0AEC0" : "#4A5568"} /><YAxis dataKey="nome" type="category" stroke={theme === 'dark' ? "#A0AEC0" : "#4A5568"} width={100} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#4A5568' : '#CBD5E0'}` }} labelStyle={{ color: theme === 'dark' ? '#E2E8F0' : '#1A202C' }} formatter={(value) => [value, "Estoque"]} /><Bar dataKey="emEstoque" fill="#8884d8" name="Em Estoque" /></BarChart>;
                            break;
                        case 'lowStock':
                            chartContent = <BarChart data={dashboardData.menosEstoque} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#4A5568" : "#E2E8F0"} /><XAxis type="number" stroke={theme === 'dark' ? "#A0AEC0" : "#4A5568"} /><YAxis dataKey="nome" type="category" stroke={theme === 'dark' ? "#A0AEC0" : "#4A5568"} width={100} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#4A5568' : '#CBD5E0'}` }} labelStyle={{ color: theme === 'dark' ? '#E2E8F0' : '#1A202C' }} formatter={(value) => [value, "Estoque"]} /><Bar dataKey="emEstoque" fill="#82ca9d" name="Em Estoque" /></BarChart>;
                            break;
                        case 'category':
                            chartContent = <PieChart><Pie data={dashboardData.categoriaDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{dashboardData.categoriaDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#4A5568' : '#CBD5E0'}` }} /><Legend /></PieChart>;
                            break;
                        case 'supplier':
                            chartContent = <PieChart><Pie data={dashboardData.fornecedorDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{dashboardData.fornecedorDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#4A5568' : '#CBD5E0'}` }} /><Legend /></PieChart>;
                            break;
                        case 'payment':
                            chartContent = <PieChart><Pie data={dashboardData.paymentMethodDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{dashboardData.paymentMethodDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#4A5568' : '#CBD5E0'}` }} /><Legend /></PieChart>;
                            break;
                        default:
                            chartContent = null;
                        }

                        return (
                        <div key={chart.id} className={chart.width === 'full' ? 'lg:col-span-2' : ''}>
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

            <Modal isOpen={reprintingSale !== null} onClose={handleCloseReprintModal}>
                {reprintingSale && (
                    <>
                        <h2 className="text-2xl font-bold text-center text-blue-600 dark:text-blue-400 mb-4">Reimpressão de Recibo</h2>
                        <div className="bg-white rounded-lg overflow-y-auto max-h-[60vh]">
                            <ReciboVenda saleDetails={reprintingSale} />
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4">
                            <button onClick={handleWhatsAppRecibo} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full transition-colors">
                                <Send size={18} /> Enviar por WhatsApp
                            </button>
                            <button onClick={handlePrintRecibo} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors">
                                <Printer size={18} /> Imprimir / Salvar PDF
                            </button>
                            <button onClick={handlePrintThermalRecibo} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-full transition-colors">
                                <Printer size={18} /> Impressão Térmica
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default AdminPage;