
import { FTLMission, Sighting } from '../../types';

const MISSIONS_KEY = 'rudraksha_ftl_missions';

export const FTLStorageService = {
  getMissions: async (): Promise<FTLMission[]> => {
    const stored = localStorage.getItem(MISSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveMission: async (mission: FTLMission): Promise<void> => {
    const missions = await FTLStorageService.getMissions();
    const idx = missions.findIndex(m => m.id === mission.id);
    if (idx >= 0) missions[idx] = mission;
    else missions.unshift(mission);
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions));
  },

  deleteMission: async (missionId: string): Promise<void> => {
    const missions = await FTLStorageService.getMissions();
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions.filter(m => m.id !== missionId)));
  },

  addSighting: async (missionId: string, sighting: Sighting): Promise<void> => {
    const missions = await FTLStorageService.getMissions();
    const idx = missions.findIndex(m => m.id === missionId);
    if (idx >= 0) {
      missions[idx].sightings.unshift(sighting);
      localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions));
    }
  },

  verifySighting: async (missionId: string, sightingId: string, verified: boolean): Promise<void> => {
    const missions = await FTLStorageService.getMissions();
    const mIdx = missions.findIndex(m => m.id === missionId);
    if (mIdx >= 0) {
      const sIdx = missions[mIdx].sightings.findIndex(s => s.id === sightingId);
      if (sIdx >= 0) {
        if (verified) {
            missions[mIdx].sightings[sIdx].isVerified = true;
        } else {
            missions[mIdx].sightings[sIdx].isVerified = false;
        }
        localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions));
      }
    }
  },

  resolveMission: async (missionId: string): Promise<void> => {
    const missions = await FTLStorageService.getMissions();
    const idx = missions.findIndex(m => m.id === missionId);
    if (idx >= 0) {
      missions[idx].status = 'resolved';
      localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions));
    }
  }
};
