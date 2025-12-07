import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';

// Tipagem para os itens do orçamento (peças e serviços)
interface QuoteItem {
    descricao: string;
    valor: number;
}

// Tipagem para o objeto de orçamento, espelhando a tabela do DB
interface Quote {
    id: number;
    quote_number: string;
    status: 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Concluído';
    customer_name: string;
    total: number;
    created_at: string;
    // Adicione outros campos se precisar exibi-los na tabela
}

interface OrcamentoProps {
    currentUser: { name: string; role: string; };
    onLogout?: () => void; // Tornando opcional, pois não é usado aqui
}

/**
 * Componente do Formulário de Orçamento
 * Responsável por criar ou editar um orçamento.
 */
const OrcamentoForm = ({ onBackToList, currentUser }: { onBackToList: () => void, currentUser: OrcamentoProps['currentUser'] }) => {
    // Estado para os dados do formulário
    const [formData, setFormData] = useState({
        // Inicializa a data do orçamento com o dia de hoje
        expected_quote_date: new Date().toISOString().split('T')[0],
        customer_name: '',
        customer_cpf: '',
        customer_phone: '',
        customer_email: '',
        deviceBrand: '',
        deviceModel: '',
        device_serial_number: '',
        reported_defect: '',
        observations: '',
        expected_delivery_date: '',
        warranty_period: '',
    });

    // Estado para a lista de itens (serviços e peças)
    const [items, setItems] = useState<QuoteItem[]>([
        { descricao: 'Análise Técnica', valor: 50.00 },
        { descricao: 'Mão de Obra', valor: 100.00 },
    ]);

    // Estado para o valor total
    const [total, setTotal] = useState(0);

    // Recalcula o total sempre que a lista de itens mudar
    useEffect(() => {
        const novoTotal = items.reduce((acc, item) => acc.valor + item.valor, 0);
        setTotal(novoTotal);
    }, [items]);

    // Função para lidar com a mudança nos inputs do formulário
    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Função para adicionar um novo item à lista
    const handleAddItem = () => {
        setItems([...items, { descricao: '', valor: 0 }]);
    };

    // Função para submeter o formulário
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // Monta o objeto final para ser enviado à API
        const orcamentoCompleto = {
            ...formData,
            device_brand_model: `${formData.deviceBrand} ${formData.deviceModel}`.trim(), // Combina marca e modelo
            items: items, // A lista de serviços/peças (JSONB)
            total: total,
            user_id: (currentUser as any).id, // Pegar o ID do usuário logado
        };
        // Remove os campos separados de marca e modelo que não existem na tabela
        delete (orcamentoCompleto as any).deviceBrand;
        delete (orcamentoCompleto as any).deviceModel;

        console.log('Dados do Orçamento:', orcamentoCompleto);
        // TODO: Chamar a API para salvar o orçamento
        // Ex: await api.post('/quotes', orcamentoCompleto);
        // Após salvar, voltar para a lista
        onBackToList();
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-gray-800">Novo Orçamento</h1>
            <p className="text-md text-gray-500 mb-8">Preencha os dados para gerar um novo orçamento.</p>

            <form className="space-y-8" onSubmit={handleSubmit}>
                {/* Seção de Informações do Cliente */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Dados do Cliente</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="customer_name" className="block text-sm font-medium text-gray-600 mb-1">Nome:</label>
                            <input type="text" id="customer_name" name="customer_name" value={formData.customer_name} onChange={handleInputChange} placeholder="Nome completo do cliente" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="customer_cpf" className="block text-sm font-medium text-gray-600 mb-1">CPF:</label>
                            <input type="text" id="customer_cpf" name="customer_cpf" value={formData.customer_cpf} onChange={handleInputChange} placeholder="000.000.000-00" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-600 mb-1">Telefone:</label>
                            <input type="tel" id="customer_phone" name="customer_phone" value={formData.customer_phone} onChange={handleInputChange} placeholder="(XX) XXXXX-XXXX" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="customer_email" className="block text-sm font-medium text-gray-600 mb-1">Email:</label>
                            <input type="email" id="customer_email" name="customer_email" value={formData.customer_email} onChange={handleInputChange} placeholder="email@exemplo.com" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                </section>

                {/* Seção de Informações do Aparelho */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Informações do Aparelho</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="deviceBrand" className="block text-sm font-medium text-gray-600 mb-1">Marca:</label>
                            <input type="text" id="deviceBrand" name="deviceBrand" value={formData.deviceBrand} onChange={handleInputChange} placeholder="Ex: Samsung" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="deviceModel" className="block text-sm font-medium text-gray-600 mb-1">Modelo:</label>
                            <input type="text" id="deviceModel" name="deviceModel" value={formData.deviceModel} onChange={handleInputChange} placeholder="Ex: Galaxy S22" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="device_serial_number" className="block text-sm font-medium text-gray-600 mb-1">IMEI/Nº de Série:</label>
                            <input type="text" id="device_serial_number" name="device_serial_number" value={formData.device_serial_number} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                </section>

                {/* Seção de Defeitos e Observações */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Diagnóstico e Observações</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="reported_defect" className="block text-sm font-medium text-gray-600 mb-1">Defeito Relatado:</label>
                            <textarea id="reported_defect" name="reported_defect" value={formData.reported_defect} onChange={handleInputChange} rows={3} placeholder="Descrição do problema informado pelo cliente..." className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                        </div>
                        <div>
                            <label htmlFor="observations" className="block text-sm font-medium text-gray-600 mb-1">Observações Técnicas:</label>
                            <textarea id="observations" name="observations" value={formData.observations} onChange={handleInputChange} rows={3} placeholder="Detalhes técnicos, avarias encontradas, etc..." className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                        </div>
                    </div>
                </section>

                {/* Seção de Itens e Custos */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Serviços e Peças</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Valor (R$)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.descricao}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-right font-mono">{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-800 uppercase">Total</td>
                                    <td className="px-6 py-3 text-right text-lg font-bold text-gray-900 font-mono">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div className="mt-4 flex justify-start">
                        <button type="button" onClick={handleAddItem} className="px-4 py-2 border border-dashed border-gray-400 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">
                            + Adicionar Item
                        </button>
                    </div>
                </section>

                {/* Seção de Prazos e Garantia */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Prazos e Garantia</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="expected_quote_date" className="block text-sm font-medium text-gray-600 mb-1">Data do Orçamento:</label>
                            <input type="date" id="expected_quote_date" name="expected_quote_date" value={formData.expected_quote_date} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="expected_delivery_date" className="block text-sm font-medium text-gray-600 mb-1">Previsão de Entrega:</label>
                            <input type="date" id="expected_delivery_date" name="expected_delivery_date" value={formData.expected_delivery_date} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="warranty_period" className="block text-sm font-medium text-gray-600 mb-1">Garantia:</label>
                            <input type="text" id="warranty_period" name="warranty_period" value={formData.warranty_period} onChange={handleInputChange} placeholder="Ex: 90 dias" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                </section>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onBackToList} className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        Gerar Orçamento
                    </button>
                </div>
            </form>
        </>
    );
}

/**
 * Componente da Lista de Orçamentos
 * Exibe uma tabela com os orçamentos existentes.
 */
const OrcamentoList = ({ onShowForm }: { onShowForm: () => void }) => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                // A requisição será direcionada para http://localhost:3001/api/quotes pelo proxy do Vite
                const token = localStorage.getItem('boycell-token');
                const response = await fetch('/api/quotes', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error('Falha ao buscar orçamentos');
                }
                const data = await response.json();
                setQuotes(data);
            } catch (error) {
                console.error(error);
                // TODO: Mostrar notificação de erro para o usuário
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuotes();
    }, []);

    if (isLoading) {
        return <div>Carregando orçamentos...</div>;
    }

    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Gerenciar Orçamentos</h1>
                    <p className="text-md text-gray-500">Visualize, crie e edite os orçamentos.</p>
                </div>
                <button onClick={onShowForm} className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    Novo Orçamento
                </button>
            </div>

            {/* TODO: Adicionar campos de busca e filtro aqui */}

            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {quotes.length > 0 ? quotes.map(quote => (
                            <tr key={quote.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{quote.quote_number}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{quote.customer_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{quote.status}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{new Date(quote.created_at).toLocaleDateString('pt-BR')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-right font-mono">{Number(quote.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <a href="#" className="text-indigo-600 hover:text-indigo-900">Ver / Editar</a>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum orçamento encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

/**
 * Componente Principal da Página de Orçamento
 * Controla a visualização entre a lista e o formulário.
 */
export function Orcamento({ currentUser }: OrcamentoProps) {
    const [view, setView] = useState<'list' | 'form'>('list');

    return (
        <div className="max-w-7xl mx-auto my-8 p-6 md:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <header className="text-center pb-4 mb-8 border-b-2 border-gray-100 dark:border-gray-700">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Módulo de Orçamentos</h1>
                <p className="text-md text-gray-500 dark:text-gray-400">BOY CELL - Assistência Técnica</p>
            </header>

            {view === 'list' ? (
                <OrcamentoList onShowForm={() => setView('form')} />
            ) : (
                <OrcamentoForm onBackToList={() => setView('list')} currentUser={currentUser} />
            )}
        </div>
    );
}