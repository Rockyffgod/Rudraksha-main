import { FunctionDeclaration, Type } from '@google/genai';
import { StorageService } from '../services/storageService';

export const REWARDS_TOOLS: FunctionDeclaration[] = [
  {
    name: 'check_karma_balance',
    parameters: {
      type: Type.OBJECT,
      description: 'Checks the user\'s current Karma points balance.',
      properties: {}
    }
  },
  {
    name: 'redeem_reward_item',
    parameters: {
      type: Type.OBJECT,
      description: 'Redeems a reward item from the Karma Bazaar.',
      properties: {
        keyword: { type: Type.STRING, description: 'Keyword of the item (e.g., "tree", "dog", "gold frame").' }
      },
      required: ['keyword']
    }
  }
];

export const executeRewardsTool = async (name: string, args: any, navigate: (path: string) => void) => {
  if (name === 'check_karma_balance') {
    const p = await StorageService.getProfile();
    return { result: `You currently have ${p?.points || 0} Karma points.` };
  }

  if (name === 'redeem_reward_item') {
    const key = args.keyword.toLowerCase();
    let itemId = '';
    let cost = 0;

    // Simple keyword mapping for demo purposes
    if (key.includes('dog')) { itemId = 'donate_dog'; cost = 100; }
    else if (key.includes('tree')) { itemId = 'donate_tree'; cost = 250; }
    else if (key.includes('orphan')) { itemId = 'donate_orphan'; cost = 1000; }
    else if (key.includes('gold') && key.includes('frame')) { itemId = 'frame_gold'; cost = 200; }
    else if (key.includes('adventurer')) { itemId = 'pack_adventurer'; cost = 500; }
    
    if (itemId) {
        const res = await StorageService.redeemReward(itemId, cost);
        if (res.success) {
            navigate('/rewards');
            return { result: `Successfully redeemed ${args.keyword}. Karma deducted.` };
        } else {
            return { result: `Redemption failed: ${res.error}` };
        }
    }
    
    return { result: `I couldn't find a reward item matching "${args.keyword}". Try visiting the Bazaar.` };
  }

  return null;
};