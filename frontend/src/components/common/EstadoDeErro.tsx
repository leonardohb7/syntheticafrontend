'use client';

import React from 'react';

interface EstadoDeErroProps {
  /** O que a camada de rede reportou. Vem do `detail` da API ou da falha de conexão. */
  mensagem?: string;
  /** Chamada curta, no vocabulário da tela onde o erro apareceu. */
  titulo?: string;
  /** Quando existe, desenha o botão de nova tentativa. */
  onTentarDeNovo?: () => void;
  className?: string;
}

/**
 * Aviso de acervo inacessível.
 *
 * Existe porque a alternativa, quando a API não responde, seria a tela ficar em
 * branco: os dados chegam por fetch no cliente, então uma falha silenciosa se
 * parece com uma página vazia, e quem está avaliando não tem como distinguir
 * uma coisa da outra.
 *
 * Segue o princípio de traço, não chapa: linha de 1px à esquerda em magenta,
 * sem painel de fundo e sem ícone de alerta.
 */
export const EstadoDeErro: React.FC<EstadoDeErroProps> = ({
  mensagem,
  titulo = 'Sinal perdido',
  onTentarDeNovo,
  className = '',
}) => (
  <div className={`border-l border-accent pl-6 py-2 space-y-4 ${className}`} role="alert">
    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">{titulo}</p>

    <p className="text-ink/45 text-[13px] leading-relaxed max-w-md">
      {mensagem || 'O acervo não respondeu. Confirme que o backend está no ar.'}
    </p>

    {onTentarDeNovo && (
      <button type="button" onClick={onTentarDeNovo} className="sw-btn px-6 py-2.5">
        Tentar de novo
      </button>
    )}
  </div>
);
