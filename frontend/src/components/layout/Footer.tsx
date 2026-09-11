import React from 'react';
import Link from 'next/link';

const links = [
  { label: 'Descobrir', path: '/descobrir' },
  { label: 'Conectar', path: '/conectar' },
  { label: 'Participar', path: '/participar' },
];

export const Footer: React.FC = () => (
  /* relative z-10 é obrigatório: o Backdrop é fixed com z-0 e um rodapé
     estático seria pintado por baixo dele, ou seja, invisível. */
  <footer className="relative z-10 mt-32 border-t border-accent/20">
    {/* Nota de autoria em fio próprio, acima da navegação: as assinaturas do
        acervo são personagens, e isso precisa estar dito em algum lugar que
        apareça em toda página, não só na página do ensaio. */}
    <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-8">
      <p className="font-mono text-[10px] leading-relaxed tracking-[0.08em] text-ink/30 max-w-3xl">
        Peça de ficção situada em 2047. O esporte, o vocabulário e as regras existem, e o
        estado de coisas descrito é especulação. As assinaturas do acervo são personagens
        editoriais, com nome de pista e cargo inventados: elas não correspondem a pessoas
        reais nem aos integrantes do grupo que construiu o Derby Synthetica.
      </p>
    </div>

    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
      <Link href="/" className="font-display text-[11px] tracking-[0.2em]">
        <span className="font-bold text-white">DERBY</span>
        <span className="text-accent"> SYNTHETICA</span>
      </Link>

      <nav className="flex items-center gap-6">
        {links.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/55 hover:text-accent transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Temporada fixa, e não o ano do sistema: o acervo é datado em 2047 e um
          rodapé com o ano corrente desmentiria a moldura na primeira olhada. */}
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
        Temporada 2047 · Flat track · Brasil
      </p>
    </div>
  </footer>
);
