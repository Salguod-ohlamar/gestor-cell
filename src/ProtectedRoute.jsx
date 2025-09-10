import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({
  user,
  allowedRoles,
  redirectPath = '/',
}) => {
  const location = useLocation();

  if (!user) {
    // Usuário não está logado, redireciona para a página inicial
    // Passamos a localização atual para que possamos voltar após o login, se desejado.
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Se roles são especificadas, verifica se o usuário tem a permissão
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Usuário logado mas sem a permissão necessária.
    // Redireciona para uma página padrão para sua role ou uma página de "não autorizado".
    const defaultPage = (user.role === 'admin' || user.role === 'root') ? '/estoque' : '/vendas';
    return <Navigate to={defaultPage} replace />;
  }

  // Se todas as verificações passarem, renderiza o componente filho (a rota protegida).
  return <Outlet />;
};

export default ProtectedRoute;