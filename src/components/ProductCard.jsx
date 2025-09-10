import React from 'react';
import Button from './Button.jsx';

const ProductCard = ({ product, onComprarClick }) => (
  <div className="bg-gray-900 p-6 rounded-2xl shadow-xl hover:shadow-green-500/20 transition-all duration-300 transform hover:-translate-y-2 group flex flex-col animate-fade-in">
    <div className="flex-shrink-0">
      <img src={product.image} alt={product.name} className="w-full h-84 object-cover rounded-xl mb-4 group-hover:scale-105 transition-transform duration-300 bg-gray-800" />
    </div>
    <div className="flex-grow flex flex-col">
      <h3 className="text-xl font-semibold mb-2 flex-grow">{product.name}</h3>
      {product.description && (
        <p className="text-gray-400 mb-4 text-sm">{product.description}</p>
      )}
    </div>
    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800">
      <span className="text-2xl font-bold text-green-400">{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
      <Button size="sm" className="hover:scale-105" onClick={() => onComprarClick(product)}>
        Comprar
      </Button>
    </div>
  </div>
);

export default ProductCard;