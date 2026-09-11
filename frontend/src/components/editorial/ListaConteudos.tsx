'use client';

import React from 'react';
import Link from 'next/link';
import { Content } from '@/types';

/**
 * Índice do acervo dentro do painel editorial.
 *
 * É uma `<table>` de verdade, e não uma pilha de divs estilizada, porque aqui o
 * dado é tabular: seis colunas comparáveis entre linhas, que é exatamente o que
 * leitor de tela navega melhor com cabeçalho de coluna anunciado. Nas telas
 * públicas o acervo é uma lista de links, e lá div é o certo.
 *
 * O desenho continua sendo o do sistema TERMINAL, que já pedia "linha, não
 * cartão": fileiras separadas por fio, sem zebra e sem caixa em volta.
 */

const NOME_DA_TRILHA: Record<string, string> = {
  velocidade: 'Velocidade',
  expressao: 'Expressão',
};

interface ListaConteudosProps {
  conteudos: Content[];
  onEditar: (conteudo: Content) => void;
  onExcluir: (conteudo: Content) => void;
  /** Verdadeiro quando há recorte de trilha ligado, o que muda o estado vazio. */
  filtrado?: boolean;
  onLimparFiltro?: () => void;
  /** Id do ensaio em operação no momento. A fileira dele espera, apagada. */
  idOcupado?: string | null;
}

/* Cabeçalho de coluna. O `sw-label` já é o rótulo do sistema, e a variante sem
   o prefixo `//` é a certa aqui: repetir o glifo seis vezes na mesma linha
   viraria ruído. */
const Coluna: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <th
    scope="col"
    className={`sw-label sw-label-bare pb-3 text-left font-normal whitespace-nowrap ${className}`}
  >
    {children}
  </th>
);

export const ListaConteudos: React.FC<ListaConteudosProps> = ({
  conteudos,
  onEditar,
  onExcluir,
  filtrado = false,
  onLimparFiltro,
  idOcupado = null,
}) => {
  if (conteudos.length === 0) {
    return (
      <div className="border-t border-accent/16 py-20 space-y-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
          Pista vazia
        </p>

        <p className="text-ink/45 text-[13px] leading-relaxed max-w-sm">
          {filtrado
            ? 'Nenhum ensaio assinado nesta trilha ainda. Troque a pista ou abra o acervo inteiro.'
            : 'O acervo está sem ensaios. Escreva o primeiro para o portal ter o que publicar.'}
        </p>

        {filtrado && onLimparFiltro && (
          <button type="button" onClick={onLimparFiltro} className="sw-btn px-6 py-2.5">
            Ver todas as pistas
          </button>
        )}
      </div>
    );
  }

  return (
    /* A tabela tem seis colunas e não encolhe até caber num telefone sem virar
       texto de uma letra por linha. Rolar na horizontal preserva a comparação
       entre fileiras, que é a razão de ser de uma tabela. */
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] border-collapse">
        <caption className="sr-only">
          Ensaios do acervo, com as ações de editar e excluir
        </caption>

        <thead>
          <tr className="border-b border-accent/30">
            <Coluna className="w-10">Nº</Coluna>
            <Coluna>Título</Coluna>
            <Coluna>Categoria</Coluna>
            <Coluna>Trilha</Coluna>
            <Coluna>Autor</Coluna>
            <Coluna>Data</Coluna>
            <Coluna className="text-right">Ações</Coluna>
          </tr>
        </thead>

        <tbody>
          {conteudos.map((conteudo, indice) => {
            const ocupado = conteudo.id === idOcupado;

            return (
              <tr
                key={conteudo.id}
                className={`group border-b border-accent/16 transition-colors hover:bg-accent/4 ${
                  /* A fileira em operação para de responder ao clique: um
                     segundo Excluir no mesmo ensaio, enquanto o primeiro corre,
                     voltaria 404 em vez de dizer que já foi. */
                  ocupado ? 'opacity-40 pointer-events-none' : ''
                }`}
              >
                <td className="sw-idx text-[11px] py-4 pr-4 align-top">
                  {String(indice + 1).padStart(2, '0')}
                </td>

                <td className="py-4 pr-6 align-top">
                  {/* O título leva ao ensaio publicado. É o caminho curto para
                      conferir no portal o que o painel acabou de gravar. */}
                  <Link
                    href={`/conteudo/${conteudo.slug}`}
                    className="text-[13px] text-ink/85 hover:text-white transition-colors"
                  >
                    {conteudo.title}
                  </Link>

                  <span className="block mt-1 font-mono text-[10px] tracking-[0.08em] text-ink/25">
                    /{conteudo.slug}
                  </span>
                </td>

                <td className="py-4 pr-6 align-top font-mono text-[11px] text-ink/55 whitespace-nowrap">
                  {conteudo.categoryName}
                </td>

                <td className="py-4 pr-6 align-top whitespace-nowrap">
                  <span className="sw-tag">
                    {NOME_DA_TRILHA[conteudo.trilha] ?? conteudo.trilha}
                  </span>
                </td>

                <td className="py-4 pr-6 align-top font-mono text-[11px] text-ink/55 whitespace-nowrap">
                  {conteudo.author}
                </td>

                <td className="py-4 pr-6 align-top font-mono text-[11px] text-ink/40 whitespace-nowrap">
                  {conteudo.date}
                </td>

                <td className="py-4 align-top text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => onEditar(conteudo)}
                      className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50 hover:text-white transition-colors"
                    >
                      {/* O nome do ensaio entra no rótulo lido em voz alta:
                          fora da fileira, "Editar" sozinho não diz o quê. */}
                      <span aria-hidden="true">Editar</span>
                      <span className="sr-only">Editar {conteudo.title}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onExcluir(conteudo)}
                      className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50 hover:text-accent transition-colors"
                    >
                      <span aria-hidden="true">Excluir</span>
                      <span className="sr-only">Excluir {conteudo.title}</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
