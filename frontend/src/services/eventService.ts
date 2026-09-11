import { Event } from '@/types';
import { mockEvents } from '@/data/eventData';

/**
 * Service de Eventos e Bouts
 * FUTURAMENTE: GET /api/events
 */
export const eventService = {
  async getEvents(): Promise<Event[]> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return [...mockEvents];
  },

  async getUpcomingEvents(): Promise<Event[]> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return mockEvents.filter((e) => e.registrationStatus !== 'esgotada');
  },
};
