// src/components/Orders/OrderSummary.jsx
import React, { useMemo } from 'react';

const OrderSummary = ({ order, products, onClose }) => {
  // Procesar y agrupar los productos del pedido
  const groupedProducts = useMemo(() => {
    const allProductsMap = {};
    
    // Crear un mapa de ID a producto para búsqueda rápida
    products.forEach(product => {
      allProductsMap[product.id] = product;
    });
    
    // Agrupar los productos por tipo y contar cantidades
    const result = {
      comida: {},
      bebida: {}
    };
    
    // Recorrer todos los usuarios y sus productos
    order.usuarios.forEach(user => {
      user.productos.forEach(productId => {
        const product = allProductsMap[productId];
        
        if (product) {
          const type = product.tipo.toLowerCase();
          
          if (!result[type][product.id]) {
            result[type][product.id] = {
              ...product,
              count: 1,
              users: [user.nombre]
            };
          } else {
            result[type][product.id].count += 1;
            result[type][product.id].users.push(user.nombre);
          }
        }
      });
    });
    
    return result;
  }, [order, products]);
  
  // Convertir objetos a arrays ordenados alfabéticamente
  const foodProducts = useMemo(() => {
    return Object.values(groupedProducts.comida).sort((a, b) => 
      a.nombre.localeCompare(b.nombre)
    );
  }, [groupedProducts]);
  
  const drinkProducts = useMemo(() => {
    return Object.values(groupedProducts.bebida).sort((a, b) => 
      a.nombre.localeCompare(b.nombre)
    );
  }, [groupedProducts]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Resumen de Pedidos</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {order.usuarios.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No hay productos en este pedido.</p>
          ) : (
            <div>
              {/* Sección Comida */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-blue-600">Comida</h3>
                {foodProducts.length > 0 ? (
                  <div className="space-y-2">
                    {foodProducts.map(product => (
                      <div key={product.id} className="border-b pb-2">
                        <div className="flex justify-between">
                          <div>
                            <span className="font-medium">{product.nombre}</span>
                            <span className="ml-2 text-gray-500">x{product.count}</span>
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Para: {product.users.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay productos de comida.</p>
                )}
              </div>
              
              {/* Sección Bebida */}
              <div>
                <h3 className="text-lg font-bold mb-3 text-blue-600">Bebida</h3>
                {drinkProducts.length > 0 ? (
                  <div className="space-y-2">
                    {drinkProducts.map(product => (
                      <div key={product.id} className="border-b pb-2">
                        <div className="flex justify-between">
                          <div>
                            <span className="font-medium">{product.nombre}</span>
                            <span className="ml-2 text-gray-500">x{product.count}</span>
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Para: {product.users.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay productos de bebida.</p>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-6 text-right">
            <button
              onClick={onClose}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;