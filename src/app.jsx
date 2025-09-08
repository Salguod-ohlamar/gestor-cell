import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, Wrench, Power, Phone, Globe, Instagram, Facebook, Menu, X } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useEstoque } from './components/useEstoque.jsx';
import Modal from './components/Modal.jsx';
import WhatsAppButton from './components/WhatsAppButton.jsx';

import BrandText from './components/BrandText.jsx';
import Button from './components/Button.jsx';
import ProductCard from './components/ProductCard.jsx';
import ServiceCard from './components/ServiceCard.jsx';
import ContactForm from './components/ContactForm.jsx';

// Lazy load pages for better initial performance
const EstoquePage = lazy(() => import('./components/stockControl.jsx'));
const VendasPage = lazy(() => import('./components/VendasPage.jsx'));
const ClientesPage = lazy(() => import('./components/ClientesPage.jsx'));

// --- Dados (Idealmente em um arquivo separado, ex: data.js) ---
const navLinksData = [
  { title: 'Início', href: '#inicio' },
  { title: 'Produtos', href: '#produtos' },
  { title: 'Serviços', href: '#servicos' },
  { title: 'Contato', href: '#contato' },
];

const App = () => {
  const estoqueData = useEstoque();
  const { users, handlePasswordRecovery, estoque, servicos } = estoqueData;

  const [productsByCategory, setProductsByCategory] = useState({});
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState('home'); // 'home', 'vendas', 'estoque'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [modalView, setModalView] = useState('login'); // 'login' ou 'recover'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverName, setRecoverName] = useState('');
  
  const loadHomePageData = () => {
    setLoading(true);
    if (!estoque || !servicos) return;
    // Acesso direto aos dados já carregados pelo hook, sem timeout ou releitura do localStorage
    try {
      // Carregar Produtos em destaque
      const featuredProducts = estoque.filter(p => p.destaque === true);

      // Agrupar por categoria
      const groupedProducts = featuredProducts.reduce((acc, product) => {
        const category = product.categoria || 'Outros';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(product);
        return acc;
      }, {});

      setProductsByCategory(groupedProducts);

      // Carregar Serviços em destaque
      setFeaturedServices(servicos.filter(s => s.destaque === true));

    } catch (error) {
      console.error("Erro ao carregar dados da página inicial:", error);
      setProductsByCategory({});
      setFeaturedServices([]);
    }
    setLoading(false);
  };

  const handleLoginClick = () => {
    setModalView('login');
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setLoginEmail('');
    setLoginPassword('');
    setRecoverEmail('');
    setRecoverName('');
  };

  const handleComprarClick = (item) => {
    const phoneNumber = "5511986366982"; // O mesmo número do WhatsAppButton.jsx
    const itemName = item.name;
    const itemPrice = item.price;

    const message = `Olá! Gostaria de saber se o produto "${itemName}" no valor de ${itemPrice} está disponível.`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.email === loginEmail && u.password === loginPassword);

    if (user) {
      setCurrentUser(user);
      setView(user.role === 'admin' || user.role === 'root' ? 'estoque' : 'vendas');
      toast.success(`Bem-vindo, ${user.name}!`);
      handleCloseModal();
    } else {
      toast.error('Credenciais inválidas.');
    }
  };

  const handleRecover = (e) => {
    e.preventDefault();
    if (!recoverEmail || !recoverName) {
        toast.error('Por favor, preencha e-mail e nome.');
        return;
    }
    const success = handlePasswordRecovery(recoverEmail, recoverName);
    if (success) {
        setModalView('login');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('home');
    loadHomePageData();
  };

  useEffect(() => {
    if (view === 'home') {
      loadHomePageData();
    }
  }, [view]);

  const LoadingFallback = () => (
    <div className="flex justify-center items-center h-screen bg-gray-950 text-white text-xl">
      Carregando...
    </div>
  );

  if (view === 'vendas') {
    return <Suspense fallback={<LoadingFallback />}>
      <VendasPage
        {...estoqueData}
        onLogout={handleLogout}
        onNavigateToEstoque={() => setView('estoque')}
        currentUser={currentUser}
      />
    </Suspense>;
  }
  if (view === 'estoque') {
    return <Suspense fallback={<LoadingFallback />}>
      <EstoquePage {...estoqueData} onLogout={handleLogout} onNavigateToVendas={() => setView('vendas')} onNavigateToClientes={() => setView('clientes')} currentUser={currentUser} />
    </Suspense>;
  }
  if (view === 'clientes') {
    return <Suspense fallback={<LoadingFallback />}>
      <ClientesPage
        {...estoqueData}
        onLogout={handleLogout}
        onNavigateToEstoque={() => setView('estoque')}
        currentUser={currentUser}
      />
    </Suspense>;
  }

  return (
    <div className="bg-gray-950 text-gray-100 font-sans leading-relaxed">
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
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
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="icon" size="icon" onClick={handleLoginClick} aria-label="Acessar conta">
              <User size={24} />
            </Button>
          </div>
          <div className="md:hidden">
            <Button variant="icon" size="icon" onClick={() => setIsMobileMenuOpen(true)} aria-label="Abrir menu">
              <Menu size={24} />
            </Button>
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
                    <Button variant="secondary" size="md" onClick={() => { handleLoginClick(); setIsMobileMenuOpen(false); }}><User size={20} className="mr-2" />Acessar Conta</Button>
                </nav>
            </div>
        </div>
      )}

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
                            type: 'produto',
                            id: product.id,
                            name: product.nome,
                            price: product.precoFinal,
                            image: product.imagem,
                            description: `Marca: ${product.marca}`
                          }}
                          onComprarClick={handleComprarClick}
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
                        type: 'servico',
                        id: service.id,
                        name: service.servico,
                        price: service.precoFinal,
                        image: service.imagem,
                        description: `Reparo: ${service.tipoReparo}`
                      }}
                      onComprarClick={handleComprarClick}
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
        {modalView === 'login' ? (
          <>
            <h2 className="text-2xl font-bold text-center text-green-400 mb-6">Acessar Conta</h2>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email-login" className="block text-sm font-medium text-gray-300">Email</label>
                <input id="email-login" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label htmlFor="password-login" className="block text-sm font-medium text-gray-300">Senha</label>
                <input id="password-login" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <Button type="submit" size="md" className="w-full !px-4 !py-3 text-base mt-4">
                Entrar
              </Button>
            </form>
            <div className="text-center mt-4">
              <button onClick={() => setModalView('recover')} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                Esqueceu a senha?
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center text-green-400 mb-6">Recuperar Senha</h2>
            <form className="space-y-4" onSubmit={handleRecover}>
              <div>
                <label htmlFor="email-recover" className="block text-sm font-medium text-gray-300">Email Cadastrado</label>
                <input id="email-recover" type="email" value={recoverEmail} onChange={e => setRecoverEmail(e.target.value)} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label htmlFor="name-recover" className="block text-sm font-medium text-gray-300">Nome Completo</label>
                <input id="name-recover" type="text" value={recoverName} onChange={e => setRecoverName(e.target.value)} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <Button type="submit" size="md" className="w-full !px-4 !py-3 text-base mt-4">Recuperar</Button>
            </form>
            <div className="text-center mt-4">
              <button onClick={() => setModalView('login')} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">Voltar para o login</button>
            </div>
          </>
        )}
      </Modal>

      <WhatsAppButton phoneNumber="5511986366982" message="Olá! Gostaria de mais informações sobre seus produtos e serviços." />
    </div>
  );
};

export default App;