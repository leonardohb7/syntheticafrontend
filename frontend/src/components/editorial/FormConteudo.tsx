'use client';

import React, { useRef, useState } from 'react';
import { Category, Content, ContentSection } from '@/types';
import { ContentInput } from '@/services/contentService';

/**
 * Formulário de ensaio do painel editorial.
 *
 * Serve ao cadastro e à edição, e não são dois componentes, porque o contrato
 * da API é de atualização por inteiro: o PUT recebe o mesmo corpo do POST, com
 * todos os campos, e não um remendo parcial. Dois formulários seriam a mesma
 * lista de campos duas vezes, com a garantia de divergirem na primeira mudança
 * de schema. O que muda entre um modo e outro cabe em três lugares: o título da
 * tela, o rótulo do botão e o valor inicial de cada campo.
 *
 * O recorte em duas colunas segue o que a escrita pede: à esquerda o que é
 * lido em prosa (título, subtítulo, resumo e as seções do ensaio), à direita o
 * que é preenchido uma vez e conferido de relance (categoria, assinatura, data,
 * tempo de leitura, destaque e selo).
 */

const NOME_DA_TRILHA: Record<string, string> = {
  velocidade: 'Velocidade',
  expressao: 'Expressão',
};

/** Erro que a API recusou, já com o status para a tela saber o que marcar. */
export interface ErroDeEnvio {
  mensagem: string;
  status: number;
}

/* Do nome de campo da API para o do formulário. É o mesmo mapa que o
   `contentService` aplica nos dados, aqui aplicado às mensagens de recusa: o
   Pydantic responde o 422 nomeando o campo em português, e é o campo em inglês
   que está na tela para ser aceso. Sem isto, o editor leria "subtitulo: Field
   required" sem nada marcado no formulário. */
const CAMPO_DA_API: Record<string, keyof ValoresDoForm> = {
  slug: 'slug',
  titulo: 'title',
  subtitulo: 'subtitle',
  resumo: 'summary',
  categoria_id: 'categoryId',
  tempo_leitura: 'readTime',
  data: 'date',
  autor: 'author',
  autor_cargo: 'authorRole',
  selo_editorial: 'editorialBadge',
};

interface ValoresDoForm {
  title: string;
  slug: string;
  subtitle: string;
  summary: string;
  categoryId: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  editorialBadge: string;
  featured: boolean;
}

type ErrosDoForm = Partial<Record<keyof ValoresDoForm | string, string>>;

const SECAO_VAZIA: ContentSection = { heading: '', text: '', quote: '', callout: '' };

/**
 * Converte um título no slug que vira URL do ensaio.
 *
 * O `normalize` separa a letra do acento, e o `\p{Mn}` apaga o que sobrou: a
 * marca que não ocupa espaço próprio, que é a forma que todo acento assume
 * depois da decomposição. Sem esta linha "Expressão" viraria "express-o",
 * porque o "ã" não passa no filtro de a-z0-9.
 */
function paraSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Valores iniciais. Em cadastro é tudo em branco, em edição é o que existe. */
function valoresIniciais(conteudo?: Content | null): ValoresDoForm {
  return {
    title: conteudo?.title ?? '',
    slug: conteudo?.slug ?? '',
    subtitle: conteudo?.subtitle ?? '',
    summary: conteudo?.summary ?? '',
    /* Fica em branco aqui de propósito: o `Content` guarda o slug da categoria,
       não o id, e resolver um pelo outro precisa da lista de categorias, que
       este trecho não tem em mãos. Quem preenche é o inicializador do estado,
       logo abaixo. */
    categoryId: '',
    author: conteudo?.author ?? '',
    authorRole: conteudo?.authorRole ?? '',
    date: conteudo?.date ?? '',
    readTime: conteudo?.readTime ?? '',
    editorialBadge: conteudo?.editorialBadge ?? '',
    featured: Boolean(conteudo?.featured),
  };
}

interface FormConteudoProps {
  categorias: Category[];
  /** O ensaio em edição. Ausente significa cadastro novo. */
  conteudo?: Content | null;
  /** Corre enquanto a API não respondeu. Trava o envio e troca o rótulo. */
  salvando?: boolean;
  /** A última recusa da API, para virar banner e marca de campo. */
  erro?: ErroDeEnvio | null;
  /** Chamado ao mexer em qualquer campo, para a recusa anterior sair da tela. */
  onLimparErro?: () => void;
  onSalvar: (entrada: ContentInput) => void;
  onCancelar: () => void;
}

export const FormConteudo: React.FC<FormConteudoProps> = ({
  categorias,
  conteudo = null,
  salvando = false,
  erro = null,
  onLimparErro,
  onSalvar,
  onCancelar,
}) => {
  const editando = Boolean(conteudo);

  /* Inicialização de uma vez só, na montagem. Quem garante que os valores
     correspondem ao ensaio certo é a `key` que a página dá a este componente:
     trocar de ensaio remonta o formulário, em vez de sincronizar campo a campo
     e correr o risco de sobrescrever o que estava sendo digitado. */
  const [valores, setValores] = useState<ValoresDoForm>(() => {
    const iniciais = valoresIniciais(conteudo);

    /* A categoria vem do slug, que é o que o `Content` carrega. Resolver aqui,
       e não na página, mantém o formulário inteiro responsável pelo que
       preenche os próprios campos. */
    if (conteudo && !iniciais.categoryId) {
      iniciais.categoryId = categorias.find((cat) => cat.slug === conteudo.category)?.id ?? '';
    }

    return iniciais;
  });

  const [secoes, setSecoes] = useState<ContentSection[]>(() =>
    /* Ensaio novo abre com uma seção em branco: um formulário sem nenhum campo
       de texto não deixa claro que o corpo do ensaio se monta em blocos. */
    conteudo?.sections?.length ? conteudo.sections.map((secao) => ({ ...secao })) : [{ ...SECAO_VAZIA }]
  );

  const [erros, setErros] = useState<ErrosDoForm>({});

  /* Enquanto ninguém mexe no slug, ele acompanha o título. Assim que alguém o
     edita à mão, para de acompanhar: o slug é o endereço público do ensaio, e
     corrigir uma palavra do título não pode quebrar o link que já circulou.
     Na edição já nasce travado, pelo mesmo motivo. */
  const slugEditadoAMao = useRef(editando);

  const definir = <C extends keyof ValoresDoForm>(campo: C, valor: ValoresDoForm[C]) => {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));

    // Campo corrigido perde a marca na hora. A validação inteira roda no envio.
    setErros((anteriores) => {
      if (!anteriores[campo]) return anteriores;
      const copia = { ...anteriores };
      delete copia[campo];
      return copia;
    });

    onLimparErro?.();
  };

  const definirTitulo = (titulo: string) => {
    definir('title', titulo);
    if (!slugEditadoAMao.current) definir('slug', paraSlug(titulo));
  };

  const definirSlug = (slug: string) => {
    slugEditadoAMao.current = true;
    definir('slug', slug);
  };

  const alterarSecao = (indice: number, campo: keyof ContentSection, valor: string) => {
    setSecoes((anteriores) =>
      anteriores.map((secao, i) => (i === indice ? { ...secao, [campo]: valor } : secao))
    );

    setErros((anteriores) => {
      const chave = `secao-${indice}`;
      if (!anteriores[chave]) return anteriores;
      const copia = { ...anteriores };
      delete copia[chave];
      return copia;
    });

    onLimparErro?.();
  };

  const adicionarSecao = () => setSecoes((anteriores) => [...anteriores, { ...SECAO_VAZIA }]);

  const removerSecao = (indice: number) => {
    setSecoes((anteriores) => anteriores.filter((_, i) => i !== indice));
    /* As marcas de erro das seções são indexadas por posição, e remover uma do
       meio desloca todas as de baixo. Limpar é mais honesto que reindexar um
       estado que a próxima validação reconstrói inteiro. */
    setErros((anteriores) => {
      const copia: ErrosDoForm = {};
      for (const [chave, valor] of Object.entries(anteriores)) {
        if (!chave.startsWith('secao-')) copia[chave] = valor;
      }
      return copia;
    });
  };

  /**
   * Confere o que a API recusaria, antes de gastar a ida até ela.
   *
   * Não é a mesma checagem do backend nem substitui a dele: é a que evita que o
   * editor descubra um campo em branco só depois do envio. A do servidor
   * continua valendo, e o que ela recusar chega aqui pelo `erro`.
   */
  const validar = (): ErrosDoForm => {
    const encontrados: ErrosDoForm = {};
    const vazio = (campo: keyof ValoresDoForm) => !String(valores[campo]).trim();

    if (vazio('title')) encontrados.title = 'O ensaio precisa de título.';

    if (vazio('slug')) {
      encontrados.slug = 'O slug monta a URL do ensaio e não pode ficar vazio.';
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(valores.slug.trim())) {
      encontrados.slug = 'Use apenas letras minúsculas, números e hífen entre palavras.';
    }

    if (vazio('subtitle')) encontrados.subtitle = 'O subtítulo aparece sob o título no acervo.';
    if (vazio('summary')) encontrados.summary = 'O resumo é o que a capa do portal mostra.';
    if (vazio('categoryId')) encontrados.categoryId = 'Escolha a categoria: é dela que sai a trilha.';
    if (vazio('author')) encontrados.author = 'Assine com o personagem editorial.';
    if (vazio('authorRole')) encontrados.authorRole = 'O cargo aparece sob a assinatura.';
    if (vazio('date')) encontrados.date = 'Informe a data, no formato do acervo.';
    if (vazio('readTime')) encontrados.readTime = 'Informe o tempo de leitura.';

    if (!secoes.length) {
      encontrados.secoes = 'Um ensaio sem seção nenhuma abriria em branco no portal.';
    }

    secoes.forEach((secao, indice) => {
      if (!secao.text?.trim()) encontrados[`secao-${indice}`] = 'A seção precisa de texto.';
    });

    return encontrados;
  };

  /**
   * Traduz a recusa da API em marca de campo.
   *
   * O 409 é sempre do slug, que é o único campo único do contrato. O 422 do
   * Pydantic chega como "campo: motivo", separado por ponto e vírgula, já
   * montado assim pelo cliente HTTP. O 422 de categoria inexistente vem como
   * frase solta, sem nome de campo, e por isso fica só no banner.
   */
  const errosDaApi = (): ErrosDoForm => {
    if (!erro) return {};
    if (erro.status === 409) return { slug: erro.mensagem };
    if (erro.status !== 422) return {};

    const encontrados: ErrosDoForm = {};

    for (const parte of erro.mensagem.split(';')) {
      const [nome, ...resto] = parte.split(':');
      const campo = CAMPO_DA_API[nome.trim()];
      if (campo && resto.length) encontrados[campo] = resto.join(':').trim();
    }

    return encontrados;
  };

  const visiveis: ErrosDoForm = { ...erros, ...errosDaApi() };

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault();
    if (salvando) return;

    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;

    onSalvar({
      slug: valores.slug.trim(),
      title: valores.title.trim(),
      subtitle: valores.subtitle.trim(),
      categoryId: valores.categoryId,
      summary: valores.summary.trim(),
      readTime: valores.readTime.trim(),
      date: valores.date.trim(),
      author: valores.author.trim(),
      authorRole: valores.authorRole.trim(),
      featured: valores.featured,
      editorialBadge: valores.editorialBadge,
      /* Os três abaixo não têm campo na tela, e mesmo assim são reenviados. O
         PUT substitui o registro inteiro, então omiti-los apagaria, a cada
         edição, os aprendizados, os ensaios relacionados e o arquétipo que o
         seed trouxe. Um formulário que perde dado calado é pior que um campo a
         mais. */
      takeaways: conteudo?.takeaways ?? [],
      relatedSlugs: conteudo?.relatedSlugs ?? [],
      graphicArchetype: conteudo?.graphicArchetype,
      sections: secoes.map((secao) => ({
        heading: secao.heading?.trim() || undefined,
        text: secao.text.trim(),
        quote: secao.quote?.trim() || undefined,
        callout: secao.callout?.trim() || undefined,
      })),
    });
  };

  /* A trilha do que está sendo escrito, lida da categoria escolhida. Não existe
     estado para ela de propósito: ela é derivada aqui pelo mesmo motivo que a
     API a deriva na leitura, para não haver duas versões da mesma verdade. */
  const categoriaEscolhida = categorias.find((cat) => cat.id === valores.categoryId);
  const trilhaDerivada = categoriaEscolhida ? NOME_DA_TRILHA[categoriaEscolhida.trilha] : null;

  /** Props comuns de um campo de texto, para o markup não repetir dez vezes. */
  const props = (campo: keyof ValoresDoForm) => ({
    id: `campo-${campo}`,
    value: String(valores[campo]),
    'aria-invalid': visiveis[campo] ? true : undefined,
    'aria-describedby': visiveis[campo] ? `campo-${campo}-erro` : undefined,
  });

  return (
    <form onSubmit={enviar} noValidate>
      <div className="flex flex-wrap items-baseline justify-between gap-4 pb-6 border-b border-accent/30">
        <h2 className="font-mono text-sm tracking-[0.12em] text-white normal-case">
          {editando ? `Editando: ${conteudo?.title}` : 'Novo ensaio'}
        </h2>

        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/30">
          {editando ? `Id ${conteudo?.id}` : 'Cadastro'}
        </span>
      </div>

      {/* Duas colunas a partir do desktop: prosa à esquerda, metadados à
          direita. Abaixo disso elas empilham, e a ordem do DOM é a que vale,
          que é a de quem escreve: primeiro o texto, depois a ficha. */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_19rem] gap-x-12 gap-y-10 items-start">
        {/* ------------------------------------------------- coluna da prosa */}
        <div className="space-y-8 min-w-0">
          <Campo id="campo-title" rotulo="Título" erro={visiveis.title}>
            <input
              {...props('title')}
              type="text"
              onChange={(e) => definirTitulo(e.target.value)}
              placeholder="O que este ensaio defende"
              className="px-3.5 py-2.5 text-sm"
            />
          </Campo>

          <Campo
            id="campo-subtitle"
            rotulo="Subtítulo"
            erro={visiveis.subtitle}
            dica="Aparece sob o título, no índice do acervo."
          >
            <textarea
              {...props('subtitle')}
              rows={2}
              onChange={(e) => definir('subtitle', e.target.value)}
              placeholder="Uma linha que completa o título"
              className="px-3.5 py-2.5"
            />
          </Campo>

          <Campo
            id="campo-summary"
            rotulo="Resumo"
            erro={visiveis.summary}
            dica="É o texto de chamada na capa e na abertura do ensaio."
          >
            <textarea
              {...props('summary')}
              rows={4}
              onChange={(e) => definir('summary', e.target.value)}
              placeholder="O argumento do ensaio em poucas linhas"
              className="px-3.5 py-2.5"
            />
          </Campo>

          {/* ------------------------------------------------------- seções */}
          <div className="pt-2">
            <div className="flex items-baseline justify-between gap-4 pb-4 sw-rule">
              <span className="sw-label">Seções do ensaio</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/30">
                {String(secoes.length).padStart(2, '0')} blocos
              </span>
            </div>

            {visiveis.secoes && (
              <p role="alert" className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                {visiveis.secoes}
              </p>
            )}

            <div className="space-y-10 mt-8">
              {secoes.map((secao, indice) => (
                <fieldset key={indice} className="space-y-5">
                  <legend className="sr-only">Seção {indice + 1}</legend>

                  <div className="flex items-baseline justify-between gap-4">
                    <span className="sw-idx text-[11px]">
                      {String(indice + 1).padStart(2, '0')}
                    </span>

                    {/* A última seção não some: um ensaio sem bloco nenhum não
                        tem corpo, e a validação recusaria de qualquer jeito. */}
                    {secoes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerSecao(indice)}
                        className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40 hover:text-accent transition-colors"
                      >
                        Remover seção {indice + 1}
                      </button>
                    )}
                  </div>

                  <Campo id={`secao-${indice}-heading`} rotulo="Título da seção (opcional)">
                    <input
                      id={`secao-${indice}-heading`}
                      type="text"
                      value={secao.heading ?? ''}
                      onChange={(e) => alterarSecao(indice, 'heading', e.target.value)}
                      className="px-3.5 py-2.5 text-sm"
                    />
                  </Campo>

                  <Campo
                    id={`secao-${indice}-text`}
                    rotulo="Texto"
                    erro={visiveis[`secao-${indice}`]}
                  >
                    <textarea
                      id={`secao-${indice}-text`}
                      rows={7}
                      value={secao.text}
                      onChange={(e) => alterarSecao(indice, 'text', e.target.value)}
                      aria-invalid={visiveis[`secao-${indice}`] ? true : undefined}
                      aria-describedby={
                        visiveis[`secao-${indice}`] ? `secao-${indice}-text-erro` : undefined
                      }
                      placeholder="O corpo desta parte do ensaio"
                      className="px-3.5 py-2.5"
                    />
                  </Campo>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Campo
                      id={`secao-${indice}-quote`}
                      rotulo="Citação (opcional)"
                      dica="Sai em bloco, sempre como fala de quem assina."
                    >
                      <textarea
                        id={`secao-${indice}-quote`}
                        rows={3}
                        value={secao.quote ?? ''}
                        onChange={(e) => alterarSecao(indice, 'quote', e.target.value)}
                        className="px-3.5 py-2.5"
                      />
                    </Campo>

                    <Campo id={`secao-${indice}-callout`} rotulo="Destaque (opcional)">
                      <textarea
                        id={`secao-${indice}-callout`}
                        rows={3}
                        value={secao.callout ?? ''}
                        onChange={(e) => alterarSecao(indice, 'callout', e.target.value)}
                        className="px-3.5 py-2.5"
                      />
                    </Campo>
                  </div>
                </fieldset>
              ))}
            </div>

            <button type="button" onClick={adicionarSecao} className="sw-btn px-6 py-2.5 mt-8">
              Acrescentar seção
            </button>
          </div>
        </div>

        {/* --------------------------------------------- coluna dos metadados */}
        {/* Acompanha a rolagem: a lista de seções cresce bastante, e a ficha
            precisa continuar à vista enquanto o ensaio é escrito. */}
        <aside className="space-y-8 lg:sticky lg:top-24">
          <div>
            <Campo id="campo-categoryId" rotulo="Categoria" erro={visiveis.categoryId}>
              <select
                {...props('categoryId')}
                onChange={(e) => definir('categoryId', e.target.value)}
                className="px-3.5 py-2.5 text-[11px] uppercase tracking-[0.14em]"
              >
                <option value="">Escolha a categoria</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </Campo>

            {/* A trilha é informação, não campo: quem a define é a categoria
                logo acima, e mostrá-la aqui deixa isso explícito para quem
                escreve, em vez de virar uma regra que só o código sabe. */}
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/35">
              Trilha:{' '}
              <span className={trilhaDerivada ? 'text-accent' : 'text-ink/25'}>
                {trilhaDerivada ?? 'definida pela categoria'}
              </span>
            </p>
            <p className="mt-1.5 font-mono text-[10px] tracking-[0.06em] text-ink/25 leading-relaxed">
              Herdada, não escolhida. Trocar a categoria muda a trilha do ensaio.
            </p>
          </div>

          <Campo
            id="campo-slug"
            rotulo="Slug"
            erro={visiveis.slug}
            dica={
              editando
                ? 'Alterar o slug muda o endereço público e quebra links antigos.'
                : 'Sai do título sozinho. Editar à mão desliga esse acompanhamento.'
            }
          >
            <input
              {...props('slug')}
              type="text"
              onChange={(e) => definirSlug(e.target.value)}
              placeholder="slug-do-ensaio"
              className="px-3.5 py-2.5 text-[11px] tracking-[0.08em]"
            />
          </Campo>

          <Campo id="campo-author" rotulo="Autor" erro={visiveis.author}>
            <input
              {...props('author')}
              type="text"
              onChange={(e) => definir('author', e.target.value)}
              placeholder='Nome "Derby Name" Sobrenome'
              className="px-3.5 py-2.5 text-[11px] tracking-[0.08em]"
            />
          </Campo>

          <Campo id="campo-authorRole" rotulo="Cargo" erro={visiveis.authorRole}>
            <input
              {...props('authorRole')}
              type="text"
              onChange={(e) => definir('authorRole', e.target.value)}
              placeholder="Analista de pack"
              className="px-3.5 py-2.5 text-[11px] tracking-[0.08em]"
            />
          </Campo>

          <Campo
            id="campo-date"
            rotulo="Data"
            erro={visiveis.date}
            /* Sem valor inicial vindo do relógio da máquina: o portal é uma
               peça situada em 2047, e uma data do ano corrente preenchida
               sozinha desmentiria a moldura na primeira olhada. */
            dica="Escrita por extenso, como no acervo."
          >
            <input
              {...props('date')}
              type="text"
              onChange={(e) => definir('date', e.target.value)}
              placeholder="12 Março 2047"
              className="px-3.5 py-2.5 text-[11px] tracking-[0.08em]"
            />
          </Campo>

          <Campo id="campo-readTime" rotulo="Tempo de leitura" erro={visiveis.readTime}>
            <input
              {...props('readTime')}
              type="text"
              onChange={(e) => definir('readTime', e.target.value)}
              placeholder="6 min"
              className="px-3.5 py-2.5 text-[11px] tracking-[0.08em]"
            />
          </Campo>

          <Campo
            id="campo-editorialBadge"
            rotulo="Selo editorial (opcional)"
            erro={visiveis.editorialBadge}
            dica="Etiqueta curta, como Ensaio ou Perfil de pista."
          >
            <input
              {...props('editorialBadge')}
              type="text"
              onChange={(e) => definir('editorialBadge', e.target.value)}
              className="px-3.5 py-2.5 text-[11px] tracking-[0.08em]"
            />
          </Campo>

          <div>
            <span className="sw-label block mb-3">Destaque</span>

            {/* Caixa de marcar do sistema: o input de verdade fica escondido, e
                quem desenha o estado é o quadrado do `sw-check`. O foco de
                teclado continua no input, então o anel ciano aparece onde deve. */}
            <label className="inline-flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={valores.featured}
                onChange={(e) => definir('featured', e.target.checked)}
                className="sr-only peer"
              />
              <span
                aria-hidden="true"
                className={`sw-check peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-live peer-focus-visible:outline-offset-2 ${
                  valores.featured ? 'sw-check-on' : ''
                }`}
              >
                ×
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60 group-hover:text-ink transition-colors">
                Abre a capa do portal
              </span>
            </label>

            <p className="mt-3 font-mono text-[10px] tracking-[0.06em] text-ink/25 leading-relaxed">
              A capa mostra um destaque por vez, o primeiro que encontrar.
            </p>
          </div>
        </aside>
      </div>

      {/* ------------------------------------------------------ barra de ação */}
      <div className="mt-14 pt-6 border-t border-accent/30 space-y-6">
        {/* A recusa da API fica junto dos botões, que é onde a atenção está
            depois do envio. Os campos que ela nomeia já estão acesos acima. */}
        {erro && (
          <div className="border-l border-accent pl-5 py-1" role="alert">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              {erro.status === 409
                ? 'Slug já em uso'
                : erro.status === 422
                  ? 'Cadastro recusado'
                  : 'Não foi possível gravar'}
            </p>
            <p className="mt-2 text-ink/55 text-[13px] leading-relaxed">{erro.mensagem}</p>
          </div>
        )}

        {Object.keys(erros).length > 0 && (
          <p role="alert" className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            Revise os campos marcados antes de enviar.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={salvando}
            className="sw-btn px-6 py-3 disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={salvando}
            className="sw-btn sw-btn-solid px-8 py-3 disabled:opacity-60"
          >
            {salvando
              ? editando
                ? 'Salvando'
                : 'Criando'
              : editando
                ? 'Salvar alterações'
                : 'Publicar no acervo'}
          </button>
        </div>
      </div>
    </form>
  );
};

/* ------------------------------------------------------------------- campo */

interface CampoProps {
  id: string;
  rotulo: string;
  erro?: string;
  /** Explicação curta. Sai de cena quando o campo está em erro, para o vermelho
      não dividir a linha de baixo com uma instrução que já não é a urgente. */
  dica?: string;
  children: React.ReactNode;
}

/**
 * Rótulo, moldura e a linha de erro de um campo.
 *
 * Existe para que a marca de erro seja uma decisão só: a moldura ganha o
 * magenta e a mensagem nasce logo abaixo, com o id que o `aria-describedby` do
 * controle aponta. Espalhado campo a campo, isso divergiria no terceiro.
 */
const Campo: React.FC<CampoProps> = ({ id, rotulo, erro, dica, children }) => (
  <div>
    <label htmlFor={id} className="sw-label block mb-2">
      {rotulo}
    </label>

    <div className={`sw-field ${erro ? 'sw-field-erro' : ''}`}>{children}</div>

    {erro ? (
      <p
        id={`${id}-erro`}
        role="alert"
        className="mt-2 font-mono text-[10px] tracking-[0.08em] text-accent leading-relaxed"
      >
        {erro}
      </p>
    ) : dica ? (
      <p className="mt-2 font-mono text-[10px] tracking-[0.06em] text-ink/25 leading-relaxed">
        {dica}
      </p>
    ) : null}
  </div>
);
