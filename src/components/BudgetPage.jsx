import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, LogOut, ShoppingCart, Printer, ArrowLeft, Sun, Moon, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useEstoqueContext } from './EstoqueContext.jsx';
import { useTheme } from './ThemeContext.jsx';
import ReciboOrcamento from './ReciboOrcamento.jsx';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const BudgetPage = ({ onLogout, currentUser }) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { estoque, servicos } = useEstoqueContext();

    const [orcamento, setOrcamento] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [validade, setValidade] = useState(7);
    const [produtoSearchTerm, setProdutoSearchTerm] = useState('');
    const [servicoSearchTerm, setServicoSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('produtos');
    const [isReciboModalOpen, setIsReciboModalOpen] = useState(false);
    const [lastOrcamentoDetails, setLastOrcamentoDetails] = useState(null);

    const addToOrcamento = (item, type) => {
        const existingItem = orcamento.find(cartItem => cartItem.id === item.id && cartItem.type === type);
        if (existingItem) {
            setOrcamento(orcamento.map(cartItem =>
                cartItem.id === item.id && cartItem.type === type
                    ? { ...cartItem, quantity: cartItem.quantity + 1 }
                    : cartItem
            ));
        } else if (type === 'produto' && Number(item.emEstoque) <= 0) {
            toast.error(`"${item.nome}" está sem estoque e não pode ser adicionado.`);
            return;
        } else {
            setOrcamento([...orcamento, { ...item, quantity: 1, type }]);
        }
        toast.success(`${item.nome || item.servico} adicionado ao orçamento.`);
    };

    const updateQuantity = (itemId, type, newQuantity) => {
        if (newQuantity < 1) {
            setOrcamento(orcamento.filter(item => !(item.id === itemId && item.type === type)));
        } else {
            const itemInOrcamento = orcamento.find(item => item.id === itemId && item.type === type);
            if (itemInOrcamento && type === 'produto') {
                const estoqueDisponivel = Number(itemInOrcamento.emEstoque);
                if (newQuantity > estoqueDisponivel) {
                    toast.error(`Estoque insuficiente. Apenas ${estoqueDisponivel} unidades disponíveis.`);
                    newQuantity = estoqueDisponivel;
                }
            }
            setOrcamento(orcamento.map(item => 
                item.id === itemId && item.type === type ? { ...item, quantity: newQuantity } : item
            ));
        }
    };

    const removeFromOrcamento = (itemId, type) => {
        setOrcamento(orcamento.filter(item => !(item.id === itemId && item.type === type)));
    };

    const totalOrcamento = useMemo(() => {
        return orcamento.reduce((total, item) => total + (item.precoFinal * item.quantity), 0);
    }, [orcamento]);

    const handleGerarOrcamento = () => {
        if (orcamento.length === 0) {
            toast.error("Adicione itens para gerar um orçamento.");
            return;
        }
        if (!customerName || !customerPhone) {
            toast.error("Nome e telefone do cliente são obrigatórios.");
            return;
        }

        const orcamentoDetails = {
            items: [...orcamento],
            subtotal: totalOrcamento,
            total: totalOrcamento,
            date: new Date(),
            customer: customerName.trim(),
            customerPhone: customerPhone,
            customerEmail: customerEmail,
            validade: validade,
            orcamentoCode: `ORC-${Date.now().toString().slice(-6)}`
        };

        setLastOrcamentoDetails(orcamentoDetails);
        setIsReciboModalOpen(true);
    };

    const handleCloseReciboModal = () => {
        setIsReciboModalOpen(false);
    };

    const handlePrintOrcamento = () => {
        document.body.classList.add('print-mode-recibo');
        window.print();
    };

    useEffect(() => {
        const afterPrint = () => {
            document.body.classList.remove('print-mode-recibo');
        };
        window.addEventListener('afterprint', afterPrint);
        return () => window.removeEventListener('afterprint', afterPrint);
    }, []);

    const produtoResults = useMemo(() => {
        if (!Array.isArray(estoque)) return [];
        return estoque.filter(p =>
            p.nome?.toLowerCase().includes(produtoSearchTerm.toLowerCase())
        );
    }, [estoque, produtoSearchTerm]);

    const servicoResults = useMemo(() => {
        if (!Array.isArray(servicos)) return [];
        return servicos.filter(s =>
            s.servico?.toLowerCase().includes(servicoSearchTerm.toLowerCase())
        );
    }, [servicos, servicoSearchTerm]);

    return (
        <div className="min-h-screen font-sans">
            <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
            <div id="recibo-printable-area" className="hidden">
                <ReciboOrcamento orcamentoDetails={lastOrcamentoDetails} />
            </div>

            <div id="orcamento-non-printable-area">
                <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b">
                    <nav className="container h-14 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerador de Orçamento</h1>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => navigate('/vendas')} title="Ir para Vendas">
                                <ArrowLeft size={20} />
                                <span className="hidden sm:inline">Vendas</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={toggleTheme} title={`Mudar para Tema ${theme === 'dark' ? 'Claro' : 'Escuro'}`}>
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </Button>
                            <Button variant="ghost" onClick={onLogout} title="Sair">
                                <LogOut size={20} />
                                <span className="hidden sm:inline ml-2">Sair</span>
                            </Button>
                        </div>
                    </nav>
                </header>

                <main className="container mx-auto p-4 mt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Coluna do Orçamento */}
                        <Card className="lg:col-span-1 flex flex-col h-fit lg:sticky top-24">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-500 dark:text-orange-400"><ShoppingCart size={24} /> Itens do Orçamento</CardTitle>
                                <CardDescription>Adicione produtos e serviços para montar o orçamento.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ScrollArea className="h-[30vh] pr-4">
                                    {orcamento.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-muted-foreground text-center">Nenhum item adicionado.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {orcamento.map(item => (
                                                <div key={`${item.type}-${item.id}`} className="flex items-center gap-3">
                                                    <img src={item.imagem} alt={item.nome || item.servico} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                                    <div className="flex-grow min-w-0">
                                                        <p className="font-semibold truncate">{item.nome || item.servico}</p>
                                                        <p className="text-sm text-muted-foreground">{item.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}><Minus size={14} /></Button>
                                                        <Input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.id, item.type, parseInt(e.target.value))} className="w-14 h-7 text-center" min="1" />
                                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}><Plus size={14} /></Button>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeFromOrcamento(item.id, item.type)}><X size={18} /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                                <Separator className="my-4" />
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="customerName">Nome do Cliente</Label>
                                        <Input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome completo" required />
                                    </div>
                                    <div>
                                        <Label htmlFor="customerPhone">Telefone</Label>
                                        <Input type="text" id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(XX) XXXXX-XXXX" required />
                                    </div>
                                    <div>
                                        <Label htmlFor="customerEmail">Email (Opcional)</Label>
                                        <Input type="email" id="customerEmail" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@exemplo.com" />
                                    </div>
                                    <div>
                                        <Label htmlFor="validade">Validade do Orçamento (dias)</Label>
                                        <Input type="number" id="validade" value={validade} onChange={(e) => setValidade(e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4">
                                <div className="w-full flex justify-between items-center text-xl font-bold">
                                    <span>Total:</span>
                                    <span className="text-green-500 dark:text-green-400">{totalOrcamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <Button onClick={handleGerarOrcamento} className="w-full bg-orange-600 hover:bg-orange-700">Gerar Orçamento</Button>
                            </CardFooter>
                        </Card>

                        {/* Coluna de Produtos/Serviços */}
                        <Card className="lg:col-span-2">
                            <CardContent className="p-6">
                                <Tabs defaultValue="produtos" onValueChange={setActiveTab}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="produtos">Produtos</TabsTrigger>
                                        <TabsTrigger value="servicos">Serviços</TabsTrigger>
                                    </TabsList>
                                    <div className="relative my-4">
                                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <Input type="text" placeholder={`Buscar ${activeTab === 'produtos' ? 'produto' : 'serviço'}...`} value={activeTab === 'produtos' ? produtoSearchTerm : servicoSearchTerm} onChange={e => activeTab === 'produtos' ? setProdutoSearchTerm(e.target.value) : setServicoSearchTerm(e.target.value)} className="pl-10" />
                                    </div>
                                    <TabsContent value="produtos">
                                        <ScrollArea className="h-[65vh] pr-4">
                                            <div className="space-y-3">
                                                {produtoResults.map(p => (
                                                    <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg border">
                                                        <img src={p.imagem} alt={p.nome} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                                        <div className="flex-grow min-w-0">
                                                            <p className="font-semibold truncate">{p.nome}</p>
                                                            <p className="text-sm text-muted-foreground">{p.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                        </div>
                                                        <Button onClick={() => addToOrcamento(p, 'produto')} size="sm">Adicionar</Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>
                                    <TabsContent value="servicos">
                                        <ScrollArea className="h-[65vh] pr-4">
                                            <div className="space-y-3">
                                                {servicoResults.map(s => (
                                                    <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg border">
                                                        <img src={s.imagem} alt={s.servico} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                                        <div className="flex-grow min-w-0">
                                                            <p className="font-semibold truncate">{s.servico}</p>
                                                            <p className="text-sm text-muted-foreground">{s.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                        </div>
                                                        <Button onClick={() => addToOrcamento(s, 'servico')} size="sm" variant="secondary">Adicionar</Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>

            <Dialog open={isReciboModalOpen} onOpenChange={setIsReciboModalOpen}>
              <DialogContent className="max-w-2xl">
                {lastOrcamentoDetails && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-center text-orange-500 dark:text-orange-400">Orçamento Gerado</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh] my-4">
                            <div className="bg-white rounded-lg p-2">
                                <ReciboOrcamento orcamentoDetails={lastOrcamentoDetails} />
                            </div>
                        </ScrollArea>
                        <DialogFooter>
                            <Button onClick={handlePrintOrcamento}>
                                <Printer size={18} /> Imprimir / Salvar PDF
                            </Button>
                        </DialogFooter>
                    </>
                )}
              </DialogContent>
            </Dialog>
        </div>
    );
};

export default BudgetPage;