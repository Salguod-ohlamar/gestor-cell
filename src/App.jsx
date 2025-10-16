import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { usePersistedState } from './components/usePersistedState';
import { ThemeProvider } from './components/ThemeContext.jsx';
import { EstoqueProvider, useEstoqueContext } from './components/EstoqueContext.jsx';
import LoginPage from './components/LoginPage.jsx';
import Modal from './components/Modal.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

// Lazy load pages for better initial performance
const HomePage = lazy(() => import('./HomePage.jsx'));
const StockControl = lazy(() => import('./components/StockControl.jsx'));
const VendasPage = lazy(() => import('./components/VendasPage.jsx'));
const ClientesPage = lazy(() => import('./components/ClientesPage.jsx'));
import { PERMISSION_GROUPS } from './components/useEstoque.jsx';
const AdminPage = lazy(() => import('./AdminPage.jsx'));

const AppContent = () => {
    const [currentUser, setCurrentUser] = usePersistedState('boycell-currentUser', null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogin = ({ user, token }) => {
        localStorage.setItem('boycell-token', token); // Salva o token
        setCurrentUser(user);
        setIsLoginModalOpen(false);
        // Admin/root goes to stock control, vendedor goes to sales page
        if (['admin', 'root'].includes(user.role)) {
            navigate('/estoque');
        } else {
            navigate('/vendas'); // Fallback para outros papéis futuros
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
            <EstoqueProvider currentUser={currentUser}>
                <Toaster position="top-right" toastOptions={{ className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white', style: { background: 'transparent', boxShadow: 'none' } }} />
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        {/* Rota Pública */}
                        <Route path="/" element={<HomePage onLoginClick={() => setIsLoginModalOpen(true)} />} />

                        {/* Rotas Protegidas */}
                        <Route element={<ProtectedRoute user={currentUser} redirectPath="/" />}>
                            {/* Acessível por todos os usuários logados */}
                            <Route path="/vendas" element={
                                <VendasPage
                                    onLogout={handleLogout}
                                    currentUser={currentUser}
                                />
                            } />

                            {/* Rotas para Estoque, Clientes e Admin: Acessíveis por admin e root. */}
                            <Route element={<ProtectedRoute user={currentUser} allowedRoles={['admin', 'root']} redirectPath="/vendas" />}>
                                <Route path="/estoque" element={<StockControl onLogout={handleLogout} currentUser={currentUser} />} />
                                <Route path="/clientes" element={<ClientesPage onLogout={handleLogout} currentUser={currentUser} />} />
                                <Route path="/admin" element={<AdminPage onLogout={handleLogout} currentUser={currentUser} />} />
                            </Route>
                        </Route>

                        {/* Redirecionamento para rotas não encontradas */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
                <LoginModalWrapper isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} />
            </EstoqueProvider>
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
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
};

export default App;