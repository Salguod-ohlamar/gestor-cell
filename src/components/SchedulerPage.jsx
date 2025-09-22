import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Calendar, User, Wrench, Clock, Check, ArrowRight } from 'lucide-react';
import { useEstoqueContext } from './EstoqueContext.jsx';
import Modal from './Modal';
import Phone2DViewer from './Phone2DViewer'; // Importando o visualizador 2D

const SchedulerPage = ({ currentUser }) => {
    const {
        appointments,
        clientes,
        servicos,
        users,
        handleAddClient,
        handleAddAppointment,
        handleUpdateAppointment,
        handleDeleteAppointment,
    } = useEstoqueContext();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    // Estado para o formulário do cliente
    const [clientForm, setClientForm] = useState({ id: null, name: '', cpf: '', phone: '', email: '' });
    const [isSearchingClient, setIsSearchingClient] = useState(false);

    const [newAppointment, setNewAppointment] = useState({
        clientId: '',
        serviceId: '',
        userId: '',
        scheduledFor: '',
        notes: '',
        status: 'scheduled',
    });

    const technicians = useMemo(() => users.filter(u => u.role === 'vendedor' || u.role === 'admin'), [users]);
    const selectedService = useMemo(() => servicos.find(s => s.id === parseInt(newAppointment.serviceId)), [servicos, newAppointment.serviceId]);

    const handleOpenModal = (appointment = null) => {
        if (appointment) {
            setEditingAppointment(appointment);
            const client = clientes.find(c => c.id === appointment.clientId);
            if (client) {
                setClientForm({ id: client.id, name: client.name, cpf: client.cpf, phone: client.phone, email: client.email });
            }
            setNewAppointment({
                clientId: appointment.clientId,
                serviceId: appointment.serviceId,
                userId: appointment.userId || '',
                scheduledFor: new Date(appointment.scheduledFor).toISOString().slice(0, 16),
                status: appointment.status || 'scheduled',
                completedAt: appointment.completedAt ? new Date(appointment.completedAt).toISOString().slice(0, 16) : '',
                notes: appointment.notes || '',
            });
        } else {
            setEditingAppointment(null);
            setClientForm({ id: null, name: '', cpf: '', phone: '', email: '' });
            setNewAppointment({ clientId: '', serviceId: '', userId: '', scheduledFor: '', notes: '', status: 'scheduled' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAppointment(null);
        setClientForm({ id: null, name: '', cpf: '', phone: '', email: '' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewAppointment(prev => ({ ...prev, [name]: value }));
    };

    const handleClientInputChange = (e) => {
        const { name, value } = e.target;
        setClientForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCpfBlur = async () => {
        const { cpf } = clientForm;
        if (!cpf || cpf.length < 11) return;

        setIsSearchingClient(true);
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`/api/clients/search?cpf=${cpf}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 404) {
                alert('Cliente não encontrado. Preencha os dados para cadastrar um novo.');
                setClientForm(prev => ({ ...prev, id: null, name: '', phone: '', email: '' }));
                return;
            }
            if (!response.ok) throw new Error('Erro ao buscar cliente.');
            const clientData = await response.json();
            setClientForm({ id: clientData.id, name: clientData.name, cpf: clientData.cpf, phone: clientData.phone, email: clientData.email });
            setNewAppointment(prev => ({ ...prev, clientId: clientData.id }));
            alert(`Cliente "${clientData.name}" encontrado!`);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSearchingClient(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let finalClientId = clientForm.id;

        // Se não temos um ID de cliente, significa que é um novo cliente
        if (!finalClientId) {
            if (!clientForm.name || !clientForm.phone) {
                alert('Nome e Telefone são obrigatórios para o novo cliente.');
                return;
            }
            const createdClient = await handleAddClient(clientForm, currentUser.name);
            if (!createdClient) {
                alert('Falha ao criar o novo cliente. Verifique se o CPF já existe e tente novamente.');
                return;
            }
            finalClientId = createdClient.id;
        }

        // Construção explícita do objeto de dados para garantir os tipos corretos
        const data = {
            clientId: parseInt(finalClientId, 10),
            serviceId: parseInt(newAppointment.serviceId, 10),
            userId: newAppointment.userId ? parseInt(newAppointment.userId, 10) : null,
            scheduledFor: new Date(newAppointment.scheduledFor).toISOString(),
            notes: newAppointment.notes,
            status: newAppointment.status,
        };

        let success;
        if (editingAppointment) {
            success = await handleUpdateAppointment(editingAppointment.id, { ...data, completedAt: data.completedAt || null }, currentUser.name);
        } else {
            success = await handleAddAppointment(data, currentUser.name);
        }

        if (success) {
            handleCloseModal();
        } else {
            alert('Falha ao salvar agendamento.');
        }
    };

    const handleDelete = async (id) => {
        await handleDeleteAppointment(id, currentUser.name);
    };

    return (
        <div className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Calendar /> Agendador de Serviços
                    </h1>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} /> Novo Agendamento
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4">
                        <h2 className="text-xl font-semibold mb-4">Próximos Agendamentos</h2>
                        <div className="space-y-4">
                            {appointments.length > 0 ? appointments.map(app => (
                                <div key={app.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex-1 space-y-1">
                                        <p className="font-bold text-lg">{app.serviceName}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"><User size={14} /> {app.clientName}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"><Clock size={14} /> Agendado: {new Date(app.scheduledFor).toLocaleString('pt-BR')}</p>
                                        {app.completedAt && <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2"><Check size={14} /> Saída: {new Date(app.completedAt).toLocaleString('pt-BR')}</p>}
                                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"><Wrench size={14} /> Técnico: {app.userName || 'Não definido'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full 
                                            ${app.status === 'completed' ? 'bg-green-200 text-green-800' : 
                                            app.status === 'canceled' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                        </span>
                                        <button onClick={() => handleOpenModal(app)} className="p-2 text-gray-500 hover:text-blue-500"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(app.id)} className="p-2 text-gray-500 hover:text-red-500"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-gray-500 py-8">Nenhum agendamento encontrado.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="2xl">
                <h2 className="text-2xl font-bold mb-6">{editingAppointment ? 'Editar' : 'Novo'} Agendamento</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-center">Visualização do Reparo</h3>
                        <Phone2DViewer serviceType={selectedService?.tipoReparo} />
                        <div className="mt-4 text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="font-bold">{selectedService?.servico || "Selecione um serviço"}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{selectedService?.tipoReparo}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <fieldset className="border border-gray-300 dark:border-gray-600 p-4 rounded-lg">
                            <legend className="px-2 font-semibold">Dados do Cliente</legend>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="clientCpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CPF/CNPJ (Opcional)</label>
                                    <input type="text" id="clientCpf" name="cpf" value={clientForm.cpf} onChange={handleClientInputChange} onBlur={handleCpfBlur} disabled={!!editingAppointment} className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg" />
                                </div>
                                <div>
                                    <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                                    <input type="text" id="clientName" name="name" value={clientForm.name} onChange={handleClientInputChange} disabled={!!editingAppointment && !!clientForm.id} required className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg" />
                                </div>
                                <div>
                                    <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
                                    <input type="text" id="clientPhone" name="phone" value={clientForm.phone} onChange={handleClientInputChange} disabled={!!editingAppointment && !!clientForm.id} required className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg" />
                                </div>
                                <div>
                                    <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email (Opcional)</label>
                                    <input type="email" id="clientEmail" name="email" value={clientForm.email} onChange={handleClientInputChange} disabled={!!editingAppointment && !!clientForm.id} className="mt-1 block w-full p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg" />
                                </div>
                            </div>
                        </fieldset>

                        <fieldset className="border border-gray-300 dark:border-gray-600 p-4 rounded-lg">
                            <legend className="px-2 font-semibold">Dados do Serviço</legend>
                            <div className="space-y-4">
                        <div>
                            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Serviço</label>
                            <select
                                id="serviceId"
                                name="serviceId"
                                value={newAppointment.serviceId}
                                onChange={handleInputChange}
                                required
                                disabled={!!editingAppointment}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="">Selecione um serviço</option>
                                {servicos.map(s => <option key={s.id} value={s.id}>{s.servico} - {s.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Técnico Responsável</label>
                            <select
                                id="userId"
                                name="userId"
                                value={newAppointment.userId}
                                onChange={handleInputChange}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="">Não atribuído</option>
                                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data e Hora</label>
                            <input
                                type="datetime-local"
                                id="scheduledFor"
                                name="scheduledFor"
                                value={newAppointment.scheduledFor}
                                onChange={handleInputChange}
                                required
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                <select id="status" name="status" value={newAppointment.status} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                    <option value="scheduled">Agendado</option>
                                    <option value="in_progress">Em Andamento</option>
                                    <option value="completed">Concluído</option>
                                    <option value="canceled">Cancelado</option>
                                </select>
                            </div>
                            {editingAppointment && (
                                <div>
                                    <label htmlFor="completedAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Saída</label>
                                    <input
                                        type="datetime-local"
                                        id="completedAt"
                                        name="completedAt"
                                        value={newAppointment.completedAt}
                                        onChange={handleInputChange}
                                        disabled={newAppointment.status !== 'completed'}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:opacity-50"
                                    />
                                </div>
                            )}
                        </div>
                        </div>
                        </fieldset>

                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observações</label>
                            <textarea id="notes" name="notes" rows="3" value={newAppointment.notes} onChange={handleInputChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md"></textarea>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={handleCloseModal} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg mr-2">Cancelar</button>
                            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">{editingAppointment ? 'Salvar Alterações' : 'Agendar'}</button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default SchedulerPage;