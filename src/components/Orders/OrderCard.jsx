// src/components/Orders/OrderCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const OrderCard = ({ order }) => {
  // Formatear la fecha de creación
  const formatDate = (timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Link 
      to={`/pedido/${order.id}`}
      className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{order.id}</h3>
        <p className="text-sm text-gray-500 mb-4">
          Creado el {formatDate(order.fechaCreacion)}
        </p>
        
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Participantes:</p>
          
          {order.usuarios && order.usuarios.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {order.usuarios.map((usuario, index) => (
                <span 
                  key={usuario.id + index}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {usuario.nombre}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aún no hay participantes</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default OrderCard;