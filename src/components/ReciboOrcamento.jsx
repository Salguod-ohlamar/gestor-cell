import React from 'react';

const ReciboOrcamento = ({ orcamentoDetails }) => {
    if (!orcamentoDetails) return null;

    const { items, subtotal, total, date, customer, customerPhone, customerEmail, validade, orcamentoCode } = orcamentoDetails;

    return (
        <div className="p-8 bg-white text-black font-mono text-xs">
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold">Boycell</h1>
                <p className="text-sm font-semibold">ORÇAMENTO</p>
                {orcamentoCode && <p className="text-xs font-semibold">Cód: {orcamentoCode}</p>}
            </div>
            <div className="mb-4">
                <p>Data: {new Date(date).toLocaleString('pt-BR')}</p>
                {customer && <p>Cliente: {customer}</p>}
                {customerPhone && <p>Telefone: {customerPhone}</p>}
                {customerEmail && <p>Email: {customerEmail}</p>}
            </div>
            <table className="w-full mb-4">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="text-left p-1">Item</th>
                        <th className="text-center p-1">Qtd</th>
                        <th className="text-right p-1">Vlr. Unit.</th>
                        <th className="text-right p-1">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={`${item.type}-${item.id}`} className="border-b border-dashed border-gray-400">
                            <td className="p-1 w-1/2 text-left">
                                {item.nome || item.servico}
                                {item.tempoDeGarantia > 0 && (
                                    <span className="block text-gray-600 text-[10px] italic">
                                        Garantia do serviço/peça: {item.tempoDeGarantia} dias
                                    </span>
                                )}
                            </td>
                            <td className="text-center p-1">{item.quantity}</td>
                            <td className="text-right p-1">{item.precoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="text-right p-1">{(item.precoFinal * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex justify-end mt-6">
                <div className="w-1/2 space-y-1">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm border-t-2 border-black pt-2 mt-1">
                        <span>TOTAL:</span>
                        <span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>
            </div>
            <div className="text-center mt-10 text-xs">
                <p className="font-bold">Este orçamento é válido por {validade} dias.</p>
                <p>Os valores podem sofrer alteração após o período de validade.</p>
                <p className="mt-4">Obrigado pela sua preferência!</p>
            </div>
        </div>
    );
};

export default ReciboOrcamento;