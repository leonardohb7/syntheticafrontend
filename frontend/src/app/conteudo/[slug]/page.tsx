import type { Metadata } from 'next';
import ConteudoDetalheClient from './ConteudoDetalheClient';

type Props = { params: Promise<{ slug: string }> };

/* A página de conteúdo precisa de título e descrição individuais para que o
   Google indexe cada ensaio com seu próprio texto, e não com o título genérico
   do portal. Como os dados vêm da API e o Render hiberna no plano gratuito,
   a busca tem timeout curto e fallback seguro: a pior situação é metadado
   genérico, nunca tela branca. O conteúdo em si continua renderizando no
   cliente, que não depende desta busca. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

  const fallback: Metadata = {
    title: 'Derby Synthetica',
    description:
      'Portal editorial do flat track roller derby na temporada 2047: tática, equipamento, arbitragem assistida, transmissão e a cultura da pista.',
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${API_URL}/conteudos/slug/${slug}`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    clearTimeout(timer);

    if (!res.ok) return fallback;

    const data = await res.json();

    return {
      title: `${data.titulo} | Derby Synthetica`,
      description: data.resumo ?? fallback.description,
      openGraph: {
        title: `${data.titulo} | Derby Synthetica`,
        description: data.resumo ?? String(fallback.description),
        type: 'article',
      },
    };
  } catch {
    return fallback;
  }
}

export default function ConteudoPage() {
  return <ConteudoDetalheClient />;
}
