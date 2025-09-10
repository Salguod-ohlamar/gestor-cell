//HomePge.jsx

import React, { useState, useEffect } from 'react';
import { User, Menu, X } from 'lucide-react';

import BrandText from './components/BrandText.jsx';
import Button from './components/Button.jsx';
import ProductCard from './components/ProductCard.jsx';
import WhatsAppButton from './components/WhatsAppButton.jsx';
import LocationMap from './LocationMap.jsx';
import BannerCarousel from './components/BannerCarousel.jsx';
import Modal from './components/Modal.jsx';

const navLinksData = [
  { title: 'Início', href: '#inicio' },
  { title: 'Produtos', href: '#produtos' },
  { title: 'Serviços', href: '#servicos' },
  { title: 'Localização', href: '#localizacao' },
];

const HomePage = ({ onLoginClick }) => {
    const [productsByCategory, setProductsByCategory] = useState({});
    const [featuredServices, setFeaturedServices] = useState([]);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLgpdModalOpen, setIsLgpdModalOpen] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch banners
                const bannersResponse = await fetch(`${API_URL}/api/banners`);
                if (bannersResponse.ok) setBanners(await bannersResponse.json());

                // Fetch products
                const productsResponse = await fetch(`${API_URL}/api/products`);
                if (!productsResponse.ok) throw new Error('Falha ao buscar produtos.');
                const products = await productsResponse.json();

                const featuredProducts = products.filter(p => p.destaque === true);
                const groupedProducts = featuredProducts.reduce((acc, product) => {
                    const category = product.categoria || 'Outros';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(product);
                    return acc;
                }, {});
                setProductsByCategory(groupedProducts);

                // Fetch services
                const servicesResponse = await fetch(`${API_URL}/api/services`);
                if (!servicesResponse.ok) throw new Error('Falha ao buscar serviços.');
                const services = await servicesResponse.json();
                setFeaturedServices(services.filter(s => s.destaque === true));

            } catch (error) {
                console.error("Erro ao carregar dados da página inicial:", error);
                setProductsByCategory({});
                setBanners([]);
                setFeaturedServices([]);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleComprarClick = (item) => {
        const phoneNumber = "5511986366982";
        const itemName = item.name;
        const itemPrice = item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const message = `Olá! Gostaria de saber se o item "${itemName}" no valor de ${itemPrice} está disponível.`;
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="bg-gray-950 text-gray-100 font-sans leading-relaxed">
            <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-sm shadow-lg">
                <nav className="container mx-auto flex items-center justify-between p-4 md:p-6">
                    <div className="text-2xl"><BrandText>Boycell</BrandText></div>
                    <div className="hidden md:flex space-x-8">
                        {navLinksData.map((link) => (
                            <a key={link.href} href={link.href} className="text-lg font-medium hover:text-green-400 transition-colors duration-300">{link.title}</a>
                        ))}
                    </div>
                    <div className="hidden md:flex items-center space-x-4">
                        <Button variant="icon" size="icon" onClick={onLoginClick} aria-label="Acessar conta"><User size={24} /></Button>
                    </div>
                    <div className="md:hidden">
                        <Button variant="icon" size="icon" onClick={() => setIsMobileMenuOpen(true)} aria-label="Abrir menu"><Menu size={24} /></Button>
                    </div>
                </nav>
            </header>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-gray-950/95 md:hidden animate-fade-in">
                    <div className="container mx-auto p-4">
                        <div className="flex justify-between items-center">
                            <div className="text-2xl"><BrandText>Boycell</BrandText></div>
                            <Button variant="icon" size="icon" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu"><X size={24} /></Button>
                        </div>
                        <nav className="mt-16 flex flex-col items-center space-y-8">
                            {navLinksData.map((link) => (
                                <a key={link.href} href={link.href} className="text-2xl font-medium hover:text-green-400" onClick={() => setIsMobileMenuOpen(false)}>{link.title}</a>
                            ))}
                            <Button variant="secondary" size="md" onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}><User size={20} className="mr-2" />Acessar Conta</Button>
                        </nav>
                    </div>
                </div>
            )}

            <main className="container mx-auto px-4 py-8 md:py-16">
                <section id="banners" className="mb-20">
                    <BannerCarousel banners={banners} />
                </section>

                <section id="inicio" className="text-center py-20 md:py-32">
                    <div className="relative z-10 space-y-6">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white"><BrandText>Boycell</BrandText>: Conectando você ao futuro</h1>
                        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">Periféricos de ponta e conserto especializado para o seu universo móvel.</p>
                        <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <Button as="a" href="#produtos" size="lg">Compre agora</Button>
                            <Button as="a" href="#servicos" variant="secondary" size="lg">Reparo rápido</Button>
                        </div>
                    </div>
                </section>

                <section id="produtos" className="mt-20">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Nossos <span className="text-green-400">produtos</span></h2>
                    {loading ? (<div className="text-center text-lg text-gray-400">Carregando produtos...</div>) : (
                        <div className="space-y-16">
                            {Object.keys(productsByCategory).length > 0 ? (Object.entries(productsByCategory).map(([category, items]) => (
                                <div key={category}>
                                    <h3 className="text-2xl md:text-3xl font-bold mb-8 border-b-2 border-green-500/30 pb-2 text-white">{category}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {items.map(product => (<ProductCard key={product.id} product={{ type: 'produto', id: product.id, name: product.nome, price: product.precoFinal, image: product.imagem, description: `Marca: ${product.marca}` }} onComprarClick={handleComprarClick} />))}
                                    </div>
                                </div>
                            ))) : (<p className="text-center text-gray-500">Nenhum produto encontrado no estoque.</p>)}
                        </div>
                    )}
                </section>

                <section id="servicos" className="mt-20">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Conserto de <span className="text-green-400">celulares</span></h2>
                    {loading ? (<div className="text-center text-lg text-gray-400">Carregando serviços...</div>) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {featuredServices.length > 0 ? (featuredServices.map(service => (<ProductCard key={service.id} product={{ type: 'servico', id: service.id, name: service.servico, price: service.precoFinal, image: service.imagem, description: `Reparo: ${service.tipoReparo}` }} onComprarClick={handleComprarClick} />))) : (<p className="col-span-full text-center text-gray-500">Nenhum serviço em destaque no momento.</p>)}
                        </div>
                    )}
                </section>

                <section id="localizacao" className="mt-20">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Nossa <span className="text-green-400">localização</span></h2>
                    <LocationMap />
                </section>

            </main>

            <footer className="bg-gray-900 mt-20 py-8 text-gray-400">
                <div className="container mx-auto px-4 text-center md:flex md:justify-between md:items-center">
                    <div className="mb-4 md:mb-0"><div className="text-2xl"><BrandText>Boycell</BrandText></div><p className="mt-2 text-sm">Tecnologia e cuidado para o seu dispositivo.</p></div>
                    <div className="mb-4 md:mb-0 space-y-2"><h4 className="font-semibold text-gray-200">Links Úteis</h4><a href="#servicos" className="block text-sm hover:text-green-400 transition-colors duration-300">Serviços</a><a href="#produtos" className="block text-sm hover:text-green-400 transition-colors duration-300">Produtos</a></div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-4 text-center text-sm">
                    <p>© 2025 Boycell. Todos os direitos reservados. | <button onClick={() => setIsLgpdModalOpen(true)} className="underline hover:text-green-400 transition-colors">Política de Privacidade (LGPD)</button></p>
                </div>
            </footer>

            <WhatsAppButton phoneNumber="5511986366982" message="Olá! Gostaria de mais informações sobre seus produtos e serviços." />

            <Modal isOpen={isLgpdModalOpen} onClose={() => setIsLgpdModalOpen(false)} size="lg">
                <h2 className="text-2xl font-bold text-center text-green-400 mb-6">Política de Privacidade e Proteção de Dados (LGPD)</h2>
                <div className="text-gray-300 space-y-4 max-h-[70vh] overflow-y-auto pr-4 text-sm">
                    <p>A <strong>Boycell</strong>, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), está comprometida em proteger a sua privacidade e garantir a segurança dos seus dados pessoais. Esta política explica como coletamos, usamos, compartilhamos e protegemos suas informações.</p>
                    
                    <h3 className="font-semibold text-lg text-white pt-2">1. Coleta de Dados</h3>
                    <p>Coletamos dados pessoais que você nos fornece diretamente ao se cadastrar em nosso sistema, realizar uma compra ou solicitar um serviço. Os dados coletados podem incluir: nome completo, CPF/CNPJ, endereço de e-mail, número de telefone e histórico de compras/serviços.</p>

                    <h3 className="font-semibold text-lg text-white pt-2">2. Uso dos Dados</h3>
                    <p>Utilizamos seus dados para:</p>
                    <ul className="list-disc list-inside pl-4">
                        <li>Processar suas compras e ordens de serviço.</li>
                        <li>Gerenciar seu cadastro e histórico para facilitar futuras interações.</li>
                        <li>Emitir notas fiscais e comprovantes de venda.</li>
                        <li>Comunicar sobre o andamento de serviços e informações sobre produtos, quando solicitado.</li>
                        <li>Cumprir obrigações legais e regulatórias.</li>
                    </ul>

                    <h3 className="font-semibold text-lg text-white pt-2">3. Compartilhamento de Dados</h3>
                    <p>A Boycell não compartilha seus dados pessoais com terceiros para fins de marketing. O compartilhamento pode ocorrer apenas com autoridades governamentais para cumprimento de obrigações legais ou em caso de requisição judicial.</p>

                    <h3 className="font-semibold text-lg text-white pt-2">4. Seus Direitos</h3>
                    <p>Como titular dos dados, você tem o direito de:</p>
                    <ul className="list-disc list-inside pl-4">
                        <li>Confirmar a existência de tratamento dos seus dados.</li>
                        <li>Acessar seus dados.</li>
                        <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                        <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos.</li>
                        <li>Solicitar a portabilidade dos seus dados a outro fornecedor de serviço ou produto.</li>
                        <li>Revogar o consentimento, quando aplicável.</li>
                    </ul>
                    <p>Para exercer seus direitos, entre em contato conosco através dos nossos canais de atendimento.</p>

                    <h3 className="font-semibold text-lg text-white pt-2">5. Segurança dos Dados</h3>
                    <p>Adotamos medidas técnicas e administrativas para proteger seus dados pessoais de acessos não autorizados e de situações de destruição, perda, alteração, comunicação ou difusão.</p>

                    <p className="pt-4">Ao utilizar nossos serviços, você concorda com os termos desta Política de Privacidade.</p>
                </div>
            </Modal>
        </div>
    );
};

export default HomePage;