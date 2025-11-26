import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Componente de Modal reutilizável
const Modal = ({ isOpen, onClose, children, size = 'md' }) => {
  if (!isOpen) return null;

  // O controle de tamanho agora é feito diretamente no DialogContent
  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-7xl',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded-lg shadow-xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh]`}>
        {/* O conteúdo do modal agora é passado diretamente aqui */}
        {/* O botão de fechar já vem embutido no DialogContent */}
        <div className="overflow-y-auto pr-4 -mr-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;