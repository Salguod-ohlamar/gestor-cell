import React, { useState, useMemo } from 'react';
import { ArrowLeft, LogOut, Search, Edit, Trash2, ChevronLeft, ChevronRight, History, RefreshCw, Mail, Send, Printer, Settings, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import Modal from './Modal.jsx';
import ReciboVenda from './ReciboVenda.jsx';

const ClientesPage = ({
    onLogout,
    currentUser,
    clientes,
    salesHistory,
    handleUpdateCliente,
    handleDeleteCliente,
}) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [historySearchTerm, setHistorySearchTerm] = useState('');
    const [reprintingSale, setReprintingSale] = useState(null);

    const itemsPerPage = 10;

    const filteredClientes = useMemo(() => {
        if (!Array.isArray(clientes)) return [];
        return clientes.filter(cliente =>
            (cliente.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (cliente.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (cliente.cpf?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (cliente.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.lastPurchase) - new Date(a.lastPurchase));
    }, [clientes, searchTerm]);

    const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
    const paginatedClientes = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredClientes.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredClientes, currentPage]);

    const clienteSalesHistory = useMemo(() => {
        if (!selectedCliente || !Array.isArray(salesHistory)) return [];
        return salesHistory
            .filter(sale => sale.customerCpf === selectedCliente.cpf)
            .filter(sale => {
                if (!historySearchTerm) return true;
                const lowerSearch = historySearchTerm.toLowerCase();
                return (
                    (sale.receiptCode || '').toLowerCase().includes(lowerSearch) ||
                    sale.items.some(item => (item.nome || item.servico || '').toLowerCase().includes(lowerSearch))
                );
            });
    }, [selectedCliente, salesHistory, historySearchTerm]);

    const handleOpenHistoryModal = (cliente) => {
        setSelectedCliente(cliente);
        setIsHistoryModalOpen(true);
    };

    const handleCloseHistoryModal = () => {
        setIsHistoryModalOpen(false);
        setSelectedCliente(null);
        setHistorySearchTerm('');
    };

    const handleOpenReprintModal = (sale) => setReprintingSale(sale);
    const handleCloseReprintModal = () => setReprintingSale(null);

    const handlePrintRecibo = () => {
        document.body.classList.add('print-mode-recibo');
        window.print();
    };

    const handleEmailRecibo = () => {
        if (!reprintingSale) return;
        const { items, subtotal, discountPercentage, discountValue, total, date, customer, customerCpf, customerEmail, receiptCode } = reprintingSale;
        let emailBody = `Olá, ${customer || 'cliente'},\n\nObrigado pela sua compra na Boycell!\n\nDetalhes da Venda:\nCódigo: ${receiptCode}\nCliente: ${customer}\nCPF/CNPJ: ${customerCpf}\nData: ${new Date(date).toLocaleString('pt-BR')}\n\nItens:\n`;
        items.forEach(item => {
            const itemSubtotal = (item.precoFinal * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            emailBody += `- ${item.nome || item.servico} (x${item.quantity}) - ${itemSubtotal}\n`;
            if (item.tempoDeGarantia > 0) {
                const dataGarantia = new Date(date);
                dataGarantia.setDate(dataGarantia.getDate() + item.tempoDeGarantia);
                emailBody += `  Garantia até: ${dataGarantia.toLocaleDateString('pt-BR')}\n`;
            }
        });
        emailBody += `\nSubtotal: ${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
        if (discountPercentage > 0) emailBody += `Desconto (${discountPercentage}%): -${discountValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
        emailBody += `\nTotal: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\nAtenciosamente,\nEquipe Boycell`;
        const subject = `Seu Comprovante de Compra - Boycell (Cód: ${receiptCode || 'N/A'})`;
        window.open(`mailto:${customerEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`, '_blank');
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

    const handleOpenEditModal = (cliente) => {
        setEditingCliente({ ...cliente });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingCliente(null);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingCliente(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!editingCliente) return;
        const success = await handleUpdateCliente(editingCliente.id, editingCliente, currentUser.name);
        if (success) {
            handleCloseEditModal();
        }
    };

    return (
        <div className="bg-gray-950 text-gray-100 min-h-screen font-sans">
            <div id="recibo-printable-area" className="hidden">
                <ReciboVenda saleDetails={reprintingSale} />
            </div>
            <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
            <header className="bg-gray-900 shadow-lg sticky top-0 z-20">
                <nav className="container mx-auto flex items-center justify-between p-4">
                    <h1 className="text-2xl font-bold text-white">Gerenciar Clientes</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/estoque')} className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors" title="Voltar ao Estoque">
                            <ArrowLeft size={20} />
                            <span className="hidden sm:inline">Voltar ao Estoque</span>
                        </button>
                        <button onClick={onLogout} className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors" title="Sair">
                            <LogOut size={20} />
                            <span className="hidden sm:inline">Sair</span>
                        </button>
                    </div>
                </nav>
            </header>

            <main className="container mx-auto p-4 mt-8 space-y-8">
                <div className="bg-gray-900 p-8 rounded-2xl shadow-xl">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search size={20} className="text-gray-500" />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                className="w-full p-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-700">
                                <tr>
                                    <th className="p-4 font-semibold">Nome</th>
                                    <th className="p-4 font-semibold">CPF/CNPJ</th>
                                    <th className="p-4 font-semibold">Email</th>
                                    <th className="p-4 font-semibold">Telefone</th>
                                    <th className="p-4 font-semibold">Última Compra</th>
                                    <th className="p-4 font-semibold text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedClientes.length > 0 ? paginatedClientes.map((cliente) => (
                                    <tr key={cliente.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                        <td className="p-4 font-medium">{cliente.name}</td>
                                        <td className="p-4">{cliente.cpf}</td>
                                        <td className="p-4">{cliente.email || '-'}</td>
                                        <td className="p-4">{cliente.phone}</td>
                                        <td className="p-4">{new Date(cliente.lastPurchase).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-4">
                                                <button onClick={() => handleOpenHistoryModal(cliente)} className="text-purple-400 hover:text-purple-300" title="Histórico de Compras">
                                                    <History size={18} />
                                                </button>
                                                <button onClick={() => handleOpenEditModal(cliente)} className="text-blue-400 hover:text-blue-300" title="Editar Cliente">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={async () => await handleDeleteCliente(cliente.id, currentUser.name)} className="text-red-400 hover:text-red-300" title="Excluir Cliente">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">Nenhum cliente encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-6 flex justify-between items-center">
                            <span className="text-sm text-gray-400">
                                Página {currentPage} de {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"><ChevronLeft size={20} /></button>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"><ChevronRight size={20} /></button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal}>
                <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">Editar Cliente</h2>
                {editingCliente && (
                    <form className="space-y-4" onSubmit={handleUpdateSubmit}>
                        <div>
                            <label htmlFor="edit-cliente-name" className="block text-sm font-medium text-gray-300">Nome</label>
                            <input
                                id="edit-cliente-name"
                                name="name"
                                type="text"
                                value={editingCliente.name}
                                onChange={handleEditChange}
                                required
                                className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="edit-cliente-cpf" className="block text-sm font-medium text-gray-300">CPF/CNPJ</label>
                            <input
                                id="edit-cliente-cpf"
                                name="cpf"
                                type="text"
                                value={editingCliente.cpf}
                                onChange={handleEditChange}
                                required
                                className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="edit-cliente-email" className="block text-sm font-medium text-gray-300">Email</label>
                            <input
                                id="edit-cliente-email"
                                name="email"
                                type="email"
                                value={editingCliente.email}
                                onChange={handleEditChange}
                                className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="edit-cliente-phone" className="block text-sm font-medium text-gray-300">Telefone</label>
                            <input
                                id="edit-cliente-phone"
                                name="phone"
                                type="text"
                                value={editingCliente.phone}
                                onChange={handleEditChange}
                                required
                                className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button type="submit" className="w-full mt-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                            Salvar Alterações
                        </button>
                    </form>
                )}
            </Modal>

            <Modal isOpen={isHistoryModalOpen} onClose={handleCloseHistoryModal} size="xl">
                {selectedCliente && (
                    <>
                        <h2 className="text-2xl font-bold text-center text-purple-400 mb-2">Histórico de Compras</h2>
                        <p className="text-center text-lg font-semibold text-white mb-6">{selectedCliente.name}</p>

                        <div className="relative mb-6">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search size={20} className="text-gray-500" />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar por código ou produto..."
                                className="w-full p-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={historySearchTerm}
                                onChange={(e) => setHistorySearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                            {clienteSalesHistory.length > 0 ? (
                                clienteSalesHistory.map(sale => (
                                    <div key={sale.id} className="p-4 bg-gray-800 rounded-lg border-l-4 border-purple-500">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-grow">
                                                <p className="text-sm text-gray-400">{new Date(sale.date).toLocaleString('pt-BR')}</p>
                                                {sale.receiptCode && <p className="text-xs text-gray-500 font-mono">Cód: {sale.receiptCode}</p>}
                                                <p className="text-lg font-bold text-purple-300">Total: {sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                <p className="text-sm text-gray-300">Pagamento: <span className="font-semibold text-purple-200">{sale.paymentMethod}</span></p>
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
                            ) : (<p className="text-center text-gray-500 py-16">Nenhuma compra encontrada para este cliente com os filtros atuais.</p>)}
                        </div>
                    </>
                )}
            </Modal>

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

export default ClientesPage;