'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SectionHead } from '@/components/common/SectionHead';
import { EstadoDeErro } from '@/components/common/EstadoDeErro';
import { contentService } from '@/services/contentService';
import { teamService } from '@/services/teamService';
import { Content, Team } from '@/types';

/* Textos enxutos: uma linha por item. A versão longa de cada conceito vive
   nos ensaios de /descobrir, e repeti-la aqui era o excesso de informação.

   Cada pilar diz o que mudou até 2047 e o que continua igual. É a tese da
   página: o esporte cresceu sem trocar o que ele é. Sem número cravado de
   velocidade ou público, que seria dado inventado. */
const pillars = [
  { num: '01', title: 'Velocidade', desc: 'Arrancada explosiva na tração de oito rodas, sem motor e sem auxílio. A física é a mesma de vinte anos atrás.' },
  { num: '02', title: 'Estratégia', desc: 'Atacar e defender no mesmo instante, em jams de até dois minutos. O que ficou mais rápido foi a remontagem do pack.' },
  { num: '03', title: 'Contato', desc: 'Bloqueio com torso, quadril e ombro, dentro de zonas legais milimétricas. A arbitragem virou assistida, o julgamento continua humano.' },
  { num: '04', title: 'Comunidade', desc: 'Ginásio cheio e calendário fechado, com a assembleia de atletas ainda decidindo as regras.' },
];

const steps = [
  { num: '01', title: 'Descubra', desc: 'Entenda o pack, as regras e a linguagem da pista plana.' },
  { num: '02', title: 'Experimente', desc: 'Calce patins quad e aprenda a cair em quatro apoios. Continua sendo a primeira aula.' },
  { num: '03', title: 'Encontre uma liga', desc: 'Do galpão de bairro ao ginásio de temporada, quase toda cidade tem a sua.' },
  { num: '04', title: 'Vá a um treino', desc: 'Inscreva-se no Fresh Meat. Nenhuma experiência exigida, e a proteção sai do acervo da liga.' },
  { num: '05', title: 'Entre na pista', desc: 'Passe no Minimal Skills, escolha seu derby name e jogue.' },
];

export default function Home() {
  const [featured, setFeatured] = useState<Content | null>(null);
  const [secondary, setSecondary] = useState<Content[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [erroDoAcervo, setErroDoAcervo] = useState<string | null>(null);
  /* Só existe para o botão de nova tentativa reexecutar o efeito do acervo. */
  const [tentativa, setTentativa] = useState(0);

  /* As ligas saem de dado local e sempre respondem. Carregar em efeito
     separado do acervo é o que impede uma falha da API de apagar a seção
     delas junto: no Promise.all antigo, uma rejeição levava as duas. */
  useEffect(() => {
    teamService.getTeams().then((ligas) => setTeams(ligas.slice(0, 5)));
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarAcervo() {
      setErroDoAcervo(null);

      try {
        const [destaque, conteudos] = await Promise.all([
          contentService.getFeaturedContent(),
          contentService.getContents(),
        ]);

        if (cancelado) return;

        setFeatured(destaque);
        setSecondary(conteudos.filter((item) => item.slug !== destaque?.slug).slice(0, 3));
      } catch (falha) {
        if (cancelado) return;

        setErroDoAcervo(falha instanceof Error ? falha.message : 'O acervo não respondeu.');
        setFeatured(null);
        setSecondary([]);
      }
    }

    carregarAcervo();
    return () => {
      cancelado = true;
    };
  }, [tentativa]);

  return (
    <div>
      {/* ===================================================
          HERÓI: a única imagem da página, malha em fuga
          =================================================== */}
      {/* A malha ocupa a faixa inferior e o texto vive acima dela: o padding
          reserva o espaço, então a linha do horizonte nunca corta o título. */}
      <section className="relative min-h-screen overflow-hidden px-6 sm:px-8 pt-40 pb-[38vh]">
        <div className="sw-mesh h-[34vh]" />
        <div className="absolute left-0 right-0 bottom-[34vh] h-px sw-horizon opacity-60" />

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          {/* 9vw, não 11: em 390px de largura "SYNTHETICA" mais o tracking
              estouravam a caixa e a última letra era cortada. */}
          <h1 className="text-[clamp(1.9rem,9vw,6rem)] leading-[0.94]">
            <span className="block font-bold text-white">Derby</span>
            <span className="block font-medium text-accent tracking-[0.1em]">Synthetica</span>
          </h1>

          <p className="sw-caret mt-8 font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] text-ink/60">
            Temporada 2047 · Flat track
          </p>

          {/* A moldura da ficção precisa ser estabelecida na primeira tela, e o
              jeito de fazer isso sem legenda explicativa é o contraste: o que
              era, o que é, e a coisa que não mudou no meio. */}
          <p className="mt-6 text-ink/45 text-[13px] leading-relaxed max-w-md">
            Vinte anos atrás era esporte de galpão alugado e ingresso vendido na porta.
            Hoje enche ginásio. A assembleia de atletas continua decidindo as regras.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link href="/descobrir" className="sw-btn sw-btn-solid px-7 py-3">
              Descubra o esporte
            </Link>
            <Link
              href="/conectar"
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50 hover:text-accent transition-colors"
            >
              Ver as ligas →
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================
          01: O ESPORTE (era uma grade de quatro cartões)
          =================================================== */}
      <section className="px-6 sm:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <SectionHead
            title="Por que ele cresceu"
            deck="Não é corrida nem teatro coreografado. É combate tático sem bola, onde cada corpo é escudo, aríete e pontuador ao mesmo tempo. Isso nunca mudou, e é exatamente o que encheu a arquibancada."
          />

          <div className="border-t border-accent/16">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="sw-row flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-10 py-6"
              >
                <div className="flex items-baseline gap-4 sm:w-52 shrink-0">
                  <span className="sw-idx text-[11px]">{pillar.num}</span>
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-white">
                    {pillar.title}
                  </span>
                </div>
                <p className="text-ink/50 text-[13px] leading-relaxed max-w-xl">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================
          02: ACERVO, um destaque emoldurado, o resto em fileira
          =================================================== */}
      <section className="px-6 sm:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <SectionHead
            title="Descubra a pista"
            deck="Ensaios autorais sobre tática, equipamento, arbitragem e a cultura escrita do flat track."
            action={
              <Link
                href="/descobrir"
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50 hover:text-accent transition-colors whitespace-nowrap"
              >
                Ver todos →
              </Link>
            }
          />

          {/* A falha fica contida nesta seção: o herói, os pilares, as ligas e
              o guia continuam na tela, porque não dependem da API. */}
          {erroDoAcervo && (
            <EstadoDeErro
              className="py-4"
              titulo="Acervo fora de alcance"
              mensagem={erroDoAcervo}
              onTentarDeNovo={() => setTentativa((numero) => numero + 1)}
            />
          )}

          {featured && (
            <Link
              href={`/conteudo/${featured.slug}`}
              className="sw-frame sw-frame-live sw-ticks block p-8 sm:p-12 mb-12"
            >
              <div className="flex items-baseline justify-between gap-4 mb-8">
                <span className="sw-tag">{featured.categoryName}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/30">
                  {featured.readTime}
                </span>
              </div>

              <h3 className="text-xl sm:text-3xl leading-snug tracking-[0.02em] max-w-2xl normal-case">
                {featured.title}
              </h3>

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

          {/* Condicionado à lista porque o fio de topo, sozinho, apareceria
              como um traço solto quando o acervo não carrega. */}
          {secondary.length > 0 && (
            <div className="border-t border-accent/16">
              {secondary.map((content, idx) => (
                <Link
                  key={content.id}
                  href={`/conteudo/${content.slug}`}
                  className="sw-row group flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 py-5"
                >
                  <span className="sw-idx text-[11px] w-8 shrink-0">
                    {String(idx + 2).padStart(2, '0')}
                  </span>
                  <span className="text-sm text-ink/85 group-hover:text-white transition-colors max-w-lg">
                    {content.title}
                  </span>
                  <span className="sw-leader hidden sm:block" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/30 whitespace-nowrap">
                    {content.categoryName} · {content.readTime}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===================================================
          03: LIGAS, índice, não cartões
          =================================================== */}
      <section className="px-6 sm:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <SectionHead
            title="Conecte-se"
            deck="Ligas independentes por todo o Brasil, do galpão de bairro ao ginásio de temporada, abertas a novas patinadoras, arbitragem e torcida."
            action={
              <Link
                href="/conectar"
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50 hover:text-accent transition-colors whitespace-nowrap"
              >
                Mapa completo →
              </Link>
            }
          />

          <div className="border-t border-accent/16">
            {teams.map((team) => (
              <Link
                key={team.id}
                href="/conectar"
                className="sw-row group flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 py-5"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/75 sm:w-40 shrink-0">
                  {team.city}
                </span>
                <span className="text-sm text-ink/85 group-hover:text-white transition-colors">
                  {team.name}
                </span>
                <span className="sw-leader hidden sm:block" />
                <span className="font-mono text-[10px] tabular-nums tracking-[0.16em] text-ink/30">
                  {team.foundedYear}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================
          04: COMEÇAR (era uma grade de cinco cartões)
          =================================================== */}
      <section className="px-6 sm:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <SectionHead
            title="Entre na pista"
            deck="Do primeiro contato teórico à primeira jam oficial. A porta de entrada é a mesma de sempre."
            action={
              <Link href="/participar" className="sw-btn px-6 py-3">
                Guia do iniciante
              </Link>
            }
          />

          <div className="border-t border-accent/16">
            {steps.map((step) => (
              <div
                key={step.num}
                className="sw-row flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-10 py-6"
              >
                <div className="flex items-baseline gap-4 sm:w-52 shrink-0">
                  <span className="sw-idx text-[11px]">{step.num}</span>
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-white">
                    {step.title}
                  </span>
                </div>
                <p className="text-ink/50 text-[13px] leading-relaxed max-w-xl">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================
          FECHAMENTO
          =================================================== */}
      <section className="px-6 sm:px-8 pt-12 pb-24">
        <div className="sw-frame sw-ticks max-w-3xl mx-auto px-8 py-16 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-4xl leading-[1.25] tracking-[0.08em]">
            Descubra.<br />Conecte.<br />Participe.
          </h2>

          <p className="mt-8 text-ink/45 text-[13px] leading-relaxed max-w-md mx-auto">
            O esporte cresceu, encheu ginásio e não fechou a porta. O próximo apito inicial
            está a poucos passos.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/descobrir" className="sw-btn sw-btn-solid px-7 py-3">
              Acervo
            </Link>
            <Link href="/participar" className="sw-btn px-7 py-3">
              Aula experimental
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
