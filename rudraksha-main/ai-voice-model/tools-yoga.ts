
import { FunctionDeclaration, Type } from '@google/genai';

export const YOGA_TOOLS: FunctionDeclaration[] = [
  {
    name: 'control_yoga_session',
    parameters: {
      type: Type.OBJECT,
      description: 'Controls the active Yoga/Meditation UI based on voice commands. Supports English ("Next", "Back", "Repeat", "Stop") and Nepali ("Arko/Aagadi", "Pachhi/Farka", "Pheri/Dohoryau", "Banda/Sakincha").',
      properties: {
        command: {
          type: Type.STRING,
          enum: ['next', 'prev', 'repeat', 'exit'],
          description: 'The action to perform. Map "arko"/"next" to next, "pachhi"/"back" to prev, "pheri"/"repeat" to repeat, "banda"/"stop" to exit.'
        }
      },
      required: ['command']
    }
  }
];

export const executeYogaTool = async (name: string, args: any) => {
  if (name === 'control_yoga_session') {
    const { command } = args;
    
    // Fast dispatch to the UI component
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('rudraksha-yoga-control', { 
            detail: { action: command } 
        }));
    }, 100);

    const responses: Record<string, string> = {
        'next': 'Moving to next step / अर्को चरण।',
        'prev': 'Going back / अघिल्लो चरण।',
        'repeat': 'Repeating instruction / फेरी सुन्नुहोस्।',
        'exit': 'Ending session. Namaste / सत्र समाप्त भयो। नमस्ते।'
    };

    return { result: responses[command] || "Command executed." };
  }
  return null;
};
