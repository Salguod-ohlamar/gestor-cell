import React from 'react';
import './OrcamentoPrintable.css';

const OrcamentoPrintable = React.forwardRef(({ data }, ref) => {
    const {
        quoteNumber,
        customerName,
        customerCpf,
        customerPhone,
        customerEmail,
        deviceBrandModel,
        deviceSerialNumber,
        reportedDefect,
        observations,
        issues,
        quoteItems,
        total,
        expectedQuoteDate,
        expectedDeliveryDate,
        warrantyPeriod
    } = data;

    const formatDate = (dateString) => {
        if (!dateString) return '___/___/______';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    return (
        <div ref={ref} className="print-container">
            <header className="print-header">
                <h1 className="print-brand-text">Boycell</h1>
                <div className="print-quote-info">
                    <h2>Orçamento de Serviço</h2>
                    <p>Número: <strong>{quoteNumber}</strong></p>
                    <p>Data: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
            </header>

            <section className="print-section">
                <h3>Dados do Cliente</h3>
                <p><strong>Nome:</strong> {customerName || 'Não informado'}</p>
                <p><strong>CPF/CNPJ:</strong> {customerCpf || 'Não informado'}</p>
                <p><strong>Telefone:</strong> {customerPhone || 'Não informado'}</p>
            </section>

            <section className="print-section">
                <h3>Dados do Aparelho</h3>
                <p><strong>Marca/Modelo:</strong> {deviceBrandModel || 'Não informado'}</p>
                <p><strong>Nº de Série:</strong> {deviceSerialNumber || 'Não informado'}</p>
            </section>

            <section className="print-section">
                <h3>Defeito Reclamado e Observações</h3>
                <p><strong>Defeito:</strong> {reportedDefect || 'Nenhum defeito relatado.'}</p>
                <p><strong>Observações:</strong> {observations || 'Nenhuma observação.'}</p>
                {issues && issues.length > 0 && (
                    <>
                        <p className="mt-2"><strong>Condições Adicionais:</strong></p>
                        <ul className="print-issues-list">
                            {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                        </ul>
                    </>
                )}
            </section>

            <section className="print-section">
                <h3>Itens do Orçamento</h3>
                <table className="print-items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th className="text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quoteItems && quoteItems.length > 0 ? (
                            quoteItems.map(item => (
                                <tr key={item.quoteItemId}>
                                    <td>{item.nome || item.servico}</td>
                                    <td className="text-right">{item.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="2">Nenhum item no orçamento.</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td className="font-bold">Total</td>
                            <td className="font-bold text-right total-amount">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        </tr>
                    </tfoot>
                </table>
            </section>

            <section className="print-section">
                <h3>Prazos e Garantia</h3>
                <p><strong>Data Prevista p/ Orçamento:</strong> {formatDate(expectedQuoteDate)}</p>
                <p><strong>Data Prevista p/ Entrega:</strong> {formatDate(expectedDeliveryDate)}</p>
                <p><strong>Garantia:</strong> {warrantyPeriod || 'Não informada'}</p>
            </section>

            <section className="print-section termo-responsabilidade-print">
                <h4>TERMO DE RESPONSABILIDADE</h4>
                <p>"Assumo total responsabilidade da propriedade do aparelho acima citado, isentando a assistência técnica de qualquer eventual dano, perda ou acontecimento no mesmo. Estou ciente de que serviços de reset e atualização implica na perda de dados pessoais, fotos ou qualquer conteúdo no aparelho. A assistência técnica em placa lógica (conectores, botões, componentes, ou qualquer tipo de serviços em aparelho) fica a cargo dos componentes, e faço a lógica para aplicar na morte súbita do aparelho e inutilizando. A garantia dos serviços é aplicada para: Problemas elétricos, oxidação, sobrecargas elétrica, exposição do aparelho a algo mal, água, queda, arranhões, display trincado, software, exclusão de aplicativos maliciosos, alterações no sistema operacional, abertura ou tentativas de conserto de terceiros não autorizados pela assistência técnica, bem como a violação do selo lacre de garantia. Me comprometo a realizar a retirada do aparelho em até 90 (noventa) dias, salientando que passado este prazo será cobrado um acréscimo de 10% ao mês ou proporcional ao período. Ao fim do prazo de 90 (noventa) dias o aparelho será vendido para cobrir custos."</p>
            </section>

            <footer className="print-footer">
                <div className="signature-line">
                    <p>Assinatura do Cliente</p>
                </div>
                <p className="footer-brand">Relatório gerado por GestorCell</p>
            </footer>
        </div>
    );
});

export default OrcamentoPrintable;