
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon'; // full includes text, icon is just the mask
}

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", variant = 'icon' }) => {
  const logoUrl = "https://iili.io/fgyxLsn.md.png";

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img 
        src={logoUrl} 
        alt="Rudraksha Logo" 
        draggable="false"
        className="w-full h-full object-contain rounded-[25%] drop-shadow-[0_0_15px_rgba(220,38,38,0.5)] pointer-events-none select-none"
      />
    </div>
  );
};
