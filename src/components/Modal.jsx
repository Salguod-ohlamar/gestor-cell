import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Componente de Modal reutilizável
const Modal = ({ isOpen, onClose, children, title, description, size = 'md' }) => {
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
      <DialogContent className={`bg-card text-card-foreground p-6 rounded-lg shadow-xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh]`}>
        <DialogHeader>
          {title && <DialogTitle className="text-2xl font-bold text-center mb-2">{title}</DialogTitle>}
          {description && <DialogDescription className="text-center text-muted-foreground mb-4">{description}</DialogDescription>}
        </DialogHeader>
        <div className="overflow-y-auto pr-4 -mr-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;