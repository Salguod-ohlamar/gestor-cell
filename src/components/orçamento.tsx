import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';

// Tipagem para os itens do orçamento (peças e serviços)
interface Item {
    descricao: string;
    valor: number;
}

export function Orcamento() {
    // Estado para os dados do formulário
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_cpf: '',
        customer_phone: '',
        customer_email: '',
        deviceBrand: '',
        deviceModel: '',
        device_serial_number: '',
        reported_defect: '',
        observations: '',
        expected_quote_date: '',
        expected_delivery_date: '',
        warranty_period: '',
    });

    // Estado para a lista de itens (serviços e peças)
    const [items, setItems] = useState<Item[]>([
        { descricao: 'Troca de Tela Frontal', valor: 450.00 },
        { descricao: 'Mão de Obra', valor: 100.00 },
    ]);

    // Estado para o valor total
    const [total, setTotal] = useState(0);

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

    // Função para adicionar um novo item à lista
    const addItem = () => {
        setItems([...items, { descricao: '', valor: 0 }]);
    };

    // Função para submeter o formulário
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // Monta o objeto final para ser enviado à API
        const orcamentoCompleto = {
            ...formData,
            device_brand_model: `${formData.deviceBrand} ${formData.deviceModel}`.trim(), // Combina marca e modelo
            items: items, // A lista de serviços/peças
            total: total,
            // user_id: // Pegar do contexto de autenticação
        };
        // Remove os campos separados de marca e modelo que não existem na tabela
        delete (orcamentoCompleto as any).deviceBrand;
        delete (orcamentoCompleto as any).deviceModel;

        console.log('Dados do Orçamento:', orcamentoCompleto);
        // Aqui você chamaria a função para enviar os dados para a API
    };

    return (
        <div className="max-w-4xl mx-auto my-8 p-8 bg-white rounded-lg shadow-lg">
            <header className="text-center pb-4 mb-8 border-b-2 border-gray-100">
                <h1 className="text-3xl font-bold text-gray-800">Orçamento de Reparo</h1>
                <p className="text-md text-gray-500">BOY CELL - Assistência Técnica</p>
            </header>

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
                        <button type="button" onClick={addItem} className="px-4 py-2 border border-dashed border-gray-400 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">
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
                    <button type="button" onClick={() => window.print()} className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                        Imprimir
                    </button>
                    <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        Gerar Orçamento
                    </button>
                </div>
            </form>
        </div>
    );
}