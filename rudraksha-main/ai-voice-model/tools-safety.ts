
import { FunctionDeclaration, Type } from '@google/genai';
import { StorageService } from '../services/storageService';
import { FTLMission } from '../types';

export const SAFETY_TOOLS: FunctionDeclaration[] = [
  {
    name: 'check_safety_alerts',
    parameters: {
      type: Type.OBJECT,
      description: 'Checks for active emergency alerts or lost items in the vicinity.',
      properties: {
        radius_km: { type: Type.NUMBER, description: 'Search radius in km (optional).' }
      }
    }
  },
  {
    name: 'report_lost_found_item',
    parameters: {
      type: Type.OBJECT,
      description: 'Drafts a report for a lost or found item/person/pet. Requires specific location details.',
      properties: {
        status: { 
          type: Type.STRING, 
          enum: ['lost', 'found'],
          description: 'Whether the item was lost or found.' 
        },
        category: {
            type: Type.STRING,
            enum: ['pet', 'person', 'object'],
            description: 'Category of the report.'
        },
        description: { 
          type: Type.STRING, 
          description: 'Short description of the item (e.g. "Black Labrador", "Red wallet").' 
        },
        location: { 
          type: Type.STRING, 
          description: 'Specific location including city (e.g. "Central Park, Kathmandu").' 
        }
      },
      required: ['status', 'category', 'description', 'location']
    }
  }
];

export const executeSafetyTool = async (name: string, args: any, navigate: (path: string) => void) => {
  if (name === 'check_safety_alerts') {
    const missions = await StorageService.getMissions();
    const active = missions.filter(m => m.status === 'active');
    
    if (active.length === 0) {
      return { result: "There are no active emergency alerts in your vicinity. Systems normal." };
    }
    
    navigate('/safety');
    const titles = active.slice(0, 3).map(m => m.title).join(", ");
    return { result: `There are ${active.length} active alerts. Most recent: ${titles}. Opening Safety protocol.` };
  }

  if (name === 'report_lost_found_item') {
    // Navigate to safety page
    navigate('/safety');
    
    // Fast dispatch to pre-fill the form
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('rudraksha-ftl-draft', { 
            detail: {
                status: args.status,
                category: args.category,
                description: args.description,
                location: args.location
            } 
        }));
    }, 200); 

    return { 
        result: `Report drafted for ${args.status} ${args.description} at ${args.location}. Please upload a photo on the screen to confirm.` 
    };
  }

  return null;
};
