// src/components/Products/ProductCard.jsx
import React from 'react';

const ProductCard = ({ product, isSelected, isFavorite, onToggleSelect, onToggleFavorite }) => {
  return (
    <div 
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onToggleSelect}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg">{product.nombre}</h3>
          <p className="text-sm text-gray-500 capitalize">{product.tipo}</p>
        </div>
        
        {/* Botón de favorito */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Evitar que se active el toggle de selección
            onToggleFavorite();
          }}
          className="text-2xl focus:outline-none"
          aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>
      
      {/* Indicador de selección */}
      {isSelected && (
        <div className="mt-2 flex items-center text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Seleccionado</span>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
  