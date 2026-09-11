/**
 * Cliente HTTP do portal Derby Synthetica.
 *
 * Toda conversa com o FastAPI passa por aqui, e não por `fetch` solto espalhado
 * nas telas, por três motivos concretos:
 *
 * 1. A URL base vem de variável de ambiente. Em desenvolvimento a API é local,
 *    no deploy ela é o endereço do Render. Com as chamadas centralizadas, essa
 *    troca acontece em uma linha, e não em cada página.
 * 2. O tratamento de erro é o mesmo em todo lugar. O FastAPI devolve o motivo
 *    da recusa no campo `detail`, e é esse texto que precisa chegar à tela:
 *    sem um ponto único, cada componente inventaria a própria mensagem.
 * 3. Distinguir "a API recusou" de "a API não respondeu" é decisão de camada de
 *    rede, não de interface. Quem chama recebe um erro já classificado.
 */

/* Fallback para o endereço local: sem ele, esquecer o .env.local quebraria o
   portal com um erro de URL inválida em vez de simplesmente rodar na máquina. */
const URL_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

type ParametrosDeConsulta = Record<string, string | number | boolean | undefined | null>;

/**
 * Erro de comunicação com a API, já com o status HTTP junto.
 *
 * O status vem anexado porque nem todo código de erro significa a mesma coisa
 * para a tela: um 404 em `/conteudos/slug/{slug}` é "ensaio não encontrado",
 * que é uma resposta legítima do portal, enquanto um 500 ou uma falha de rede
 * é "o acervo está fora do ar". Quem chama precisa poder separar os dois.
 */
export class ErroDaApi extends Error {
  /** Status HTTP da resposta. Zero quando a requisição nem chegou ao servidor. */
  readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.name = 'ErroDaApi';
    this.status = status;
  }
}

/** Monta a URL completa, descartando filtro vazio. */
function montarUrl(caminho: string, parametros?: ParametrosDeConsulta): string {
  const consulta = new URLSearchParams();

  for (const [chave, valor] of Object.entries(parametros ?? {})) {
    /* Filtro ausente e filtro vazio são coisas diferentes para o FastAPI:
       `?busca=` chega como string vazia e zeraria o resultado da busca. */
    if (valor === undefined || valor === null || valor === '') continue;
    consulta.set(chave, String(valor));
  }

  const sufixo = consulta.toString();
  return sufixo ? `${URL_BASE}${caminho}?${sufixo}` : `${URL_BASE}${caminho}`;
}

/** Extrai do corpo da resposta a mensagem que o editor vai ler. */
async function extrairMensagem(resposta: Response): Promise<string> {
  let corpo: any = null;

  try {
    corpo = await resposta.json();
  } catch {
    /* Erro sem corpo JSON: proxy fora do ar, página de erro em HTML, 502 do
       Render hibernando. Cai na mensagem genérica lá embaixo. */
  }

  const detalhe = corpo?.detail;

  // Recusa escrita por nós: 404, 409 e o 422 de categoria inexistente.
  if (typeof detalhe === 'string') return detalhe;

  /* Recusa escrita pelo Pydantic: o 422 de payload inválido devolve `detail`
     como lista de objetos, um por campo, e não como texto. Sem este ramo o
     painel editorial mostraria "[object Object]" para quem está preenchendo. */
  if (Array.isArray(detalhe)) {
    const campos = detalhe
      .map((item) => {
        const caminho = Array.isArray(item?.loc) ? item.loc.slice(1).join('.') : '';
        return caminho ? `${caminho}: ${item?.msg}` : item?.msg;
      })
      .filter(Boolean);

    if (campos.length) return campos.join('; ');
  }

  return `A API respondeu ${resposta.status}.`;
}

/** Executa a requisição e devolve o corpo já convertido. */
async function requisitar<T>(
  caminho: string,
  opcoes: RequestInit,
  parametros?: ParametrosDeConsulta
): Promise<T> {
  let resposta: Response;

  try {
    resposta = await fetch(montarUrl(caminho, parametros), {
      ...opcoes,
      /* O portal é um CRUD: reler do cache do navegador depois de um POST
         mostraria a lista sem o item recém-criado. */
      cache: 'no-store',
    });
  } catch {
    /* O fetch só rejeita quando a requisição não chegou ao servidor: backend
       desligado, DNS, CORS bloqueado. Status HTTP de erro não cai aqui, cai no
       `resposta.ok` abaixo. Status zero marca justamente essa diferença. */
    throw new ErroDaApi(
      'Não foi possível alcançar a API do portal. Confirme que o backend está no ar.',
      0
    );
  }

  if (!resposta.ok) {
    throw new ErroDaApi(await extrairMensagem(resposta), resposta.status);
  }

  /* O DELETE responde 204 sem corpo, e chamar .json() em corpo vazio lança. */
  if (resposta.status === 204) return undefined as T;

  return resposta.json() as Promise<T>;
}

const CABECALHO_JSON = { 'Content-Type': 'application/json' };

export const api = {
  /** GET com filtros opcionais em query string. */
  get: <T>(caminho: string, parametros?: ParametrosDeConsulta) =>
    requisitar<T>(caminho, { method: 'GET' }, parametros),

  /** POST com corpo JSON. Usado no cadastro de conteúdo. */
  post: <T>(caminho: string, corpo: unknown) =>
    requisitar<T>(caminho, {
      method: 'POST',
      headers: CABECALHO_JSON,
      body: JSON.stringify(corpo),
    }),

  /** PUT com corpo JSON. O contrato define atualização por inteiro. */
  put: <T>(caminho: string, corpo: unknown) =>
    requisitar<T>(caminho, {
      method: 'PUT',
      headers: CABECALHO_JSON,
      body: JSON.stringify(corpo),
    }),

  /** DELETE. Chamado `del` porque `delete` é palavra reservada. */
  del: (caminho: string) => requisitar<void>(caminho, { method: 'DELETE' }),
};
