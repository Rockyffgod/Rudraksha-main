
import { HeritageSite } from '../types';
import { HERITAGE_SITES } from '../data/staticData';

export const HeritageService = {
  getAllSites: async (): Promise<HeritageSite[]> => {
    // Return high quality local data for the demo to ensure images load
    return HERITAGE_SITES;
  }
};
