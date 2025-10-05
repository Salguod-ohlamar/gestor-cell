import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { usePersistedState } from './components/usePersistedState.js';
import { ThemeProvider } from './components/ThemeContext.jsx';
import { EstoqueProvider, useEstoqueContext } from './components/EstoqueContext.jsx';
import LoginPage from './components/LoginPage.jsx';
import Modal from './components/Modal.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import AdminLayout from './components/AdminLayout.jsx';

// Lazy load pages for better initial performance
const HomePage = lazy(() => import('./HomePage.jsx'));
const EstoquePage = lazy(() => import('./components/StockControl.jsx'));
const VendasPage = lazy(() => import('./components/VendasPage.jsx'));
const ClientesPage = lazy(() => import('./components/ClientesPage.jsx'));
const AgendamentosPage = lazy(() => import('./components/AgendamentosPage.jsx'));
const AdminPage = lazy(() => import('./AdminPage.jsx'));

const App = () => {
    const [currentUser, setCurrentUser] = usePersistedState('boycell-currentUser', null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const handleLoginSuccess = (user, token) => {
        localStorage.setItem('boycell-token', token);
        setCurrentUser(user);
        setIsLoginModalOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('boycell-token');
        setCurrentUser(null);
    };

    const LoadingFallback = () => (
        <div className="flex justify-center items-center h-screen bg-white dark:bg-gray-950 text-gray-800 dark:text-white text-xl">
          Carregando...
        </div>
    );

    return (
        <ThemeProvider>
            <EstoqueProvider currentUser={currentUser}>
                <Toaster position="top-right" toastOptions={{ className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white', style: { background: 'transparent', boxShadow: 'none' } }} />
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/" element={!currentUser ? <HomePage onLoginClick={() => setIsLoginModalOpen(true)} /> : <Navigate to="/vendas" />} />
                        
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute user={currentUser} redirectPath="/">
                                    <AdminLayout currentUser={currentUser} onLogout={handleLogout} />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="vendas" element={<VendasPage currentUser={currentUser} />} />
                            
                            <Route element={<ProtectedRoute user={currentUser} allowedRoles={['admin', 'root']} />}>
                                <Route path="estoque" element={<EstoquePage currentUser={currentUser} onLogout={handleLogout} />} />
                                <Route path="estoque/produtos" element={<EstoquePage currentUser={currentUser} onLogout={handleLogout} initialTab="produtos" />} />
                                <Route path="estoque/servicos" element={<EstoquePage currentUser={currentUser} onLogout={handleLogout} initialTab="servicos" />} />
                                <Route path="estoque/agendamentos" element={<AgendamentosPage currentUser={currentUser} />} />
                                <Route path="estoque/clientes" element={<ClientesPage currentUser={currentUser} />} />
                                <Route path="estoque/relatorios" element={<AdminPage currentUser={currentUser} onLogout={handleLogout} />} />
                                <Route path="estoque/usuarios" element={<AdminPage currentUser={currentUser} onLogout={handleLogout} />} />
                                <Route path="estoque/configuracoes" element={<AdminPage currentUser={currentUser} onLogout={handleLogout} />} />
                            </Route>
                        </Route>

                        <Route path="*" element={<Navigate to={currentUser ? "/vendas" : "/"} replace />} />
                    </Routes>
                </Suspense>
                <LoginModalWrapper
                    isOpen={isLoginModalOpen}
                    onClose={() => setIsLoginModalOpen(false)}
                    onLoginSuccess={handleLoginSuccess}
                />
            </EstoqueProvider>
        </ThemeProvider>
    );
};

const LoginModalWrapper = ({ isOpen, onClose, onLoginSuccess }) => {
    const { handlePasswordRecovery } = useEstoqueContext();
    const navigate = useNavigate();

    const handleLogin = ({ user, token }) => {
        onLoginSuccess(user, token);
        if (user.role === 'admin' || user.role === 'root') {
            navigate('/estoque');
        } else {
            navigate('/vendas');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <LoginPage onLogin={onLogin} handlePasswordRecovery={handlePasswordRecovery} />
        </Modal>
    );
};

export default App;