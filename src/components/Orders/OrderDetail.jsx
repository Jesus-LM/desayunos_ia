// src/components/Orders/OrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { toggleFavorito } from '../../firebase/firestore';
import ProductList from '../Products/ProducList';
import OrderSummary from './OrderSummary';

const OrderDetail = () => {
  const { orderId } = useParams();
  const { currentUser, userData, refreshUserData } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('COMIDA');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  
  // Cargar datos del pedido y productos
  useEffect(() => {
    const fetchOrderAndProducts = async () => {
      try {
        // Obtener datos del pedido
        const orderRef = doc(db, 'PEDIDOS', orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (!orderDoc.exists()) {
          setError('El pedido no existe');
          return;
        }
        
        const orderData = {
          id: orderDoc.id,
          ...orderDoc.data()
        };
        
        setOrder(orderData);
        
        // Obtener usuario actual dentro del pedido
        const currentUserInOrder = orderData.usuarios.find(u => u.id === currentUser.email);
        if (currentUserInOrder) {
          setSelectedProducts(currentUserInOrder.productos || []);
        }
        
        // Obtener productos
        const productsCollection = collection(db, 'PRODUCTOS');
        const productsSnapshot = await getDocs(productsCollection);
        
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProducts(productsData);
        
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderAndProducts();
  }, [orderId, currentUser]);
  
  const handleToggleProduct = async (productId) => {
    let updatedSelectedProducts;
    
    if (selectedProducts.includes(productId)) {
      // Eliminar producto si ya está seleccionado
      updatedSelectedProducts = selectedProducts.filter(id => id !== productId);
    } else {
      // Añadir producto si no está seleccionado
      updatedSelectedProducts = [...selectedProducts, productId];
    }
    
    setSelectedProducts(updatedSelectedProducts);
    
    try {
      const orderRef = doc(db, 'PEDIDOS', orderId);
      const orderDoc = await getDoc(orderRef);
      const orderData = orderDoc.data();
      
      // Verificar si el usuario ya está en el pedido
      const userIndex = orderData.usuarios.findIndex(u => u.id === currentUser.email);
      
      if (userIndex >= 0) {
        // Actualizar productos del usuario existente
        orderData.usuarios[userIndex].productos = updatedSelectedProducts;
      } else {
        // Añadir nuevo usuario al pedido
        orderData.usuarios.push({
          id: currentUser.email,
          nombre: userData.nombre,
          productos: updatedSelectedProducts
        });
      }
      
      // Actualizar pedido en Firestore
      await updateDoc(orderRef, {
        usuarios: orderData.usuarios
      });
      
    } catch (err) {
      console.error('Error al actualizar productos:', err);
    }
  };
  
  // Función para manejar favoritos
  const handleToggleFavorite = async (productId) => {
    try {
      await toggleFavorito(currentUser.email, productId);
      // Actualizar los datos del usuario después de cambiar favoritos
      refreshUserData();
    } catch (err) {
      console.error('Error al actualizar favoritos:', err);
    }
  };
  
  const getFilteredProducts = () => {
    if (activeCategory === 'FAVORITOS') {
      return products.filter(product => userData.favoritos.includes(product.id));
    } else {
      return products.filter(product => product.tipo.toLowerCase() === activeCategory.toLowerCase());
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">{order.id}</h2>
          <p className="text-sm text-gray-500">
            {order.fechaCreacion.toDate().toLocaleDateString('es-ES')}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSummary(true)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Ver Resumen
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Volver
          </button>
        </div>
      </div>
      
      {/* Selector de categorías */}
      <div className="flex border-b mb-6">
        {['COMIDA', 'BEBIDA', 'FAVORITOS'].map((category) => (
          <button
            key={category}
            className={`py-2 px-4 ${
              activeCategory === category
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Lista de productos */}
      <ProductList
        products={getFilteredProducts()}
        selectedProducts={selectedProducts}
        onToggleProduct={handleToggleProduct}
        userFavorites={userData.favoritos}
        onToggleFavorite={handleToggleFavorite}
      />
      
      {/* Modal de resumen */}
      {showSummary && (
        <OrderSummary
          order={order}
          products={products}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
};

export default OrderDetail;