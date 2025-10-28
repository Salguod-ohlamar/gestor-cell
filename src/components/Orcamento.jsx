import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';
import { FaTrash, FaPrint, FaShareAlt, FaSearch } from 'react-icons/fa';
import './Orcamento.css';

function Orcamento() {
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [quoteItems, setQuoteItems] = useState([]);

    // Customer details
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerAddressNumber, setCustomerAddressNumber] = useState('');
    const [customerNeighborhood, setCustomerNeighborhood] = useState('');
    const [customerCity, setCustomerCity] = useState('');
    const [customerContact, setCustomerContact] = useState('');

    // Device details
    const [deviceBrandModel, setDeviceBrandModel] = useState('');
    const [deviceSerialNumber, setDeviceSerialNumber] = useState('');
    const [reportedDefect, setReportedDefect] = useState('');
    const [observations, setObservations] = useState('');

    // Checkbox states for device issues
    const [issueNaoLiga, setIssueNaoLiga] = useState(false);
    const [issueEmLoop, setIssueEmLoop] = useState(false);
    const [issueSemNF, setIssueSemNF] = useState(false);
    const [issueTelaQuebrada, setIssueTelaQuebrada] = useState(false);
    const [issueSemChip, setIssueSemChip] = useState(false);
    const [issueSemAudio, setIssueSemAudio] = useState(false);
    const [issueTouchNaoFunciona, setIssueTouchNaoFunciona] = useState(false);
    const [issueMicrofoneComDefeito, setIssueMicrofoneComDefeito] = useState(false);
    const [issueEntFoneComDefeito, setIssueEntFoneComDefeito] = useState(false);
    const [issueSemBotao, setIssueSemBotao] = useState(false);
    const [issueNaoCarrega, setIssueNaoCarrega] = useState(false);
    const [issueSemTampa, setIssueSemTampa] = useState(false);
    const [issueBateriaInchada, setIssueBateriaInchada] = useState(false);
    const [issueCameraQuebrada, setIssueCameraQuebrada] = useState(false);

    // Dates and Warranty
    const [expectedQuoteDate, setExpectedQuoteDate] = useState('');
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
    const [warrantyPeriod, setWarrantyPeriod] = useState('');

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

                </div>
            </header>

            {/* Customer Details Section */}
            <div className="section-card">
                <h2>Dados do Cliente</h2>
                <div className="form-group">
                    <label htmlFor="customerName">Nome:</label>
                    <input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="form-row">
                    <div className="form-group flex-grow">
                        <label htmlFor="customerAddress">Endereço:</label>
                        <input type="text" id="customerAddress" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Rua, Avenida, etc." />
                    </div>
                    <div className="form-group w-24">
                        <label htmlFor="customerAddressNumber">Nº:</label>
                        <input type="text" id="customerAddressNumber" value={customerAddressNumber} onChange={(e) => setCustomerAddressNumber(e.target.value)} placeholder="Nº" />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group flex-grow">
                        <label htmlFor="customerNeighborhood">Bairro:</label>
                        <input type="text" id="customerNeighborhood" value={customerNeighborhood} onChange={(e) => setCustomerNeighborhood(e.target.value)} placeholder="Bairro" />
                    </div>
                    <div className="form-group flex-grow">
                        <label htmlFor="customerCity">Cidade:</label>
                        <input type="text" id="customerCity" value={customerCity} onChange={(e) => setCustomerCity(e.target.value)} placeholder="Cidade" />
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="customerContact">Contato (Telefone):</label>
                    <input type="text" id="customerContact" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder="(XX) XXXXX-XXXX" />
                </div>
            </div>

            {/* Device Details Section */}
            <div className="section-card">
                <h2>Dados do Aparelho</h2>
                <div className="form-group">
                    <label htmlFor="deviceBrandModel">Marca/Modelo:</label>
                    <input type="text" id="deviceBrandModel" value={deviceBrandModel} onChange={(e) => setDeviceBrandModel(e.target.value)} placeholder="Ex: Samsung Galaxy S21" />
                </div>
                <div className="form-group">
                    <label htmlFor="deviceSerialNumber">Nº Série:</label>
                    <input type="text" id="deviceSerialNumber" value={deviceSerialNumber} onChange={(e) => setDeviceSerialNumber(e.target.value)} placeholder="Número de série do aparelho" />
                </div>

                <h3>Defeitos e Condições (Marque o que se aplica)</h3>
                <div className="checkbox-group">
                    <label><input type="checkbox" checked={issueNaoLiga} onChange={(e) => setIssueNaoLiga(e.target.checked)} /> Não liga</label>
                    <label><input type="checkbox" checked={issueEmLoop} onChange={(e) => setIssueEmLoop(e.target.checked)} /> Em loop</label>
                    <label><input type="checkbox" checked={issueSemNF} onChange={(e) => setIssueSemNF(e.target.checked)} /> Sem NF</label>
                    <label><input type="checkbox" checked={issueTelaQuebrada} onChange={(e) => setIssueTelaQuebrada(e.target.checked)} /> Tela quebrada</label>
                    <label><input type="checkbox" checked={issueSemChip} onChange={(e) => setIssueSemChip(e.target.checked)} /> Sem Chip</label>
                    <label><input type="checkbox" checked={issueSemAudio} onChange={(e) => setIssueSemAudio(e.target.checked)} /> Sem áudio</label>
                    <label><input type="checkbox" checked={issueTouchNaoFunciona} onChange={(e) => setIssueTouchNaoFunciona(e.target.checked)} /> Touch não funciona</label>
                    <label><input type="checkbox" checked={issueMicrofoneComDefeito} onChange={(e) => setIssueMicrofoneComDefeito(e.target.checked)} /> Microfone com defeito</label>
                    <label><input type="checkbox" checked={issueEntFoneComDefeito} onChange={(e) => setIssueEntFoneComDefeito(e.target.checked)} /> Entrada fone com defeito</label>
                    <label><input type="checkbox" checked={issueSemBotao} onChange={(e) => setIssueSemBotao(e.target.checked)} /> Sem botão</label>
                    <label><input type="checkbox" checked={issueNaoCarrega} onChange={(e) => setIssueNaoCarrega(e.target.checked)} /> Não carrega</label>
                    <label><input type="checkbox" checked={issueSemTampa} onChange={(e) => setIssueSemTampa(e.target.checked)} /> Sem tampa</label>
                    <label><input type="checkbox" checked={issueBateriaInchada} onChange={(e) => setIssueBateriaInchada(e.target.checked)} /> Bateria inchada</label>
                    <label><input type="checkbox" checked={issueCameraQuebrada} onChange={(e) => setIssueCameraQuebrada(e.target.checked)} /> Câmera quebrada</label>
                </div>

                <div className="form-group">
                    <label htmlFor="reportedDefect">Defeito Reclamado:</label>
                    <textarea id="reportedDefect" value={reportedDefect} onChange={(e) => setReportedDefect(e.target.value)} placeholder="Descreva o defeito relatado pelo cliente" rows="3"></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="observations">Observações:</label>
                    <textarea id="observations" value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Observações adicionais sobre o aparelho ou serviço" rows="3"></textarea>
                </div>
            </div>

            {/* Search Section */}
            {/* This section remains as is, allowing to add products/services to the quote */}

            <div className="search-section">
                <div className="search-input-wrapper">
                )}
            </div>

            <div className="quote-items-section section-card">
                <h2>Itens do Orçamento</h2>
                {quoteItems.length === 0 ? (
                    <p className="empty-quote">Nenhum item adicionado ao orçamento.</p>
                )}
            </div>

            {/* Dates and Warranty Section */}
            <div className="section-card">
                <h2>Prazos e Garantia</h2>
                <div className="form-row">
                    <div className="form-group flex-grow">
                        <label htmlFor="expectedQuoteDate">Data Prevista para Orçamento:</label>
                        <input type="date" id="expectedQuoteDate" value={expectedQuoteDate} onChange={(e) => setExpectedQuoteDate(e.target.value)} />
                    </div>
                    <div className="form-group flex-grow">
                        <label htmlFor="expectedDeliveryDate">Data Prevista para Entrega:</label>
                        <input type="date" id="expectedDeliveryDate" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="warrantyPeriod">Garantia:</label>
                    <input type="text" id="warrantyPeriod" value={warrantyPeriod} onChange={(e) => setWarrantyPeriod(e.target.value)} placeholder="Ex: 90 dias, 3 meses, etc." />
                </div>
            </div>

            <footer className="orcamento-footer">
                <div className="total-section">
                    <h2>Total do Orçamento:</h2>
                    <span className="total-amount">R$ {total.toFixed(2)}</span>
                </div>
            </footer>

            {/* Termo de Responsabilidade */}
            <div className="section-card termo-responsabilidade">
                <h2>TERMO DE RESPONSABILIDADE</h2>
                <p>"Assumo total responsabilidade da propriedade do aparelho acima citado, isentando a assistência técnica de qualquer eventual dano, perda ou acontecimento no mesmo. Estou ciente de que serviços de reset e atualização implica na perda de dados pessoais, fotos ou qualquer conteúdo no aparelho. A assistência técnica em placa lógica (conectores, botões, componentes, ou qualquer tipo de serviços em aparelho) fica a cargo dos componentes, e faço a lógica para aplicar na morte súbita do aparelho e inutilizando. A garantia dos serviços é aplicada para: Problemas elétricos, oxidação, sobrecargas elétrica, exposição do aparelho a algo mal, água, queda, arranhões, display trincado, software, exclusão de aplicativos maliciosos, alterações no sistema operacional, abertura ou tentativas de conserto de terceiros não autorizados pela assistência técnica, bem como a violação do selo lacre de garantia. Me comprometo a realizar a retirada do aparelho em até 90 (noventa) dias, salientando que passado este prazo será cobrado um acréscimo de 10% ao mês ou proporcional ao período. Ao fim do prazo de 90 (noventa) dias o aparelho será vendido para cobrir custos."</p>
            </div>
        </div>
    );
}
