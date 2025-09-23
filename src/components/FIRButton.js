import Link from 'next/link';
import React, { useState } from 'react';

const FIRButton = ({ children, onClick, href, className = '', variant = 'primary' }) => {
  const [isPressed, setIsPressed] = useState(false);

  // 🎨 Variantes de estilo
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-50',
    outline: 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-100',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  

  const baseClasses = `
    relative
    px-6 
    py-3 
    font-semibold 
    rounded-lg
    transform
    transition-all
    duration-200
    ease-in-out
    hover:shadow-lg
    active:scale-95
    ${isPressed ? 'scale-95' : ''}
    ${variantClasses[variant] || variantClasses.primary}
    ${className}
  `;

  if (href) {
    return (
      <Link
        href={href}
        className={baseClasses}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={baseClasses}
    >
      {children}
    </button>
  );
};

export default FIRButton;
