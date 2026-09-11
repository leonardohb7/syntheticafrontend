'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Trilha } from '@/types';
import { usaMovimentoReduzido, useEfeitoDeLayout } from '@/hooks/movimento';

/**
 * Seletor de trilha do portal público.
 *
 * É a microinteração escolhida para a entrega de Design Essential & Motion
 * Graphics, e o briefing de Framework Application manda reaproveitar o mesmo
 * componente no React: o que o vídeo mostra é o que este arquivo faz.
 *
 * São duas peças que só fazem sentido juntas, por isso o mesmo arquivo:
 * `SeletorTrilha` desenha as abas e o traço que desliza entre elas, e
 * `PainelTrilha` arrasta o acervo inteiro para fora da tela enquanto o da
 * outra trilha entra pelo lado oposto.
 *
 * O filtro de três posições do painel editorial ("Todas as pistas") é outro
 * componente. Os dois compartilham a linguagem visual, não o comportamento:
 * aqui sempre existe uma trilha escolhida, e é justamente isso que permite
 * tratar a seleção como aba, no padrão ARIA de tabs, em vez de como filtro.
 *
 * O desenho (traço de 1px, bloom curto, acento magenta) mora no `globals.css`,
 * junto do resto do sistema TERMINAL, nas classes com prefixo `sw-trilha`.
 */

/* A ordem importa duas vezes: ela decide a posição das abas e o sentido em que
   o conteúdo atravessa a tela. */
const TRILHAS: { id: Trilha; rotulo: string }[] = [
  { id: 'velocidade', rotulo: 'Velocidade' },
  { id: 'expressao', rotulo: 'Expressão' },
];

/** Trilha assumida quando a URL não diz qual é. O seletor nunca fica vazio. */
export const TRILHA_PADRAO: Trilha = 'velocidade';

/**
 * Converte o que veio do query param em trilha válida.
 *
 * Link antigo ou URL digitada à mão cai no padrão, em vez de deixar a página
 * pedir `?trilha=qualquercoisa` para a API e receber 422.
 */
export function lerTrilha(valor: string | null | undefined): Trilha {
  return TRILHAS.some((trilha) => trilha.id === valor) ? (valor as Trilha) : TRILHA_PADRAO;
}

const indiceDa = (trilha: Trilha) => TRILHAS.findIndex((item) => item.id === trilha);

/* Ids fixos porque aba e painel precisam se apontar, e existe um seletor por
   tela. Se algum dia houver dois na mesma página, isto vira useId com o valor
   passado por prop. */
const ID_DO_PAINEL = 'sw-trilha-painel';
const idDaAba = (trilha: Trilha) => `sw-trilha-aba-${trilha}`;

/* O traço continua nos 180ms do briefing de Motion: ele percorre a largura de
   uma aba, não a da tela. A travessia do conteúdo é bem mais longa que os 200ms
   e 320ms do briefing original porque a distância também é: atravessar a janela
   inteira naquele tempo lê como corte, não como movimento.

   Quem encerra a travessia é o evento `animationend`, e não estes números: o
   relógio do setTimeout e o da animação correm separados, e o desencontro de um
   quadro entre eles era um tranco no fim do percurso. Eles ficam como rede de
   segurança, e por isso precisam continuar iguais aos do `globals.css`. */
const MS_DESLIZE = 600;
/* Movimento reduzido troca a travessia por uma fusão só, e ela dura 150ms. */
const MS_REDUZIDO = 150;

interface SeletorTrilhaProps {
  trilha: Trilha;
  onTrilhaChange: (trilha: Trilha) => void;
  className?: string;
}

/**
 * As duas abas e o traço que desliza entre elas.
 *
 * Não guarda qual trilha está ativa: quem manda é a URL da página, para o link
 * ser compartilhável. O componente só desenha o estado e avisa o clique.
 *
 * O traço responde ao clique na hora, sem esperar a API. É ele que confirma que
 * o clique foi recebido enquanto o acervo novo ainda está a caminho.
 */
export const SeletorTrilha: React.FC<SeletorTrilhaProps> = ({
  trilha,
  onTrilhaChange,
  className = '',
}) => {
  const abas = useRef<(HTMLButtonElement | null)[]>([]);
  const [medida, setMedida] = useState<{ x: number; largura: number } | null>(null);
  const [pronto, setPronto] = useState(false);

  const indiceAtivo = indiceDa(trilha);

  useEfeitoDeLayout(() => {
    const medir = () => {
      const ativa = abas.current[indiceAtivo];
      if (!ativa) return;
      setMedida({ x: ativa.offsetLeft, largura: ativa.offsetWidth });
    };

    medir();

    /* A largura de uma aba muda depois da primeira medida em dois momentos que
       nenhum evento de clique cobre: quando a fonte do next/font termina de
       carregar e quando a janela reflui. Sem observar, o traço fica com a
       largura do texto na fonte de fallback. */
    const observador = new ResizeObserver(medir);
    abas.current.forEach((aba) => aba && observador.observe(aba));
    return () => observador.disconnect();
  }, [indiceAtivo]);

  useEffect(() => {
    /* A transição só liga depois que a primeira medida foi pintada. Sem esta
       espera, abrir um link que já vem com `?trilha=expressao` faria o traço
       deslizar da esquerda sozinho, como se alguém tivesse clicado. */
    const quadro = requestAnimationFrame(() => setPronto(true));
    return () => cancelAnimationFrame(quadro);
  }, []);

  /**
   * Setas movem o foco, Enter e Espaço é que trocam a trilha.
   *
   * É a ativação manual do padrão ARIA de tabs, e não a automática, porque
   * cada troca dispara uma requisição e uma travessia de tela inteira: com
   * ativação automática, atravessar as abas pelo teclado viraria uma sequência
   * de animações canceladas pela metade.
   */
  const aoTeclar = (evento: React.KeyboardEvent<HTMLButtonElement>, indice: number) => {
    const destinos: Record<string, number> = {
      ArrowRight: indice + 1,
      ArrowLeft: indice - 1,
      Home: 0,
      End: TRILHAS.length - 1,
    };

    const destino = destinos[evento.key];
    if (destino === undefined) return;

    evento.preventDefault();
    // O resto circula: da última seta para a direita volta para a primeira.
    abas.current[(destino + TRILHAS.length) % TRILHAS.length]?.focus();
  };

  return (
    <div role="tablist" aria-label="Trilhas do portal" className={`sw-trilha-abas ${className}`}>
      {TRILHAS.map((item, indice) => {
        const ativa = item.id === trilha;

        return (
          <button
            key={item.id}
            ref={(elemento) => {
              abas.current[indice] = elemento;
            }}
            id={idDaAba(item.id)}
            type="button"
            role="tab"
            aria-selected={ativa}
            aria-controls={ID_DO_PAINEL}
            /* Tabulação rotativa: o Tab entra e sai do grupo de abas de uma
               vez, e a navegação entre elas fica com as setas. */
            tabIndex={ativa ? 0 : -1}
            onClick={() => onTrilhaChange(item.id)}
            onKeyDown={(evento) => aoTeclar(evento, indice)}
            className={`sw-trilha-aba ${ativa ? 'sw-trilha-aba-on' : ''}`}
          >
            {/* Numeral de índice: decoração do sistema TERMINAL, não faz parte
                do nome da aba, e por isso sai da leitura de tela. */}
            <span aria-hidden="true" className="sw-idx text-[10px]">
              {String(indice + 1).padStart(2, '0')}
            </span>
            {item.rotulo}
          </button>
        );
      })}

      <span
        aria-hidden="true"
        className="sw-trilha-indicador"
        data-pronto={pronto ? 'sim' : 'nao'}
        style={{
          /* Largura zero até a primeira medida: melhor ausente por um quadro
             do que aceso na posição errada. */
          width: medida?.largura ?? 0,
          transform: `translateX(${medida?.x ?? 0}px)`,
        }}
      />
    </div>
  );
};

interface PainelTrilhaProps {
  /**
   * A trilha do conteúdo que está em `children`, e não a que a pessoa acabou de
   * clicar. A diferença é o ponto central deste componente: a travessia mostra
   * o acervo que sai e o que entra ao mesmo tempo, então ela só pode começar
   * quando o conteúdo novo já existe. Quem faz esse controle é a página, que
   * sabe quando a resposta da API chegou.
   */
  trilha: Trilha;
  children: React.ReactNode;
  className?: string;
}

/**
 * O palco onde o acervo de uma trilha sai e o da outra entra.
 *
 * Durante a travessia existem duas camadas: a que sai vira absoluta, para não
 * empurrar nada, e a que entra ocupa o fluxo normal. As duas usam a mesma
 * duração e a mesma curva, o que as mantém coladas, como uma tira única sendo
 * puxada de lado.
 *
 * O conteúdo que sai é o do quadro anterior, guardado em ref: quando a página
 * troca `children`, o React já teria descartado aquela árvore, e sem essa cópia
 * não haveria o que arrastar para fora.
 */
export const PainelTrilha: React.FC<PainelTrilhaProps> = ({ trilha, children, className = '' }) => {
  const reduzido = usaMovimentoReduzido();
  const [trocando, setTrocando] = useState(false);
  const [sentido, setSentido] = useState(1);
  /* Identifica cada travessia. Vira `key` das duas camadas, e é o que faz a
     animação recomeçar do zero quando alguém clica na outra aba com uma
     travessia ainda em curso: sem remontar, o CSS manteria a animação antiga
     rodando e ela mudaria de sentido no meio do caminho. */
  const [ciclo, setCiclo] = useState(0);

  const palco = useRef<HTMLDivElement>(null);
  const camadaQueSai = useRef<HTMLDivElement>(null);
  const camadaQueEntra = useRef<HTMLDivElement>(null);

  const trilhaAnterior = useRef(trilha);
  /* O que está pintado agora, candidato a sair de cena na próxima troca. */
  const ultimoConteudo = useRef<React.ReactNode>(children);
  const conteudoQueSai = useRef<React.ReactNode>(null);

  /* Efeito de layout, e não de renderização: a travessia precisa estar armada
     antes da pintura. Com `useEffect` o navegador chega a pintar um quadro com
     o acervo novo já parado no lugar, e só então ele salta para fora da tela
     para começar a atravessar. */
  useEfeitoDeLayout(() => {
    // Na montagem as duas são iguais: abrir a página não é trocar de trilha.
    if (trilhaAnterior.current === trilha) return;

    const de = indiceDa(trilhaAnterior.current);
    const para = indiceDa(trilha);
    trilhaAnterior.current = trilha;

    /* O acervo sai para o lado contrário ao da aba escolhida, e o novo chega do
       lado dela, seguindo o traço. */
    setSentido(para > de ? 1 : -1);
    /* O que atravessa para fora é sempre o que estava pintado, nunca `children`.
       No instante em que este efeito roda, `children` já é o acervo novo: ele
       chegou no mesmo commit que trouxe a trilha nova. */
    conteudoQueSai.current = ultimoConteudo.current;
    setCiclo((numero) => numero + 1);
    setTrocando(true);
  }, [trilha]);

  /* Encerra a travessia quando a animação de verdade acaba, e não quando um
     cronômetro paralelo acha que ela acabou. Um quadro de diferença entre os
     dois bastava para as camadas serem tiradas ainda em movimento, o que se
     sentia como um tranco na hora de parar. */
  useEffect(() => {
    if (!trocando) return;

    const entrando = camadaQueEntra.current;
    if (!entrando) return;

    const encerrar = (evento?: AnimationEvent) => {
      /* `animationend` borbulha: só o fim da travessia da própria camada
         encerra a troca, não o de alguma animação lá dentro. */
      if (evento && evento.target !== entrando) return;

      conteudoQueSai.current = null;
      setTrocando(false);
    };

    entrando.addEventListener('animationend', encerrar);
    /* Rede de segurança: em aba de segundo plano o navegador engaveta a
       animação e o evento pode nunca chegar, o que deixaria as duas camadas na
       tela para sempre. */
    const reserva = setTimeout(encerrar, (reduzido ? MS_REDUZIDO : MS_DESLIZE) + 400);

    return () => {
      entrando.removeEventListener('animationend', encerrar);
      clearTimeout(reserva);
    };
  }, [trocando, ciclo, reduzido]);

  /* Guarda o que foi pintado. A camada que entra sempre mostra `children`, então
     aqui a cópia é `children` mesmo, sem condição. Efeito de renderização, e não
     de layout, para rodar depois do efeito da troca de trilha, que é quem
     precisa ler o valor do commit anterior. */
  useEffect(() => {
    ultimoConteudo.current = children;
  });

  useEfeitoDeLayout(() => {
    if (!trocando || reduzido) return;

    const elemento = palco.current;
    const saindo = camadaQueSai.current;
    const entrando = camadaQueEntra.current;
    if (!elemento || !saindo || !entrando) return;

    /* As duas trilhas têm acervos de tamanhos diferentes, e a camada que sai é
       absoluta: sem prender a altura, o rodapé saltaria para a altura do acervo
       novo no primeiro quadro, antes de o antigo terminar de atravessar. */
    const alturaQueSai = saindo.offsetHeight;
    const alturaQueEntra = entrando.offsetHeight;

    elemento.style.height = `${alturaQueSai}px`;
    /* Leitura descartada de propósito: força o navegador a assumir a altura
       inicial antes da próxima linha, senão ele só enxerga o valor final e não
       há transição nenhuma. */
    void elemento.offsetHeight;
    elemento.style.height = `${alturaQueEntra}px`;

    return () => {
      elemento.style.height = '';
    };
  }, [trocando, ciclo, reduzido]);

  return (
    <div
      ref={palco}
      id={ID_DO_PAINEL}
      role="tabpanel"
      aria-labelledby={idDaAba(trilha)}
      className={`sw-trilha-palco ${className}`}
      style={{ '--sw-sentido': sentido } as React.CSSProperties}
    >
      {trocando && (
        /* `inert` em vez de `aria-hidden`: por um instante existem dois acervos
           no DOM, e o que está de saída não pode ser lido nem receber Tab.
           Marcar só com aria-hidden deixaria links focáveis escondidos. */
        <div key={`sai-${ciclo}`} ref={camadaQueSai} inert className="sw-trilha-camada-sai">
          {conteudoQueSai.current}
        </div>
      )}

      {/* A `key` só muda quando começa uma travessia nova, nunca quando ela
          termina: assim o fim da animação tira a classe sem remontar o acervo
          que acabou de chegar. */}
      <div
        key={`entra-${ciclo}`}
        ref={camadaQueEntra}
        className={trocando ? 'sw-trilha-camada-entra' : undefined}
      >
        {children}
      </div>
    </div>
  );
};
