'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FourPointStar } from '@/components/common/FourPointStar';

interface SplashScreenProps {
  onComplete: () => void;
}

const DURATION = 2400;

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const pct = Math.min(100, Math.floor(((Date.now() - startTime) / DURATION) * 100));
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, []);

  const isDone = progress >= 100;

  const handleEnter = useCallback(() => {
    setIsClosing(true);
    setTimeout(onComplete, 450);
  }, [onComplete]);

  /* A carga não se pula: o listener só é registrado quando ela termina.
     Enter/Espaço antes dos 100% não fazem nada — sem isso, o teclado
     continuaria sendo o atalho que o botão "Pular" deixou de ser. */
  useEffect(() => {
    if (!isDone) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') handleEnter();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDone, handleEnter]);

  return (
    <div
      onClick={isDone ? handleEnter : undefined}
      className={`fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center gap-10 p-6 select-none transition-opacity duration-500 ${
        isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="sw-scan absolute inset-0 pointer-events-none" />

      <FourPointStar size={72} fillPercent={progress} />

      <div className="text-center space-y-3">
        <h1 className="text-[clamp(1.1rem,5vw,1.75rem)] tracking-[0.28em]">
          Derby Synthetica
        </h1>
        <p className="sw-caret font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent">
          Temporada 2047 · Flat track
        </p>
      </div>

      {/* Carga: um fio de 1px que se preenche, com a porcentagem ao lado. */}
      <div className="w-full max-w-[260px] flex items-center gap-4">
        <div className="flex-1 h-px bg-accent/20">
          <div
            className="h-px bg-accent shadow-[0_0_8px_rgba(255,46,151,0.8)] transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Sem zeros à esquerda. A largura é fixa porque era o padStart que
            segurava as quatro casas: sem ela, "9%" → "100%" empurraria o fio
            de carga a cada dígito novo. */}
        <span className="w-10 shrink-0 text-right font-mono text-[10px] tabular-nums tracking-[0.1em] text-ink/50">
          {progress}%
        </span>
      </div>

      {/* Altura reservada: o botão só nasce aos 100%, e sem o espaço guardado
          o bloco inteiro pularia para cima quando a carga terminasse. */}
      <div className="h-11 flex items-center">
        {isDone && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleEnter();
            }}
            className="sw-btn sw-btn-solid px-8 py-3 cursor-pointer"
          >
            Entrar
          </button>
        )}
      </div>
    </div>
  );
};
