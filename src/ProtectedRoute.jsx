import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEstoqueContext } from './components/EstoqueContext.jsx';

const ProtectedRoute = ({
  user,
  allowedRoles,
  redirectPath = '/',
  requiredPermission,
}) => {
  const location = useLocation();

  if (!user) {
    // Usuário não está logado, redireciona para a página inicial
    // Passamos a localização atual para que possamos voltar após o login, se desejado.
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  let hasAccess = false;

  // 1. Verifica por papel (role)
  if (allowedRoles && allowedRoles.includes(user.role)) {
    hasAccess = true;
  }

  // 2. Se não tiver acesso pelo papel, verifica por permissão granular
  if (!hasAccess && requiredPermission) {
    if (user.permissions && user.permissions[requiredPermission]) {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    // Usuário logado mas sem o papel ou a permissão necessária.
    return <Navigate to="/vendas" state={{ from: location }} replace />;
  }

  // Se todas as verificações passarem, renderiza o componente filho (a rota protegida).
  return <Outlet />;
};

export default ProtectedRoute;