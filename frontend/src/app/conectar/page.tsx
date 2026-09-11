'use client';

import React, { useState, useEffect } from 'react';
import { teamService } from '@/services/teamService';
import { eventService } from '@/services/eventService';
import { Team, Event } from '@/types';
import { NetworkMap } from '@/components/connect/NetworkMap';
import { SectionHead } from '@/components/common/SectionHead';
import { Chip } from '@/components/common/Chip';

const cities = ['all', 'São Paulo', 'Rio de Janeiro', 'Curitiba', 'Porto Alegre', 'Brasília', 'Belo Horizonte'];

export default function Conectar() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const [formSent, setFormSent] = useState(false);

  useEffect(() => {
    async function load() {
      const [allTeams, allEvents] = await Promise.all([
        teamService.getTeams({ city: cityFilter, search: searchQuery }),
        eventService.getEvents(),
      ]);
      setTeams(allTeams);
      setEvents(allEvents);
      /* Mantém a seleção se ela sobreviveu ao filtro; senão cai na primeira. */
      setSelectedTeamId((current) =>
        current && allTeams.some((t) => t.id === current) ? current : allTeams[0]?.id ?? null
      );
    }
    load();
  }, [cityFilter, searchQuery]);

  const selected = teams.find((t) => t.id === selectedTeamId) ?? null;

  const openContact = () => {
    setFormSent(false);
    setContactOpen(true);
  };

  return (
    <div className="px-6 sm:px-8 pt-32 pb-24">
      <div className="max-w-6xl mx-auto">
        <header className="mb-14">
          <h1 className="text-[clamp(2rem,7vw,3.5rem)] tracking-[0.08em]">Conectar</h1>
          <p className="mt-6 text-ink/45 text-[13px] sm:text-sm leading-relaxed max-w-xl">
            O roller derby existe por apoio mútuo e autogestão. Encontre a liga da sua cidade,
            acompanhe os bouts e junte-se à bancada.
          </p>
        </header>

        <NetworkMap
          teams={teams}
          selectedTeamId={selectedTeamId}
          onSelectTeam={setSelectedTeamId}
        />

        {/* Filtros */}
        <div className="sw-rule-fade mt-14 pt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {cities.map((city) => (
              <Chip key={city} active={cityFilter === city} onClick={() => setCityFilter(city)}>
                {city === 'all' ? 'Todas' : city}
              </Chip>
            ))}
          </div>

          <div className="sw-field w-full lg:w-64 shrink-0">
            <input
              type="text"
              placeholder="Buscar liga"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-2.5 text-[11px] uppercase tracking-[0.14em]"
            />
          </div>
        </div>

        {/* Índice de ligas à esquerda, ficha da selecionada à direita.
            Substituiu a grade em que cada liga repetia o mesmo cartão. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="border-t border-accent/16">
              {teams.map((team) => {
                const isSelected = team.id === selectedTeamId;
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setSelectedTeamId(team.id)}
                    className="sw-row w-full py-4 text-left cursor-pointer"
                  >
                    <span
                      className={`w-1.5 h-1.5 shrink-0 self-center transition-colors ${
                        isSelected ? 'bg-accent' : 'bg-accent/25'
                      }`}
                    />
                    <span
                      className={`text-[13px] transition-colors ${
                        isSelected ? 'text-white' : 'text-ink/60'
                      }`}
                    >
                      {team.name}
                    </span>
                    <span className="sw-leader" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/30 whitespace-nowrap">
                      {team.state}
                    </span>
                  </button>
                );
              })}
            </div>

            {teams.length === 0 && (
              <p className="py-10 font-mono text-[11px] uppercase tracking-[0.24em] text-ink/40">
                Nenhuma liga encontrada
              </p>
            )}
          </div>

          {selected && (
            <div className="lg:col-span-7">
              <div className="sw-frame sw-ticks p-8 sm:p-10 lg:sticky lg:top-24">
                <div className="flex items-baseline justify-between gap-4 mb-8">
                  <span className="sw-tag">{selected.alias}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/30">
                    {selected.city}, {selected.state}
                  </span>
                </div>

                <h2 className="font-mono text-xl sm:text-2xl normal-case tracking-[0.02em]">
                  {selected.name}
                </h2>

                <p className="mt-5 text-ink/50 text-[13px] leading-relaxed">
                  {selected.description}
                </p>

                <div className="mt-9 border-t border-accent/16">
                  {[
                    { label: 'Fundação', value: String(selected.foundedYear) },
                    { label: 'Roster ativo', value: `${selected.rosterCount} atletas` },
                    { label: 'Pista base', value: selected.homeTrack },
                    { label: 'Instagram', value: selected.instagram },
                    ...(selected.nextEvent
                      ? [{ label: 'Próximo bout', value: `${selected.nextEvent.name} · ${selected.nextEvent.date}` }]
                      : []),
                  ].map((item) => (
                    <div key={item.label} className="sw-row py-3">
                      <span className="sw-label sw-label-bare shrink-0">{item.label}</span>
                      <span className="sw-leader hidden sm:block" />
                      <span className="text-[12px] text-ink/75 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={openContact} className="sw-btn sw-btn-solid mt-9 px-6 py-3">
                  Falar com a liga
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Agenda */}
        <section className="mt-28">
          <SectionHead
            title="Próximos encontros"
            deck="Partidas abertas ao público, workshops de arbitragem e clínicas técnicas."
          />

          <div className="border-t border-accent/16">
            {events.map((evt) => (
              <div key={evt.id} className="sw-row flex-col items-stretch gap-2 py-6">
                <div className="flex items-baseline gap-4 sm:gap-6">
                  <span className="sw-idx text-[10px] uppercase tracking-[0.16em] w-24 shrink-0">
                    {evt.date}
                  </span>
                  <span className="text-sm text-ink/85">{evt.title}</span>
                  <span className="sw-leader hidden md:block" />
                  <span className="hidden md:block font-mono text-[10px] uppercase tracking-[0.16em] text-ink/30 whitespace-nowrap">
                    {evt.typeLabel} · {evt.isOpenToPublic ? 'Entrada livre' : 'Inscritas'}
                  </span>
                </div>
                <p className="pl-0 sm:pl-30 text-ink/40 text-[12px] leading-relaxed">
                  {evt.venue} · {evt.city} · {evt.time}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Contato */}
      {contactOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="sw-frame sw-ticks bg-black w-full max-w-md p-8">
            <div className="flex items-baseline justify-between gap-4 mb-8">
              <span className="sw-label">{selected.city}</span>
              <button
                type="button"
                onClick={() => setContactOpen(false)}
                className="font-mono text-sm text-ink/40 hover:text-accent transition-colors"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <h3 className="text-lg normal-case">{selected.name}</h3>

            {formSent ? (
              <div className="mt-8 space-y-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                  Mensagem encaminhada
                </p>
                <p className="text-ink/50 text-[12px] leading-relaxed">
                  A equipe de acolhimento Fresh Meat entrará em contato pelo canal informado.
                </p>
                <button
                  type="button"
                  onClick={() => setContactOpen(false)}
                  className="sw-btn px-6 py-2.5"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setFormSent(true);
                }}
                className="mt-8 space-y-5"
              >
                <div className="space-y-2">
                  <label className="sw-label block">Nome</label>
                  <div className="sw-field">
                    <input required type="text" className="px-3.5 py-2.5 text-[12px]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="sw-label block">E-mail ou WhatsApp</label>
                  <div className="sw-field">
                    <input required type="text" className="px-3.5 py-2.5 text-[12px]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="sw-label block">Interesse</label>
                  <div className="sw-field">
                    <select className="px-3.5 py-2.5 text-[12px]">
                      <option value="fresh_meat">Fresh Meat — começar do zero</option>
                      <option value="transfer">Já patino — transferência</option>
                      <option value="referee">Arbitragem / NSO</option>
                      <option value="fan">Torcida / bouts</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-4">
                  <button type="submit" className="sw-btn sw-btn-solid px-6 py-2.5">
                    Enviar
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactOpen(false)}
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40 hover:text-ink transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
