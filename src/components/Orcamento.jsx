import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactToPrint from 'react-to-print';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';
import { Trash, Search, Printer, Save, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import toast from 'react-hot-toast';
import OrcamentoPrintable from './OrcamentoPrintable.jsx';
import './OrcamentoPrintable.css';
import { useNavigate } from 'react-router-dom';

function Orcamento() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [quoteItems, setQuoteItems] = useState([]);
    const [quoteNumber, setQuoteNumber] = useState('');

    // Customer details
    const [customerName, setCustomerName] = useState('');
    const [customerCpf, setCustomerCpf] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');

    const printableComponentRef = useRef();
    const navigate = useNavigate();

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

    useEffect(() => {
        const generateQuoteNumber = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
            return `ORC-${year}${month}${day}-${randomPart}`;
        };
        setQuoteNumber(generateQuoteNumber());
    }, []); // Executa apenas uma vez ao montar o componente

    useEffect(() => {
        const searchItems = async () => {
            if (debouncedSearchTerm.length < 2) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            try {
                const [productsRes, servicesRes] = await Promise.all([
                    api.get(`/api/products/search?q=${debouncedSearchTerm}`),
                    api.get(`/api/services/search?q=${debouncedSearchTerm}`)
                ]);

                const products = productsRes.data.map(p => ({ ...p, type: 'produto' }));
                const services = servicesRes.data.map(s => ({ ...s, type: 'servico' }));

                setSearchResults([...products, ...services]);
            } catch (error) {
                console.error("Erro ao buscar itens:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        searchItems();
    }, [debouncedSearchTerm]);

    const handleAddItemToQuote = (item) => {
        setQuoteItems(prevItems => [...prevItems, { ...item, quoteItemId: Date.now() }]); // Add unique ID for list key
        setSearchTerm('');
        setSearchResults([]);
    };

    const handleRemoveItemFromQuote = (quoteItemId) => {
        setQuoteItems(prevItems => prevItems.filter(item => item.quoteItemId !== quoteItemId));
    };

    const total = useMemo(() => {
        return quoteItems.reduce((acc, item) => acc + (item.precoFinal || 0), 0);
    }, [quoteItems]);

    const getSelectedIssues = () => {
        const issues = [];
        if (issueNaoLiga) issues.push("Não liga");
        if (issueEmLoop) issues.push("Em loop");
        if (issueSemNF) issues.push("Sem NF");
        if (issueTelaQuebrada) issues.push("Tela quebrada");
        if (issueSemChip) issues.push("Sem Chip");
        if (issueSemAudio) issues.push("Sem áudio");
        if (issueTouchNaoFunciona) issues.push("Touch não funciona");
        if (issueMicrofoneComDefeito) issues.push("Microfone com defeito");
        if (issueEntFoneComDefeito) issues.push("Entrada fone com defeito");
        if (issueSemBotao) issues.push("Sem botão");
        if (issueNaoCarrega) issues.push("Não carrega");
        if (issueSemTampa) issues.push("Sem tampa");
        if (issueBateriaInchada) issues.push("Bateria inchada");
        if (issueCameraQuebrada) issues.push("Câmera quebrada");
        return issues;
    };

    const printableData = {
        quoteNumber,
        customerName,
        customerCpf,
        customerPhone,
        customerEmail,
        deviceBrandModel,
        deviceSerialNumber,
        reportedDefect,
        observations,
        issues: getSelectedIssues(),
        quoteItems,
        total,
        expectedQuoteDate,
        expectedDeliveryDate,
        warrantyPeriod,
    };

    const handleSaveQuote = async () => {
        try {
            const token = localStorage.getItem('boycell-token');
            const response = await api.post('/api/quotes', printableData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success(`Orçamento ${response.data.quote_number} salvo com sucesso!`);
        } catch (error) {
            console.error("Erro ao salvar orçamento:", error);
            toast.error(error.response?.data?.message || 'Falha ao salvar o orçamento.');
        }
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen p-4 sm:p-8">
            <div className="container mx-auto space-y-8">
                <header className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Gerador de Orçamento</h1>
                        {quoteNumber && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Número do Orçamento: <strong>{quoteNumber}</strong></p>}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                        </Button>
                        <Button onClick={handleSaveQuote}>
                            <Save className="mr-2 h-4 w-4" /> Salvar Orçamento
                        </Button>
                        <ReactToPrint
                            trigger={() => (
                                <Button variant="secondary"><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
                            )}
                            content={() => printableComponentRef.current}
                            documentTitle={`Orcamento-${quoteNumber}`}
                        />
                    </div>
                </header>

                {/* Customer Details Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customerName">Nome do Cliente</Label>
                                <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome completo" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customerCpf">CPF/CNPJ</Label>
                                <Input id="customerCpf" value={customerCpf} onChange={(e) => setCustomerCpf(e.target.value)} placeholder="CPF ou CNPJ" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customerPhone">Telefone</Label>
                                <Input type="tel" id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(XX) XXXXX-XXXX" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customerEmail">Email</Label>
                                <Input type="email" id="customerEmail" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@exemplo.com" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Device Details Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Aparelho</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="deviceBrandModel">Marca/Modelo</Label>
                                <Input id="deviceBrandModel" value={deviceBrandModel} onChange={(e) => setDeviceBrandModel(e.target.value)} placeholder="Ex: Samsung Galaxy S21" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deviceSerialNumber">Nº Série</Label>
                                <Input id="deviceSerialNumber" value={deviceSerialNumber} onChange={(e) => setDeviceSerialNumber(e.target.value)} placeholder="Número de série do aparelho" />
                            </div>
                        </div>

                        <div>
                            <Label className="mb-3 block">Defeitos e Condições (Marque o que se aplica)</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                <div className="flex items-center space-x-2"><Checkbox id="issueNaoLiga" checked={issueNaoLiga} onCheckedChange={setIssueNaoLiga} /><Label htmlFor="issueNaoLiga">Não liga</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="issueEmLoop" checked={issueEmLoop} onCheckedChange={setIssueEmLoop} /><Label htmlFor="issueEmLoop">Em loop</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="issueSemNF" checked={issueSemNF} onCheckedChange={setIssueSemNF} /><Label htmlFor="issueSemNF">Sem NF</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="issueTelaQuebrada" checked={issueTelaQuebrada} onCheckedChange={setIssueTelaQuebrada} /><Label htmlFor="issueTelaQuebrada">Tela quebrada</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="issueSemChip" checked={issueSemChip} onCheckedChange={setIssueSemChip} /><Label htmlFor="issueSemChip">Sem Chip</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="issueSemAudio" checked={issueSemAudio} onCheckedChange={setIssueSemAudio} /><Label htmlFor="issueSemAudio">Sem áudio</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="issueTouchNaoFunciona" checked={issueTouchNaoFunciona} onCheckedChange={setIssueTouchNaoFunciona} /><Label htmlFor="issueTouchNaoFunciona">Touch não funciona</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="issueMicrofoneComDefeito" checked={issueMicrofoneComDefeito} onCheckedChange={setIssueMicrofoneComDefeito} /><Label htmlFor="issueMicrofoneComDefeito">Microfone c/ defeito</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="issueEntFoneComDefeito" checked={issueEntFoneComDefeito} onCheckedChange={setIssueEntFoneComDefeito} /><Label htmlFor="issueEntFoneComDefeito">Entrada fone c/ defeito</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="issueSemBotao" checked={issueSemBotao} onCheckedChange={setIssueSemBotao} /><Label htmlFor="issueSemBotao">Sem botão</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="issueNaoCarrega" checked={issueNaoCarrega} onCheckedChange={setIssueNaoCarrega} /><Label htmlFor="issueNaoCarrega">Não carrega</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="issueSemTampa" checked={issueSemTampa} onCheckedChange={setIssueSemTampa} /><Label htmlFor="issueSemTampa">Sem tampa</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="issueBateriaInchada" checked={issueBateriaInchada} onCheckedChange={setIssueBateriaInchada} /><Label htmlFor="issueBateriaInchada">Bateria inchada</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="issueCameraQuebrada" checked={issueCameraQuebrada} onCheckedChange={setIssueCameraQuebrada} /><Label htmlFor="issueCameraQuebrada">Câmera quebrada</Label></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reportedDefect">Defeito Reclamado</Label>
                            <Textarea id="reportedDefect" value={reportedDefect} onChange={(e) => setReportedDefect(e.target.value)} placeholder="Descreva o defeito relatado pelo cliente" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="observations">Observações</Label>
                            <Textarea id="observations" value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Observações adicionais sobre o aparelho ou serviço" />
                        </div>
                    </CardContent>
                </Card>

                {/* Search Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Adicionar Itens ao Orçamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                type="text"
                                placeholder="Buscar produto ou serviço..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                            {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>}
                        </div>
                        {searchResults.length > 0 && (
                            <div className="mt-2 border rounded-md bg-white dark:bg-gray-800">
                                {searchResults.map(item => (
                                    <div key={`${item.type}-${item.id}`} onClick={() => handleAddItemToQuote(item)} className="flex justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0">
                                        <span>{item.nome || item.servico}</span>
                                        <span className="font-mono text-sm">
                                            {item.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Itens do Orçamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {quoteItems.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">Nenhum item adicionado ao orçamento.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead className="w-[50px] text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quoteItems.map(item => (
                                        <TableRow key={item.quoteItemId}>
                                            <TableCell className="font-medium">{item.nome || item.servico}</TableCell>
                                            <TableCell className="text-right font-mono">{item.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItemFromQuote(item.quoteItemId)}>
                                                    <Trash className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                    {quoteItems.length > 0 && (
                        <CardFooter className="flex justify-end font-bold text-lg">
                            <div className="flex items-baseline gap-4">
                                <span>Total:</span>
                                <span className="font-mono">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        </CardFooter>
                    )}
                </Card>

                {/* Dates and Warranty Section */}
                <Card>
                    <CardHeader><CardTitle>Prazos e Garantia</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expectedQuoteDate">Data Prevista para Orçamento</Label>
                            <Input type="date" id="expectedQuoteDate" value={expectedQuoteDate} onChange={(e) => setExpectedQuoteDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expectedDeliveryDate">Data Prevista para Entrega</Label>
                            <Input type="date" id="expectedDeliveryDate" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="warrantyPeriod">Garantia</Label>
                            <Input id="warrantyPeriod" value={warrantyPeriod} onChange={(e) => setWarrantyPeriod(e.target.value)} placeholder="Ex: 90 dias, 3 meses, etc." />
                        </div>
                    </CardContent>
                </Card>

                {/* Termo de Responsabilidade */}
                <Card>
                    <CardHeader><CardTitle>TERMO DE RESPONSABILIDADE</CardTitle></CardHeader>
                    <CardContent className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
                        <p>"Assumo total responsabilidade da propriedade do aparelho acima citado, isentando a assistência técnica de qualquer eventual dano, perda ou acontecimento no mesmo. Estou ciente de que serviços de reset e atualização implica na perda de dados pessoais, fotos ou qualquer conteúdo no aparelho. A assistência técnica em placa lógica (conectores, botões, componentes, ou qualquer tipo de serviços em aparelho) fica a cargo dos componentes, e faço a lógica para aplicar na morte súbita do aparelho e inutilizando. A garantia dos serviços é aplicada para: Problemas elétricos, oxidação, sobrecargas elétrica, exposição do aparelho a algo mal, água, queda, arranhões, display trincado, software, exclusão de aplicativos maliciosos, alterações no sistema operacional, abertura ou tentativas de conserto de terceiros não autorizados pela assistência técnica, bem como a violação do selo lacre de garantia. Me comprometo a realizar a retirada do aparelho em até 90 (noventa) dias, salientando que passado este prazo será cobrado um acréscimo de 10% ao mês ou proporcional ao período. Ao fim do prazo de 90 (noventa) dias o aparelho será vendido para cobrir custos."</p>
                    </CardContent>
                </Card>

                {/* Componente oculto que será usado para impressão */}
                <div style={{ display: 'none' }}>
                    <OrcamentoPrintable ref={printableComponentRef} data={printableData} />
                </div>
            </div>
        </div>
    );
}

export default Orcamento;
