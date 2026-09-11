# Derby Synthetica

Portal editorial sobre roller derby, entrega de **Framework Application** do
challenge FIAP "O Mundo de Synthetica" (2026).

## Integrantes

| Nome | RM |
|---|---|
| Denise Shamira Chuquimia | 563714 |
| Tandara Sartore Perez de Azevedo | 566455 |
| Álvaro Milantonio | 561652 |
| Leonardo Henrique | 564231 |

Mini sistema CRUD em **FastAPI + React**, com o frontend consumindo a API por
`fetch`. O portal tem cinco rotas de leitura e um painel editorial onde os
quatro verbos do CRUD são exercitados pela interface.

## Os dois repositórios

A entrega são dois repositórios separados, e não um monorepo:

| Parte | Repositório | Stack |
|---|---|---|
| Portal (este) | https://github.com/leonardohb7/syntheticafrontend | Next 15 (App Router), React 19, TypeScript, Tailwind 4 |
| API | https://github.com/leonardohb7/syntheticabackend | FastAPI, Pydantic, dados em memória |

Publicados em:

| Serviço | URL |
|---|---|
| Portal (Vercel) | https://frontend-three-fawn-51.vercel.app |
| API (Render) | https://syntheticabackend.onrender.com |
| Documentação da API | https://syntheticabackend.onrender.com/docs |

A API está no plano gratuito do Render e hiberna quando fica ociosa. A primeira
visita depois de uma pausa espera o boot, que leva dezenas de segundos, e o
portal mostra "Consultando acervo" nesse intervalo. Abrir o link da API antes de
apresentar o portal acorda o serviço.

## Como rodar

O portal não tem dados próprios: o acervo vem da API. Suba o backend primeiro,
seguindo o README do repositório dele, e confirme que
`http://127.0.0.1:8000/conteudos` responde.

```bash
# 1. dependências
cd frontend
npm install

# 2. variável de ambiente
copy .env.local.example .env.local     # Windows
cp .env.local.example .env.local       # Linux ou macOS

# 3. servidor de desenvolvimento
npm run dev
```

O portal sobe em **http://localhost:3000**.

O `.env.local` tem uma variável só, `NEXT_PUBLIC_API_URL`, que aponta para a
API. O prefixo `NEXT_PUBLIC_` é obrigatório: sem ele o Next não expõe o valor ao
navegador, e todas as chamadas do portal acontecem no cliente.

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build |
| `npm run lint` | Checagem de tipos (`tsc --noEmit`) |

> O `build` e o `dev` dividem a pasta `.next`. Rodar o build com o servidor de
> desenvolvimento no ar derruba a porta 3000 em erro 500, e basta reiniciar o
> `npm run dev` depois.

## Rotas

| Rota | Página | O que faz |
|---|---|---|
| `/` | Home | Abertura, matéria em destaque e as duas trilhas |
| `/descobrir` | Acervo | Seletor de trilha, filtro por categoria e busca |
| `/conteudo/[slug]` | Ensaio | Leitura completa, com seções, citações e relacionados |
| `/conectar` | Conectar | Ligas e mapa relacional em SVG |
| `/participar` | Participar | Entrada na pista, proteções e locais de treino |
| `/editorial` | **Painel editorial** | Cadastro, edição e remoção de ensaio |

### O painel editorial

É onde o CRUD aparece na interface. As outras rotas só leem.

O painel lista o acervo em tabela, filtra por trilha (com a posição "todas as
pistas", que o portal público não tem), cadastra e edita pelo mesmo formulário
de duas colunas e exclui sempre atrás de uma confirmação. A lista recarrega da
API depois de cada operação, e a recusa do servidor chega ao editor legível: o
409 de slug duplicado acende o campo do slug, e o 422 de payload inválido
nomeia os campos que o Pydantic recusou.

A **trilha não é campo do formulário**. Ela pertence à categoria, e o painel a
mostra como texto ao lado do select, para deixar explícito que é derivada.

## Arquitetura

```
frontend/src/
  app/                  rotas do App Router
    editorial/          painel editorial
    conteudo/[slug]/    página de ensaio
    globals.css         o sistema visual inteiro
  components/
    common/             seletor de trilha, chips, estados de erro
    editorial/          filtro, tabela, formulário e modal do painel
    layout/             Header, Footer, AppShell
  services/             api.ts (cliente HTTP) e os services por entidade
  data/                 mocks de times, eventos e locais
  types/                vocabulário do portal, em inglês
```

**Todo `fetch` acontece no cliente, nunca em Server Component.** O plano
gratuito do Render hiberna, e com SSR a espera pelo boot da API viraria tela
branca longa ou falha de build.

**Não existe `app/api`.** A API do projeto é o FastAPI. Duas camadas de API no
mesmo projeto seria complexidade sem função.

### A tradução entre os dois vocabulários

A API fala português, porque segue o MER da disciplina de Database Application,
e os types do portal falam inglês. A tradução acontece na camada de services, e
só nela, para que a API não fique amarrada ao formato da interface nem a
interface precise conhecer o formato da API.

```
titulo → title          resumo → summary        tempo_leitura → readTime
autor_cargo → authorRole   destaque → featured     secoes → sections
```

`categoria_slug`, `categoria_nome` e `trilha` são derivados pela API na leitura
e nunca gravados no conteúdo. Trocar a categoria de um ensaio faz a trilha dele
acompanhar sozinha.

### De onde vêm os dados

Os conteúdos e as categorias vêm do FastAPI. Times, eventos e locais, que
alimentam `/conectar` e `/participar`, continuam em `src/data` e não fazem parte
do CRUD.

## Sistema visual

O CSS chama o sistema de **TERMINAL** e ele vive inteiro em `globals.css`, nas
classes com prefixo `sw-`. Três princípios:

1. **Um acento.** Magenta `#FF2E97` sobre preto puro. O ciano `#00F0FF` é sinal
   de estado (foco, item ativo), nunca decoração.
2. **Traço, não chapa.** Linha de 1px com bloom curto. Sem gradiente de
   preenchimento, sem sombra projetada.
3. **Linha, não cartão.** Informação repetida mora em fileiras separadas por
   fio, como índice de terminal.

Tipografia: Orbitron na marca e nos títulos, Share Tech Mono na interface,
Rajdhani na prosa longa dos ensaios.

## Sobre o conteúdo

O acervo é uma **peça de ficção situada em 2047**, escrita como se o roller
derby já fosse esporte consagrado. A tecnologia (arbitragem assistida,
telemetria de patim, narração gerada) aparece como cenário do mundo, nunca como
assunto do texto.

Os ensaios são assinados por **personagens editoriais**, que não são os
integrantes do grupo. A ficção é declarada no rodapé de toda página, na linha
sob cada assinatura e na nota ao fim do ensaio sobre derby names.

Nenhum ensaio cita obra, lei, estudo, métrica ou estatística: onde o argumento
pediria número, a formulação é qualitativa. As regras reais de derby que
aparecem (cinco atletas por time, jam de até dois minutos, penalidade de trinta
segundos, sentido anti-horário) são canônicas e corretas.

## Deploy

O portal está na **Vercel**, publicado a partir deste repositório. A Vercel
detecta o Next sozinha, então build command e output directory ficam no padrão.
A pasta do app é `frontend/`, e é ela que precisa estar como **Root Directory**
no projeto da Vercel.

As duas variáveis de ambiente do deploy, uma de cada lado:

| Onde | Variável | Valor |
|---|---|---|
| Vercel | `NEXT_PUBLIC_API_URL` | `https://syntheticabackend.onrender.com` |
| Render | `FRONTEND_URL` | `https://frontend-three-fawn-51.vercel.app` |

As duas são obrigatórias, e cada uma falha de um jeito diferente:

**Sem `NEXT_PUBLIC_API_URL` na Vercel**, o build cai no fallback do
`services/api.ts`, que é `http://127.0.0.1:8000`. O portal publicado passa a
pedir dados ao localhost de quem está visitando, que não tem backend nenhum, e
toda página de acervo mostra o estado de erro. Como o prefixo `NEXT_PUBLIC_` é
**inlined em tempo de build**, criar a variável não basta: é preciso redeploy
para o valor entrar no bundle.

**Sem `FRONTEND_URL` no Render**, o navegador bloqueia as respostas por CORS. O
sintoma é pior de ler, porque o log do servidor mostra 200 em tudo enquanto a
tela fica vazia: quem barra é o navegador, depois da resposta chegar.

Para conferir se o CORS está de pé, sem abrir o portal:

```bash
curl -s -o /dev/null -D - \
  -H "Origin: https://frontend-three-fawn-51.vercel.app" \
  https://syntheticabackend.onrender.com/categorias | grep -i access-control
```

A resposta precisa trazer `access-control-allow-origin` com a URL da Vercel. Se
o cabeçalho não vier, a variável no Render está ausente, escrita com barra no
fim ou apontando para outra URL.

Como a base da API é uma lista em memória, o conteúdo cadastrado pelo painel
desaparece quando o serviço reinicia ou hiberna. O acervo nunca fica vazio,
porque o seed recarrega no startup.

## Pendências da entrega

- [x] Links dos dois repositórios, no topo deste arquivo
- [x] URL do portal publicado e URL da API publicada
- [x] `FRONTEND_URL` configurada no Render, com o CORS respondendo
- [x] Integrantes do grupo
- [ ] `NEXT_PUBLIC_API_URL` configurada na Vercel, com redeploy depois
- [ ] PDF de descrição do sistema
- [ ] Vídeo pitch de 2 a 3 minutos
