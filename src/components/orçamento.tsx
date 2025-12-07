import React from 'react';

export function Orcamento() {
    // Valores de exemplo - no futuro, eles virão do estado do componente
    const servicos = [
        { descricao: 'Troca de Tela Frontal', valor: 450.00 },
        { descricao: 'Mão de Obra', valor: 100.00 },
    ];

    const total = servicos.reduce((acc, servico) => acc + servico.valor, 0);

    return (
        <div className="max-w-4xl mx-auto my-8 p-8 bg-white rounded-lg shadow-lg">
            <header className="text-center pb-4 mb-8 border-b-2 border-gray-100">
                <h1 className="text-3xl font-bold text-gray-800">Orçamento de Reparo</h1>
                <p className="text-md text-gray-500">BOY CELL - Assistência Técnica</p>
            </header>

            <form className="space-y-8">
                {/* Seção de Informações do Cliente */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Informações do Cliente</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-600 mb-1">Nome:</label>
                            <input type="text" id="clientName" name="clientName" placeholder="Nome completo do cliente" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-600 mb-1">Telefone:</label>
                            <input type="tel" id="clientPhone" name="clientPhone" placeholder="(XX) XXXXX-XXXX" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                </section>

                {/* Seção de Informações do Aparelho */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Informações do Aparelho</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="deviceBrand" className="block text-sm font-medium text-gray-600 mb-1">Marca:</label>
                            <input type="text" id="deviceBrand" name="deviceBrand" placeholder="Ex: Apple" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="deviceModel" className="block text-sm font-medium text-gray-600 mb-1">Modelo:</label>
                            <input type="text" id="deviceModel" name="deviceModel" placeholder="Ex: iPhone 13" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="deviceImei" className="block text-sm font-medium text-gray-600 mb-1">IMEI/Nº de Série:</label>
                            <input type="text" id="deviceImei" name="deviceImei" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                </section>

                {/* Seção do Problema */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Defeito Relatado</h2>
                    <div>
                        <textarea id="problemDescription" name="problemDescription" rows={4} placeholder="Descreva o problema do aparelho..." className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                    </div>
                </section>

                {/* Seção de Serviços e Custos */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Serviços e Peças</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor (R$)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {servicos.map((servico, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{servico.descricao}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-right font-mono">{servico.valor.toFixed(2).replace('.', ',')}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-800 uppercase">Total</td>
                                    <td className="px-6 py-3 text-right text-lg font-bold text-gray-900 font-mono">{total.toFixed(2).replace('.', ',')}</td>
                                </tr>
                            </tfoot>
                        </table>
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