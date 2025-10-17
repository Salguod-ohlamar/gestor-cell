import React from 'react';

const DreReport = ({ reportData }) => {
    if (!reportData) {
        return <p className="text-center text-gray-500 py-10">Selecione um período e gere o relatório para visualizar os dados.</p>;
    }

    const {
        period, receitaBruta, deducoes, receitaLiquida,
        custoVendas, lucroBruto
    } = reportData;

    const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const ItemRow = ({ label, value, isSub, isTotal, isFinal }) => (
        <div className={`flex justify-between py-2 border-b border-gray-200 ${isTotal ? 'font-bold text-lg' : ''} ${isFinal ? 'text-xl' : ''}`}>
            <span className={`${isSub ? 'pl-4 text-gray-700' : 'font-semibold'}`}>{label}</span>
            <span className={`${value < 0 ? 'text-red-600' : ''} ${isFinal && value >= 0 ? 'text-green-600' : ''}`}>
                {isSub ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
            </span>
        </div>
    );

    return (
        <div id="dre-printable-area" className="p-8 bg-white text-black font-sans">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">Demonstrativo de Resultado (DRE Simplificado)</h1>
                <h2 className="text-lg">
                    Período: {new Date(period.start + 'T00:00:00').toLocaleDateString('pt-BR')} a {new Date(period.end + 'T23:59:59').toLocaleDateString('pt-BR')}
                </h2>
            </div>

            <div className="max-w-2xl mx-auto space-y-1 text-base">
                <ItemRow label="Receita Bruta de Vendas" value={receitaBruta} />
                <ItemRow label="(-) Deduções (Descontos)" value={deducoes} isSub />
                <ItemRow label="(=) Receita Líquida" value={receitaLiquida} isTotal />
                <ItemRow label="(-) Custo das Vendas (CMV)" value={custoVendas} isSub />
                <ItemRow label="(=) Lucro Bruto" value={lucroBruto} isTotal isFinal />
            </div>

            <div className="text-center mt-10 text-xs text-gray-500">
                <p><strong>Nota:</strong> Este é um relatório simplificado e não inclui despesas operacionais como aluguel, salários, etc.</p>
                <p>Relatório gerado em: {new Date().toLocaleString('pt-BR')}</p>
                <p>Relatorio gerado por GestorCell</p>
            </div>
        </div>
    );
};

export default DreReport;