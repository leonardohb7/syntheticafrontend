'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { contentService } from '@/services/contentService';
import { Content, Category, Trilha } from '@/types';
import { Chip } from '@/components/common/Chip';
import { EstadoDeErro } from '@/components/common/EstadoDeErro';
import { SeletorTrilha, PainelTrilha, lerTrilha } from '@/components/common/SeletorTrilha';
import { TransicaoDeFiltro } from '@/components/common/TransicaoDeFiltro';

/* Isolado porque aparece duas vezes: no conteúdo real e no fallback do
   Suspense, que é o que o next build pré-renderiza para esta rota. */
const Cabecalho: React.FC = () => (
  <header className="mb-14">
    <h1 className="text-[clamp(2rem,7vw,3.5rem)] tracking-[0.08em]">Descobrir</h1>
    <p className="mt-6 text-ink/45 text-[13px] sm:text-sm leading-relaxed max-w-xl">
      O flat track em 2047, lido em duas trilhas: Velocidade para tática, equipamento e
      arbitragem, Expressão para transmissão, som e cultura escrita da pista.
    </p>
  </header>
);

const Acervo: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  /* No App Router o useSearchParams é só leitura. A escrita vira uma navegação
     explícita, feita no selectCategory logo abaixo. */
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('cat') || 'all';
  /* A trilha vive na URL, e não em estado local, para o link ser
     compartilhável: mandar `/descobrir?trilha=expressao` abre a aba certa. */
  const activeTrilha = lerTrilha(searchParams.get('trilha'));

  const [categories, setCategories] = useState<Category[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [featured, setFeatured] = useState<Content | null>(null);
  /* A trilha que está na tela, que não é a mesma coisa que a trilha clicada.
     Entre uma e outra existe a ida à API, e a travessia do painel precisa dos
     dois acervos ao mesmo tempo: ela só pode começar quando o novo chega. Até
     lá o portal segue mostrando o antigo, com o traço do seletor já na aba
     nova avisando que o clique foi recebido. */
  const [trilhaExibida, setTrilhaExibida] = useState(activeTrilha);
  /* Mesma ideia para os filtros: o chip acende no clique, a letra aparece na
     hora, e a lista só é trocada quando a resposta chega. Sem isso o arrasto
     rodaria com a lista antiga dos dois lados, e o acervo novo entraria em corte
     seco logo depois.

     São dois estados, e não um só, porque a categoria ainda precisa ser
     consultada à parte: é dela que sai a posição na fileira de chips, que é o
     que decide se o conteúdo sobe ou desce. */
  const [categoriaExibida, setCategoriaExibida] = useState(activeCategory);
  const [buscaExibida, setBuscaExibida] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  /* O termo que já foi consultado, que fica para trás do campo enquanto a
     pessoa digita. Antes o acervo era pedido letra por letra; agora ele espera
     a digitação parar, o que também é o que torna a recomposição possível na
     busca: uma animação por termo procurado, e não uma por tecla. */
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  /* Só existe para o botão de nova tentativa reexecutar o efeito. */
  const [tentativa, setTentativa] = useState(0);

  const isUnfiltered = activeCategory === 'all' && !buscaAplicada;

  /* 280ms: tempo suficiente para uma digitação corrida não virar uma requisição
     por tecla, e curto o bastante para não parecer que o campo travou. */
  useEffect(() => {
    const espera = setTimeout(() => setBuscaAplicada(searchQuery), 280);
    return () => clearTimeout(espera);
  }, [searchQuery]);

  /* Limpar não é digitar: a espera existe para agrupar teclas, e aqui não há
     tecla nenhuma vindo atrás. Zerar os dois de uma vez também evita que o
     acervo seja pedido duas vezes, e recomposto duas vezes, quando o clique
     limpa a busca e a categoria juntas. */
  const limparBusca = () => {
    setSearchQuery('');
    setBuscaAplicada('');
  };

  useEffect(() => {
    /* O efeito dispara a cada tecla digitada na busca, e as respostas podem
       voltar fora de ordem. A trava descarta o resultado de uma consulta que
       já foi substituída, senão o acervo pisca com o filtro anterior. */
    let cancelado = false;

    async function carregarAcervo() {
      setLoading(true);
      setErro(null);

      try {
        const [cats, encontrados] = await Promise.all([
          contentService.getCategories(),
          contentService.getContents({
            trilha: activeTrilha,
            category: activeCategory !== 'all' ? activeCategory : undefined,
            search: buscaAplicada,
          }),
        ]);

        if (cancelado) return;

        setCategories(cats);
        setContents(encontrados);
        /* O destaque sai da lista que já veio, em vez de uma segunda chamada:
           sem filtro, `encontrados` é a trilha inteira, que é exatamente onde
           o destaque dela estaria. Pedir à parte custaria uma requisição por
           tecla digitada e ainda poderia emoldurar um ensaio da outra
           trilha. */
        setFeatured(
          isUnfiltered
            ? encontrados.find((conteudo) => conteudo.featured) ?? encontrados[0] ?? null
            : null
        );
      } catch (falha) {
        if (cancelado) return;

        /* Sem este ramo a tela ficaria presa em "Consultando acervo" para
           sempre, que é indistinguível de uma página vazia. */
        setErro(falha instanceof Error ? falha.message : 'O acervo não respondeu.');
        setContents([]);
        setFeatured(null);
      } finally {
        if (!cancelado) {
          setLoading(false);
          /* Só aqui, e não no clique: é este o instante em que `contents` passa
             a ser o acervo pedido, que é o que as animações precisam ter em mãos
             para trocar uma coisa por outra. Vale também quando a requisição
             falha, porque aí o que entra em cena é o erro. */
          setTrilhaExibida(activeTrilha);
          setCategoriaExibida(activeCategory);
          setBuscaExibida(buscaAplicada);
        }
      }
    }

    carregarAcervo();
    return () => {
      cancelado = true;
    };
  }, [activeTrilha, activeCategory, buscaAplicada, isUnfiltered, tentativa]);

  const selectCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') {
      params.delete('cat');
    } else {
      params.set('cat', slug);
    }
    const query = params.toString();
    /* replace, não push: trocar de chip é refinar a mesma tela, e empilhar
       histórico faria o botão Voltar percorrer filtro por filtro.
       scroll: false porque o padrão do App Router é subir ao topo a cada
       navegação, e aqui o clique acontece no meio da página. */
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const selectTrilha = (trilha: Trilha) => {
    const params = new URLSearchParams(searchParams.toString());
    /* Sempre escrita, mesmo sendo a trilha padrão: o link copiado da barra de
       endereço tem de abrir na aba que a pessoa estava vendo. */
    params.set('trilha', trilha);
    /* A categoria pertence a uma trilha só. Mantê-la na troca deixaria o
       acervo vazio com um chip aceso que não existe mais na lista. */
    params.delete('cat');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  /* Os chips filtram dentro da trilha escolhida. A lista completa de categorias
     já está em memória (o service guarda a resposta da sessão), então separar
     aqui é mais barato que pedir `/categorias?trilha=` a cada troca de aba.

     Separados pela trilha exibida, e não pela clicada: os chips vivem dentro do
     painel, então eles têm de atravessar a tela junto com o acervo a que
     pertencem, em vez de trocar no lugar enquanto o resto ainda desliza. */
  const categoriasDaTrilha = categories.filter((cat) => cat.trilha === trilhaExibida);

  /* A posição do chip na fileira, com o "Todos" na frente, como ele aparece na
     tela. O arrasto usa isso para decidir o sentido: quem anda para a direita
     faz o conteúdo descer, quem anda para a esquerda faz subir. */
  const posicaoNaFileira = (slug: string) =>
    slug === 'all' ? 0 : 1 + categoriasDaTrilha.findIndex((cat) => cat.slug === slug);

  /* O destaque já aparece emoldurado acima; repeti-lo na lista seria ruído. */
  const listed = isUnfiltered ? contents.filter((c) => c.slug !== featured?.slug) : contents;

  return (
    <div className="px-6 sm:px-8 pt-32 pb-24">
      <div className="max-w-6xl mx-auto">
        <Cabecalho />

        {/* A trilha é a primeira decisão da tela: ela define quais categorias
            existem abaixo e qual recorte do acervo o resto da página mostra. */}
        <SeletorTrilha trilha={activeTrilha} onTrilhaChange={selectTrilha} />

        {/* Tudo o que a trilha comanda vive dentro do painel, inclusive os
            filtros: os chips mudam junto com a aba, e trocá-los em corte seco
            enquanto a lista abaixo atravessa a tela pareceria defeito. */}
        <PainelTrilha trilha={trilhaExibida}>
          {/* Filtros: controles soltos, sem painel. O fio acima é o das abas. */}
          <div className="pt-6 space-y-5 mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="sw-field relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Buscar termo, manobra, regra"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-3.5 pr-9 py-2.5 text-[11px] uppercase tracking-[0.14em]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={limparBusca}
                    className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-ink/40 hover:text-accent"
                    aria-label="Limpar busca"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* O contador é o aviso discreto de que há consulta em curso.
                  Quando já existe acervo na tela, ele substitui o bloco grande
                  de "Consultando acervo", que apagaria o que está sendo
                  lido a cada tecla digitada e a cada troca de trilha. */}
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/30">
                {loading ? 'Consultando' : `${String(contents.length).padStart(2, '0')} resultados`}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Chip active={activeCategory === 'all'} onClick={() => selectCategory('all')}>
                Todos
              </Chip>
              {categoriasDaTrilha.map((cat) => (
                <Chip
                  key={cat.id}
                  active={activeCategory === cat.slug}
                  onClick={() => selectCategory(cat.slug)}
                >
                  {cat.name}
                </Chip>
              ))}
            </div>
          </div>

          {/* Os resultados ficam dentro da recomposição, e os filtros acima
              dela: o chip clicado precisa continuar no lugar acendendo, é ele
              que explica por que a lista mudou. */}
          <TransicaoDeFiltro
            trilha={trilhaExibida}
            filtro={`${categoriaExibida}|${buscaExibida}`}
            posicao={posicaoNaFileira(categoriaExibida)}
          >
            {/* O bloco de carregamento só aparece quando não há nada para
                mostrar, ou seja, na primeira visita: depois disso a consulta é
                uma revalidação, o acervo anterior continua legível e quem avisa
                é o contador ali em cima. */}
            {loading && contents.length === 0 ? (
              <p className="sw-caret py-20 font-mono text-[11px] uppercase tracking-[0.24em] text-ink/40">
                Consultando acervo
              </p>
            ) : erro ? (
              <EstadoDeErro
                className="py-16"
                mensagem={erro}
                onTentarDeNovo={() => setTentativa((numero) => numero + 1)}
              />
            ) : contents.length === 0 ? (
              <div className="py-20 space-y-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
                  Nenhum resultado
                </p>
                <p className="text-ink/45 text-[13px] max-w-sm leading-relaxed">
                  Redefina a busca ou volte a navegar por todas as categorias.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    limparBusca();
                    selectCategory('all');
                  }}
                  className="sw-btn px-6 py-2.5"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <>
                {isUnfiltered && featured && (
                  <Link
                    href={`/conteudo/${featured.slug}`}
                    className="sw-frame sw-frame-live sw-ticks block p-8 sm:p-12 mb-14"
                  >
                    <div className="flex items-baseline justify-between gap-4 mb-8">
                      <span className="sw-tag">{featured.categoryName}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/30">
                        {featured.readTime} · {featured.date}
                      </span>
                    </div>

                    <h2 className="font-mono text-xl sm:text-3xl leading-snug tracking-[0.02em] normal-case max-w-2xl">
                      {featured.title}
                    </h2>

                    <p className="mt-5 text-ink/50 text-[13px] sm:text-sm leading-relaxed max-w-2xl">
                      {featured.subtitle}
                    </p>

                    <div className="mt-10 pt-5 sw-rule flex items-baseline justify-between gap-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
                        {featured.author}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                        Ler ensaio →
                      </span>
                    </div>
                  </Link>
                )}

                {/* O acervo é um índice, não uma grade de cartões. */}
                <div className="border-t border-accent/16">
                  {listed.map((item, idx) => (
                    <Link
                      key={item.id}
                      href={`/conteudo/${item.slug}`}
                      className="sw-row group flex-col items-stretch gap-2 py-6"
                    >
                      <div className="flex items-baseline gap-4 sm:gap-6">
                        <span className="sw-idx text-[11px] w-8 shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm sm:text-base text-ink/85 group-hover:text-white transition-colors">
                          {item.title}
                        </span>
                        <span className="sw-leader hidden md:block" />
                        <span className="hidden md:block font-mono text-[10px] uppercase tracking-[0.16em] text-ink/30 whitespace-nowrap">
                          {item.categoryName} · {item.readTime}
                        </span>
                      </div>

                      <p className="pl-12 sm:pl-14 text-ink/40 text-[12px] leading-relaxed max-w-2xl line-clamp-2">
                        {item.subtitle}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </TransicaoDeFiltro>
        </PainelTrilha>
      </div>
    </div>
  );
};

/**
 * useSearchParams obriga uma fronteira de Suspense acima de quem o chama:
 * sem ela o next build falha ao pré-renderizar esta rota. O fallback repete
 * o estado de carregamento que a própria página já mostrava, para que o HTML
 * pré-renderizado seja igual ao primeiro quadro que o usuário via antes.
 */
export default function DescobrirPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 sm:px-8 pt-32 pb-24">
          <div className="max-w-6xl mx-auto">
            <Cabecalho />
            <p className="sw-caret py-20 font-mono text-[11px] uppercase tracking-[0.24em] text-ink/40">
              Consultando acervo
            </p>
          </div>
        </div>
      }
    >
      <Acervo />
    </Suspense>
  );
}
