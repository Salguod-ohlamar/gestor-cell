import React, { useState, useEffect } from 'react';
import { ShoppingCart, Wrench, Power, Phone, Globe, Instagram, Facebook } from 'lucide-react';

// Componente para o texto da marca
const BrandText = ({ children }) => (
  // Trocamos o gradiente por uma cor verde sólida do Tailwind
  <span className="font-bold text-green-400">
    {children}
  </span>
);

const App = () => {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  useEffect(() => {
    const mockProducts = [
      { id: 1, name: 'Capa Protetora Neon', price: 'R$ 79,90', image: 'https://placehold.co/400x400/0077FF/ffffff?text=Capa+Neon', description: 'Design robusto e luzes LED personalizáveis.' },
      { id: 2, name: 'Fone de Ouvido Cyber', price: 'R$ 199,90', image: 'https://placehold.co/400x400/FF00FF/ffffff?text=Fone+Cyber', description: 'Áudio imersivo com design futurista e sem fio.' },
      { id: 3, name: 'Película de Privacidade Stealth', price: 'R$ 59,90', image: 'https://placehold.co/400x400/333333/ffffff?text=Película+Stealth', description: 'Proteção total contra curiosos e arranhões.' },
      { id: 4, name: 'Carregador Turbo Tech', price: 'R$ 129,90', image: 'https://placehold.co/400x400/00FFFF/ffffff?text=Carregador+Turbo', description: 'Carregamento ultra-rápido para você nunca ficar sem energia.' },
    ];
    const mockServices = [
      { id: 1, name: 'Troca de Tela', icon: Phone, description: 'Reparo rápido e de alta qualidade para telas trincadas ou danificadas.' },
      { id: 2, name: 'Reparo de Bateria', icon: Power, description: 'Substituição de bateria para restaurar a vida útil do seu aparelho.' },
      { id: 3, name: 'Conserto de Placa', icon: Wrench, description: 'Diagnóstico e reparo de problemas complexos de placa-mãe.' },
      { id: 4, name: 'Otimização de Software', icon: Globe, description: 'Restauração e otimização do sistema operacional do seu celular.' },
    ];
    setTimeout(() => {
      setProducts(mockProducts);
      setServices(mockServices);
      setLoading(false);
    }, 1000);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log('Dados do formulário enviados:', formData);
    alert('Mensagem enviada com sucesso! Em breve entraremos em contato.');
    setFormData({ name: '', email: '', message: '' });
  };

  const navLinks = [
    { title: 'Início', href: '#inicio' },
    { title: 'Produtos', href: '#produtos' },
    { title: 'Serviços', href: '#servicos' },
    { title: 'Contato', href: '#contato' },
  ];

  return (
    <div className="bg-gray-950 text-gray-100 font-sans leading-relaxed">
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-sm shadow-lg">
        <nav className="container mx-auto flex items-center justify-between p-4 md:p-6">
          <div className="text-2xl">
            <BrandText>Boycell</BrandText>
          </div>
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link, index) => (
              <a key={index} href={link.href} className="text-lg font-medium hover:text-green-400 transition-colors duration-300">
                {link.title}
              </a>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-800 transition-colors duration-300">
              <ShoppingCart size={24} className="text-green-400" />
            </button>
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
              <a href="#produtos" className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-full shadow-lg text-white bg-green-600 hover:bg-green-700 transition-all duration-300">
                Compre agora
              </a>
              <a href="#contato" className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-full shadow-lg text-green-400 bg-gray-800/50 border border-green-500/50 hover:bg-green-400 hover:text-white transition-colors duration-300">
                Reparo rápido
              </a>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map(product => (
                <div key={product.id} className="bg-gray-900 p-6 rounded-2xl shadow-xl hover:shadow-green-500/20 transition-all duration-300 transform hover:-translate-y-2 group">
                  <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded-xl mb-4 group-hover:scale-105 transition-transform duration-300" />
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-400 mb-4 text-sm">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-400">{product.price}</span>
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full hover:scale-105 transition-transform duration-300">
                      Comprar
                    </button>
                  </div>
                </div>
              ))}
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
                {services.map(service => (
                <div key={service.id} className="bg-gray-900 p-6 rounded-2xl shadow-xl border-t-4 border-green-500 transform hover:scale-105 transition-transform duration-300 text-center">
                    <div className="flex justify-center mb-4">
                    <service.icon size={48} className="text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                    <p className="text-gray-400 text-sm">{service.description}</p>
                </div>
                ))}
            </div>
            )}
        </section>

        {/* SEÇÃO DE CONTATO ADICIONADA ABAIXO */}
        <section id="contato" className="mt-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Entre em <span className="text-green-400">contato</span>
          </h2>
          <div className="max-w-xl mx-auto bg-gray-900 p-8 rounded-2xl shadow-xl">
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nome</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300">Mensagem</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="4"
                  required
                  className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full inline-flex justify-center px-4 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-green-600 hover:bg-green-700 transition-transform duration-300"
              >
                Enviar mensagem
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* RODAPÉ ADICIONADO ABAIXO */}
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
            <a href="#" className="inline-block p-2 rounded-full hover:bg-gray-800 transition-colors duration-300">
              <Instagram size={20} className="text-green-400" />
            </a>
            <a href="#" className="inline-block p-2 rounded-full hover:bg-gray-800 transition-colors duration-300">
              <Facebook size={20} className="text-green-400" />
            </a>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-4 text-center text-sm">
          <p>© 2025 Boycell. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;