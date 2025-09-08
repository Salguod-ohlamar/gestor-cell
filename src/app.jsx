import React, { useState, useEffect } from 'react';
import { User, Wrench, Power, Phone, Globe, Instagram, Facebook } from 'lucide-react';

import EstoquePage from './components/stockcontrol.jsx';
import VendasPage from './components/VendasPage.jsx';
import Modal from './components/Modal.jsx';

import BrandText from './components/BrandText.jsx';
import Button from './components/Button.jsx';
import ProductCard from './components/ProductCard.jsx';
import ServiceCard from './components/ServiceCard.jsx';
import ContactForm from './components/ContactForm.jsx';

// --- Dados (Idealmente em um arquivo separado, ex: data.js) ---
const navLinksData = [
  { title: 'Início', href: '#inicio' },
  { title: 'Produtos', href: '#produtos' },
  { title: 'Serviços', href: '#servicos' },
  { title: 'Contato', href: '#contato' },
];

const App = () => {
  const [productsByCategory, setProductsByCategory] = useState({});
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState('home'); // 'home', 'vendas', 'estoque'
  
  const loadHomePageData = () => {
    setLoading(true);
    // Simula uma chamada de API
    setTimeout(() => { // Timeout pode ser reduzido ou removido
      try {
        // Carregar Produtos
        const savedEstoque = localStorage.getItem('boycell-estoque');
        const allProducts = savedEstoque ? JSON.parse(savedEstoque) : [];
        const featuredProducts = allProducts.filter(p => p.destaque === true);

        // Group by category
        const groupedProducts = featuredProducts.reduce((acc, product) => {
          const category = product.categoria || 'Outros';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(product);
          return acc;
        }, {});

        setProductsByCategory(groupedProducts);

        // Carregar Serviços
        const savedServicos = localStorage.getItem('boycell-servicos');
        const allServices = savedServicos ? JSON.parse(savedServicos) : [];
        setFeaturedServices(allServices.filter(s => s.destaque === true));

      } catch (error) {
        console.error("Erro ao carregar produtos do estoque:", error);
        setProductsByCategory({}); // Set to empty object on error
        setFeaturedServices([]);
      }
      setLoading(false);
    }, 200);
  };

  const handleLoginClick = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleLogin = (e) => {
    e.preventDefault();
    // Aqui, você faria a verificação de credenciais.
    // Por enquanto, vamos apenas simular um login bem-sucedido.
    setView('estoque');
    handleCloseModal();
  };

  const handleLogout = () => {
    setView('home');
    loadHomePageData();
  };

  useEffect(() => {
    loadHomePageData();
  }, []);

  if (view === 'vendas') {
    return <VendasPage onLogout={handleLogout} onNavigateToEstoque={() => setView('estoque')} />;
  }
  if (view === 'estoque') {
    return <EstoquePage onLogout={handleLogout} onNavigateToVendas={() => setView('vendas')} />;
  }

  return (
    <div className="bg-gray-950 text-gray-100 font-sans leading-relaxed">
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-sm shadow-lg">
        <nav className="container mx-auto flex items-center justify-between p-4 md:p-6">
          <div className="text-2xl">
            <BrandText>Boycell</BrandText>
          </div>
          <div className="hidden md:flex space-x-8">
            {navLinksData.map((link, index) => (
              <a key={index} href={link.href} className="text-lg font-medium hover:text-green-400 transition-colors duration-300">
                {link.title}
              </a>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="icon" size="icon" onClick={handleLoginClick} aria-label="Acessar conta">
              <User size={24} />
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-16">
        <section id="inicio" className="text-center py-20 md:py-32">
          <div className="relative z-10 space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white">
              <BrandText>Boycell</BrandText>: Conectando você ao futuro
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
              Periféricos de ponta e conserto especializado para o seu universo móvel.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button as="a" href="#produtos" size="lg">
                Compre agora
              </Button>
              <Button as="a" href="#contato" variant="secondary" size="lg">
                Reparo rápido
              </Button>
            </div>
          </div>
        </section>

        <section id="produtos" className="mt-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Nossos <span className="text-green-400">produtos</span>
          </h2>
          {loading ? (
            <div className="text-center text-lg text-gray-400">Carregando produtos...</div>
          ) : (
            <div className="space-y-16">
              {Object.keys(productsByCategory).length > 0 ? (
                Object.entries(productsByCategory).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-2xl md:text-3xl font-bold mb-8 border-b-2 border-green-500/30 pb-2 text-white">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {items.map(product => (
                        <ProductCard 
                          key={product.id} 
                          product={{
                            id: product.id,
                            name: product.nome,
                            price: product.precoFinal,
                            image: product.imagem,
                            description: `Marca: ${product.marca}`
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">Nenhum produto encontrado no estoque.</p>
              )}
            </div>
          )}
        </section>

        <section id="servicos" className="mt-20">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                Conserto de <span className="text-green-400">celulares</span>
            </h2>
            {loading ? (
              <div className="text-center text-lg text-gray-400">Carregando serviços...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredServices.length > 0 ? (
                  featuredServices.map(service => (
                    <ProductCard 
                      key={service.id} 
                      product={{
                        id: service.id,
                        name: service.servico,
                        price: service.precoFinal,
                        image: service.imagem,
                        description: `Reparo: ${service.tipoReparo}`
                      }} 
                    />))
                ) : (<p className="col-span-full text-center text-gray-500">Nenhum serviço em destaque no momento.</p>)}
            </div>
            )}
        </section>

        <section id="contato" className="mt-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Entre em <span className="text-green-400">contato</span>
          </h2>
          <ContactForm />
        </section>
      </main>

      <footer className="bg-gray-900 mt-20 py-8 text-gray-400">
        <div className="container mx-auto px-4 text-center md:flex md:justify-between md:items-center">
          <div className="mb-4 md:mb-0">
            <div className="text-2xl">
              <BrandText>Boycell</BrandText>
            </div>
            <p className="mt-2 text-sm">Tecnologia e cuidado para o seu dispositivo.</p>
          </div>
          <div className="mb-4 md:mb-0 space-y-2">
            <h4 className="font-semibold text-gray-200">Links Úteis</h4>
            <a href="#servicos" className="block text-sm hover:text-green-400 transition-colors duration-300">Serviços</a>
            <a href="#produtos" className="block text-sm hover:text-green-400 transition-colors duration-300">Produtos</a>
          </div>
          <div className="space-x-4">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="inline-block p-2 rounded-full hover:bg-gray-800 transition-colors duration-300">
              <Instagram size={20} className="text-green-400" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="inline-block p-2 rounded-full hover:bg-gray-800 transition-colors duration-300">
              <Facebook size={20} className="text-green-400" />
            </a>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-4 text-center text-sm">
          <p>© 2025 Boycell. Todos os direitos reservados.</p>
        </div>
      </footer>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <h2 className="text-2xl font-bold text-center text-green-400 mb-6">Acessar Conta</h2>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email-login" className="block text-sm font-medium text-gray-300">Email</label>
            <input id="email-login" type="email" required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label htmlFor="password-login" className="block text-sm font-medium text-gray-300">Senha</label>
            <input id="password-login" type="password" required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <Button type="submit" size="md" className="w-full !px-4 !py-3 text-base mt-4">
            Entrar
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default App;