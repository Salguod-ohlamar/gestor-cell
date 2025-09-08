import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  as: Component = 'button', 
  className, 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white shadow-lg border border-transparent',
    secondary: 'bg-gray-800/50 border border-green-500/50 text-green-400 hover:bg-green-400 hover:text-white shadow-lg',
    icon: 'hover:bg-gray-800 text-green-400',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-3 text-base',
    icon: 'p-2',
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};

export default Button;