import React from 'react';

const ReciboOrcamento = ({ quoteDetails }) => {
    if (!quoteDetails) return null;

    const {
        quote_number,
        customer_name,
        customer_cpf,
        customer_phone,
        device_brand_model,
        device_serial_number,
        reported_defect,
        observations,
        items,
        total,
        created_at
    } = quoteDetails;

    return (
        <div className="p-8 bg-white text-black font-mono text-xs">
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold">Boycell</h1>
                <p className="text-sm">Orçamento de Serviço</p>
                {quote_number && <p className="text-xs font-semibold">Nº: {quote_number}</p>}
                <p className="text-xs italic">Este documento não é fiscal. Orçamento válido por 7 dias.</p>
            </div>
            <div className="mb-4">
                <p>Data: {new Date(created_at).toLocaleString('pt-BR')}</p>
                {customer_name && <p>Cliente: {customer_name}</p>}
                {customer_cpf && <p>CPF/CNPJ: {customer_cpf}</p>}
                {customer_phone && <p>Telefone: {customer_phone}</p>}
            </div>
            <div className="mb-4 border-t border-dashed border-black pt-2">
                <h2 className="font-bold mb-1">Aparelho</h2>
                <p>Dispositivo: {device_brand_model}</p>
                <p>Nº de Série/IMEI: {device_serial_number}</p>
            </div>
            <div className="mb-4 border-t border-dashed border-black pt-2">
                <h2 className="font-bold mb-1">Diagnóstico</h2>
                <p><strong>Defeito Relatado:</strong> {reported_defect}</p>
                {observations && <p><strong>Observações Técnicas:</strong> {observations}</p>}
            </div>
            <table className="w-full mb-4">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="text-left p-1">Item / Serviço</th>
                        <th className="text-center p-1">Qtd</th>
                        <th className="text-right p-1">Vlr. Unit.</th>
                        <th className="text-right p-1">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index} className="border-b border-dashed border-gray-400">
                            <td className="p-1 w-1/2 text-left">{item.descricao}</td>
                            <td className="text-center p-1">{item.quantity}</td>
                            <td className="text-right p-1">{item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="text-right p-1">{(item.valor * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex justify-end mt-6">
                <div className="w-1/2 space-y-1">
                    <div className="flex justify-between font-bold text-sm border-t-2 border-black pt-2 mt-1">
                        <span>TOTAL DO ORÇAMENTO:</span>
                        <span>{Number(total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>
            </div>
            <div className="text-center mt-10 text-xs">
                <p>Obrigado pela sua preferência!</p>
            </div>
        </div>
    );
};

export default ReciboOrcamento;