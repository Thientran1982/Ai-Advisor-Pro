
import React, { useId } from 'react';

interface BrandLogoProps {
  variant?: 'icon' | 'full' | 'text-only';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  lightMode?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'full', size = 'md', className = '', lightMode = false }) => {
  const sizeClasses = {
    sm: { icon: 'w-6 h-6', text: 'text-lg', gap: 'gap-2', subText: 'text-[0.5em]' },
    md: { icon: 'w-10 h-10', text: 'text-xl', gap: 'gap-3', subText: 'text-[0.45em]' }, // Slightly larger icon for impact
    lg: { icon: 'w-16 h-16', text: 'text-3xl', gap: 'gap-4', subText: 'text-[0.4em]' },
    xl: { icon: 'w-24 h-24', text: 'text-6xl', gap: 'gap-5', subText: 'text-[0.35em]' },
  };

  const currentSize = sizeClasses[size];
  const textColor = lightMode ? 'text-white' : 'text-slate-900';
  
  const id = useId(); 
  const gradPrimary = `${id}-primary`;
  const gradAccent = `${id}-accent`;

  return (
    <div className={`flex items-center ${currentSize.gap} ${className} font-sans select-none group`}>
      {/* 1. ICON MARK: THE ORBITAL APEX (Designed on 100x100 Grid) */}
      {(variant === 'icon' || variant === 'full') && (
        <div className={`relative flex-shrink-0 ${currentSize.icon}`}>
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform transition-transform duration-500 ease-out group-hover:scale-105 group-hover:rotate-3">
            <defs>
                {/* PRIMARY: Deep Space Intelligence (Indigo to Deep Blue) */}
                <linearGradient id={gradPrimary} x1="10" y1="100" x2="90" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#312E81" />   {/* Indigo 900 - Trust/Real Estate */}
                    <stop offset="100%" stopColor="#4F46E5" />  {/* Indigo 600 - Tech */}
                </linearGradient>
                
                {/* ACCENT: The Spark / Singularity (Cyan to Electric Blue) */}
                <linearGradient id={gradAccent} x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#22D3EE" />    {/* Cyan 400 - AI/Future */}
                    <stop offset="100%" stopColor="#3B82F6" />  {/* Blue 500 - Clarity */}
                </linearGradient>
                
                {/* SHADOW for Depth */}
                <filter id={`${id}-drop`} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4F46E5" floodOpacity="0.25"/>
                </filter>
            </defs>

            {/* SHAPE 1: The Foundation (The 'A' / The Mountain) */}
            {/* Solid, stable, pointing upwards. Represents Real Estate Assets. */}
            <path 
                d="M50 12 L88 88 H12 L50 12 Z" 
                stroke={`url(#${gradPrimary})`}
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-90"
            />

            {/* SHAPE 2: The Orbit (The Galaxy/Data Stream) */}
            {/* A swoosh cutting through, representing AI processing data. */}
            <path 
                d="M20 75 Q 50 25 80 75" 
                stroke={`url(#${gradAccent})`} 
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                filter={`url(#${id}-drop)`}
                className="opacity-100"
            />
            
            {/* SHAPE 3: The North Star (The AI Core) */}
            {/* Perfectly centered at the apex intersection. Guidance. */}
            <circle 
                cx="50" cy="38" r="8" 
                fill="white"
                className="group-hover:animate-pulse"
            />
            <circle 
                cx="50" cy="38" r="8" 
                fill={`url(#${gradAccent})`}
                className="opacity-80 mix-blend-multiply" 
            />
          </svg>
        </div>
      )}

      {/* 2. TYPOGRAPHY: Kerning & Hierarchy */}
      {(variant === 'full' || variant === 'text-only') && (
        <div className="flex flex-col justify-center">
          <div className={`font-bold tracking-tight flex items-baseline leading-none ${currentSize.text} ${textColor}`}>
            Advisor
            <span className={`font-extrabold ml-[3px] ${lightMode ? 'text-cyan-300' : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500'}`}>
                Pro
            </span>
          </div>
          {size !== 'sm' && (
            <div className="flex items-center gap-2 mt-1 w-full">
                <div className={`h-[1px] flex-1 ${lightMode ? 'bg-indigo-300/30' : 'bg-slate-200'}`}></div>
                <span className={`${currentSize.subText} font-bold tracking-[0.2em] uppercase ${lightMode ? 'text-indigo-200' : 'text-slate-400'}`}>
                    AI Property
                </span>
                <div className={`h-[1px] flex-1 ${lightMode ? 'bg-indigo-300/30' : 'bg-slate-200'}`}></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
