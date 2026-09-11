import { Team } from '@/types';
import { mockTeams } from '@/data/teamData';

/**
 * Service de Equipes e Ligas do Derby Synthetica
 * 
 * ATUALMENTE: Retorna dados estruturados a partir dos mocks locais.
 * FUTURAMENTE: Conectado a:
 *   - GET /api/teams
 *   - GET /api/teams/:id
 */

export const teamService = {
  async getTeams(params?: { city?: string; search?: string }): Promise<Team[]> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    let results = [...mockTeams];

    if (params?.city && params.city !== 'all') {
      results = results.filter((team) => team.city.toLowerCase() === params.city?.toLowerCase());
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      results = results.filter(
        (team) =>
          team.name.toLowerCase().includes(q) ||
          team.alias.toLowerCase().includes(q) ||
          team.city.toLowerCase().includes(q) ||
          team.description.toLowerCase().includes(q)
      );
    }

    return results;
  },

  async getTeamById(id: string): Promise<Team | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const team = mockTeams.find((t) => t.id === id);
    return team || null;
  },
};
