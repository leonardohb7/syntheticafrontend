'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Confirmação de ação sem volta.
 *
 * Existe por um motivo só: o acervo vive em lista na memória do backend, sem
 * lixeira e sem histórico. Excluir é definitivo até o próximo restart do
 * servidor recarregar o seed, e um ensaio escrito no painel não está no seed.
 * Um clique errado na fileira apaga trabalho, então nada é excluído sem passar
 * por aqui.
 *
 * Vai para o `document.body` por portal, e não fica onde foi declarado, porque
 * o painel mora dentro do `AppShell`, que empilha cabeçalho fixo, fundo e
 * conteúdo em camadas. Renderizado lá dentro, o modal disputaria z-index com o
 * cabeçalho; no body ele só precisa estar acima de tudo uma vez.
 */

interface ModalConfirmacaoProps {
  aberto: boolean;
  titulo: string;
  /** O que será perdido, dito com o nome do ensaio, nunca "este item". */
  mensagem: React.ReactNode;
  rotuloConfirmar?: string;
  /** Enquanto corre, os dois botões travam e o de confirmar vira o aviso. */
  processando?: boolean;
  rotuloProcessando?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ModalConfirmacao: React.FC<ModalConfirmacaoProps> = ({
  aberto,
  titulo,
  mensagem,
  rotuloConfirmar = 'Confirmar',
  processando = false,
  rotuloProcessando = 'Processando',
  onConfirmar,
  onCancelar,
}) => {
  /* O portal só pode mirar o body depois da montagem no cliente: na
     renderização do servidor não existe `document`. */
  const [montado, setMontado] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;

    /* De onde o foco veio, para devolvê-lo ao fechar. Sem isso, o Tab depois de
       cancelar recomeçaria do topo da página, e não da fileira que a pessoa
       estava usando. */
    const origemDoFoco = document.activeElement as HTMLElement | null;

    /* O foco começa em Cancelar, e não em Excluir: quem chegou aqui por engano
       sai com um Enter, e quem quer mesmo excluir dá um Tab a mais. */
    cancelar.current?.focus();

    /* Trava a rolagem do fundo enquanto a cortina está no ar. O `html` do
       portal reserva o vão da barra com `scrollbar-gutter: stable`, então
       esconder o transbordo aqui não empurra a página para o lado. */
    const rolagemAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        /* Escape cancela, mas não no meio da exclusão: a requisição já saiu, e
           fechar agora deixaria a lista mostrando um ensaio que não existe
           mais até alguém recarregar. */
        if (!processando) onCancelar();
        return;
      }

      if (evento.key !== 'Tab') return;

      /* Prende o Tab dentro da caixa. Um modal que deixa o foco escapar para a
         página atrás é pior que nenhum: a pessoa continua clicando em botões
         que a cortina diz estarem desligados. */
      const focaveis = caixa.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focaveis?.length) return;

      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener('keydown', aoTeclar);

    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = rolagemAnterior;
      origemDoFoco?.focus();
    };
  }, [aberto, processando, onCancelar]);

  if (!aberto || !montado) return null;

  return createPortal(
    /* z-index acima do cabeçalho fixo, que está no 50. */
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      {/* A cortina. Escurece e desfoca o painel atrás, que é o que diz que a
          tabela está fora de alcance enquanto a pergunta não for respondida.
          Clicar fora cancela, pelo mesmo motivo do Escape. */}
      <div
        aria-hidden="true"
        onClick={() => !processando && onCancelar()}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <div
        ref={caixa}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sw-modal-titulo"
        aria-describedby="sw-modal-mensagem"
        /* 560px é a medida pedida para o painel. O `max-w` existe para a caixa
           não estourar a janela de um telefone, onde 560px não cabem. */
        className="sw-frame sw-ticks relative w-[560px] max-w-full bg-black p-8 sm:p-10"
      >
        <h2 id="sw-modal-titulo" className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent normal-case">
          {titulo}
        </h2>

        <div id="sw-modal-mensagem" className="mt-6 text-ink/60 text-[13px] leading-relaxed">
          {mensagem}
        </div>

        <div className="mt-10 pt-6 sw-rule flex items-center justify-end gap-3">
          <button
            ref={cancelar}
            type="button"
            onClick={onCancelar}
            disabled={processando}
            className="sw-btn px-6 py-2.5 disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={processando}
            className="sw-btn sw-btn-solid px-6 py-2.5 disabled:opacity-60"
          >
            {processando ? rotuloProcessando : rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
