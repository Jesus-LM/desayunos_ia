// src/components/Products/CategorySelector.jsx
import React from 'react';

const CategorySelector = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: 'COMIDA', label: 'Comida' },
    { id: 'BEBIDA', label: 'Bebida' },
    { id: 'FAVORITOS', label: 'Favoritos' }
  ];

  return (
    <div className="flex border-b mb-6">
      {categories.map((category) => (
        <button
          key={category.id}
          className={`py-2 px-4 ${
            activeCategory === category.id
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => onCategoryChange(category.id)}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
};

export default CategorySelector;