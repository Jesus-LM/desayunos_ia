// src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './components/Auth/AuthContext';
import AppRoutes from './routes';
// import './index.css'; // Asumiendo que tienes un archivo CSS para los estilos

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;