import React from 'react';

const ReciboVenda = ({ saleDetails }) => {
    if (!saleDetails) return null;

    // Defensive destructuring to prevent errors if some properties are missing
    const { 
        items = [], 
        subtotal = 0, 
        discountPercentage = 0, 
        discountValue = 0, 
        total = 0, 
        date, 
        customer, 
        paymentMethod, 
        customerCpf, 
        customerPhone, 
        customerEmail, 
        receiptCode } = saleDetails;

    return (
        <div className="p-8 bg-white text-black font-mono text-xs">
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold">Boycell</h1>
                <p className="text-sm">Comprovante de Venda</p>
                {receiptCode && <p className="text-xs font-semibold">Cód: {receiptCode}</p>}
                <p className="text-xs italic">Este documento não é fiscal.</p>
            </div>
            <div className="mb-4">
                <p>Data: {date ? new Date(date).toLocaleString('pt-BR') : 'N/A'}</p>
                {customer && <p>Cliente: {customer}</p>}
                {customerCpf && <p>CPF/CNPJ: {customerCpf}</p>}
                {customerPhone && <p>Telefone: {customerPhone}</p>}
                {customerEmail && <p>Email: {customerEmail}</p>}
                {paymentMethod && <p>Pagamento: {paymentMethod}</p>}
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
                    {items.map(item => {
                        const dataGarantia = date ? new Date(date) : new Date();
                        if (item.tempoDeGarantia && item.tempoDeGarantia > 0) {
                            dataGarantia.setDate(dataGarantia.getDate() + item.tempoDeGarantia);
                        }
                        return (
                            <tr key={`${item.type}-${item.id}`} className="border-b border-dashed border-gray-400">
                                <td className="p-1 w-1/2">
                                    {item.nome || item.servico}
                                    {item.tempoDeGarantia > 0 && (
                                        <span className="block text-gray-600 text-[10px] italic">
                                            Garantia até: {dataGarantia.toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                </td>
                                <td className="text-center p-1">{item.quantity || 1}</td>
                                <td className="text-right p-1">{(item.precoFinal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="text-right p-1">{((item.precoFinal || 0) * (item.quantity || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="flex justify-end mt-6">
                <div className="w-1/2 space-y-1">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{(subtotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    {discountValue > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span>Desconto ({discountPercentage}%):</span>
                            <span>-{(discountValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-sm border-t-2 border-black pt-2 mt-1">
                        <span>TOTAL:</span>
                        <span>{(total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>
            </div>
            <div className="text-center mt-10 text-xs">
                <p>Obrigado pela sua preferência!</p>
            </div>
        </div>
    );
};

export default ReciboVenda;