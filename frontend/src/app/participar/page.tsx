'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { locationService } from '@/services/locationService';
import { LocationVenue } from '@/types';
import { SectionHead } from '@/components/common/SectionHead';
import { Chip } from '@/components/common/Chip';

const journey = [
  { num: '01', title: 'Conheça o esporte', desc: 'Assista a um bout. Observe como as bloqueadoras constroem o pack e como as jammers buscam o ápice da curva.' },
  { num: '02', title: 'Encontre uma liga', desc: 'Quase toda capital tem uma liga autogerida com turmas abertas de Fresh Meat. Não é preciso ter patins no primeiro dia.' },
  { num: '03', title: 'Faça uma aula', desc: 'O primeiro treino é postura, equilíbrio com joelhos flexionados e técnica de queda segura.' },
  { num: '04', title: 'Monte o kit', desc: 'Cinco itens obrigatórios, mais dureza de rodas e amortecedores calibrados para o seu peso.' },
  { num: '05', title: 'Entre na pista', desc: 'Passe no Minimal Skills — paradas de emergência, 27 voltas em 5 minutos e contato legal — e receba seu número.' },
];

const gear = [
  { id: 'skates', title: 'Patins quad', desc: 'Cano baixo, base plana, quatro rodas paralelas.' },
  { id: 'helmet', title: 'Capacete multimpacto', desc: 'Rente à linha da testa, certificado CPSC / ASTM.' },
  { id: 'kneepads', title: 'Joelheiras de alto impacto', desc: 'Espuma espessa e concha rígida para deslizar no solo.' },
  { id: 'wristguards', title: 'Munhequeiras com tala', desc: 'Evitam hiperextensão do pulso nas paradas.' },
  { id: 'elbowpads', title: 'Cotoveleiras com concha', desc: 'Proteção contra colisões laterais.' },
  { id: 'mouthguard', title: 'Protetor bucal', desc: 'Obrigatório em qualquer treino com contato.' },
];

const cities = ['all', 'São Paulo', 'Rio de Janeiro', 'Curitiba', 'Porto Alegre', 'Brasília'];

export default function Participar() {
  const [locations, setLocations] = useState<LocationVenue[]>([]);
  const [cityFilter, setCityFilter] = useState('all');
  const [checked, setChecked] = useState<Record<string, boolean>>({
    skates: true,
    helmet: true,
    kneepads: true,
  });

  useEffect(() => {
    async function load() {
      const data = await locationService.getLocations(cityFilter !== 'all' ? cityFilter : undefined);
      setLocations(data);
    }
    load();
  }, [cityFilter]);

  return (
    <div className="px-6 sm:px-8 pt-32 pb-24">
      <div className="max-w-6xl mx-auto">
        <header className="mb-20">
          <h1 className="text-[clamp(2rem,7vw,3.5rem)] tracking-[0.08em]">Participar</h1>
          <p className="mt-6 text-ink/45 text-[13px] sm:text-sm leading-relaxed max-w-xl">
            Você não precisa saber patinar para começar. As ligas brasileiras ensinam desde o
            primeiro equilíbrio até o contato de jogo.
          </p>
        </header>

        {/* 01: Jornada (era uma linha do tempo de cinco cartões) */}
        <section className="mb-28">
          <SectionHead title="Do zero à primeira jam" />

          <div className="border-t border-accent/16">
            {journey.map((step) => (
              <div
                key={step.num}
                className="sw-row flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-10 py-6"
              >
                <div className="flex items-baseline gap-4 sm:w-56 shrink-0">
                  <span className="sw-idx text-[11px]">{step.num}</span>
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-white">
                    {step.title}
                  </span>
                </div>
                <p className="text-ink/50 text-[13px] leading-relaxed max-w-xl">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 02: Kit de proteção */}
        <section className="mb-28">
          <SectionHead
            title="Kit obrigatório"
            deck="Ninguém entra na pista sem o conjunto completo. Muitas ligas emprestam proteções nas primeiras semanas."
            /* Aponta para o acervo sem filtro: a categoria `equipamentos` do
               mock antigo não existe mais, e um `cat=` inválido abriria a tela
               com chip aceso e zero resultado. */
            action={
              <Link
                href="/descobrir"
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50 hover:text-accent transition-colors whitespace-nowrap"
              >
                Ver o acervo →
              </Link>
            }
          />

          <div className="border-t border-accent/16">
            {gear.map((item) => {
              const isChecked = checked[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                  aria-pressed={isChecked}
                  className="sw-row w-full py-5 text-left cursor-pointer select-none"
                >
                  <span className={`sw-check self-center ${isChecked ? 'sw-check-on' : ''}`}>×</span>
                  <span
                    className={`font-mono text-xs uppercase tracking-[0.16em] shrink-0 sm:w-64 transition-colors ${
                      isChecked ? 'text-white' : 'text-ink/50'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="hidden sm:block text-ink/40 text-[12px] leading-relaxed">
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 03: Locais */}
        <section>
          <SectionHead
            title="Onde praticar"
            deck="Pistas de piso liso, ginásios com flat track demarcado e quadras com treinos abertos."
            action={
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {cities.map((c) => (
                  <Chip key={c} active={cityFilter === c} onClick={() => setCityFilter(c)}>
                    {c === 'all' ? 'Todas' : c}
                  </Chip>
                ))}
              </div>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locations.map((loc) => (
              <div key={loc.id} className="sw-frame sw-frame-live p-7">
                <div className="flex items-baseline justify-between gap-4 mb-6">
                  <span className="sw-tag">
                    {loc.city}, {loc.state}
                  </span>
                  {loc.hasSkateLoan && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-live/70">
                      Empresta patins
                    </span>
                  )}
                </div>

                <h3 className="text-base leading-snug">{loc.name}</h3>

                <div className="mt-6 border-t border-accent/16">
                  {[
                    { label: 'Endereço', value: loc.address },
                    { label: 'Superfície', value: loc.surfaceType },
                    { label: 'Sessões', value: loc.openSessions },
                    { label: 'Contato', value: loc.contact },
                  ].map((row) => (
                    <div key={row.label} className="sw-row py-2.5">
                      <span className="sw-label sw-label-bare shrink-0">{row.label}</span>
                      <span className="sw-leader hidden sm:block" />
                      <span className="text-[12px] text-ink/70 text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Fechamento */}
        <section className="mt-28">
          <div className="sw-frame sw-ticks px-8 py-16 text-center">
            <h2 className="text-xl sm:text-3xl tracking-[0.08em]">
              Pronta para a primeira volta?
            </h2>
            <p className="mt-6 text-ink/45 text-[13px] leading-relaxed max-w-md mx-auto">
              As ligas estão com inscrições abertas para novas turmas.
            </p>
            <Link href="/conectar" className="sw-btn sw-btn-solid mt-9 px-7 py-3">
              Conectar com uma liga
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
