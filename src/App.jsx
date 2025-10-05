import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { usePersistedState } from './components/usePersistedState';
import { ThemeProvider } from './components/ThemeContext.jsx';
import { EstoqueProvider, useEstoqueContext } from './components/EstoqueContext.jsx';
import LoginPage from './components/LoginPage.jsx';
import Modal from './components/Modal.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import AdminLayout from './components/AdminLayout.jsx';

// Lazy load pages for better initial performance
const HomePage = lazy(() => import('./HomePage.jsx'));
const EstoquePage = lazy(() => import('./components/EstoquePage.jsx'));
const VendasPage = lazy(() => import('./components/VendasPage.jsx'));
const ClientesPage = lazy(() => import('./components/ClientesPage.jsx'));
const AgendamentosPage = lazy(() => import('./components/AgendamentosPage.jsx'));
const RelatoriosPage = lazy(() => import('./components/RelatoriosPage.jsx'));
const UsuariosPage = lazy(() => import('./components/UsuariosPage.jsx'));
const ConfiguracoesPage = lazy(() => import('./components/ConfiguracoesPage.jsx'));

const AppContent = () => {
    const [currentUser, setCurrentUser] = usePersistedState('boycell-currentUser', null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogin = ({ user, token }) => {
        localStorage.setItem('boycell-token', token); // Salva o token
        setCurrentUser(user);
        setIsLoginModalOpen(false);
        // Vendedor vai para a página de vendas, outros vão para o dashboard
        if (user.role === 'admin' || user.role === 'root') {
            navigate('/estoque');
        } else {
            navigate('/vendas');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('boycell-token'); // Remove o token
        setCurrentUser(null);
        navigate('/');
    };

    const LoadingFallback = () => (
        <div className="flex justify-center items-center h-screen bg-white dark:bg-gray-950 text-gray-800 dark:text-white text-xl">
          Carregando...
        </div>
    );

    return (
        <>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    {/* Rota Pública */}
                    <Route path="/" element={!currentUser ? <HomePage onLoginClick={() => setIsLoginModalOpen(true)} /> : <Navigate to="/vendas" />} />

                    {/* Rotas Protegidas com o novo Layout */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute user={currentUser} redirectPath="/">
                                <AdminLayout currentUser={currentUser} onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    >
                        {/* Acessível por todos os usuários logados */}
                        <Route path="vendas" element={<VendasPage currentUser={currentUser} />} />

                        {/* Acessível apenas por admin e root */}
                        <Route element={<ProtectedRoute user={currentUser} allowedRoles={['admin', 'root']} />}>
                            <Route path="estoque" element={<EstoquePage currentUser={currentUser} />} />
                            {/* As rotas abaixo são exemplos de como você pode estruturar as outras páginas */}
                            <Route path="estoque/produtos" element={<EstoquePage currentUser={currentUser} initialTab="produtos" />} />
                            <Route path="estoque/servicos" element={<EstoquePage currentUser={currentUser} initialTab="servicos" />} />
                            <Route path="estoque/agendamentos" element={<AgendamentosPage currentUser={currentUser} />} />
                            <Route path="estoque/clientes" element={<ClientesPage currentUser={currentUser} />} />
                            <Route path="estoque/relatorios" element={<RelatoriosPage currentUser={currentUser} />} />
                            <Route path="estoque/usuarios" element={<UsuariosPage currentUser={currentUser} />} />
                            <Route path="estoque/configuracoes" element={<ConfiguracoesPage currentUser={currentUser} />} />
                        </Route>
                    </Route>

                    {/* Redirecionamento para rotas não encontradas */}
                    <Route path="*" element={<Navigate to={currentUser ? "/vendas" : "/"} replace />} />
                </Routes>
            </Suspense>
            <LoginModalWrapper isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} />
        </>
    );
};

// Componente wrapper para o modal de login para poder usar o hook useEstoqueContext
const LoginModalWrapper = ({ isOpen, onClose, onLogin }) => {
    const { handlePasswordRecovery } = useEstoqueContext();
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <LoginPage onLogin={onLogin} handlePasswordRecovery={handlePasswordRecovery} />
        </Modal>
    );
}

const App = () => {
    return (
        <EstoqueProvider>
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </EstoqueProvider>
    );
};

export default App;