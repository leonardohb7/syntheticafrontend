/**
 * Era um conjunto fechado com os sete slugs do mock. As categorias agora vêm do
 * backend, que pode renomeá-las ou acrescentar outras sem o front ser
 * recompilado, então manter a lista aqui passaria a ser uma promessa falsa.
 */
export type CategorySlug = string;

/**
 * As duas trilhas do portal. Esta continua fechada de propósito: o conjunto é
 * definido por um enum do backend, não por dado cadastrado.
 */
export type Trilha = 'velocidade' | 'expressao';

export interface Category {
  id: string;
  slug: CategorySlug;
  name: string;
  shortDesc: string;
  /* A trilha pertence à categoria. É dela que cada conteúdo herda a sua. */
  trilha: Trilha;
}

export interface ContentSection {
  heading?: string;
  text: string;
  quote?: string;
  callout?: string;
}

export interface Content {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: CategorySlug;
  categoryName: string;
  /* Derivada da categoria pela API, nunca gravada no conteúdo. Chega pronta
     na leitura e por isso não é campo do formulário do painel editorial. */
  trilha: Trilha;
  summary: string;
  readTime: string;
  date: string;
  author: string;
  authorRole: string;
  featured?: boolean;
  editorialBadge?: string;
  sections: ContentSection[];
  relatedSlugs: string[];
  takeaways?: string[];
  /* Texto livre, não mais um conjunto fechado: a API tipa `arquetipo_grafico`
     como string e aceita qualquer valor que o painel editorial cadastrar. */
  graphicArchetype: string;
}

export interface Team {
  id: string;
  name: string;
  alias: string;
  city: string;
  state: string;
  foundedYear: number;
  description: string;
  primaryColor: string;
  accentColor: string;
  nextEvent?: {
    name: string;
    date: string;
    location: string;
    type: string;
  };
  instagram: string;
  contactEmail: string;
  rosterCount: number;
  homeTrack: string;
  openForNewSkaters: boolean;
  mapCoordinates: { xPercent: number; yPercent: number };
}

export interface Event {
  id: string;
  title: string;
  type: 'bout' | 'torneio' | 'clinica' | 'scrimmage' | 'workshop';
  typeLabel: string;
  date: string;
  time: string;
  city: string;
  venue: string;
  description: string;
  participatingTeams?: string[];
  isOpenToPublic: boolean;
  registrationStatus: 'aberta' | 'em_breve' | 'esgotada';
}

export interface LocationVenue {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  surfaceType: string;
  rinkFeatures: string[];
  openSessions: string;
  hasSkateLoan: boolean;
  contact: string;
  googleMapQuery: string;
}
