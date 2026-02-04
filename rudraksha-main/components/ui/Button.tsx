
import React, { useRef, useEffect } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particles = useRef<any[]>([]);

  // Cleanup
  useEffect(() => {
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const createParticles = (x: number, y: number, theme: string) => {
    const count = theme === 'theme_midnight' ? 20 : theme === 'theme_royal' ? 12 : 8;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (theme === 'theme_midnight' ? 4 : 2) + 1;
      
      particles.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: Math.random() * 0.03 + 0.02,
        size: Math.random() * 3 + 1,
        theme
      });
    }
    
    if (!animationRef.current) {
        animate();
    }
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.current.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      // Theme Physics
      if (p.theme === 'theme_royal') {
          p.vy += 0.2; // Gravity for gold dust
          p.size *= 0.95;
      } else if (p.theme === 'theme_sky') {
          p.vy -= 0.1; // Float up for clouds
          p.size += 0.2; // Expand
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      
      if (p.theme === 'theme_midnight') {
          // Star Burst
          ctx.fillStyle = '#fff';
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#6366f1';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
      } else if (p.theme === 'theme_royal') {
          // Gold Diamonds
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.rect(p.x, p.y, p.size * 2, p.size * 2);
          ctx.fill();
      } else if (p.theme === 'theme_sky') {
          // Cloud Puffs
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
      } else {
          // Default Ripple/Nature
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, (1 - p.life) * 30, 0, Math.PI * 2);
          ctx.stroke();
      }
      
      ctx.restore();

      if (p.life <= 0) {
        particles.current.splice(index, 1);
      }
    });

    if (particles.current.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      animationRef.current = 0;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.disabled) return;
    
    // Get active theme from body attribute set by Layout
    const theme = document.body.getAttribute('data-theme') || 'default';
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Setup Canvas Resolution
    if (canvasRef.current) {
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
    }

    createParticles(x, y, theme);
    if (props.onClick) props.onClick(e);
  };

  const baseStyles = "relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95 hover:shadow-md overflow-hidden";
  
  const variants = {
    primary: "bg-red-700 text-white hover:bg-red-800 focus:ring-red-600 shadow-sm hover:shadow-red-500/30 border border-transparent",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-orange-50 focus:ring-orange-500 hover:border-orange-300",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-red-500/30 border border-transparent",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm hover:shadow-green-500/30 border border-transparent",
    ghost: "bg-transparent text-gray-600 hover:bg-orange-100 hover:text-red-700 focus:ring-gray-500 hover:shadow-none border border-transparent",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-6 text-lg",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      onClick={handleClick}
      {...props}
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none z-0" 
      />
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};
