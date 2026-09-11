'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { contentService } from '@/services/contentService';
import { EstadoDeErro } from '@/components/common/EstadoDeErro';
import { Content } from '@/types';

export default function ConteudoDetalheClient() {
  /* useParams do next/navigation, não do react-router: a pasta [slug] é quem
     define o nome da chave. */
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [content, setContent] = useState<Content | null>(null);
  const [related, setRelated] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  /* Só existe para o botão de nova tentativa reexecutar o efeito. */
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let cancelado = false;

    async function carregarEnsaio() {
      setLoading(true);
      setErro(null);

      try {
        /* O service devolve null no 404 e só lança quando a comunicação
           falha. É o que permite a tela separar "este ensaio não existe" de
           "o acervo está fora do ar", que pedem respostas diferentes. */
        const ensaio = await contentService.getContentBySlug(slug);
        if (cancelado) return;

        setContent(ensaio);

        if (ensaio?.relatedSlugs?.length) {
          /* Leitura acessória: se ela falhar, o ensaio já está na tela e a
             seção de leituras conectadas apenas não aparece. */
          const conectadas = await contentService
            .getRelatedContents(ensaio.relatedSlugs)
            .catch(() => []);
          if (!cancelado) setRelated(conectadas);
        } else {
          setRelated([]);
        }
      } catch (falha) {
        if (cancelado) return;

        setErro(falha instanceof Error ? falha.message : 'O acervo não respondeu.');
        setContent(null);
        setRelated([]);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    carregarEnsaio();
    return () => {
      cancelado = true;
    };
  }, [slug, tentativa]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="px-6 pt-40 max-w-3xl mx-auto">
        <p className="sw-caret font-mono text-[11px] uppercase tracking-[0.24em] text-ink/40">
          Carregando ensaio
        </p>
      </div>
    );
  }

  /* Vem antes do "não encontrado" de propósito: com a API fora, `content`
     também é nulo, e dizer que o ensaio não existe seria informação errada. */
  if (erro) {
    return (
      <div className="px-6 pt-40 max-w-md mx-auto">
        <EstadoDeErro
          mensagem={erro}
          onTentarDeNovo={() => setTentativa((numero) => numero + 1)}
        />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="px-6 pt-40 max-w-md mx-auto space-y-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
          Ensaio não encontrado
        </p>
        <p className="text-ink/45 text-[13px] leading-relaxed">
          O conteúdo solicitado não está disponível ou o link está desatualizado.
        </p>
        <button
          type="button"
          onClick={() => router.push('/descobrir')}
          className="sw-btn px-6 py-2.5"
        >
          Voltar ao acervo
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-8 pt-32 pb-24">
      {/* Cabeçalho do ensaio. O bloco visual com roda, estrela e trajetória
          saiu: a página é texto, e o texto agora abre a página. */}
      <header className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40 hover:text-accent transition-colors mb-10"
        >
          ← Voltar
        </button>

        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 mb-8">
          <Link href={`/descobrir?cat=${content.category}`} className="sw-tag hover:text-accent">
            {content.categoryName}
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/30">
            {content.readTime} · {content.date}
          </span>
        </div>

        <h1 className="font-mono normal-case font-normal text-[clamp(1.5rem,5vw,2.5rem)] leading-[1.2] tracking-[0.01em]">
          {content.title}
        </h1>

        <p className="sw-prose mt-7 text-ink/55">{content.subtitle}</p>

        <div className="sw-rule mt-10 pt-5 flex items-baseline justify-between gap-4">
          {/* A nota de autoria fica colada na assinatura, e não só no rodapé:
              é aqui que o leitor pode tomar um personagem editorial por uma
              pessoa real, então é aqui que a ressalva tem de estar. */}
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
            {content.author} · {content.authorRole}
            <span className="block mt-1.5 normal-case tracking-[0.08em] text-ink/25">
              Personagem editorial do portal, não uma pessoa real.
            </span>
          </span>
          <button
            type="button"
            onClick={handleShare}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40 hover:text-accent transition-colors whitespace-nowrap"
          >
            {copied ? 'Link copiado' : 'Compartilhar'}
          </button>
        </div>
      </header>

      {/* Pontos decisivos */}
      {content.takeaways && (
        <div className="max-w-3xl mx-auto mt-14">
          <div className="sw-frame sw-ticks p-8">
            <span className="sw-label block mb-6">Pontos decisivos</span>
            <div className="border-t border-accent/16">
              {content.takeaways.map((point, idx) => (
                <div key={idx} className="flex items-baseline gap-5 py-3.5 border-b border-accent/16">
                  <span className="sw-idx text-[11px] shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] text-ink/75 leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Corpo */}
      <article className="max-w-3xl mx-auto mt-20 space-y-16">
        {content.sections.map((section, idx) => (
          <section key={idx}>
            {section.heading && (
              <h2 className="font-mono normal-case font-normal text-lg sm:text-xl tracking-[0.02em] mb-6">
                {section.heading}
              </h2>
            )}

            <p className="sw-prose text-ink/80">{section.text}</p>

            {section.callout && (
              <p className="mt-8 border-l border-accent pl-6 text-[13px] text-ink/70 leading-relaxed">
                {section.callout}
              </p>
            )}

            {section.quote && (
              <blockquote className="sw-prose mt-10 border-l border-accent pl-6 text-lg sm:text-xl text-white italic">
                {section.quote}
              </blockquote>
            )}
          </section>
        ))}
      </article>

      {/* Leituras conectadas */}
      {related.length > 0 && (
        <section className="max-w-3xl mx-auto mt-28">
          <div className="flex items-baseline justify-between gap-4 mb-8">
            <h2 className="text-xl sm:text-2xl tracking-[0.08em]">Leituras conectadas</h2>
            <Link
              href="/descobrir"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40 hover:text-accent transition-colors"
            >
              Ver todos →
            </Link>
          </div>

          <div className="border-t border-accent/16">
            {related.map((item, idx) => (
              <Link
                key={item.id}
                href={`/conteudo/${item.slug}`}
                className="sw-row group py-5"
              >
                <span className="sw-idx text-[11px] w-8 shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="text-[13px] text-ink/80 group-hover:text-white transition-colors">
                  {item.title}
                </span>
                <span className="sw-leader hidden sm:block" />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/30 whitespace-nowrap">
                  {item.readTime}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
