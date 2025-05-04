import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Login from './components/Auth/Login';
import OrderList from './components/Orders/OrderList';
import CreateOrder from './components/Orders/CreateOrder';
import OrderDetail from './components/Orders/OrderDetail';
import Loading from './components/Layout/Loading';
import { useAuth } from './hooks/useAuth';

// Componente de protección de rutas
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        {/* Rutas anidadas dentro del layout principal */}
        <Route index element={<Navigate to="/orders" replace />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/create" element={<CreateOrder />} />
        <Route path="orders/:orderId" element={<OrderDetail />} />
      </Route>
      
      {/* Ruta por defecto - redirige a la lista de pedidos */}
      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  );
};

export default AppRoutes;