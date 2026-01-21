import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  icon, 
  isLoading,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-1 focus:ring-offset-transparent active:scale-[0.98]";
  
  const variants = {
    // Soft Blue Gradient, Raised
    primary: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 border-t border-white/20 hover:shadow-blue-500/30 hover:to-blue-500",
    
    // White/Glass, Embossed feel
    secondary: "bg-white/70 border border-white/60 text-slate-600 shadow-sm hover:bg-white hover:text-slate-800 hover:shadow-md backdrop-blur-sm",
    
    // Soft Red
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:border-red-200 shadow-sm",
    
    // Transparent
    ghost: "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;