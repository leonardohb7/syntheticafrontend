import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Orbitron, Rajdhani, Share_Tech_Mono } from 'next/font/google';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';

/* O <link> do Google Fonts saiu do index.html e virou next/font: as fontes
   passam a ser servidas pelo próprio domínio, sem requisição a terceiros.
   `display: swap` mantém o comportamento antigo, em que o texto aparece na
   fonte de sistema e troca quando a web font chega, em vez de ficar invisível. */
const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-orbitron',
  display: 'swap',
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-rajdhani',
  display: 'swap',
});

const shareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-share-tech-mono',
  display: 'swap',
});

/* A descrição é a mesma nos dois lugares de propósito: ela é o resumo do
   portal para buscador e para prévia de link, e manter duas versões faria as
   duas divergirem na primeira edição. */
const DESCRICAO =
  'Portal editorial do flat track roller derby na temporada 2047: tática, equipamento, arbitragem assistida, transmissão e a cultura da pista.';

export const metadata: Metadata = {
  title: 'DERBY SYNTHETICA',
  description: DESCRICAO,
  openGraph: {
    title: 'DERBY SYNTHETICA | Temporada 2047.',
    description: DESCRICAO,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

/* theme-color vive no export viewport, não em metadata: no metadata ele ainda
   compila, mas o build imprime aviso de descontinuado em toda rota. */
export const viewport: Viewport = {
  themeColor: '#000000',
};

/* Único Server Component da árvore. Precisa continuar server para exportar
   metadata, por isso toda a parte interativa mora no AppShell. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${orbitron.variable} ${rajdhani.variable} ${shareTechMono.variable}`}
    >
      <body className="bg-black text-ink antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
