'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Trilha } from '@/types';
import { usaMovimentoReduzido, useEfeitoDeLayout } from '@/hooks/movimento';

/**
 * A troca do acervo quando o filtro muda dentro de uma trilha.
 *
 * Funciona como a travessia do `PainelTrilha`, e de propósito: o portal ganha
 * um gesto só, arrastar, e o que muda é o eixo. Horizontal é trocar de trilha,
 * porque são dois recortes irmãos, lado a lado. Vertical é filtrar dentro de
 * uma, porque é a mesma lista sendo substituída por outra versão dela mesma.
 *
 * O sentido vertical vem da fileira de chips, que é horizontal: andar para a
 * direita faz o conteúdo descer, andar para a esquerda faz subir. É o que
 * amarra os dois eixos, e é por isso que o componente recebe a posição do
 * filtro na fileira, e não só a identidade dele.
 *
 * O eixo vertical tem uma diferença que não é de gosto. Na horizontal, o
 * `overflow-x: hidden` que já existia no portal apara o que passa da borda, e
 * por isso o acervo pode sair da tela inteira. Na vertical não há nada aparando:
 * o que sobe atravessaria o cabeçalho e o que desce criaria barra de rolagem.
 * Então aqui quem corta é o próprio palco, e o percurso é a altura dele, não a
 * da janela.
 *
 * Este componente não anima quando a trilha muda: nesse caso quem conduz é a
 * travessia horizontal, e duas animações ao mesmo tempo contariam a mesma
 * história duas vezes, uma por cima da outra.
 */

/* Mesma curva da travessia, tempo menor: o percurso aqui é a altura do acervo,
   e não a largura da janela. Quem encerra é o `animationend`, e não este
   número, que fica como rede de segurança e precisa continuar igual ao do
   `globals.css`. */
const MS_DESLIZE = 500;
const MS_REDUZIDO = 150;

interface TransicaoDeFiltroProps {
  /**
   * A identidade do recorte que está em `children`: categoria e busca juntas,
   * porque as duas mexem na lista do mesmo jeito. Mudou, o acervo é trocado.
   *
   * Como na trilha, o valor tem de descrever o que já está na tela, e não o que
   * a pessoa acabou de clicar: as duas listas aparecem ao mesmo tempo durante o
   * arrasto, então a animação só pode começar quando a nova existe.
   */
  filtro: string;
  /**
   * A posição desse filtro na fileira de chips, contando o "Todos" como zero.
   * É ela que decide o sentido: andar para a direita desce, para a esquerda
   * sobe. Busca não anda na fileira, então trocar o termo procurado mantém a
   * posição e o conteúdo sobe, que é o sentido de quem volta atrás.
   */
  posicao: number;
  /** A trilha desse filtro. Mudou junto, este componente cede a vez. */
  trilha: Trilha;
  children: React.ReactNode;
  className?: string;
}

export const TransicaoDeFiltro: React.FC<TransicaoDeFiltroProps> = ({
  filtro,
  posicao,
  trilha,
  children,
  className = '',
}) => {
  const reduzido = usaMovimentoReduzido();
  const [trocando, setTrocando] = useState(false);
  /* 1 desce, -1 sobe. Começa em -1 porque é o sentido de quem não andou para
     lado nenhum, que é o caso da busca. */
  const [sentido, setSentido] = useState(-1);
  /* Identifica cada arrasto e vira `key` das camadas, para a animação recomeçar
     do zero quando alguém troca de filtro com um arrasto ainda em curso. */
  const [ciclo, setCiclo] = useState(0);

  const palco = useRef<HTMLDivElement>(null);
  const camadaQueSai = useRef<HTMLDivElement>(null);
  const camadaQueEntra = useRef<HTMLDivElement>(null);

  const filtroAnterior = useRef(filtro);
  const posicaoAnterior = useRef(posicao);
  const trilhaAnterior = useRef(trilha);
  /* O que está pintado agora. Quando a página troca `children`, o React já teria
     descartado essa árvore, e sem a cópia não haveria o que arrastar para fora. */
  const ultimoConteudo = useRef<React.ReactNode>(children);
  const conteudoQueSai = useRef<React.ReactNode>(null);

  /* Efeito de layout para o navegador não chegar a pintar a lista nova já no
     lugar antes de o arrasto começar. */
  useEfeitoDeLayout(() => {
    const mudouOFiltro = filtroAnterior.current !== filtro;
    const mudouATrilha = trilhaAnterior.current !== trilha;
    const de = posicaoAnterior.current;

    filtroAnterior.current = filtro;
    /* Atualizada mesmo quando a animação não roda: a fileira de chips é outra a
       cada trilha, então posição de uma não se compara com posição da outra. */
    posicaoAnterior.current = posicao;
    trilhaAnterior.current = trilha;

    if (!mudouOFiltro || mudouATrilha) return;

    // Andou para a direita na fileira, desce. Para a esquerda ou parado, sobe.
    setSentido(posicao > de ? 1 : -1);
    /* O que sai de cena é sempre o que estava pintado, nunca `children`. No
       instante em que este efeito roda, `children` já é a lista nova: ela chegou
       no mesmo commit que trouxe o filtro novo. */
    conteudoQueSai.current = ultimoConteudo.current;
    setCiclo((numero) => numero + 1);
    setTrocando(true);
  }, [filtro, posicao, trilha]);

  /* Encerra quando a animação de verdade acaba. Cronômetro paralelo erra por um
     quadro de vez em quando, e o erro aparece como tranco na hora de parar. */
  useEffect(() => {
    if (!trocando) return;

    const entrando = camadaQueEntra.current;
    if (!entrando) return;

    const encerrar = (evento?: AnimationEvent) => {
      // `animationend` borbulha: só o fim do arrasto da própria camada conta.
      if (evento && evento.target !== entrando) return;
      conteudoQueSai.current = null;
      setTrocando(false);
    };

    entrando.addEventListener('animationend', encerrar);
    // Rede de segurança para aba em segundo plano, onde o evento pode não vir.
    const reserva = setTimeout(encerrar, (reduzido ? MS_REDUZIDO : MS_DESLIZE) + 400);

    return () => {
      entrando.removeEventListener('animationend', encerrar);
      clearTimeout(reserva);
    };
  }, [trocando, ciclo, reduzido]);

  useEfeitoDeLayout(() => {
    if (!trocando || reduzido) return;

    const elemento = palco.current;
    const saindo = camadaQueSai.current;
    const entrando = camadaQueEntra.current;
    if (!elemento || !saindo || !entrando) return;

    const alturaQueSai = saindo.offsetHeight;
    const alturaQueEntra = entrando.offsetHeight;

    /* O percurso é a maior das duas alturas, e não a de cada camada. O palco
       encolhe durante o arrasto, mas até terminar ele ainda tem a altura antiga:
       uma lista curta deslocada só da própria altura pararia visível dentro
       dele, em vez de sair de cena. */
    elemento.style.setProperty(
      '--sw-percurso',
      `${Math.max(alturaQueSai, alturaQueEntra)}px`
    );

    /* Filtrar pode passar de seis linhas para uma. Sem animar a altura, o rodapé
       sobe de uma vez no primeiro quadro, com o acervo antigo ainda subindo. */
    elemento.style.height = `${alturaQueSai}px`;
    /* Leitura descartada de propósito: força o navegador a assumir a altura
       inicial antes da linha seguinte, senão não há transição nenhuma. */
    void elemento.offsetHeight;
    elemento.style.height = `${alturaQueEntra}px`;

    return () => {
      elemento.style.height = '';
      elemento.style.removeProperty('--sw-percurso');
    };
  }, [trocando, ciclo, reduzido]);

  /* Guarda o que foi pintado. A camada que entra sempre mostra `children`, então
     a cópia é `children` mesmo. Efeito de renderização, e não de layout, para
     rodar depois do efeito da troca de filtro, que é quem precisa ler o valor do
     commit anterior. */
  useEffect(() => {
    ultimoConteudo.current = children;
  });

  return (
    <div
      ref={palco}
      className={`sw-filtro-palco ${className}`}
      /* Nome próprio, e não o `--sw-sentido` da trilha: este palco vive dentro
         daquele, e herdaria o sentido horizontal dele se dividissem a variável. */
      style={{ '--sw-sentido-y': sentido } as React.CSSProperties}
    >
      {trocando && (
        /* `inert` em vez de `aria-hidden`: por um instante existem duas listas no
           DOM, e a que está de saída não pode ser lida nem receber Tab. */
        <div key={`sai-${ciclo}`} ref={camadaQueSai} inert className="sw-filtro-camada-sai">
          {conteudoQueSai.current}
        </div>
      )}

      {/* A `key` só muda quando começa um arrasto novo, nunca quando ele termina:
          assim o fim da animação tira a classe sem remontar a lista que acabou
          de chegar. */}
      <div
        key={`entra-${ciclo}`}
        ref={camadaQueEntra}
        className={trocando ? 'sw-filtro-camada-entra' : undefined}
      >
        {children}
      </div>
    </div>
  );
};
