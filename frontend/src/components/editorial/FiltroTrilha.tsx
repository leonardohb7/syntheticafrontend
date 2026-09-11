'use client';

import React, { useRef } from 'react';
import { Trilha } from '@/types';

/**
 * Filtro de trilha do painel editorial.
 *
 * É parente do `SeletorTrilha` do portal público, e não o mesmo componente, por
 * uma diferença que não é de aparência: lá sempre existe uma trilha escolhida,
 * aqui existe o estado "todas". Essa terceira posição muda o padrão de
 * acessibilidade e muda o significado do controle.
 *
 * No portal, como a seleção nunca é vazia e cada recorte é uma vista irmã do
 * acervo, o conjunto é um grupo de abas: `tablist`, com o painel do conteúdo
 * anunciado como `tabpanel`. Aqui não há vista irmã nenhuma, há uma tabela só
 * sendo recortada, e "todas as pistas" é ausência de recorte, que é coisa que
 * aba não sabe representar. Por isso o padrão é o de grupo de opções
 * (`radiogroup`), onde o estado de cada posição é marcado, não selecionado.
 *
 * A consequência prática: aqui a seta do teclado já troca o filtro, enquanto no
 * portal ela só move o foco. Lá a troca custa uma requisição e uma travessia de
 * tela inteira, e atravessar as abas pelo teclado viraria uma fila de animações
 * cortadas pela metade. Aqui ela troca o recorte de uma tabela, e esperar um
 * Enter seria cerimônia sem motivo.
 *
 * Unificar os dois exigiria um componente que aceita ou não o estado vazio, com
 * dois padrões ARIA e dois comportamentos de teclado dentro do mesmo arquivo: a
 * economia seria de linhas, e o custo seria a condição que decide qual dos dois
 * está valendo.
 */

/** O que o painel filtra. `todas` é o acervo inteiro, sem recorte de trilha. */
export type FiltroDeTrilha = Trilha | 'todas';

/* A ordem é a da fileira na tela, e o estado sem recorte vem primeiro porque é
   o padrão: quem abre o painel quer ver tudo o que existe. */
const OPCOES: { id: FiltroDeTrilha; rotulo: string }[] = [
  { id: 'todas', rotulo: 'Todas as pistas' },
  { id: 'velocidade', rotulo: 'Velocidade' },
  { id: 'expressao', rotulo: 'Expressão' },
];

interface FiltroTrilhaProps {
  valor: FiltroDeTrilha;
  onChange: (valor: FiltroDeTrilha) => void;
  /** Quantos ensaios o recorte atual devolveu. Some enquanto a consulta corre. */
  total?: number | null;
  className?: string;
}

export const FiltroTrilha: React.FC<FiltroTrilhaProps> = ({
  valor,
  onChange,
  total = null,
  className = '',
}) => {
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Setas andam pela fileira e já trocam o filtro, como manda o padrão de grupo
   * de opções. O foco acompanha a escolha, senão a próxima seta partiria de
   * onde a pessoa não está.
   */
  const aoTeclar = (evento: React.KeyboardEvent<HTMLButtonElement>, indice: number) => {
    const destinos: Record<string, number> = {
      ArrowRight: indice + 1,
      ArrowDown: indice + 1,
      ArrowLeft: indice - 1,
      ArrowUp: indice - 1,
      Home: 0,
      End: OPCOES.length - 1,
    };

    const destino = destinos[evento.key];
    if (destino === undefined) return;

    evento.preventDefault();
    // As pontas circulam: da última seta para a direita volta para a primeira.
    const alvo = (destino + OPCOES.length) % OPCOES.length;
    botoes.current[alvo]?.focus();
    onChange(OPCOES[alvo].id);
  };

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-3 ${className}`}>
      <div role="radiogroup" aria-label="Filtrar o acervo por trilha" className="flex flex-wrap items-center gap-2">
        {OPCOES.map((opcao, indice) => {
          const marcada = opcao.id === valor;

          return (
            <button
              key={opcao.id}
              ref={(elemento) => {
                botoes.current[indice] = elemento;
              }}
              type="button"
              role="radio"
              aria-checked={marcada}
              /* Tabulação rotativa: o Tab entra e sai do grupo de uma vez, e o
                 passeio entre as posições fica com as setas. */
              tabIndex={marcada ? 0 : -1}
              onClick={() => onChange(opcao.id)}
              onKeyDown={(evento) => aoTeclar(evento, indice)}
              className={`sw-chip px-3.5 py-1.5 cursor-pointer select-none ${
                marcada ? 'sw-chip-on' : ''
              }`}
            >
              {opcao.rotulo}
            </button>
          );
        })}
      </div>

      {/* Contador no vocabulário do acervo. Fica ao lado do filtro, e não sobre
          a tabela, porque é do recorte que ele fala. */}
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/30">
        {total === null
          ? 'Consultando'
          : `${String(total).padStart(2, '0')} ${total === 1 ? 'ensaio' : 'ensaios'}`}
      </span>
    </div>
  );
};
