import { LocationVenue } from '@/types';
import { mockLocations } from '@/data/locationData';

/**
 * Service de Locais e Pistas para Prática
 * FUTURAMENTE: GET /api/locations
 */
export const locationService = {
  async getLocations(cityFilter?: string): Promise<LocationVenue[]> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    if (cityFilter && cityFilter !== 'all') {
      return mockLocations.filter((l) => l.city.toLowerCase() === cityFilter.toLowerCase());
    }
    return [...mockLocations];
  },

  async getLocationById(id: string): Promise<LocationVenue | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const loc = mockLocations.find((l) => l.id === id);
    return loc || null;
  },
};
