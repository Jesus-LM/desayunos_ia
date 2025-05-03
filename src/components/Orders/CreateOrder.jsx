// src/components/Orders/CreateOrder.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';

const CreateOrder = () => {
  const [orderName, setOrderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!orderName.trim()) {
      setError('Por favor, introduce un nombre para el pedido');
      return;
    }
    
    try {
      setLoading(true);
      
      // Crear un nuevo documento en la colección PEDIDOS con el nombre como ID
      const orderRef = doc(db, 'PEDIDOS', orderName);
      
      await setDoc(orderRef, {
        fechaCreacion: serverTimestamp(),
        usuarios: [
          {
            id: currentUser.email,
            nombre: userData.nombre,
            productos: []
          }
        ]
      });
      
      // Redirigir al detalle del pedido recién creado
      navigate(`/pedido/${orderName}`);
      
    } catch (err) {
      console.error('Error al crear pedido:', err);
      setError('Error al crear el pedido. Este nombre puede ya estar en uso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Crear Nuevo Pedido</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="orderName">
            Nombre del Pedido
          </label>
          <input
            id="orderName"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={orderName}
            onChange={(e) => setOrderName(e.target.value)}
            placeholder="Ej: Almuerzo Viernes"
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => navigate('/')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;