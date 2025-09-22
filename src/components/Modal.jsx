import React from 'react';

// Componente de Modal reutilizável
const Modal = ({ isOpen, onClose, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-7xl',
  };

  return (
    // Overlay
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4"
      onClick={onClose} // Fecha o modal ao clicar no fundo
    >
      {/* Conteúdo do Modal */}
      <div
        className={`bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8 rounded-2xl shadow-xl w-full ${sizeClasses[size]} relative`}
        onClick={e => e.stopPropagation()} // Impede que o clique dentro do modal o feche
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white text-3xl leading-none" aria-label="Fechar modal">
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;