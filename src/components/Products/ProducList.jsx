// src/components/Products/ProductList.jsx
import React from 'react';
import ProductCard from './ProductCard';

const ProductList = ({ products, selectedProducts, onToggleProduct, userFavorites, onToggleFavorite }) => {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay productos disponibles en esta categoría.</p>
      </div>
    );
  }

  // Ordenar los productos alfabéticamente por nombre
  const sortedProducts = [...products].sort((a, b) => 
    a.nombre.localeCompare(b.nombre)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedProducts.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          isSelected={selectedProducts.includes(product.id)}
          isFavorite={userFavorites.includes(product.id)}
          onToggleSelect={() => onToggleProduct(product.id)}
          onToggleFavorite={() => onToggleFavorite(product.id)}
        />
      ))}
    </div>
  );
};

export default ProductList;

  