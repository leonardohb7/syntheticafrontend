'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* O painel editorial entra na mesma barra das quatro rotas de leitura, e não
   escondido atrás de uma URL que só quem escreveu o código conhece: ele é parte
   do que a entrega precisa mostrar funcionando, e a banca chega nele pelo menu.
   A marca de redação separa o que é portal do que é mesa de trabalho. */
const navItems = [
  { label: 'Início', path: '/' },
  { label: 'Descobrir', path: '/descobrir' },
  { label: 'Conectar', path: '/conectar' },
  { label: 'Participar', path: '/participar' },
  { label: 'Editorial', path: '/editorial', redacao: true },
];

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  /* usePathname devolve só o caminho, sem query, igual ao location.pathname
     que estava aqui: /descobrir?cat=regras continua batendo com /descobrir. */
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) =>
    pathname === path || (path !== '/' && pathname.startsWith(path));

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        isScrolled ? 'bg-black border-b border-accent/20' : 'border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between gap-8">
        <Link href="/" className="font-display text-xs sm:text-sm tracking-[0.2em] whitespace-nowrap">
          <span className="font-bold text-white">DERBY</span>
          <span className="text-accent"> SYNTHETICA</span>
        </Link>

        {/* A barra virou cinco itens mais a chamada, e em 768px isso já não
            cabia sem as letras se encavalarem. O menu compacto agora vale até
            o lg, onde há largura para os seis controles na mesma linha. */}
        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`font-mono text-[11px] uppercase tracking-[0.18em] pb-0.5 border-b transition-colors ${
                isActive(item.path)
                  ? 'text-white border-accent'
                  : item.redacao
                    ? 'text-accent/55 border-transparent hover:text-accent'
                    : 'text-ink/45 border-transparent hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/participar" className="hidden lg:inline-flex sw-btn px-4 py-2">
          Entre na pista
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden sw-btn w-10 h-10 text-sm"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {menuOpen ? '×' : '≡'}
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden bg-black border-t border-accent/20">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`sw-row px-6 py-4 font-mono text-[11px] uppercase tracking-[0.18em] ${
                isActive(item.path)
                  ? 'text-white'
                  : item.redacao
                    ? 'text-accent/55'
                    : 'text-ink/50'
              }`}
            >
              <span>{item.label}</span>
              <span className="sw-leader" />
              {isActive(item.path) && <span className="w-1.5 h-1.5 bg-accent" />}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
