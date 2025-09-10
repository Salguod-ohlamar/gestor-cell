import React from 'react';

const RelatorioVendasMensal = ({ reportData }) => {
    if (!reportData) return null;

    const { sales, month, totalVendido, totalVendas } = reportData;

    return (
        <div className="p-8 bg-white text-black font-sans">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">Relatório de Vendas Mensal</h1>
                <h2 className="text-xl">{month.charAt(0).toUpperCase() + month.slice(1)}</h2>
            </div>

            <table className="w-full text-left text-sm mb-8">
                <thead className="border-b-2 border-black">
                    <tr>
                        <th className="p-2 font-bold">Data</th>
                        <th className="p-2 font-bold">Cód. Venda</th>
                        <th className="p-2 font-bold">Cliente</th>
                        <th className="p-2 font-bold">Vendedor</th>
                        <th className="p-2 font-bold text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(sale => (
                        <React.Fragment key={sale.id}>
                            <tr className="border-b border-gray-400 bg-gray-100">
                                <td className="p-2">{new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                                <td className="p-2 font-mono">{sale.receiptCode}</td>
                                <td className="p-2">{sale.customer}</td>
                                <td className="p-2">{sale.vendedor}</td>
                                <td className="p-2 text-right font-semibold">{sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            </tr>
                            <tr className="border-b-2 border-black">
                                <td colSpan="5" className="p-2 pl-8 text-xs">
                                    <strong className="text-xs">Itens:</strong>
                                    <ul className="list-disc list-inside ml-2">
                                        {sale.items.map(item => (
                                            <li key={`${sale.id}-${item.type}-${item.id}`}>
                                                {item.nome || item.servico} (x{item.quantity}) - {item.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                            </tr>
                        </React.Fragment>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end">
                <div className="w-1/2 space-y-2 text-base">
                    <div className="flex justify-between font-bold">
                        <span>Total de Vendas no Mês:</span>
                        <span>{totalVendas}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t-2 border-black pt-2 mt-2">
                        <span>Valor Total Vendido:</span>
                        <span>{totalVendido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>
            </div>
             <div className="text-center mt-12 text-xs">
                <p>Relatório gerado em: {new Date().toLocaleString('pt-BR')}</p>
                <p>Boycell</p>
            </div>
        </div>
    );
};

export default RelatorioVendasMensal;