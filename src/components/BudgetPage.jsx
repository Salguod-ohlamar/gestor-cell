import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, LogOut, ShoppingCart, Printer, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import Modal from './Modal';
import { useEstoqueContext } from './EstoqueContext.jsx';
import { useTheme } from './ThemeContext.jsx';
import ReciboOrcamento from './ReciboOrcamento.jsx';

const BudgetPage = ({ onLogout, currentUser }) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { estoque, servicos } = useEstoqueContext();

    const [orcamento, setOrcamento] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [validade, setValidade] = useState(7);
    const [produtoSearchTerm, setProdutoSearchTerm] = useState('');
    const [servicoSearchTerm, setServicoSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('produtos');
    const [isReciboModalOpen, setIsReciboModalOpen] = useState(false);
    const [lastOrcamentoDetails, setLastOrcamentoDetails] = useState(null);

    const addToOrcamento = (item, type) => {
        const existingItem = orcamento.find(cartItem => cartItem.id === item.id && cartItem.type === type);
        if (existingItem) {
            setOrcamento(orcamento.map(cartItem =>
                cartItem.id === item.id && cartItem.type === type
                    ? { ...cartItem, quantity: cartItem.quantity + 1 }
                    : cartItem
            ));
        } else {
            setOrcamento([...orcamento, { ...item, quantity: 1, type }]);
        }
        toast.success(`${item.nome || item.servico} adicionado ao orçamento.`);
    };

    const updateQuantity = (itemId, type, newQuantity) => {
        if (newQuantity < 1) {
            removeFromOrcamento(itemId, type);
        } else {
            setOrcamento(orcamento.map(item =>
                item.id === itemId && item.type === type ? { ...item, quantity: newQuantity } : item
            ));
        }
    };

    const removeFromOrcamento = (itemId, type) => {
        setOrcamento(orcamento.filter(item => !(item.id === itemId && item.type === type)));
    };

    const totalOrcamento = useMemo(() => {
        return orcamento.reduce((total, item) => total + (item.precoFinal * item.quantity), 0);
    }, [orcamento]);

    const handleGerarOrcamento = () => {
        if (orcamento.length === 0) {
            toast.error("Adicione itens para gerar um orçamento.");
            return;
        }
        if (!customerName || !customerPhone) {
            toast.error("Nome e telefone do cliente são obrigatórios.");
            return;
        }

        const orcamentoDetails = {
            items: [...orcamento],
            subtotal: totalOrcamento,
            total: totalOrcamento,
            date: new Date(),
            customer: customerName.trim(),
            customerPhone: customerPhone,
            customerEmail: customerEmail,
            validade: validade,
            orcamentoCode: `ORC-${Date.now().toString().slice(-6)}`
        };

        setLastOrcamentoDetails(orcamentoDetails);
        setIsReciboModalOpen(true);
    };

    const handleCloseReciboModal = () => {
        setIsReciboModalOpen(false);
    };

    const handlePrintOrcamento = () => {
        document.body.classList.add('print-mode-recibo');
        window.print();
    };

    useEffect(() => {
        const afterPrint = () => {
            document.body.classList.remove('print-mode-recibo');
        };
        window.addEventListener('afterprint', afterPrint);
        return () => window.removeEventListener('afterprint', afterPrint);
    }, []);

    const produtoResults = useMemo(() => {
        if (!Array.isArray(estoque)) return [];
        return estoque.filter(p =>
            p.nome?.toLowerCase().includes(produtoSearchTerm.toLowerCase())
        );
    }, [estoque, produtoSearchTerm]);

    const servicoResults = useMemo(() => {
        if (!Array.isArray(servicos)) return [];
        return servicos.filter(s =>
            s.servico?.toLowerCase().includes(servicoSearchTerm.toLowerCase())
        );
    }, [servicos, servicoSearchTerm]);

    return (
        <div className="bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
            <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
            <div id="recibo-printable-area" className="hidden">
                <ReciboOrcamento orcamentoDetails={lastOrcamentoDetails} />
            </div>

            <div id="orcamento-non-printable-area">
                <header className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-20">
                    <nav className="container mx-auto flex items-center justify-between p-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerador de Orçamento</h1>
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/vendas')} className="inline-flex items-center gap-2 text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors" title="Ir para Vendas">
                                <ArrowLeft size={20} />
                                <span className="hidden sm:inline">Vendas</span>
                            </button>
                            <button onClick={toggleTheme} className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors" title={`Mudar para Tema ${theme === 'dark' ? 'Claro' : 'Escuro'}`}>
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button onClick={onLogout} className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors" title="Sair">
                                <LogOut size={20} />
                                <span className="hidden sm:inline">Sair</span>
                            </button>
                        </div>
                    </nav>
                </header>

                <div className="container mx-auto p-4 mt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Coluna do Orçamento */}
                        <div className="lg:col-span-1 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl flex flex-col h-fit lg:sticky top-24">
                            <h2 className="text-2xl font-bold text-orange-500 dark:text-orange-400 mb-4 flex items-center gap-2"><ShoppingCart size={24} /> Itens do Orçamento</h2>
                            <div className="flex-grow space-y-3 overflow-y-auto max-h-[40vh] pr-2 mb-4">
                                {orcamento.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">Nenhum item adicionado.</p>
                                ) : (
                                    orcamento.map(item => (
                                        <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                                            <div className="flex-grow min-w-0">
                                                <p className="font-semibold truncate text-gray-900 dark:text-white">{item.nome || item.servico}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            </div>
                                            <input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.id, item.type, parseInt(e.target.value))} className="w-14 p-1 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-center" min="1" />
                                            <button onClick={() => removeFromOrcamento(item.id, item.type)} className="text-red-500 hover:text-red-400 p-1"><X size={18} /></button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                                <div>
                                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Cliente</label>
                                    <input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome completo" required className="w-full p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg" />
                                </div>
                                <div>
                                    <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                                    <input type="text" id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(XX) XXXXX-XXXX" required className="w-full p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg" />
                                </div>
                                <div>
                                    <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (Opcional)</label>
                                    <input type="email" id="customerEmail" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@exemplo.com" className="w-full p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg" />
                                </div>
                                <div>
                                    <label htmlFor="validade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Validade do Orçamento (dias)</label>
                                    <input type="number" id="validade" value={validade} onChange={(e) => setValidade(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg" />
                                </div>
                                <div className="flex justify-between items-center text-xl font-bold pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <span>Total:</span>
                                    <span className="text-green-500 dark:text-green-400">{totalOrcamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <button onClick={handleGerarOrcamento} className="w-full mt-4 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors">Gerar Orçamento</button>
                            </div>
                        </div>

                        {/* Coluna de Produtos/Serviços */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl">
                            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                                <button onClick={() => setActiveTab('produtos')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'produtos' ? 'text-green-500 dark:text-green-400 border-b-2 border-green-500 dark:border-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Produtos</button>
                                <button onClick={() => setActiveTab('servicos')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'servicos' ? 'text-blue-500 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Serviços</button>
                            </div>
                            <div className="relative mb-4">
                                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input type="text" placeholder={`Buscar ${activeTab}...`} value={activeTab === 'produtos' ? produtoSearchTerm : servicoSearchTerm} onChange={e => activeTab === 'produtos' ? setProdutoSearchTerm(e.target.value) : setServicoSearchTerm(e.target.value)} className="w-full p-2 pl-10 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg" />
                            </div>
                            <div className="space-y-2 overflow-y-auto max-h-[65vh] pr-2">
                                {activeTab === 'produtos' && produtoResults.map(p => (
                                    <div key={p.id} className="flex items-center gap-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50">
                                        <img src={p.imagem} alt={p.nome} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                        <div className="flex-grow min-w-0">
                                            <p className="font-semibold truncate text-gray-900 dark:text-white">{p.nome}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{p.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        </div>
                                        <button onClick={() => addToOrcamento(p, 'produto')} className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold hover:bg-green-700">Adicionar</button>
                                    </div>
                                ))}
                                {activeTab === 'servicos' && servicoResults.map(s => (
                                    <div key={s.id} className="flex items-center gap-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50">
                                        <img src={s.imagem} alt={s.servico} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                        <div className="flex-grow min-w-0">
                                            <p className="font-semibold truncate text-gray-900 dark:text-white">{s.servico}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{s.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        </div>
                                        <button onClick={() => addToOrcamento(s, 'servico')} className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700">Adicionar</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isReciboModalOpen} onClose={handleCloseReciboModal}>
                {lastOrcamentoDetails && (
                    <>
                        <h2 className="text-2xl font-bold text-center text-orange-500 dark:text-orange-400 mb-4">Orçamento Gerado</h2>
                        <div className="bg-white rounded-lg overflow-y-auto max-h-[60vh]">
                            <ReciboOrcamento orcamentoDetails={lastOrcamentoDetails} />
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={handlePrintOrcamento} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors">
                                <Printer size={18} /> Imprimir / Salvar PDF
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default BudgetPage;