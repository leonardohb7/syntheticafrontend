'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

/**
 * O que as animações do portal precisam saber sobre o ambiente.
 *
 * Mora fora dos componentes porque o seletor de trilha e a recomposição dos
 * filtros usam os dois, e duplicar um hook de preferência de movimento é o tipo
 * de cópia que uma hora diverge.
 */

/**
 * Responde se o sistema pede movimento reduzido.
 *
 * A parte visual disso está no `globals.css`, em media query. O hook existe
 * porque o JS também precisa saber: é ele quem conta quanto cada troca dura e
 * quem decide se vale animar altura.
 */
export function usaMovimentoReduzido(): boolean {
  const [reduzido, setReduzido] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduzido(consulta.matches);

    const aoMudar = (evento: MediaQueryListEvent) => setReduzido(evento.matches);
    consulta.addEventListener('change', aoMudar);
    return () => consulta.removeEventListener('change', aoMudar);
  }, []);

  return reduzido;
}

/**
 * `useLayoutEffect` que não reclama na renderização do servidor.
 *
 * Medir e começar animação precisa acontecer antes da pintura: com `useEffect`,
 * o navegador chega a pintar um quadro do conteúdo novo já no lugar, e só
 * depois ele salta para a posição inicial da animação. No servidor não há
 * layout nem pintura, então lá o `useEffect` serve igual e evita o aviso.
 */
export const useEfeitoDeLayout = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
