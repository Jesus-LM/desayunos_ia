// src/hooks/useOrders.js
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersCollection = collection(db, 'PEDIDOS');
        const ordersSnapshot = await getDocs(ordersCollection);
        
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Ordenar por fecha de creación (más reciente primero)
        ordersData.sort((a, b) => b.fechaCreacion.toDate() - a.fechaCreacion.toDate());
        
        setOrders(ordersData);
      } catch (err) {
        console.error('Error al obtener pedidos:', err);
        setError('No se pudieron cargar los pedidos');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return { orders, loading, error };
};

export const useOrder = (orderId) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        const orderRef = doc(db, 'PEDIDOS', orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (!orderDoc.exists()) {
          setError('El pedido no existe');
          return;
        }
        
        setOrder({
          id: orderDoc.id,
          ...orderDoc.data()
        });
      } catch (err) {
        console.error('Error al obtener pedido:', err);
        setError('No se pudo cargar el pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return { order, loading, error };
};
