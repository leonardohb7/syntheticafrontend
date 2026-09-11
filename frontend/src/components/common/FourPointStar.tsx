import React from 'react';

interface FourPointStarProps {
  size?: number;
  className?: string;
  /** 0–100. Preenche a estrela de baixo para cima; sem valor, ela vem cheia. */
  fillPercent?: number;
}

const STAR_PATH = `M 50 2
  C 50 28, 28 50, 2 50
  C 28 50, 50 72, 50 98
  C 50 72, 72 50, 98 50
  C 72 50, 50 28, 50 2 Z`;

/**
 * A marca. Estrela de 4 pontas em contorno magenta que se preenche de branco
 * conforme a carga avança — o único elemento com brilho real no sistema, e só
 * na tela de abertura.
 */
export const FourPointStar: React.FC<FourPointStarProps> = ({
  size = 80,
  className = '',
  fillPercent,
}) => {
  const isProgressive = typeof fillPercent === 'number';
  const progress = Math.max(0, Math.min(100, fillPercent ?? 100));

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      style={{
        filter: `drop-shadow(0 0 ${4 + (progress / 100) * 10}px rgba(255, 46, 151, ${
          0.35 + (progress / 100) * 0.5
        }))`,
      }}
    >
      {isProgressive && <path d={STAR_PATH} stroke="#FF2E97" strokeWidth="1.2" />}

      <g
        style={
          isProgressive
            ? { clipPath: `inset(${100 - progress}% 0 0 0)`, transition: 'clip-path 80ms linear' }
            : undefined
        }
      >
        <path d={STAR_PATH} fill="#FFFFFF" />
      </g>
    </svg>
  );
};
