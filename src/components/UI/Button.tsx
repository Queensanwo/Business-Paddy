'use client';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'send' | 'chip' | 'menu' | 'back';
  children: React.ReactNode;
}

export function Button({ variant = 'send', children, className = '', ...props }: ButtonProps) {
  const variantClass = variant ? ` ${variant}` : '';
  return (
    <button className={`button${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}