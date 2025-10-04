import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Edit, LogOut, ShoppingCart, Mail, Printer, Send, Banknote, CreditCard, QrCode, DollarSign, ShoppingBag, Calendar, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import ReciboVenda from './ReciboVenda';
import Modal from './Modal.jsx';
import { validateCPF, validatePhone } from './formatters.js';
import { useEstoqueContext } from './EstoqueContext.jsx';
import { useTheme } from './ThemeContext.jsx';

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

const VendasPage = ({ onLogout, currentUser }) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const {
        handleSale,
        salesHistory,
        estoque,
        servicos
    } = useEstoqueContext();

    const [carrinho, setCarrinho] = useState(() => {
        try {
            const savedCart = localStorage.getItem('boycell-carrinho');
            if (savedCart) {
                const parsed = JSON.parse(savedCart);
                if (Array.isArray(parsed)) {
                    // Validação para garantir que os itens do carrinho recuperados são válidos
                    const validCart = parsed.filter(item => 
                        item && typeof item.id !== 'undefined' && typeof item.precoFinal === 'number'
                    );
                    if (validCart.length < parsed.length) {
                        console.warn("Itens inválidos ou com formato antigo foram removidos do carrinho.");
                    }
                    return validCart;
                }
            }
        } catch (error) {
            console.error("Erro ao carregar carrinho do localStorage:", error);
        }
        return [];
    });

    // Salva o carrinho no localStorage sempre que ele for alterado
    useEffect(() => {
        localStorage.setItem('boycell-carrinho', JSON.stringify(carrinho));
    }, [carrinho]);

    const [isReciboModalOpen, setIsReciboModalOpen] = useState(false);
    const [lastSaleDetails, setLastSaleDetails] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [customerCpf, setCustomerCpf] = useState('');
    const [isCpfValid, setIsCpfValid] = useState(true);
    const [customerPhone, setCustomerPhone] = useState('');
    const [isPhoneValid, setIsPhoneValid] = useState(true);
    const [customerEmail, setCustomerEmail] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Dinheiro'); // 'Dinheiro', 'Cartão', 'Pix'
    const [discount, setDiscount] = useState('');
    const [produtoSearchTerm, setProdutoSearchTerm] = useState('');
    const [servicoSearchTerm, setServicoSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('produtos'); // 'produtos' ou 'servicos'
    const [showVendasHoje, setShowVendasHoje] = useState(false);
    const [showVendidoHoje, setShowVendidoHoje] = useState(false);
    const [showVendidoMes, setShowVendidoMes] = useState(false);
    const [isSearchingClient, setIsSearchingClient] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || '';

    const handleCpfChange = (e) => {
        const value = e.target.value;
        setCustomerCpf(value);
        const cleanedValue = value.replace(/[^\d]/g, '');
        if (cleanedValue.length >= 11) {
            setIsCpfValid(validateCPF(value));
        } else {
            setIsCpfValid(true); // Don't show error while typing
        }
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        setCustomerPhone(value);
        const cleanedValue = value.replace(/[^\d]/g, '');
        if (cleanedValue.length >= 10) {
            setIsPhoneValid(validatePhone(value));
        } else {
            setIsPhoneValid(true); // Don't show error while typing
        }
    };

    const handleCpfBlur = async () => {
        const cleanedCpf = customerCpf.replace(/[^\d]/g, '');
        if (cleanedCpf.length < 11) return;

        if (!validateCPF(customerCpf)) {
            setIsCpfValid(false);
            toast.error("CPF/CNPJ inválido.");
            return;
        }
        setIsCpfValid(true);

        try {
            setIsSearchingClient(true);
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`${API_URL}/api/clients/search?cpf=${customerCpf}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 404) {
                toast.success('Cliente não encontrado. Preencha os dados para um novo cadastro.');
                setCustomerName('');
                setCustomerPhone('');
                setCustomerEmail('');
            }
            else if (response.ok) {
                const clientData = await response.json();
                setCustomerName(clientData.name);
                setCustomerPhone(clientData.phone || '');
                setCustomerEmail(clientData.email || '');
                toast.success(`Cliente "${clientData.name}" encontrado!`);
            } else {
                throw new Error('Erro ao buscar cliente.');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSearchingClient(false);
        }
    };

    const vendedorDashboardData = useMemo(() => {
        if (!salesHistory || !currentUser) {
            return { totalVendidoHoje: 0, vendasHoje: 0, totalVendidoMes: 0 };
        }

        const hoje = new Date();
        const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        const inicioDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

        // Se o usuário for admin ou root, usa todas as vendas. Senão, filtra por vendedor.
        const vendasConsideradas = (currentUser?.role === 'admin' || currentUser?.role === 'root')
            ? salesHistory
            : salesHistory.filter(sale => sale.vendedor === currentUser?.name);


        const vendasHoje = vendasConsideradas.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= inicioDoDia;
        });

        const vendasMes = vendasConsideradas.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= inicioDoMes;
        });


        const totalVendidoHoje = vendasHoje.reduce((acc, sale) => acc + Number(sale.total || 0), 0);
        const totalVendidoMes = vendasMes.reduce((acc, sale) => acc + Number(sale.total || 0), 0);

        return { totalVendidoHoje, vendasHoje: vendasHoje.length, totalVendidoMes };
    }, [salesHistory, currentUser]
    );

    const addToCart = (item, type) => {
        const existingItem = carrinho.find(cartItem => cartItem.id === item.id && cartItem.type === type);
        if (existingItem) {
            const sellableStock = Number(item.emEstoque) - Number(item.qtdaMinima);
            if (type === 'produto' && existingItem.quantity >= sellableStock) {
                toast.error(`Estoque máximo de venda para "${item.nome}" atingido.`);
                return;
            }
            setCarrinho(carrinho.map(cartItem => 
                cartItem.id === item.id && cartItem.type === type 
                ? { ...cartItem, quantity: cartItem.quantity + 1 } 
                : cartItem
            ));
        } else {
            if (type === 'produto' && (Number(item.emEstoque) <= Number(item.qtdaMinima))) {
                toast.error(`"${item.nome}" atingiu o estoque mínimo e não pode ser vendido.`);
                return;
            }
            setCarrinho([...carrinho, { ...item, quantity: 1, type }]);
        }
    };

    const updateQuantity = (itemId, type, newQuantity) => {
        const itemInCart = carrinho.find(item => item.id === itemId && item.type === type);
        if (!itemInCart) return;

        if (type === 'produto') {
            const sellableStock = Number(itemInCart.emEstoque) - Number(itemInCart.qtdaMinima);

            if (sellableStock <= 0) {
                toast.error(`"${itemInCart.nome}" não possui estoque de venda.`);
                removeFromCart(itemId, type);
                return;
            }

            if (newQuantity > sellableStock) {
                toast.error(`Estoque de venda insuficiente. Apenas ${sellableStock} unidades de "${itemInCart.nome}" podem ser vendidas.`);
                setCarrinho(carrinho.map(item => 
                    item.id === itemId && item.type === type ? { ...item, quantity: sellableStock } : item
                ));
                return;
            }
        }
        if (newQuantity < 1) {
            removeFromCart(itemId, type);
        } else {
            setCarrinho(carrinho.map(item => 
                item.id === itemId && item.type === type ? { ...item, quantity: newQuantity } : item
            ));
        }
    };

    const removeFromCart = (itemId, type) => {
        setCarrinho(carrinho.filter(item => !(item.id === itemId && item.type === type)));
    };

    const subtotalCarrinho = useMemo(() => {
        return carrinho.reduce((total, item) => {
            return total + (item.precoFinal * item.quantity);
        }, 0);
    }, [carrinho]);

    const { totalCarrinho, discountValue } = useMemo(() => {
        const numericDiscount = parseFloat(discount) || 0;
        const calculatedDiscountValue = subtotalCarrinho * (numericDiscount / 100);
        const finalTotal = subtotalCarrinho - calculatedDiscountValue;
        return {
            totalCarrinho: finalTotal > 0 ? finalTotal : 0,
            discountValue: calculatedDiscountValue,
        };
    }, [subtotalCarrinho, discount]);

    const handleFinalizarVenda = async () => {
        if (carrinho.length === 0) {
            toast.error("O carrinho está vazio.");
            return;
        }
        
        // Valida o CPF apenas se ele for preenchido
        if (customerCpf && !validateCPF(customerCpf)) {
             toast.error("CPF/CNPJ inválido. Por favor, verifique.");
             setIsCpfValid(false);
             return;
        }

        // Valida o telefone apenas se o campo for preenchido
        if (customerPhone && !validatePhone(customerPhone)) {
             toast.error("Telefone inválido. Por favor, verifique. Use o formato (XX) 9XXXX-XXXX.");
             setIsPhoneValid(false);
             return;
         }

        const saleDetails = {
            items: [...carrinho],
            subtotal: subtotalCarrinho,
            discountPercentage: parseFloat(discount) || 0,
            discountValue: discountValue,
            total: totalCarrinho,
            date: new Date(),
            customer: customerName,
            customerCpf: customerCpf,
            customerPhone: customerPhone,
            customerEmail: customerEmail,
            paymentMethod: paymentMethod,
            vendedor: currentUser.name,
        };

        const completeSaleDetails = await handleSale(saleDetails);

        if (completeSaleDetails) {
            setLastSaleDetails(completeSaleDetails);
            toast.success(`Venda de ${totalCarrinho.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} finalizada!`);
            setCarrinho([]);
            setDiscount('');
            setPaymentMethod('Dinheiro'); // Reseta para o padrão
            setCustomerCpf('');
            setCustomerName('');
            setCustomerPhone('');
            setCustomerEmail('');

            setIsReciboModalOpen(true);
        }
    };

    const handleCloseReciboModal = () => {
        setIsReciboModalOpen(false);
        setLastSaleDetails(null);
    };

    const handlePrintRecibo = () => {
        document.body.classList.add('print-mode-recibo');
        window.print();
    };

    const handleEmailRecibo = () => {
        if (!lastSaleDetails) return;

        const { items, subtotal, discountPercentage, discountValue, total, date, customer, customerCpf, customerPhone, customerEmail, receiptCode } = lastSaleDetails;

        let emailBody = `Olá, ${customer || 'cliente'},\n\nObrigado pela sua compra na Boycell!\n\n`;
        emailBody += `Detalhes da Venda:\n`;
        if (receiptCode) emailBody += `Código da Venda: ${receiptCode}\n`;
        if (customer) emailBody += `Cliente: ${customer}\n`;
        if (customerCpf) emailBody += `CPF/CNPJ: ${customerCpf}\n`;
        if (customerPhone) emailBody += `Telefone: ${customerPhone}\n`;
        if (customerEmail) emailBody += `Email: ${customerEmail}\n`;
        emailBody += `Data: ${new Date(date).toLocaleString('pt-BR')}\n\n`;
        emailBody += `Itens:\n`;
        items.forEach(item => {
            const itemSubtotal = (item.precoFinal * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            emailBody += `- ${item.nome || item.servico} (x${item.quantity}) - ${itemSubtotal}\n`;
            // Corrigido para incluir garantia de produtos e serviços
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
        if (!lastSaleDetails) return;

        const { items, subtotal, discountPercentage, discountValue, total, date, customer, customerCpf, customerPhone, receiptCode } = lastSaleDetails;

        let whatsAppText = `*Comprovante de Compra - Boycell*\n\n`;
        if (receiptCode) whatsAppText += `*Cód. Venda:* ${receiptCode}\n`;
        if (customer) {
            whatsAppText += `*Cliente:* ${customer}\n`;
        }
        if (customerCpf) {
            whatsAppText += `*CPF/CNPJ:* ${customerCpf}\n`;
        }
        if (customerPhone) {
            whatsAppText += `*Telefone:* ${customerPhone}\n`;
        }
        whatsAppText += `*Data:* ${new Date(date).toLocaleString('pt-BR')}\n\n`;
        whatsAppText += `*Itens:*\n`;
        items.forEach(item => {
            const itemSubtotal = (item.precoFinal * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            whatsAppText += `- ${item.nome || item.servico} (x${item.quantity}) - ${itemSubtotal}\n`;
            // Corrigido para incluir garantia de produtos e serviços
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
        whatsAppText += `\n*TOTAL:* ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n`;
        whatsAppText += `_Obrigado pela sua preferência!_`;

        const whatsAppLink = `https://wa.me/${customerPhone.replace(/\D/g, '') || ''}?text=${encodeURIComponent(whatsAppText)}`;
        window.open(whatsAppLink, '_blank');
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
        const lowerCaseSearch = produtoSearchTerm.toLowerCase().trim();
        // Se a busca estiver vazia, mostra os produtos em destaque. Se não houver, mostra todos os disponíveis.
        if (!lowerCaseSearch) {
            const featured = estoque.filter(p => p.destaque && (Number(p.emEstoque) > Number(p.qtdaMinima)));
            return featured.length > 0 ? featured : estoque.filter(p => Number(p.emEstoque) > Number(p.qtdaMinima));
        }
        return estoque.filter(p =>
            (p.nome?.toLowerCase().includes(lowerCaseSearch) ||
             p.categoria?.toLowerCase().includes(lowerCaseSearch) ||
             p.marca?.toLowerCase().includes(lowerCaseSearch))
        );
    }, [estoque, produtoSearchTerm]);

    const servicoResults = useMemo(() => {
        if (!Array.isArray(servicos)) return [];
        const lowerCaseSearch = servicoSearchTerm.toLowerCase().trim();
        // Se a busca estiver vazia, mostra os serviços em destaque. Se não houver, mostra todos.
        if (!lowerCaseSearch) {
            const featured = servicos.filter(s => s.destaque);
            return featured.length > 0 ? featured : servicos;
        }
        return servicos.filter(s =>
            s.servico?.toLowerCase().includes(lowerCaseSearch) ||
            s.tipoReparo?.toLowerCase().includes(lowerCaseSearch) ||
            s.marca?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [servicos, servicoSearchTerm]);

    return (
        <div className="bg-gray-950 text-gray-100 min-h-screen font-sans">
            <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
            <div id="recibo-printable-area" className="hidden">
                <ReciboVenda saleDetails={lastSaleDetails} />
            </div>
            <div id="vendas-non-printable-area">
                <header className="bg-gray-900 shadow-lg sticky top-0 z-20">
                    <nav className="container mx-auto flex items-center justify-between p-4">
                        <h1 className="text-2xl font-bold text-white">Olá, {currentUser?.name?.split(' ')[0] || 'Vendedor'}!</h1>
                        <div>
                            {(currentUser?.role === 'admin' || currentUser?.role === 'root') && (
                                <button onClick={() => navigate('/estoque')} className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors mr-6" title="Gerenciar Estoque">
                                    <Edit size={20} />
                                    <span className="hidden sm:inline">Gerenciar Estoque</span>
                                </button>
                            )}
                            <button onClick={onLogout} className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors" title="Sair">
                                <LogOut size={20} />
                                <span className="hidden sm:inline">Sair</span>
                            </button>
                        </div>
                    </nav>
                </header>

                <div className="container mx-auto p-4 mt-8 space-y-8">
                    {/* Dashboard do Vendedor */}
                    <div id="dashboard-vendedor">
                        <h2 className="text-2xl font-bold text-white mb-4">Seu Desempenho</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DashboardCard
                                icon={DollarSign}
                                title="Total Vendido Hoje"
                                value={showVendidoHoje ? vendedorDashboardData.totalVendidoHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ####,##'}
                                colorClass="border-green-500"
                                isToggleable={true}
                                showValue={showVendidoHoje}
                                onToggle={() => setShowVendidoHoje(!showVendidoHoje)}
                            />
                            <DashboardCard
                                icon={ShoppingBag}
                                title="Vendas Realizadas Hoje"
                                value={showVendasHoje ? vendedorDashboardData.vendasHoje : '##'}
                                colorClass="border-blue-500"
                                isToggleable={true}
                                showValue={showVendasHoje}
                                onToggle={() => setShowVendasHoje(!showVendasHoje)}
                            />
                            <DashboardCard
                                icon={Calendar}
                                title="Total Vendido no Mês"
                                value={showVendidoMes ? vendedorDashboardData.totalVendidoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ####,##'}
                                colorClass="border-purple-500"
                                isToggleable={true}
                                showValue={showVendidoMes}
                                onToggle={() => setShowVendidoMes(!showVendidoMes)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Coluna do Carrinho */}
                        <div className="lg:col-span-1 bg-gray-900 p-6 rounded-2xl shadow-xl flex flex-col h-fit lg:sticky top-24">
                            <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                                <ShoppingCart size={24} />
                                Carrinho
                            </h2>
                            <div className="flex-grow space-y-4 overflow-y-auto max-h-[50vh] pr-2">
                                {carrinho.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">O carrinho está vazio.</p>
                                ) : (
                                    carrinho.map(item => (
                                        <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 bg-gray-800 p-3 rounded-lg">
                                            <img src={item.imagem} alt={item.nome || item.servico} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                            <div className="flex-grow min-w-0">
                                                <p className="font-semibold truncate">{item.nome || item.servico}</p>
                                                <p className="text-sm text-gray-400">{item.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            </div>
                                            <input 
                                                type="number" 
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.id, item.type, parseInt(e.target.value))}
                                                className="w-16 p-1 bg-gray-700 border border-gray-600 rounded-md text-center"
                                                min="1"
                                                max={item.type === 'produto' ? (Number(item.emEstoque) - Number(item.qtdaMinima)) : undefined}
                                            />
                                            <button onClick={() => removeFromCart(item.id, item.type)} className="text-red-500 hover:text-red-400 p-1 flex-shrink-0">
                                                <X size={20} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-6 border-t border-gray-700 pt-4">
                                <div className="mb-4">
                                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-300 mb-1">Nome do Cliente <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        id="customerName"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Insira o nome do cliente"
                                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="customerCpf" className="block text-sm font-medium text-gray-300 mb-1">CPF/CNPJ do Cliente (Opcional)</label>
                                    <input
                                        type="text"
                                        id="customerCpf"
                                        value={customerCpf}
                                        onBlur={handleCpfBlur}
                                        onChange={handleCpfChange}
                                        placeholder="Insira o CPF ou CNPJ para buscar"
                                        className={`w-full p-2 bg-gray-800 border rounded-lg transition-colors ${isCpfValid ? 'border-gray-700 focus:ring-green-500' : 'border-red-500 focus:ring-red-500'} ${isSearchingClient ? 'animate-pulse' : ''}`}
                                    />
                                    {!isCpfValid && <p className="text-red-500 text-xs mt-1">CPF/CNPJ inválido.</p>}
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-300 mb-1">Telefone <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        id="customerPhone"
                                        value={customerPhone}
                                        onChange={handlePhoneChange}
                                        placeholder="Insira o telefone para contato"
                                        className={`w-full p-2 bg-gray-800 border rounded-lg transition-colors ${isPhoneValid ? 'border-gray-700 focus:ring-green-500' : 'border-red-500 focus:ring-red-500'}`}
                                        required
                                    />
                                    {!isPhoneValid && <p className="text-red-500 text-xs mt-1">Telefone inválido.</p>}
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-300 mb-1">Email (Opcional)</label>
                                    <input
                                        type="email"
                                        id="customerEmail"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        placeholder="Insira o email para envio do recibo"
                                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="discount" className="block text-sm font-medium text-gray-300 mb-1">Desconto (%)</label>
                                    <input
                                        type="number"
                                        id="discount"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                        placeholder="0"
                                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg"
                                        step="0.01"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button type="button" onClick={() => setPaymentMethod('Dinheiro')} className={`flex items-center justify-center gap-2 p-2 rounded-lg text-sm transition-colors ${paymentMethod === 'Dinheiro' ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            <Banknote size={16} />
                                            Dinheiro
                                        </button>
                                        <button type="button" onClick={() => setPaymentMethod('Cartão')} className={`flex items-center justify-center gap-2 p-2 rounded-lg text-sm transition-colors ${paymentMethod === 'Cartão' ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            <CreditCard size={16} />
                                            Cartão
                                        </button>
                                        <button type="button" onClick={() => setPaymentMethod('Pix')} className={`flex items-center justify-center gap-2 p-2 rounded-lg text-sm transition-colors ${paymentMethod === 'Pix' ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            <QrCode size={16} />
                                            Pix
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xl font-bold">
                                    <span>Total:</span>
                                    <span className="text-green-400">{totalCarrinho.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <button 
                                    onClick={handleFinalizarVenda}
                                    className="w-full mt-4 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    disabled={carrinho.length === 0}
                                >
                                    Finalizar Venda
                                </button>
                            </div>
                        </div>

                        {/* Coluna de Produtos/Serviços */}
                        <div className="lg:col-span-2 bg-gray-900 p-6 rounded-2xl shadow-xl">
                            <div className="flex border-b border-gray-700 mb-4">
                                <button 
                                    onClick={() => setActiveTab('produtos')} 
                                    className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'produtos' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Produtos
                                </button>
                                <button 
                                    onClick={() => setActiveTab('servicos')} 
                                    className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'servicos' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Serviços
                                </button>
                            </div>

                            <div>
                                {activeTab === 'produtos' && (
                                    <div>
                                        <div className="relative mb-4">
                                            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input 
                                                type="text" 
                                                placeholder="Buscar produto..." 
                                                value={produtoSearchTerm}
                                                onChange={e => setProdutoSearchTerm(e.target.value)}
                                                className="w-full p-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg"
                                            />
                                        </div>
                                        <div className="space-y-2 overflow-y-auto max-h-[65vh] pr-2">
                                            {produtoResults.map(p => (
                                                <div key={p.id} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700/50">
                                                    <img src={p.imagem} alt={p.nome} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                                    <div className="flex-grow min-w-0">
                                                        <p className="font-semibold truncate">{p.nome}</p>
                                                        <p className="text-sm text-gray-400">{p.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Disponível: {Number(p.emEstoque) - Number(p.qtdaMinima)}</p>
                                                    </div>
                                                    <button onClick={() => addToCart(p, 'produto')} className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold hover:bg-green-700 flex-shrink-0">
                                                        Adicionar
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'servicos' && (
                                    <div>
                                        <div className="relative mb-4">
                                            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input 
                                                type="text" 
                                                placeholder="Buscar serviço..." 
                                                value={servicoSearchTerm}
                                                onChange={e => setServicoSearchTerm(e.target.value)}
                                                className="w-full p-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg"
                                            />
                                        </div>
                                        <div className="space-y-2 overflow-y-auto max-h-[65vh] pr-2">
                                            {servicoResults.map(s => (
                                                <div key={s.id} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700/50">
                                                    <img src={s.imagem} alt={s.servico} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                                    <div className="flex-grow min-w-0">
                                                        <p className="font-semibold truncate">{s.servico}</p>
                                                        <p className="text-sm text-gray-400">{s.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                    </div>
                                                    <button onClick={() => addToCart(s, 'servico')} className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 flex-shrink-0">
                                                        Adicionar
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isReciboModalOpen} onClose={handleCloseReciboModal}>
                {lastSaleDetails && (
                    <>
                        <h2 className="text-2xl font-bold text-center text-blue-400 mb-4">Venda Concluída</h2>
                        <div className="bg-white rounded-lg overflow-y-auto max-h-[60vh]">
                            <ReciboVenda saleDetails={lastSaleDetails} />
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4">
                            <button onClick={handleWhatsAppRecibo} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full transition-colors">
                                <Send size={18} />
                                Enviar por WhatsApp
                            </button>
                            <button onClick={handleEmailRecibo} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-full transition-colors">
                                <Mail size={18} />
                                Enviar por Email
                            </button>
                            <button onClick={handlePrintRecibo} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors">
                                <Printer size={18} />
                                Imprimir / Salvar PDF
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default VendasPage;