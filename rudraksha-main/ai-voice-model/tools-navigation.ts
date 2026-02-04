
import { FunctionDeclaration, Type } from '@google/genai';

export const NAVIGATION_TOOLS: FunctionDeclaration[] = [
  {
    name: 'navigate_app',
    parameters: {
      type: Type.OBJECT,
      description: 'Navigates to a specific section of the application.',
      properties: {
        target: {
          type: Type.STRING,
          description: 'The destination keyword (e.g., "assignment", "calendar", "arcade", "home").'
        }
      },
      required: ['target']
    }
  },
  {
    name: 'launch_game',
    parameters: {
      type: Type.OBJECT,
      description: 'Opens a specific game directly within the Arcade.',
      properties: {
        game_name: {
          type: Type.STRING,
          description: 'The name of the game (e.g., Speed Zone, Danphe Rush, Memory Shore).'
        }
      },
      required: ['game_name']
    }
  },
  {
    name: 'control_map_view',
    parameters: {
      type: Type.OBJECT,
      description: 'Controls the Heritage Map. Use this when asked about "Introduction of [Site]", "Explain [Province]", or "Show me [Site]".',
      properties: {
        target_name: { 
            type: Type.STRING, 
            description: 'Name of the province or heritage site.' 
        },
        type: {
            type: Type.STRING,
            enum: ['province', 'site', 'reset'],
            description: 'Type of location.'
        }
      },
      required: ['target_name', 'type']
    }
  },
  {
    name: 'start_navigation',
    parameters: {
      type: Type.OBJECT,
      description: 'Initiates a navigation request to a physical location or finds nearest places (Google Maps).',
      properties: {
        destination: { type: Type.STRING, description: 'The name of the place to go or "nearest [place]".' }
      },
      required: ['destination']
    }
  }
];

export const executeNavigationTool = async (name: string, args: any, navigate: (path: string, state?: any) => void) => {
  if (name === 'navigate_app') {
    const t = args.target.toLowerCase();
    
    // Comprehensive Fuzzy Intent Mapping
    const mappings: Record<string, string> = {
        'home': '/', 
        'dashboard': '/', 
        'main': '/',
        'planner': '/planner', 
        'task': '/planner', 
        'library': '/library', 
        'book': '/library', 
        'calendar': '/culture', 
        'date': '/culture', 
        'holiday': '/culture', 
        'culture': '/culture', 
        'map': '/map', 
        'kitchen': '/recipes', 
        'recipe': '/recipes', 
        'community': '/community-chat', 
        'chat': '/community-chat', 
        'health': '/health', 
        'safety': '/safety', 
        'arcade': '/arcade', 
        'game': '/arcade', 
        'rewards': '/rewards', 
        'shop': '/rewards', 
        'settings': '/settings', 
        'profile': '/profile', 
        'guru': '/study-buddy',
        'buddy': '/study-buddy',
        'messenger': '/messenger-bot',
        'bot': '/messenger-bot',
        'automation': '/messenger-bot'
    };

    let path = mappings[t];

    if (!path) {
        if (t.includes('assign') || t.includes('home') || t.includes('work')) path = '/planner';
        else if (t.includes('book')) path = '/library';
        else if (t.includes('map')) path = '/map';
        else if (t.includes('game') || t.includes('play')) path = '/arcade';
        else if (t.includes('message') || t.includes('facebook') || t.includes('auto')) path = '/messenger-bot';
        else {
            const foundKey = Object.keys(mappings).find(key => t.includes(key));
            if (foundKey) path = mappings[foundKey];
        }
    }

    if (path) {
      navigate(path);
      return { result: `Success: Navigating to ${t}.` };
    }
    return { result: `Error: Destination "${args.target}" not recognized.` };
  }

  if (name === 'launch_game') {
    const gameQuery = args.game_name.toLowerCase();
    const gameMap: Record<string, string> = {
        'speed': 'speed',
        'danphe': 'danphe',
        'memory': 'memory',
        'focus': 'attention',
        'agility': 'flexibility',
        'logic': 'problem'
    };

    const gameId = Object.keys(gameMap).find(k => gameQuery.includes(k));
    if (gameId) {
      navigate('/arcade', { state: { autoLaunch: gameMap[gameId] } });
      return { result: `Success: Launching ${args.game_name}.` };
    }
    return { result: `Error: Game module "${args.game_name}" not found.` };
  }

  if (name === 'control_map_view') {
      navigate('/map');
      
      setTimeout(() => {
          window.dispatchEvent(new CustomEvent('rudraksha-map-control', {
              detail: { type: args.type, targetName: args.target_name }
          }));
      }, 200); // Reduced delay for speed

      return { 
          result: `Opened map and focused on ${args.target_name}. Please provide a brief introduction and historical significance of ${args.target_name} now.` 
      };
  }

  if (name === 'start_navigation') {
      const dest = args.destination.toLowerCase();
      
      if (dest.includes('nearest') || dest.includes('nearby')) {
          window.open(`https://www.google.com/maps/search/${encodeURIComponent(dest)}`, '_blank');
          return { result: `Searching for ${dest} on Google Maps.` };
      } else {
          window.dispatchEvent(new CustomEvent('rudraksha-nav-start', {
              detail: { destination: args.destination, mode: 'w' } 
          }));
          return { result: `Destination acquired: ${args.destination}. Navigation overlay initialized.` };
      }
  }

  return null;
};
