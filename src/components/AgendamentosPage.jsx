import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, LogOut, Search, Edit, Trash2, PlusCircle, ChevronLeft, ChevronRight, MessageSquare, UserPlus, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import Modal from './Modal.jsx';
import { useEstoqueContext } from './EstoqueContext.jsx';
import { validateCPF, validatePhone } from './formatters.js';

const AgendamentosPage = ({ onLogout, currentUser }) => {
    const navigate = useNavigate();
    const {
        agendamentos,
        clientes,
        servicos,
        handleAdicionarAgendamento,
        handleAtualizarAgendamento,
        handleExcluirAgendamento,
        handleAdicionarCliente,
    } = useEstoqueContext();

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAgendamento, setEditingAgendamento] = useState(null);

    // State for the new multi-step modal
    const [modalStep, setModalStep] = useState(1); // 1: Client, 2: Appointment
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', cpf: '', phone: '', email: '' });
    const [formErrors, setFormErrors] = useState({});

    const [newAgendamento, setNewAgendamento] = useState({
        clientId: '',
        serviceId: '',
        scheduledForDate: '',
        scheduledForTime: '',
        dueDate: '',
        status: 'scheduled',
        notes: ''
    });

    const itemsPerPage = 10;

    const filteredAgendamentos = useMemo(() => {
        if (!Array.isArray(agendamentos)) return [];
        return agendamentos.filter(ag =>
            (ag.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (ag.serviceName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (ag.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor));
    }, [agendamentos, searchTerm]);

    const totalPages = Math.ceil(filteredAgendamentos.length / itemsPerPage);
    const paginatedAgendamentos = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAgendamentos.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAgendamentos, currentPage]);

    const handleOpenAddModal = () => setIsAddModalOpen(true);
    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        // Reset all states for the add modal
        setTimeout(() => {
            setModalStep(1);
            setSelectedClient(null);
            setShowNewClientForm(false);
            setNewClient({ name: '', cpf: '', phone: '', email: '' });
        }, 300); // Delay to allow modal to close before state reset
        setNewAgendamento({ clientId: '', serviceId: '', scheduledForDate: '', scheduledForTime: '', dueDate: '', status: 'scheduled', notes: '' });
    };

    const handleOpenEditModal = (agendamento) => {
        const scheduledDateTime = new Date(agendamento.scheduledFor);
        setEditingAgendamento({
            ...agendamento,
            dueDate: agendamento.dueDate ? new Date(agendamento.dueDate).toISOString().split('T')[0] : '',
            scheduledForDate: scheduledDateTime.toISOString().split('T')[0],
            scheduledForTime: scheduledDateTime.toTimeString().split(' ')[0].substring(0, 5),
        });
        setIsEditModalOpen(true);
    };
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingAgendamento(null);
    };

    const handleInputChange = (e, setter) => {
        const { name, value } = e.target;
        setter(prev => ({ ...prev, [name]: value }));
    };

    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        const { serviceId, scheduledForDate, scheduledForTime } = newAgendamento;
        if (!selectedClient?.id || !serviceId || !scheduledForDate || !scheduledForTime) {
            toast.error('Por favor, preencha cliente, serviço, data e hora.');
            return;
        }
        const scheduledFor = new Date(`${scheduledForDate}T${scheduledForTime}:00`).toISOString();
        const success = await handleAdicionarAgendamento({ ...newAgendamento, clientId: selectedClient.id, scheduledFor, dueDate: newAgendamento.dueDate || null });
        if (success) {
            closeFn();
        }
    };

    const columns = [
        { id: 'clientName', label: 'Cliente', sortable: true },
        { id: 'serviceName', label: 'Serviço', sortable: true },
        { id: 'scheduledFor', label: 'Entrada', sortable: true },
        { id: 'dueDate', label: 'Entrega', sortable: true },
        { id: 'status', label: 'Status', sortable: true },
        { id: 'userName', label: 'Agendado por', sortable: true },
        { id: 'acoes', label: 'Ações', sortable: false, align: 'right' },
    ];

    const handleWhatsAppClick = (agendamento) => {
        if (!agendamento.clientPhone) {
            toast.error('Cliente sem número de telefone cadastrado.');
            return;
        }
        const cleanPhone = agendamento.clientPhone.replace(/\D/g, '');
        const entryDate = new Date(agendamento.scheduledFor).toLocaleDateString('pt-BR');
        const message = `Olá! O requerimento efetuado no dia ${entryDate} encontra-se disponível para retirada.`;
        const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const renderRow = (ag) => (
        <tr key={ag.id} className="border-b border-gray-800 hover:bg-gray-800/50">
            <td className="p-4 font-medium">{ag.clientName}</td>
            <td className="p-4">{ag.serviceName}</td>
            <td className="p-4">{new Date(ag.scheduledFor).toLocaleString('pt-BR')}</td>
            <td className="p-4">{ag.dueDate ? new Date(ag.dueDate).toLocaleDateString('pt-BR') : 'N/A'}</td>
            <td className="p-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    ag.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                    ag.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300' :
                    ag.status === 'confirmed' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                }`}>
                    {ag.status}
                </span>
            </td>
            <td className="p-4">{ag.userName}</td>
            <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                    {ag.status === 'completed' && (
                        <button onClick={() => handleWhatsAppClick(ag)} className="text-green-400 hover:text-green-300" title="Notificar Cliente no WhatsApp"><MessageSquare size={18} /></button>
                    )}
                    <button onClick={() => handleOpenEditModal(ag)} className="text-blue-400 hover:text-blue-300" title="Editar Agendamento"><Edit size={18} /></button>
                    <button onClick={() => handleExcluirAgendamento(ag.id)} className="text-red-400 hover:text-red-300" title="Excluir Agendamento"><Trash2 size={18} /></button>
                </div>
            </td>
        </tr>
    );

    const renderEditFormFields = (data, handler) => (
        <>
            <div className="md:col-span-2">
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-300">Cliente</label>
                <select id="clientId" name="clientId" value={data.clientId} onChange={(e) => handler(e, data === newAgendamento ? setNewAgendamento : setEditingAgendamento)} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Selecione um cliente</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="md:col-span-2">
                <label htmlFor="serviceId" className="block text-sm font-medium text-gray-300">Serviço</label>
                <select id="serviceId" name="serviceId" value={data.serviceId} onChange={(e) => handler(e, data === newAgendamento ? setNewAgendamento : setEditingAgendamento)} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Selecione um serviço</option>
                    {servicos.map(s => <option key={s.id} value={s.id}>{s.servico}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="scheduledForDate" className="block text-sm font-medium text-gray-300">Data de Entrada</label>
                <input id="scheduledForDate" name="scheduledForDate" type="date" value={data.scheduledForDate} onChange={(e) => handler(e, data === newAgendamento ? setNewAgendamento : setEditingAgendamento)} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
                <label htmlFor="scheduledForTime" className="block text-sm font-medium text-gray-300">Hora de Entrada</label>
                <input id="scheduledForTime" name="scheduledForTime" type="time" value={data.scheduledForTime} onChange={(e) => handler(e, data === newAgendamento ? setNewAgendamento : setEditingAgendamento)} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300">Data de Entrega</label>
                <input id="dueDate" name="dueDate" type="date" value={data.dueDate} onChange={(e) => handler(e, data === newAgendamento ? setNewAgendamento : setEditingAgendamento)} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-300">Status</label>
                <select id="status" name="status" value={data.status} onChange={(e) => handler(e, data === newAgendamento ? setNewAgendamento : setEditingAgendamento)} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="scheduled">Agendado</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="completed">Concluído</option>
                    <option value="canceled">Cancelado</option>
                </select>
            </div>
            <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-300">Relato do Cliente / Observações</label>
                <textarea id="notes" name="notes" value={data.notes} onChange={(e) => handler(e, data === newAgendamento ? setNewAgendamento : setEditingAgendamento)} rows="3" className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
            </div>
        </>
    );

    // New Client Form Validation
    const validateNewClient = () => {
        const errors = {};
        if (!newClient.name) errors.name = 'Nome é obrigatório.';
        if (!newClient.phone) errors.phone = 'Telefone é obrigatório.';
        else if (!validatePhone(newClient.phone)) errors.phone = 'Telefone inválido.';
        if (newClient.cpf && !validateCPF(newClient.cpf)) errors.cpf = 'CPF/CNPJ inválido.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNewClientSubmit = async (e) => {
        e.preventDefault();
        if (!validateNewClient()) {
            toast.error('Por favor, corrija os erros no formulário.');
            return;
        }
        const createdClient = await handleAdicionarCliente(newClient, currentUser.name);
        if (createdClient) {
            setSelectedClient(createdClient);
            setModalStep(2);
            setShowNewClientForm(false);
            setNewClient({ name: '', cpf: '', phone: '', email: '' });
        }
    };

    const filteredClients = useMemo(() => {
        if (!clientSearchTerm) return clientes;
        return clientes.filter(c =>
            c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
            c.cpf?.includes(clientSearchTerm)
        );
    }, [clientes, clientSearchTerm]);

    const renderClientStep = () => (
        <div>
            <h3 className="text-xl font-bold text-center text-gray-200 mb-4">Etapa 1: Selecione o Cliente</h3>
            
            {!showNewClientForm ? (
                <>
                    <div className="relative mb-4">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar cliente por nome ou CPF..."
                            value={clientSearchTerm}
                            onChange={(e) => setClientSearchTerm(e.target.value)}
                            className="w-full p-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {filteredClients.map(client => (
                            <button
                                key={client.id}
                                onClick={() => { setSelectedClient(client); setModalStep(2); }}
                                className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <p className="font-semibold">{client.name}</p>
                                <p className="text-sm text-gray-400">{client.cpf || 'CPF não informado'}</p>
                            </button>
                        ))}
                    </div>
                    <div className="mt-6 text-center">
                        <button onClick={() => setShowNewClientForm(true)} className="inline-flex items-center gap-2 text-green-400 hover:text-green-300">
                            <UserPlus size={18} /> Cadastrar Novo Cliente
                        </button>
                    </div>
                </>
            ) : (
                <form onSubmit={handleNewClientSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="new-client-name" className="block text-sm font-medium text-gray-300">Nome Completo</label>
                        <input id="new-client-name" name="name" type="text" value={newClient.name} onChange={(e) => handleInputChange(e, setNewClient)} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg" />
                        {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="new-client-cpf" className="block text-sm font-medium text-gray-300">CPF/CNPJ</label>
                        <input id="new-client-cpf" name="cpf" type="text" value={newClient.cpf} onChange={(e) => handleInputChange(e, setNewClient)} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg" />
                        {formErrors.cpf && <p className="text-red-500 text-xs mt-1">{formErrors.cpf}</p>}
                    </div>
                    <div>
                        <label htmlFor="new-client-phone" className="block text-sm font-medium text-gray-300">Telefone</label>
                        <input id="new-client-phone" name="phone" type="text" value={newClient.phone} onChange={(e) => handleInputChange(e, setNewClient)} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg" />
                        {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                    </div>
                    <div>
                        <label htmlFor="new-client-email" className="block text-sm font-medium text-gray-300">Email</label>
                        <input id="new-client-email" name="email" type="email" value={newClient.email} onChange={(e) => handleInputChange(e, setNewClient)} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg" />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowNewClientForm(false)} className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg">Voltar</button>
                        <button type="submit" className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg">Salvar e Continuar</button>
                    </div>
                </form>
            )}
        </div>
    );

    const renderAppointmentStep = () => (
        <div>
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setModalStep(1)} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                    <ChevronLeft size={16} /> Voltar
                </button>
                <h3 className="text-xl font-bold text-center text-gray-200">Etapa 2: Detalhes do Serviço</h3>
                <div></div>
            </div>
            <div className="p-3 mb-4 bg-gray-800 rounded-lg flex items-center gap-3">
                <Building2 className="text-green-400" />
                <p className="font-semibold">{selectedClient?.name}</p>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" onSubmit={handleAppointmentSubmit}>
                {renderEditFormFields(newAgendamento, (e) => handleInputChange(e, setNewAgendamento))}
                <button type="submit" className="w-full md:col-span-2 mt-4 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
                    Salvar Agendamento
                </button>
            </form>
        </div>
    );

    return (
        <div className="bg-gray-950 text-gray-100 min-h-screen font-sans">
            <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
            <header className="bg-gray-900 shadow-lg sticky top-0 z-20">
                <nav className="container mx-auto flex items-center justify-between p-4">
                    <h1 className="text-2xl font-bold text-white">Agenda de Serviços</h1>
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
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search size={20} className="text-gray-500" />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar por cliente, serviço ou status..."
                                className="w-full md:w-80 p-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button onClick={handleOpenAddModal} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
                            <PlusCircle size={18} /> Novo Agendamento
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-700">
                                <tr>
                                    {columns.map(col => (
                                        <th key={col.id} className="p-4 font-semibold">{col.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedAgendamentos.length > 0 ? paginatedAgendamentos.map(renderRow) : (
                                    <tr>
                                        <td colSpan={columns.length} className="p-8 text-center text-gray-500">Nenhum agendamento encontrado.</td>
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

            {/* Modal Adicionar Agendamento */}
            <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal}>
                <h2 className="text-2xl font-bold text-center text-green-400 mb-6">Novo Agendamento de Serviço</h2>
                {modalStep === 1 ? renderClientStep() : renderAppointmentStep()}
            </Modal>

            {/* Modal Editar Agendamento */}
            <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal}>
                <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">Editar Agendamento</h2>
                {editingAgendamento && (
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" onSubmit={async (e) => {
                        e.preventDefault();
                        const success = await handleAtualizarAgendamento(editingAgendamento);
                        if (success) handleCloseEditModal();
                    }}>
                        {renderEditFormFields(editingAgendamento, (e) => handleInputChange(e, setEditingAgendamento))}
                        <button type="submit" className="w-full md:col-span-2 mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                            Salvar Alterações
                        </button>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default AgendamentosPage;