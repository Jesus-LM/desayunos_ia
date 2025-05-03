// src/routes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './components/Auth/Login';
import OrderList from './components/Orders/OrderList';
import CreateOrder from './components/Orders/CreateOrder';
import OrderDetail from './components/Orders/OrderDetail';
import MainLayout from './components/Layout/MainLayout';
import Loading from './components/Layout/Loading';

// Componente para proteger rutas que requieren autenticación
const PrivateRoute = ({ children }) => {
  const { currentUser, userData } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (!userData) {
    return <Loading />;
  }
  
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
};

// Componente para dirigir usuarios autenticados al inicio
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (currentUser) {
    return <Navigate to="/" />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      
      <Route path="/" element={
        <PrivateRoute>
          <OrderList />
        </PrivateRoute>
      } />
      
      <Route path="/crear-pedido" element={
        <PrivateRoute>
          <CreateOrder />
        </PrivateRoute>
      } />
      
      <Route path="/pedido/:orderId" element={
        <PrivateRoute>
          <OrderDetail />
        </PrivateRoute>
      } />
      
      {/* Ruta para cualquier otra dirección no definida */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;