import React from 'react';

interface SectionHeadProps {
  title: string;
  deck?: string;
  action?: React.ReactNode;
}

/**
 * Cabeçalho de seção: só o título e uma linha de apoio.
 *
 * A faixa que existia aqui — fio, `// 01 · RÓTULO` à esquerda e contagem à
 * direita — foi removida. Ela repetia em metadado o que o título já dizia e,
 * multiplicada por oito seções, virava a moldura mais insistente do site.
 * A separação entre seções fica por conta do espaço em branco.
 */
export const SectionHead: React.FC<SectionHeadProps> = ({ title, deck, action }) => (
  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10">
    <div className="space-y-3">
      <h2 className="text-2xl sm:text-3xl tracking-[0.08em]">{title}</h2>
      {deck && <p className="text-ink/45 text-[13px] leading-relaxed max-w-xl">{deck}</p>}
    </div>
    {action}
  </div>
);
