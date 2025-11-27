import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, GripVertical, ChevronUpSquare, ChevronDownSquare, RefreshCw, DollarSign, TrendingUp, ShoppingBag, Package, Layers, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { toast } from 'react-hot-toast';
import { useEstoqueContext } from './EstoqueContext.jsx';
import { useTheme } from './ThemeContext.jsx';

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
const CHARTS_CONFIG_VERSION = '1.1';

const initialChartsConfig = [
    { id: 'evolution', title: 'Evolução do Valor do Estoque (Custo)', visible: true, width: 'full' },
    { id: 'salesPeriod', title: 'Vendas por Período', visible: true, width: 'full' },
    { id: 'topSellingProducts', title: 'Top 10 Produtos Mais Vendidos (Unidades)', visible: true, width: 'full' },
    { id: 'topSellingServices', title: 'Top 10 Serviços Mais Realizados', visible: true, width: 'full' },
    { id: 'topStock', title: 'Top 5 - Mais Estoque', visible: true, width: 'half' },
    { id: 'lowStock', title: 'Top 5 - Menos Estoque', visible: false, width: 'half' },
    { id: 'category', title: 'Distribuição por Categoria', visible: true, width: 'full' },
    { id: 'supplier', title: 'Distribuição por Fornecedor', visible: true, width: 'half' },
    { id: 'payment', title: 'Formas de Pagamento (Vendas)', visible: true, width: 'half' },
];

const ChartsPage = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { dashboardData, salesHistory, stockValueHistory } = useEstoqueContext();

    const [showTotalValue, setShowTotalValue] = useState(false);
    const [salesChartPeriod, setSalesChartPeriod] = useState('day');
    const chartDragItem = useRef(null);
    const chartDragOverItem = useRef(null);

    const [chartsConfig, setChartsConfig] = useState(() => {
        try {
            const savedVersion = localStorage.getItem('boycell-chartsConfigVersion');
            const savedConfig = localStorage.getItem('boycell-chartsConfig');
            if (savedConfig && savedVersion === CHARTS_CONFIG_VERSION) {
                const parsedConfig = JSON.parse(savedConfig);
                if (Array.isArray(parsedConfig) && parsedConfig.every(c => c.id && c.title)) {
                    const savedIds = new Set(parsedConfig.map(c => c.id));
                    const newCharts = initialChartsConfig.filter(c => !savedIds.has(c.id));
                    return [...parsedConfig, ...newCharts];
                }
            }
        } catch (error) { console.error("Failed to load chart config", error); }
        return initialChartsConfig;
    });

    useEffect(() => {
        localStorage.setItem('boycell-chartsConfigVersion', CHARTS_CONFIG_VERSION);
        localStorage.setItem('boycell-chartsConfig', JSON.stringify(chartsConfig));
    }, [chartsConfig]);

    const handleChartDragStart = (e, index) => { chartDragItem.current = index; e.currentTarget.style.opacity = '0.5'; };
    const handleChartDragEnter = (e, index) => { chartDragOverItem.current = index; };
    const handleChartDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        const newChartsConfig = [...chartsConfig];
        const draggedItemContent = newChartsConfig.splice(chartDragItem.current, 1)[0];
        newChartsConfig.splice(chartDragOverItem.current, 0, draggedItemContent);
        chartDragItem.current = null;
        chartDragOverItem.current = null;
        setChartsConfig(newChartsConfig);
    };

    const handleToggleChartVisibility = (id) => setChartsConfig(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
    const handleResetChartsLayout = () => {
        if (window.confirm("Tem certeza que deseja resetar o layout dos gráficos para o padrão?")) {
            localStorage.removeItem('boycell-chartsConfig');
            setChartsConfig(initialChartsConfig);
            toast.success('Layout dos gráficos resetado.');
        }
    };

    const salesByPeriodData = useMemo(() => {
        if (!salesHistory || salesHistory.length === 0) return [];
        const getWeekStartDate = (d) => {
            const date = new Date(d);
            const day = date.getUTCDay();
            const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
            return new Date(date.setUTCDate(diff)).toISOString().split('T')[0];
        };
        const groupedData = salesHistory.reduce((acc, sale) => {
            const saleDate = new Date(sale.date);
            if (isNaN(saleDate.getTime())) return acc;
            let key;
            if (salesChartPeriod === 'day') key = saleDate.toISOString().split('T')[0];
            else if (salesChartPeriod === 'week') key = getWeekStartDate(saleDate);
            else key = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[key]) { acc[key] = { period: key, total: 0 }; }
            acc[key].total += Number(sale.total || 0);
            return acc;
        }, {});
        return Object.values(groupedData).sort((a, b) => new Date(a.period) - new Date(b.period));
    }, [salesHistory, salesChartPeriod]);

    // Adiciona uma verificação para garantir que os dados do dashboard existam antes de renderizar.
    if (!dashboardData) {
        return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-950 text-xl">Carregando dados do dashboard...</div>;
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
            <header className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-20">
                <nav className="container mx-auto flex items-center justify-between p-4">
                    <h1 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">Análise Gráfica</h1>
                    <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors" title="Voltar ao Painel">
                        <ArrowLeft size={20} />
                        <span className="hidden sm:inline">Voltar ao Painel</span>
                    </button>
                </nav>
            </header>

            <main className="container mx-auto p-4 md:p-8">
                <div className="flex justify-end mb-6">
                    <button onClick={handleResetChartsLayout} className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-full transition-colors" title="Resetar layout dos gráficos para o padrão">
                        <RefreshCw size={14} /> Resetar Layout
                    </button>
                </div>

                <div className="bg-gray-200 dark:bg-gray-900/50 p-6 rounded-2xl mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Resumo Geral</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        <DashboardCard icon={DollarSign} title="Valor Total do Estoque" value={showTotalValue ? dashboardData.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ####,##'} colorClass="border-green-500" isToggleable={true} showValue={showTotalValue} onToggle={() => setShowTotalValue(!showTotalValue)} />
                        <DashboardCard icon={TrendingUp} title="Total Faturado" value={Number(dashboardData.totalVendas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} colorClass="border-yellow-500" />
                        <DashboardCard icon={ShoppingBag} title="Número de Vendas" value={dashboardData.numeroVendas} colorClass="border-pink-500" />
                        <DashboardCard icon={Package} title="Total de Itens no Estoque" value={dashboardData.totalItems} colorClass="border-blue-500" />
                        <DashboardCard icon={Layers} title="Produtos Diferentes" value={dashboardData.totalProdutos} colorClass="border-purple-500" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {chartsConfig.map((chart, index) => {
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
                                chartContent = <BarChart data={dashboardData.categoriaDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#4A5568" : "#E2E8F0"} /><XAxis dataKey="name" stroke={theme === 'dark' ? "#A0AEC0" : "#4A5568"} tick={{ fontSize: 12 }} /><YAxis stroke={theme === 'dark' ? "#A0AEC0" : "#4A5568"} allowDecimals={false} /><Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#4A5568' : '#CBD5E0'}` }} labelStyle={{ color: theme === 'dark' ? '#E2E8F0' : '#1A202C' }} formatter={(value) => [value, "Quantidade"]} /><Bar dataKey="value" name="Quantidade de Itens" fill="#00C49F" /></BarChart>;
                                break;
                            case 'supplier':
                                chartContent = <PieChart><Pie data={dashboardData.fornecedorDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{dashboardData.fornecedorDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#4A5568' : '#CBD5E0'}` }} /><Legend /></PieChart>;
                                break;
                            case 'payment':
                                chartContent = <PieChart><Pie data={dashboardData.paymentMethodDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{dashboardData.paymentMethodDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A202C' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#4A5568' : '#CBD5E0'}` }} /><Legend /></PieChart>;
                                break;
                            default: chartContent = null;
                        }
                        return (
                            <div key={chart.id} className={chart.width === 'full' ? 'lg:col-span-2' : ''}>
                                <ChartContainer title={chart.title} show={chart.visible} onToggle={() => handleToggleChartVisibility(chart.id)} onDragStart={(e) => handleChartDragStart(e, index)} onDragEnter={(e) => handleChartDragEnter(e, index)} onDragEnd={handleChartDragEnd}>
                                    <ResponsiveContainer width="100%" height="100%">{chartContent}</ResponsiveContainer>
                                </ChartContainer>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default ChartsPage;