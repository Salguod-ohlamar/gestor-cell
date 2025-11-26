import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from 'react-hot-toast';

const AdminUsers = ({ currentUser, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          // Adiciona um log mais detalhado do erro
          const errorData = await response.text(); // Tenta ler o corpo do erro como texto
          console.error(`Erro na API: Status ${response.status}`, errorData);
          throw new Error('Falha ao buscar usuários.');
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Erro ao buscar usuários da API:", error);
        toast.error("Erro ao carregar usuários. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleEditUser = (userId) => {
    // Lógica para abrir modal de edição
    console.log(`Editar usuário: ${userId}`);
    toast.success(`Funcionalidade de editar usuário ${userId} a ser implementada.`);
  };

  const handleDeleteUser = (userId) => {
    // Lógica para deletar usuário
    console.log(`Deletar usuário: ${userId}`);
    toast.success(`Funcionalidade de deletar usuário ${userId} a ser implementada.`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-950 text-lg">Carregando usuários...</div>;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen p-4 sm:p-8">
      <Toaster position="top-right" />
      <div className="container mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Gerenciar Usuários</h1>
          <div>
            <Button variant="outline" onClick={() => navigate('/admin')} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Admin
            </Button>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> Adicionar Usuário
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-2xl shadow-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.title}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditUser(user.id)} className="mr-2">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan="5" className="text-center">Nenhum usuário encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;