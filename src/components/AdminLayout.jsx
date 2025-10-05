import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

const AdminLayout = ({ currentUser, onLogout }) => {
    return (
        <div className="bg-gray-950 text-gray-100 min-h-screen font-sans flex">
            <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
            <Sidebar currentUser={currentUser} onLogout={onLogout} />
            <div className="flex-1 ml-64">
                {/* O conteúdo da rota aninhada será renderizado aqui */}
                <main className="p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;