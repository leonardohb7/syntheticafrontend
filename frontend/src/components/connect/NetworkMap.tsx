'use client';

import React from 'react';
import { Team } from '@/types';

interface NetworkMapProps {
  teams: Team[];
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string) => void;
}

/**
 * Mapa esquemático das ligas. Grade fina, rotas em 1px e nós como cruzetas
 * com rótulo monoespaçado. O nó selecionado ganha um quadrado cheio; nada
 * pulsa, nada escala.
 */
export const NetworkMap: React.FC<NetworkMapProps> = ({ teams, selectedTeamId, onSelectTeam }) => (
  <div className="sw-frame sw-ticks relative w-full aspect-[16/9] max-h-[440px] overflow-hidden">
    {/* Grade de fundo */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(255,46,151,0.07) 1px, transparent 1px), linear-gradient(180deg, rgba(255,46,151,0.07) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    />

    {/* Rotas entre os polos */}
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <g stroke="rgba(255,46,151,0.30)" strokeWidth="0.25" fill="none">
        <path d="M 58 48 L 68 58 L 74 65" />
        <path d="M 68 58 L 62 70 L 55 78 L 48 88" />
        <path d="M 62 70 L 74 65" strokeDasharray="1.5 1.5" />
      </g>
    </svg>

    {/* Nós */}
    <div className="absolute inset-0">
      {teams.map((team) => {
        const isSelected = selectedTeamId === team.id;
        return (
          <button
            key={team.id}
            type="button"
            onClick={() => onSelectTeam(team.id)}
            style={{ left: `${team.mapCoordinates.xPercent}%`, top: `${team.mapCoordinates.yPercent}%` }}
            className="group absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 cursor-pointer"
          >
            <span
              className={`w-1.5 h-1.5 transition-colors ${
                isSelected
                  ? 'bg-accent shadow-[0_0_8px_rgba(255,46,151,0.9)]'
                  : 'bg-accent/40 group-hover:bg-accent'
              }`}
            />
            <span
              className={`font-mono text-[10px] tracking-[0.16em] uppercase whitespace-nowrap transition-colors ${
                isSelected ? 'text-white' : 'text-ink/45 group-hover:text-ink'
              }`}
            >
              {team.city}
            </span>
          </button>
        );
      })}
    </div>

    <div className="absolute bottom-4 left-5 sw-label">
      Rede interestadual · {teams.length} polos
    </div>
  </div>
);
