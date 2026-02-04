
import { FunctionDeclaration, Type } from '@google/genai';
import { StorageService } from '../services/storageService';

export const KITCHEN_TOOLS: FunctionDeclaration[] = [
  {
    name: 'find_recipe',
    parameters: {
      type: Type.OBJECT,
      description: 'Searches for a recipe in the database. If not found, it automatically signals to consult the AI Chef.',
      properties: {
        dish_name: { type: Type.STRING, description: 'Name of the dish (e.g., Momo, Gundruk).' }
      },
      required: ['dish_name']
    }
  },
  {
    name: 'suggest_recipe_by_ingredients',
    parameters: {
        type: Type.OBJECT,
        description: 'Suggests recipes based on available ingredients.',
        properties: {
            ingredients: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: 'List of ingredients user has (e.g., ["rice", "lentils"]).'
            }
        },
        required: ['ingredients']
    }
  },
  {
    name: 'draft_new_recipe',
    parameters: {
      type: Type.OBJECT,
      description: 'Drafts a new recipe entry based on a food name. User will fill ingredients later.',
      properties: {
        dish_name: { type: Type.STRING, description: 'The name of the dish the user wants to add.' }
      },
      required: ['dish_name']
    }
  },
  {
    name: 'consult_bhanse_dai',
    parameters: {
      type: Type.OBJECT,
      description: 'Explicitly consults the AI Chef (Bhanse Dai) for cooking advice or recipes.',
      properties: {
        query: { type: Type.STRING, description: 'The cooking question or dish name.' }
      },
      required: ['query']
    }
  }
];

export const executeKitchenTool = async (name: string, args: any, navigate: (path: string, state?: any) => void) => {
  if (name === 'find_recipe') {
    const query = args.dish_name.toLowerCase();
    const recipes = await StorageService.getRecipes();
    
    const found = recipes.find(r => 
        r.title.toLowerCase().includes(query) || 
        r.tags?.some(t => t.includes(query))
    );

    if (found) {
        navigate('/recipes');
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('rudraksha-open-recipe', { 
                detail: { recipeId: found.id } 
            }));
        }, 100);
        return { result: `Found recipe for ${found.title}. Opening kitchen.` };
    } else {
        navigate('/recipes');
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('rudraksha-consult-chef', { 
                detail: { query: args.dish_name } 
            }));
        }, 200);
        
        return { result: "HANDOFF_TO_CHEF" };
    }
  }

  if (name === 'consult_bhanse_dai') {
      navigate('/recipes');
      setTimeout(() => {
          window.dispatchEvent(new CustomEvent('rudraksha-consult-chef', { 
              detail: { query: args.query } 
          }));
      }, 200);
      return { result: "HANDOFF_TO_CHEF" };
  }

  if (name === 'suggest_recipe_by_ingredients') {
      const userIngs: string[] = args.ingredients.map((i: string) => i.toLowerCase());
      const recipes = await StorageService.getRecipes();
      
      const matches = recipes.filter(r => {
          return r.ingredients.some(ri => userIngs.some(ui => ri.toLowerCase().includes(ui)));
      });

      if (matches.length > 0) {
          const topMatch = matches[0];
          navigate('/recipes');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('rudraksha-open-recipe', { 
                detail: { recipeId: topMatch.id } 
            }));
          }, 100);
          return { result: `Based on ${userIngs.join(', ')}, I recommend making ${topMatch.title}. Opening recipe now.` };
      } else {
          navigate('/recipes');
          setTimeout(() => {
              window.dispatchEvent(new CustomEvent('rudraksha-consult-chef', { 
                  detail: { query: `Something with ${args.ingredients.join(', ')}` } 
              }));
          }, 200);
          return { result: "HANDOFF_TO_CHEF" };
      }
  }

  if (name === 'draft_new_recipe') {
      navigate('/recipes');
      
      const title = args.dish_name;
      const description = `A traditional preparation of ${title}. Known for its rich flavor and cultural significance in Nepal.`;

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('rudraksha-draft-recipe', { 
            detail: { title, description } 
        }));
      }, 200);

      return { result: `Opened the recipe editor for "${title}". I've filled in the basics, please add your ingredients and secret steps.` };
  }

  return null;
};
