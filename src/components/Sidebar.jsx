import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingCart, Package, Wrench, Calendar, Users,
    BarChart3, LogOut, User, Settings, Sun, Moon, Palette
} from 'lucide-react';
import BrandText from './BrandText';
import { useTheme } from './ThemeContext';

const Sidebar = ({ currentUser, onLogout }) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const navLinks = [
        { to: '/vendas', icon: ShoppingCart, text: 'Vendas', roles: ['vendedor', 'admin', 'root'] },
        { to: '/estoque', icon: LayoutDashboard, text: 'Dashboard', roles: ['admin', 'root'] },
        { to: '/estoque/produtos', icon: Package, text: 'Produtos', roles: ['admin', 'root'] },
        { to: '/estoque/servicos', icon: Wrench, text: 'Serviços', roles: ['admin', 'root'] },
        { to: '/estoque/agendamentos', icon: Calendar, text: 'Agenda', roles: ['admin', 'root'] },
        { to: '/estoque/clientes', icon: Users, text: 'Clientes', roles: ['admin', 'root'] },
        { to: '/estoque/relatorios', icon: BarChart3, text: 'Relatórios', roles: ['admin', 'root'] },
        { to: '/estoque/usuarios', icon: User, text: 'Usuários', roles: ['admin', 'root'] },
        { to: '/estoque/configuracoes', icon: Settings, text: 'Configurações', roles: ['admin', 'root'] },
    ];

    const hasAccess = (roles) => {
        if (!currentUser || !currentUser.role) return false;
        return roles.includes(currentUser.role);
    };

    const activeLinkClass = "bg-green-500/20 text-green-300";
    const inactiveLinkClass = "text-gray-400 hover:bg-gray-700/50 hover:text-white";

    return (
        <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full">
            <div className="h-20 flex items-center justify-center border-b border-gray-800">
                <h1 className="text-2xl font-bold text-white" onClick={() => navigate('/vendas')}>
                    <BrandText>Boycell</BrandText>
                </h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navLinks.map(link => hasAccess(link.roles) && (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === '/estoque'} // `end` prop for exact match on dashboard
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive ? activeLinkClass : inactiveLinkClass}`
                        }
                    >
                        <link.icon size={20} />
                        <span>{link.text}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="px-4 py-4 border-t border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                            <User size={20} className="text-gray-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-white truncate">{currentUser?.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{currentUser?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="p-2 rounded-md text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        title="Sair"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
                <div className="flex justify-center">
                     <button
                        onClick={toggleTheme}
                        className="flex items-center gap-2 p-2 rounded-lg text-sm transition-colors text-gray-400 hover:bg-gray-700 w-full justify-center"
                        title={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        <span className="ml-2">Mudar Tema</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;