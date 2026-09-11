'use client';

import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Filtro de categoria/cidade. Retângulo de 1px que vira chapa magenta quando
 * ligado — sem ícone, sem glifo, sem gradiente.
 */
export const Chip: React.FC<ChipProps> = ({ children, active = false, className = '', onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`sw-chip px-3.5 py-1.5 ${active ? 'sw-chip-on' : ''} ${
      onClick ? 'cursor-pointer select-none' : 'cursor-default'
    } ${className}`}
  >
    {children}
  </button>
);
