
import { FunctionDeclaration, Type } from '@google/genai';
import { StorageService } from '../services/storageService';

export const ARCADE_TOOLS: FunctionDeclaration[] = [
  {
    name: 'check_leaderboard_rank',
    parameters: {
      type: Type.OBJECT,
      description: 'Checks the top ranking user on the leaderboard.',
      properties: {
        game: { type: Type.STRING, enum: ['points', 'danphe', 'speed', 'memory', 'attention'], description: 'Game category (optional, defaults to global points).' }
      }
    }
  }
];

export const executeArcadeTool = async (name: string, args: any, navigate: (path: string) => void) => {
  if (name === 'check_leaderboard_rank') {
    const game = args.game || 'points';
    const leaders = await StorageService.getLeaderboard(1, game);
    if (leaders.length > 0) {
        const top = leaders[0];
        let score = 0;
        if (game === 'points') score = top.points;
        else score = (top.highScores as any)?.[game] || 0;
        
        return { result: `The current leader for ${game} is ${top.name} with ${score} points.` };
    }
    return { result: "Leaderboard is currently empty." };
  }
  return null;
};
