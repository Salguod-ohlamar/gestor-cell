import React, { useState, useEffect, ChangeEvent, FormEvent, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/Modal.jsx';
import { Search } from 'lucide-react'; // Importar o ícone de busca
import ReciboOrcamento from '@/components/ReciboOrcamento.jsx';
import { useEstoqueContext } from '@/components/EstoqueContext.jsx';

// Tipagem para os itens do orçamento (peças e serviços)
interface QuoteItem {
    id: number;
    type: 'produto' | 'serviço';
    descricao: string;
    valor: number;
    quantity: number;
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

// Tipagem para o objeto de produto/serviço vindo da API
interface Product {
    id: number;
    name: string;
    price: number;
    type: 'produto' | 'serviço';
}

interface OrcamentoProps {
    currentUser: { id: number; name: string; role: string; };
    onLogout?: () => void;
}

/**
 * Componente do Formulário de Orçamento
 * Responsável por criar ou editar um orçamento.
 */
const OrcamentoForm = ({ onBackToList, currentUser, quoteId }: { onBackToList: () => void, currentUser: OrcamentoProps['currentUser'], quoteId: number | null }) => {
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
    const [items, setItems] = useState<QuoteItem[]>([]);

    // Estado para o valor total
    const [total, setTotal] = useState(0);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    // Efeito para buscar os dados do orçamento quando estiver em modo de edição
    useEffect(() => {
        if (quoteId) {
            const fetchQuoteDetails = async () => {
                try {
                    const token = localStorage.getItem('boycell-token');
                    const response = await fetch(`/api/quotes/${quoteId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Falha ao buscar detalhes do orçamento');
                    const data = await response.json();

                    // Separa marca e modelo
                    const [brand, ...modelParts] = (data.device_brand_model || '').split(' ');

                    // Popula o formulário com os dados recebidos
                    setFormData({
                        customer_name: data.customer_name || '',
                        customer_cpf: data.customer_cpf || '',
                        customer_phone: data.customer_phone || '',
                        customer_email: data.customer_email || '',
                        deviceBrand: brand || '',
                        deviceModel: modelParts.join(' ') || '',
                        device_serial_number: data.device_serial_number || '',
                        reported_defect: data.reported_defect || '',
                        observations: data.observations || '',
                        expected_quote_date: data.expected_quote_date ? new Date(data.expected_quote_date).toISOString().split('T')[0] : '',
                        expected_delivery_date: data.expected_delivery_date ? new Date(data.expected_delivery_date).toISOString().split('T')[0] : '',
                        warranty_period: data.warranty_period || '',
                    });
                    setItems(data.items || []);
                } catch (error) {
                    console.error(error);
                }
            };
            fetchQuoteDetails();
        }
    }, [quoteId]);

    // Recalcula o total sempre que a lista de itens mudar
    useEffect(() => {
        const novoTotal = items.reduce((acc, item) => acc + item.valor, 0);
        setTotal(novoTotal);
    }, [items]);

    // Função para lidar com a mudança nos inputs do formulário
    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Adiciona o produto/serviço selecionado no modal à lista de itens do orçamento
    const handleProductSelect = (product: Product) => {
        setItems(prevItems => [...prevItems, {
            id: product.id,
            type: product.type,
            descricao: product.name,
            valor: Number(product.price),
            quantity: 1
        }]);
    };

    // Função para remover um item da lista
    const handleRemoveItem = (indexToRemove: number) => {
        setItems(prevItems => prevItems.filter((_, index) => index !== indexToRemove));
    };

    // Função para editar um item da lista
    const handleItemChange = (indexToUpdate: number, field: keyof QuoteItem, value: string) => {
        const newItems = items.map((item, index) => {
            if (index === indexToUpdate) {
                const processedValue = (field === 'valor' || field === 'quantity') ? parseFloat(value) || 0 : value;
                return { ...item, [field]: processedValue };
            }
            return item;
        });
        setItems(newItems);
    };

    // Abre o modal de busca de produtos
    const openSearchModal = () => {
        setIsSearchModalOpen(true);
    };

    // Função para submeter o formulário
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        // Monta o objeto final para ser enviado à API
        const orcamentoCompleto = {
            ...formData,
            device_brand_model: `${formData.deviceBrand} ${formData.deviceModel}`.trim(), // Combina marca e modelo
            items: items, // A lista de serviços/peças (JSONB)
            total: total,
            user_id: currentUser.id, // Pegar o ID do usuário logado
        };
        // Remove os campos separados de marca e modelo que não existem na tabela
        delete (orcamentoCompleto as any).deviceBrand;
        delete (orcamentoCompleto as any).deviceModel;

        try {
            const token = localStorage.getItem('boycell-token');
            const url = quoteId ? `/api/quotes/${quoteId}` : '/api/quotes';
            const method = quoteId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orcamentoCompleto)
            });

            if (!response.ok) {
                throw new Error(quoteId ? 'Falha ao atualizar orçamento' : 'Falha ao criar orçamento');
            }

            onBackToList(); // Volta para a lista após sucesso
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{quoteId ? 'Editar Orçamento' : 'Novo Orçamento'}</h1>
            <p className="text-md text-gray-500 dark:text-gray-400 mb-8">Preencha os dados para gerar um novo orçamento.</p>

            <form className="space-y-8" onSubmit={handleSubmit}>
                {/* Seção de Informações do Cliente */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 pb-2 mb-4">Dados do Cliente</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="customer_name" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Nome:</label>
                            <input type="text" id="customer_name" name="customer_name" value={formData.customer_name} onChange={handleInputChange} placeholder="Nome completo do cliente" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="customer_cpf" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">CPF:</label>
                            <input type="text" id="customer_cpf" name="customer_cpf" value={formData.customer_cpf} onChange={handleInputChange} placeholder="000.000.000-00" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Telefone:</label>
                            <input type="tel" id="customer_phone" name="customer_phone" value={formData.customer_phone} onChange={handleInputChange} placeholder="(XX) XXXXX-XXXX" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="customer_email" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Email:</label>
                            <input type="email" id="customer_email" name="customer_email" value={formData.customer_email} onChange={handleInputChange} placeholder="email@exemplo.com" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                        </div>
                    </div>
                </section>

                {/* Seção de Informações do Aparelho */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 pb-2 mb-4">Informações do Aparelho</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="deviceBrand" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Marca:</label>
                            <input type="text" id="deviceBrand" name="deviceBrand" value={formData.deviceBrand} onChange={handleInputChange} placeholder="Ex: Samsung" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="deviceModel" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Modelo:</label>
                            <input type="text" id="deviceModel" name="deviceModel" value={formData.deviceModel} onChange={handleInputChange} placeholder="Ex: Galaxy S22" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="device_serial_number" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">IMEI/Nº de Série:</label>
                            <input type="text" id="device_serial_number" name="device_serial_number" value={formData.device_serial_number} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                        </div>
                    </div>
                </section>

                {/* Seção de Defeitos e Observações */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 pb-2 mb-4">Diagnóstico e Observações</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="reported_defect" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Defeito Relatado:</label>
                            <textarea id="reported_defect" name="reported_defect" value={formData.reported_defect} onChange={handleInputChange} rows={3} placeholder="Descrição do problema informado pelo cliente..." className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"></textarea>
                        </div>
                        <div>
                            <label htmlFor="observations" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Observações Técnicas:</label>
                            <textarea id="observations" name="observations" value={formData.observations} onChange={handleInputChange} rows={3} placeholder="Detalhes técnicos, avarias encontradas, etc..." className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"></textarea>
                        </div>
                    </div>
                </section>

                {/* Seção de Itens e Custos */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 pb-2 mb-4">Serviços e Peças</h2>
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">Valor Unit. (R$)</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">Qtd.</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-2 py-1">
                                            <input
                                                type="text"
                                                value={item.descricao}
                                                onChange={(e) => handleItemChange(index, 'descricao', e.target.value)}
                                                className="w-full p-2 bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded-md dark:text-gray-200"
                                            />
                                        </td>
                                        <td className="px-2 py-1">
                                            <input
                                                type="number"
                                                value={item.valor}
                                                onChange={(e) => handleItemChange(index, 'valor', e.target.value)}
                                                className="w-full p-2 bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded-md text-right font-mono dark:text-gray-200"
                                            />
                                        </td>
                                        <td className="px-2 py-1">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                className="w-full p-2 bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded-md text-center font-mono dark:text-gray-200"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-600 hover:text-red-800" title="Remover Item">
                                                Remover
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <td colSpan="3" className="px-6 py-3 text-right text-sm font-bold text-gray-800 dark:text-gray-200 uppercase">Total</td>
                                    <td className="px-6 py-3 text-right text-lg font-bold text-gray-900 dark:text-white font-mono">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div className="mt-4 flex justify-start">
                        <button type="button" onClick={openSearchModal} className="px-4 py-2 border border-dashed border-gray-400 dark:border-gray-500 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                            + Adicionar Item
                        </button>
                    </div>
                </section>

                {/* Seção de Prazos e Garantia */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 pb-2 mb-4">Prazos e Garantia</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="expected_quote_date" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Data do Orçamento:</label>
                            <input type="date" id="expected_quote_date" name="expected_quote_date" value={formData.expected_quote_date} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="expected_delivery_date" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Previsão de Entrega:</label>
                            <input type="date" id="expected_delivery_date" name="expected_delivery_date" value={formData.expected_delivery_date} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="warranty_period" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Garantia:</label>
                            <input type="text" id="warranty_period" name="warranty_period" value={formData.warranty_period} onChange={handleInputChange} placeholder="Ex: 90 dias" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
                        </div>
                    </div>
                </section>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onBackToList} className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">
                        Cancelar
                    </button>
                    <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        {quoteId ? 'Salvar Alterações' : 'Gerar Orçamento'}
                    </button>
                </div>
            </form>
            <ProductSearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onProductSelect={handleProductSelect}
            />
        </>
    );
}

/**
 * Modal para buscar e selecionar produtos/serviços.
 */
const ProductSearchModal = ({ isOpen, onClose, onProductSelect }: { isOpen: boolean, onClose: () => void, onProductSelect: (product: Product) => void }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setError(null); // Limpa erros anteriores ao abrir
            const fetchItems = async () => {
                try {
                    const token = localStorage.getItem('boycell-token');

                    // Busca produtos e serviços em paralelo
                    const [productsResponse, servicesResponse] = await Promise.all([
                        fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } }),
                        fetch('/api/services', { headers: { 'Authorization': `Bearer ${token}` } })
                    ]);

                    if (!productsResponse.ok) {
                        throw new Error(`Falha ao buscar produtos (Status: ${productsResponse.status})`);
                    }
                    if (!servicesResponse.ok) {
                        throw new Error(`Falha ao buscar serviços (Status: ${servicesResponse.status})`);
                    }

                    const productsData = await productsResponse.json();
                    const servicesData = await servicesResponse.json();

                    // Mapeia os produtos para o formato comum, usando 'nome' e 'precoFinal'
                    const mappedProducts = Array.isArray(productsData) ? productsData.map((p: any) => ({
                        id: p.id,
                        name: p.nome, // de 'nome' para 'name'
                        price: p.precoFinal, // de 'precoFinal' para 'price'
                        type: 'produto' as const
                    })) : [];

                    // Mapeia os serviços para o formato comum, usando 'servico' e 'precoFinal'
                    const mappedServices = Array.isArray(servicesData) ? servicesData.map((s: any) => ({
                        id: s.id,
                        name: s.servico, // de 'servico' para 'name'
                        price: s.precoFinal, // de 'precoFinal' para 'price'
                        type: 'serviço' as const
                    })) : [];

                    setProducts([...mappedProducts, ...mappedServices]);

                } catch (err: any) {
                    console.error(err);
                    setError(err.message || 'Ocorreu um erro desconhecido.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchItems();
        }
    }, [isOpen]);

    const filteredProducts = products.filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (product: Product) => {
        onProductSelect(product);
        onClose(); // Fecha o modal após a seleção
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Buscar Produto ou Serviço" size="lg">
            <div className="flex flex-col space-y-4">
                <input
                    type="text"
                    placeholder="Digite para buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    autoFocus
                />
                {isLoading ? (
                    <div className="text-center p-4 dark:text-gray-300">Carregando...</div>
                ) : error ? (
                    <div className="text-center p-4 text-red-500 bg-red-100 dark:bg-red-900/20 rounded-md">{error}</div>
                ) : (
                    <ul className="max-h-96 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredProducts.length > 0 ? filteredProducts.map(product => (
                            <li key={product.id} onClick={() => handleSelect(product)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center">
                                <span className="dark:text-gray-200">{product.name}</span>
                                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </li>
                        )) : (<li className="p-3 text-center text-gray-500 dark:text-gray-400">Nenhum item encontrado.</li>)}
                    </ul>
                )}
            </div>
        </Modal>
    );
};

/**
 * Componente da Lista de Orçamentos
 * Exibe uma tabela com os orçamentos existentes.
 */
const OrcamentoList = ({ quotes, isLoading, onShowForm, onEdit, onDelete, onStatusChange, onConvertToSale, onPrint }: { quotes: Quote[], isLoading: boolean, onShowForm: () => void, onEdit: (id: number) => void, onDelete: (id: number) => void, onStatusChange: (id: number, status: string) => void, onConvertToSale: (id: number) => void, onPrint: (id: number) => void }) => {
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const quotesPerPage = 10; // You can adjust this value

    // 1. Filtra a lista completa de orçamentos com base no termo de busca
    const allFilteredQuotes = useMemo(() => {
        if (!searchTerm) return quotes;

        const lowerSearchTerm = searchTerm.toLowerCase();
        return quotes.filter(quote => (
            (quote.customer_name || '').toLowerCase().includes(lowerSearchTerm) ||
            (quote.quote_number || '').toLowerCase().includes(lowerSearchTerm)
        ));
    }, [searchTerm, quotes]);

    // 2. Aplica paginação à lista já filtrada
    const totalPages = Math.ceil(allFilteredQuotes.length / quotesPerPage);
    const indexOfLastQuote = currentPage * quotesPerPage;
    const indexOfFirstQuote = indexOfLastQuote - quotesPerPage;
    const currentQuotes = allFilteredQuotes.slice(indexOfFirstQuote, indexOfLastQuote);

    // Reseta a página para 1 se a busca resultar em menos páginas que a atual
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [searchTerm, totalPages, currentPage]);

    if (isLoading) {
        return <div className="text-center p-4 dark:text-gray-300">Carregando orçamentos...</div>;
    }

    return (
        <>
            {/* Cabeçalho e Botão de Novo Orçamento */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gerenciar Orçamentos</h1>
                    <p className="text-md text-gray-500 dark:text-gray-400">Visualize, crie e edite os orçamentos.</p>
                </div>
                <button onClick={onShowForm} className="px-6 py-2 w-full sm:w-auto border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    Novo Orçamento
                </button>
            </div>

            {/* Barra de Busca */}
            <div className="relative mb-4">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    placeholder="Buscar por cliente ou nº do orçamento..."
                    className="w-full p-2 pl-10 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Tabela de Orçamentos */}
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nº</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-56">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentQuotes.length > 0 ? currentQuotes.map(quote => (
                            <tr key={quote.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{quote.quote_number}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">{quote.customer_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">
                                    <select
                                        value={quote.status}
                                        onChange={(e) => onStatusChange(quote.id, e.target.value)}
                                        className="p-1 rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    >
                                        <option>Pendente</option>
                                        <option>Aprovado</option>
                                        <option>Rejeitado</option>
                                        <option>Concluído</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">{new Date(quote.created_at).toLocaleDateString('pt-BR')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300 text-right font-mono">{Number(quote.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                    <button onClick={() => onPrint(quote.id)} className="text-cyan-500 hover:text-cyan-700" title="Imprimir Orçamento">
                                        Imprimir
                                    </button>
                                    {quote.status === 'Aprovado' && (
                                        <button onClick={() => onConvertToSale(quote.id)} className="text-green-600 hover:text-green-900" title="Converter em Venda">
                                            Vender
                                        </button>
                                    )}
                                    <button onClick={() => onEdit(quote.id)} className="text-indigo-600 hover:text-indigo-900" title="Editar">
                                        Ver / Editar
                                    </button>
                                    <button onClick={() => onDelete(quote.id)} className="text-red-600 hover:text-red-900" title="Deletar">
                                        Deletar
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">Nenhum orçamento encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 space-x-4">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Próximo
                    </button>
                </div>
            )}
        </>
    );
}

/**
 * Componente Principal da Página de Orçamento
 * Controla a visualização entre a lista e o formulário.
 */
export function Orcamento({ currentUser, onLogout }: OrcamentoProps) {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingQuoteId, setEditingQuoteId] = useState<number | null>(null);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [printingQuote, setPrintingQuote] = useState<any | null>(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const navigate = useNavigate();
    const { setQuoteToConvert } = useEstoqueContext();

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            localStorage.removeItem('boycell-token');
            navigate('/login');
        }
    };

    const fetchQuotes = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch('/api/quotes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar orçamentos');
            const data = await response.json();
            setQuotes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Busca os orçamentos quando a view de lista é exibida
    useEffect(() => {
        if (view === 'list') {
            fetchQuotes();
        }
    }, [view]);

    const handleDeleteQuote = async (quoteId: number) => {
        if (window.confirm('Tem certeza que deseja deletar este orçamento? Esta ação não pode ser desfeita.')) {
            try {
                const token = localStorage.getItem('boycell-token');
                const response = await fetch(`/api/quotes/${quoteId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao deletar orçamento');
                // Remove o orçamento da lista localmente para atualizar a UI instantaneamente
                setQuotes(prevQuotes => prevQuotes.filter(quote => quote.id !== quoteId));
            } catch (error) {
                console.error(error);
                // TODO: Adicionar notificação de erro para o usuário
            }
        }
    };

    const handleStatusChange = async (quoteId: number, newStatus: string) => {
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`/api/quotes/${quoteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) throw new Error('Falha ao atualizar status');

            // Atualiza o estado local para refletir a mudança imediatamente
            setQuotes(prevQuotes =>
                prevQuotes.map(q =>
                    q.id === quoteId ? { ...q, status: newStatus as Quote['status'] } : q
                )
            );
        } catch (error) {
            console.error(error);
        }
    };

    const handlePrintQuote = async (quoteId: number) => {
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`/api/quotes/${quoteId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar dados do orçamento para impressão.');
            const quoteData = await response.json();
            setPrintingQuote(quoteData);
            setIsPrintModalOpen(true);
        } catch (error) {
            console.error(error);
            // TODO: Adicionar notificação de erro
        }
    };

    const triggerPrint = () => {
        const handleAfterPrint = () => {
            document.body.classList.remove('print-mode-recibo');
            window.removeEventListener('afterprint', handleAfterPrint);
        };
        window.addEventListener('afterprint', handleAfterPrint);

        document.body.classList.add('print-mode-recibo');
        window.print();
    };

    const handleConvertToSale = async (quoteId: number) => {
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await fetch(`/api/quotes/${quoteId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar detalhes do orçamento para conversão.');
            const quoteData = await response.json();

            // Armazena os dados do orçamento no contexto para a página de vendas usar
            setQuoteToConvert(quoteData);

            // Navega para a página de vendas
            navigate('/vendas');
        } catch (error) {
            console.error(error);
        }
    };

    // Função para lidar com o clique no botão de editar
    const handleEditClick = (quoteId: number) => {
        setEditingQuoteId(quoteId);
        setView('form');
    };

    const handleBackToList = () => {
        setEditingQuoteId(null); // Limpa o ID de edição
        setView('list');
    };

    return (
        <div className="max-w-7xl mx-auto my-8 p-6 md:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <nav className="flex flex-wrap justify-end items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/estoque')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                    Gerenciar Estoque
                </button>
                <button
                    onClick={() => navigate('/vendas')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                    Vendas
                </button>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                    Sair
                </button>
            </nav>
            <header className="text-center pb-4 mb-8 border-b-2 border-gray-200 dark:border-gray-700">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Módulo de Orçamentos</h1>
                <p className="text-md text-gray-500 dark:text-gray-400">BOY CELL - Assistência Técnica</p>
            </header>
            {view === 'list' ? (
                <OrcamentoList
                    quotes={quotes}
                    isLoading={isLoading}
                    onShowForm={() => setView('form')}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteQuote}
                    onStatusChange={handleStatusChange}
                    onPrint={handlePrintQuote}
                    onConvertToSale={handleConvertToSale}
                />
            ) : (
                <OrcamentoForm onBackToList={handleBackToList} currentUser={currentUser} quoteId={editingQuoteId} />
            )}

            <div id="recibo-orcamento-printable-area" className="hidden">
                <ReciboOrcamento quoteDetails={printingQuote} />
            </div>

            <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} size="lg">
                {printingQuote && (
                    <>
                        <h2 className="text-2xl font-bold text-center text-cyan-500 dark:text-cyan-400 mb-4">Pré-visualização do Orçamento</h2>
                        <div className="bg-white rounded-lg overflow-y-auto max-h-[60vh]">
                            <ReciboOrcamento quoteDetails={printingQuote} />
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={triggerPrint} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors">
                                Imprimir / Salvar PDF
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}