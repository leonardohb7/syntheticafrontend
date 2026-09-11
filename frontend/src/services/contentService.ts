/**
 * Service de conteúdos editoriais do Derby Synthetica.
 *
 * Esta é a fronteira entre os dois vocabulários do projeto. A API fala
 * português, porque segue o MER da disciplina de Database Application, e os
 * types do front falam inglês. A tradução acontece aqui, e só aqui, para que a
 * API não fique amarrada ao formato da interface nem a interface precise
 * conhecer o formato da API.
 *
 * As assinaturas públicas são as mesmas de quando os dados vinham de
 * `src/data`: as páginas continuam pedindo a mesma coisa, e mudou apenas de
 * onde a resposta sai.
 */

import { api, ErroDaApi } from '@/services/api';
import { Category, Content, ContentSection, Trilha } from '@/types';

/* ------------------------------------------------------------------ formatos
   Os dois tipos abaixo descrevem o que a API devolve, em português. Eles vivem
   neste arquivo, e não em `@/types`, porque `@/types` é o vocabulário do
   portal: misturar os dois lá apagaria a separação que a tradução existe para
   manter. */

interface SecaoDaApi {
  titulo?: string | null;
  texto: string;
  citacao?: string | null;
  destaque?: string | null;
}

interface ConteudoDaApi {
  id: number;
  slug: string;
  titulo: string;
  subtitulo: string;
  categoria_id: number;
  resumo: string;
  tempo_leitura: string;
  data: string;
  autor: string;
  autor_cargo: string;
  destaque: boolean;
  selo_editorial?: string | null;
  arquetipo_grafico: string;
  aprendizados: string[];
  secoes: SecaoDaApi[];
  slugs_relacionados: string[];
  // Derivados da categoria pela API. Não existem no corpo de escrita.
  categoria_slug: string;
  categoria_nome: string;
  trilha: Trilha;
}

interface CategoriaDaApi {
  id: number;
  slug: string;
  nome: string;
  descricao_curta: string;
  trilha: Trilha;
}

/**
 * O que o formulário do painel editorial preenche.
 *
 * É o `Content` sem os campos que não pertencem a quem escreve: `id` é do
 * servidor, e `categoryName` e `trilha` são derivados da categoria. No lugar do
 * slug da categoria entra o id dela, que é o que a API espera como chave
 * estrangeira e o que o select do formulário tem em mãos.
 */
export interface ContentInput {
  slug: string;
  title: string;
  subtitle: string;
  categoryId: number | string;
  summary: string;
  readTime: string;
  date: string;
  author: string;
  authorRole: string;
  featured?: boolean;
  editorialBadge?: string;
  graphicArchetype?: string;
  takeaways?: string[];
  sections?: ContentSection[];
  relatedSlugs?: string[];
}

/* --------------------------------------------------------------- tradução */

/**
 * Converte um conteúdo da API para o tipo que as telas consomem.
 *
 * O mapa completo dos nomes está no CLAUDE.md, na seção "Tradução entre API e
 * front". Os campos opcionais viram `undefined` em vez de `null` porque no
 * front eles são declarados com `?`, e `null` é um valor que o portal nunca
 * precisa distinguir de "não preenchido".
 */
export function paraConteudo(dto: ConteudoDaApi): Content {
  return {
    /* O id da API é inteiro e no portal é texto, como o das outras entidades.
       A conversão é segura porque o id só é usado como chave de lista e como
       trecho de URL nas rotas de edição e exclusão. */
    id: String(dto.id),
    slug: dto.slug,
    title: dto.titulo,
    subtitle: dto.subtitulo,
    category: dto.categoria_slug,
    categoryName: dto.categoria_nome,
    trilha: dto.trilha,
    summary: dto.resumo,
    readTime: dto.tempo_leitura,
    date: dto.data,
    author: dto.autor,
    authorRole: dto.autor_cargo,
    featured: dto.destaque,
    editorialBadge: dto.selo_editorial ?? undefined,
    graphicArchetype: dto.arquetipo_grafico,
    takeaways: dto.aprendizados ?? [],
    sections: (dto.secoes ?? []).map((secao) => ({
      heading: secao.titulo ?? undefined,
      text: secao.texto,
      quote: secao.citacao ?? undefined,
      callout: secao.destaque ?? undefined,
    })),
    relatedSlugs: dto.slugs_relacionados ?? [],
  };
}

/** Converte uma categoria da API para o tipo do portal. */
export function paraCategoria(dto: CategoriaDaApi): Category {
  return {
    id: String(dto.id),
    slug: dto.slug,
    name: dto.nome,
    shortDesc: dto.descricao_curta,
    trilha: dto.trilha,
  };
}

/**
 * Converte o que o formulário preencheu no corpo que a API espera.
 *
 * A inversa de `paraConteudo`, usada no POST e no PUT. Repare no que não é
 * enviado: `trilha` não aparece aqui porque pertence à categoria e a API a
 * deriva na leitura. Mandá-la seria abrir espaço para ela divergir.
 *
 * Campo de texto opcional em branco vira `null`, e não string vazia: o
 * formulário devolve `""` quando o editor não preenche, e gravar isso criaria
 * um selo ou uma citação vazios que a tela renderizaria como espaço morto.
 */
export function paraCorpoDaApi(entrada: ContentInput) {
  const opcional = (valor?: string) => valor?.trim() || null;

  return {
    slug: entrada.slug.trim(),
    titulo: entrada.title.trim(),
    subtitulo: entrada.subtitle,
    categoria_id: Number(entrada.categoryId),
    resumo: entrada.summary,
    tempo_leitura: entrada.readTime,
    data: entrada.date,
    autor: entrada.author,
    autor_cargo: entrada.authorRole,
    destaque: Boolean(entrada.featured),
    selo_editorial: opcional(entrada.editorialBadge),
    /* A API exige `arquetipo_grafico`, mas nenhuma tela do portal desenha esse
       arquétipo hoje. O padrão evita que o formulário precise de um campo que
       não muda nada do que o leitor vê. */
    arquetipo_grafico: entrada.graphicArchetype?.trim() || 'star',
    aprendizados: entrada.takeaways ?? [],
    secoes: (entrada.sections ?? []).map((secao) => ({
      titulo: opcional(secao.heading),
      texto: secao.text,
      citacao: opcional(secao.quote),
      destaque: opcional(secao.callout),
    })),
    slugs_relacionados: entrada.relatedSlugs ?? [],
  };
}

/* --------------------------------------------------------------- leitura */

/* As categorias são pedidas por quase toda tela e ainda servem para converter
   slug em id na listagem filtrada. Como elas não são editáveis pela API, e o
   seed recarrega a cada boot do backend, guardar a lista da sessão evita uma
   requisição extra a cada tecla digitada na busca do acervo. Só guarda depois
   do sucesso: uma falha precisa poder ser tentada de novo. */
let cacheDeCategorias: Category[] | null = null;

async function getCategories(): Promise<Category[]> {
  if (cacheDeCategorias) return cacheDeCategorias;

  const dados = await api.get<CategoriaDaApi[]>('/categorias');
  cacheDeCategorias = dados.map(paraCategoria);
  return cacheDeCategorias;
}

async function getContents(params?: {
  trilha?: Trilha;
  category?: string;
  search?: string;
}): Promise<Content[]> {
  const consulta: Record<string, string | number> = {};

  if (params?.search?.trim()) {
    consulta.busca = params.search.trim();
  }

  /* A trilha é o único filtro que atravessa igual: o nome do campo é o mesmo
     nos dois vocabulários, porque o conjunto vem de um enum do backend. */
  if (params?.trilha) {
    consulta.trilha = params.trilha;
  }

  if (params?.category && params.category !== 'all') {
    /* A tela filtra pelo slug da categoria, que é o que está na URL e o que o
       chip conhece, mas a API filtra por id. A conversão fica aqui para a
       página não precisar saber o formato do filtro do backend. */
    const categorias = await getCategories();
    const escolhida = categorias.find((categoria) => categoria.slug === params.category);

    /* Slug que não existe, caso de link antigo ou URL digitada à mão: acervo
       vazio é a resposta honesta, e não um erro de comunicação. */
    if (!escolhida) return [];

    consulta.categoria_id = escolhida.id;
  }

  const dados = await api.get<ConteudoDaApi[]>('/conteudos', consulta);
  return dados.map(paraConteudo);
}

async function getContentBySlug(slug: string): Promise<Content | null> {
  try {
    const dto = await api.get<ConteudoDaApi>(`/conteudos/slug/${encodeURIComponent(slug)}`);
    return paraConteudo(dto);
  } catch (erro) {
    /* 404 aqui não é falha: é slug que não existe, e a página responde com
       "ensaio não encontrado". Qualquer outro erro sobe, para a tela conseguir
       dizer que o acervo está fora do ar em vez de fingir que o texto sumiu. */
    if (erro instanceof ErroDaApi && erro.status === 404) return null;
    throw erro;
  }
}

async function getFeaturedContent(): Promise<Content | null> {
  const conteudos = await getContents();
  /* O seed pode ter mais de um destaque; a capa mostra o primeiro. O fallback
     para o primeiro da lista mantém a Home com matéria de abertura mesmo se
     ninguém tiver marcado destaque no painel. */
  return conteudos.find((conteudo) => conteudo.featured) ?? conteudos[0] ?? null;
}

async function getRelatedContents(slugs: string[]): Promise<Content[]> {
  if (!slugs?.length) return [];

  /* A API não tem rota de busca por lista de slugs. Pedir o acervo inteiro e
     filtrar custa uma requisição, enquanto pedir um por slug custaria uma por
     item: para um acervo deste tamanho, a primeira opção é a mais barata. */
  const conteudos = await getContents();
  return conteudos.filter((conteudo) => slugs.includes(conteudo.slug));
}

/* --------------------------------------------------------------- escrita */

async function createContent(entrada: ContentInput): Promise<Content> {
  const dto = await api.post<ConteudoDaApi>('/conteudos', paraCorpoDaApi(entrada));
  return paraConteudo(dto);
}

async function updateContent(id: string | number, entrada: ContentInput): Promise<Content> {
  const dto = await api.put<ConteudoDaApi>(`/conteudos/${id}`, paraCorpoDaApi(entrada));
  return paraConteudo(dto);
}

async function deleteContent(id: string | number): Promise<void> {
  await api.del(`/conteudos/${id}`);
}

export const contentService = {
  getContents,
  getContentBySlug,
  getFeaturedContent,
  getCategories,
  getRelatedContents,
  createContent,
  updateContent,
  deleteContent,
};
