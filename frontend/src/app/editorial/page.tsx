'use client';

import React, { useEffect, useState } from 'react';
import { contentService, ContentInput } from '@/services/contentService';
import { ErroDaApi } from '@/services/api';
import { Category, Content } from '@/types';
import { EstadoDeErro } from '@/components/common/EstadoDeErro';
import { FiltroTrilha, FiltroDeTrilha } from '@/components/editorial/FiltroTrilha';
import { ListaConteudos } from '@/components/editorial/ListaConteudos';
import { FormConteudo, ErroDeEnvio } from '@/components/editorial/FormConteudo';
import { ModalConfirmacao } from '@/components/editorial/ModalConfirmacao';

/**
 * Painel editorial do portal.
 *
 * É aqui que os quatro verbos do CRUD aparecem na interface. As outras rotas só
 * leem: quem cadastra, edita e remove ensaio é esta tela, e sem ela a API teria
 * escrita que nenhuma parte do portal exercita.
 *
 * Duas decisões estruturam o arquivo:
 *
 * O filtro vive em estado local, e não na URL como em `/descobrir`. Lá o
 * recorte é o que a pessoa quer compartilhar, e o link precisa abrir na trilha
 * certa. Aqui é ferramenta de trabalho de quem está com o painel aberto, e
 * levá-lo para a URL custaria uma fronteira de Suspense por causa do
 * `useSearchParams` para resolver problema que ninguém tem.
 *
 * O formulário substitui o índice em vez de aparecer abaixo dele. Ele tem duas
 * colunas e uma lista de seções que cresce sem limite: embaixo de uma tabela,
 * empurraria os botões de ação para fora da tela e deixaria dúvida sobre qual
 * ensaio está sendo editado.
 */

/* O que está em curso agora. Cada operação tem nome próprio na tela porque
   "carregando" não distingue uma gravação que ainda pode falhar de uma exclusão
   que já saiu. */
type Operacao = 'criando' | 'salvando' | 'excluindo' | null;

const ROTULO_DA_OPERACAO: Record<Exclude<Operacao, null>, string> = {
  criando: 'Criando ensaio',
  salvando: 'Salvando alterações',
  excluindo: 'Excluindo ensaio',
};

/** Recado de fim de operação. O tom decide se ele sai em magenta ou apagado. */
interface Aviso {
  texto: string;
  tom: 'ok' | 'falha';
}

export default function EditorialPage() {
  const [filtro, setFiltro] = useState<FiltroDeTrilha>('todas');

  const [categorias, setCategorias] = useState<Category[]>([]);
  const [conteudos, setConteudos] = useState<Content[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroDeCarga, setErroDeCarga] = useState<string | null>(null);
  /* Muda de valor para o efeito de carga rodar de novo. É o que recarrega o
     índice depois de cada gravação, e o que o botão de nova tentativa usa. */
  const [tentativa, setTentativa] = useState(0);

  const [modo, setModo] = useState<'indice' | 'formulario'>('indice');
  const [emEdicao, setEmEdicao] = useState<Content | null>(null);
  const [operacao, setOperacao] = useState<Operacao>(null);
  const [erroDeEnvio, setErroDeEnvio] = useState<ErroDeEnvio | null>(null);
  const [aExcluir, setAExcluir] = useState<Content | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  useEffect(() => {
    /* Trocar o filtro antes de a resposta anterior voltar deixaria a tabela com
       o recorte errado, pintado por uma consulta que já não vale. */
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      setErroDeCarga(null);

      try {
        const [cats, encontrados] = await Promise.all([
          contentService.getCategories(),
          contentService.getContents({ trilha: filtro === 'todas' ? undefined : filtro }),
        ]);

        if (cancelado) return;
        setCategorias(cats);
        setConteudos(encontrados);
      } catch (falha) {
        if (cancelado) return;
        /* Sem este ramo o painel ficaria em "Consultando acervo" para sempre,
           que na tela é a mesma coisa que uma página quebrada. */
        setErroDeCarga(falha instanceof Error ? falha.message : 'O acervo não respondeu.');
        setConteudos([]);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [filtro, tentativa]);

  /* O recado de sucesso se apaga sozinho. Ele confirma o que acabou de
     acontecer, e passado o instante da confirmação vira só ruído em cima de
     uma tabela que já mostra o resultado. A falha fica, porque ela pede
     decisão. */
  useEffect(() => {
    if (aviso?.tom !== 'ok') return;
    const espera = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(espera);
  }, [aviso]);

  const recarregar = () => setTentativa((numero) => numero + 1);

  const descreverFalha = (falha: unknown): ErroDeEnvio => ({
    mensagem: falha instanceof Error ? falha.message : 'A API não respondeu.',
    /* Status zero é a marca que o cliente HTTP usa para "a requisição nem
       chegou ao servidor", e o formulário precisa dela para não tratar uma
       queda de rede como recusa de campo. */
    status: falha instanceof ErroDaApi ? falha.status : 0,
  });

  const abrirCadastro = () => {
    setEmEdicao(null);
    setErroDeEnvio(null);
    setAviso(null);
    setModo('formulario');
  };

  const abrirEdicao = (conteudo: Content) => {
    setEmEdicao(conteudo);
    setErroDeEnvio(null);
    setAviso(null);
    setModo('formulario');
  };

  const fecharFormulario = () => {
    setModo('indice');
    setEmEdicao(null);
    setErroDeEnvio(null);
  };

  const salvar = async (entrada: ContentInput) => {
    setErroDeEnvio(null);
    setOperacao(emEdicao ? 'salvando' : 'criando');

    try {
      if (emEdicao) {
        await contentService.updateContent(emEdicao.id, entrada);
      } else {
        await contentService.createContent(entrada);
      }

      setAviso({
        texto: emEdicao
          ? `Alterações salvas em "${entrada.title}".`
          : `"${entrada.title}" entrou no acervo.`,
        tom: 'ok',
      });

      fecharFormulario();
      /* Recarrega da API em vez de costurar na lista o que acabou de ser
         enviado: os campos derivados (categoria, nome dela e trilha) só existem
         na resposta do servidor, e remontá-los aqui seria inventar uma segunda
         versão da regra que a API já aplica. */
      recarregar();
    } catch (falha) {
      /* A tela fica no formulário de propósito: o que foi digitado continua
         preenchido, e o erro acende o campo que causou a recusa. */
      setErroDeEnvio(descreverFalha(falha));
    } finally {
      setOperacao(null);
    }
  };

  const confirmarExclusao = async () => {
    if (!aExcluir) return;
    setOperacao('excluindo');

    try {
      await contentService.deleteContent(aExcluir.id);
      setAviso({ texto: `"${aExcluir.title}" saiu do acervo.`, tom: 'ok' });
      setAExcluir(null);
      recarregar();
    } catch (falha) {
      setAviso({ texto: descreverFalha(falha).mensagem, tom: 'falha' });
      /* Fecha mesmo na falha: o modal já fez a pergunta e foi respondido, e o
         motivo da recusa é lido melhor sobre a tabela, ao lado do ensaio que
         continua lá. */
      setAExcluir(null);
    } finally {
      setOperacao(null);
    }
  };

  return (
    <div className="px-6 sm:px-8 pt-32 pb-24">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <span className="sw-label">Acesso da redação</span>

          <h1 className="mt-4 text-[clamp(2rem,7vw,3.5rem)] tracking-[0.08em]">Painel editorial</h1>

          <p className="mt-6 text-ink/45 text-[13px] sm:text-sm leading-relaxed max-w-xl">
            A mesa onde o acervo é escrito. Cadastro, edição e remoção de ensaio falam direto
            com a API do portal, e o que for gravado aqui aparece em Descobrir na mesma hora.
          </p>
        </header>

        {/* Faixa de estado: o que está em curso e o que acabou de acontecer.
            Fica acima do conteúdo, e não junto de cada botão, porque a tela
            troca de vista entre uma coisa e outra, e o recado de uma gravação
            precisa sobreviver à volta do formulário para o índice. */}
        <div aria-live="polite" className="min-h-[1.5rem] mb-6">
          {operacao ? (
            <p className="sw-caret font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
              {ROTULO_DA_OPERACAO[operacao]}
            </p>
          ) : aviso ? (
            <p
              className={`font-mono text-[11px] tracking-[0.14em] ${
                aviso.tom === 'ok' ? 'text-ink/50' : 'text-accent'
              }`}
            >
              {aviso.tom === 'ok' ? '> ' : '! '}
              {aviso.texto}
            </p>
          ) : null}
        </div>

        {modo === 'formulario' ? (
          /* A `key` troca quando muda o ensaio editado, e é ela que remonta o
             formulário com os valores certos. Sem isso, sair de um ensaio e
             entrar em outro manteria em tela os campos do anterior, porque o
             estado do formulário é inicializado uma vez só. */
          <FormConteudo
            key={emEdicao?.id ?? 'novo'}
            categorias={categorias}
            conteudo={emEdicao}
            salvando={operacao === 'criando' || operacao === 'salvando'}
            erro={erroDeEnvio}
            onLimparErro={() => setErroDeEnvio(null)}
            onSalvar={salvar}
            onCancelar={fecharFormulario}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
              <FiltroTrilha
                valor={filtro}
                onChange={setFiltro}
                total={carregando ? null : conteudos.length}
              />

              {/* A ação principal da tela, e a única chapa magenta dela. */}
              <button type="button" onClick={abrirCadastro} className="sw-btn sw-btn-solid px-6 py-3">
                Novo ensaio
              </button>
            </div>

            {carregando && conteudos.length === 0 ? (
              <p className="sw-caret py-20 font-mono text-[11px] uppercase tracking-[0.24em] text-ink/40">
                Consultando acervo
              </p>
            ) : erroDeCarga ? (
              <EstadoDeErro className="py-16" mensagem={erroDeCarga} onTentarDeNovo={recarregar} />
            ) : (
              <ListaConteudos
                conteudos={conteudos}
                onEditar={abrirEdicao}
                onExcluir={setAExcluir}
                filtrado={filtro !== 'todas'}
                onLimparFiltro={() => setFiltro('todas')}
                idOcupado={operacao === 'excluindo' ? aExcluir?.id ?? null : null}
              />
            )}
          </>
        )}
      </div>

      <ModalConfirmacao
        aberto={Boolean(aExcluir)}
        titulo="Excluir do acervo"
        processando={operacao === 'excluindo'}
        rotuloProcessando="Excluindo"
        rotuloConfirmar="Excluir ensaio"
        onConfirmar={confirmarExclusao}
        onCancelar={() => setAExcluir(null)}
        mensagem={
          <>
            <p>
              <span className="text-ink/85">{aExcluir?.title}</span> sai do acervo e a página{' '}
              <span className="font-mono text-[12px] text-accent">/conteudo/{aExcluir?.slug}</span>{' '}
              passa a responder que o ensaio não existe.
            </p>
            <p className="mt-4">
              {/* O aviso é literal: os dados vivem em lista na memória do
                  backend, então só o que está no seed volta num restart. */}
              Não há como desfazer pelo painel. Um ensaio escrito aqui não está no seed, e por
              isso não volta quando o servidor reinicia.
            </p>
          </>
        }
      />
    </div>
  );
}
