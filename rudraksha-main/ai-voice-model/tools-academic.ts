import { FunctionDeclaration, Type } from '@google/genai';
import { StorageService } from '../services/storageService';
import { TaskStatus, Priority } from '../types';

export const ACADEMIC_TOOLS: FunctionDeclaration[] = [
  {
    name: 'search_books',
    parameters: {
      type: Type.OBJECT,
      description: 'Searches the digital library for books.',
      properties: {
        query: { type: Type.STRING, description: 'Title, author or subject.' }
      },
      required: ['query']
    }
  },
  {
    name: 'check_assignments',
    parameters: {
      type: Type.OBJECT,
      description: 'Checks pending homework or assignments.',
      properties: {
        filter: { type: Type.STRING, enum: ['all', 'urgent'] }
      }
    }
  },
  {
    name: 'analyze_workload',
    parameters: {
      type: Type.OBJECT,
      description: 'Analyzes current tasks and suggests a study plan or priority list.',
      properties: {}
    }
  },
  {
    name: 'take_quick_note',
    parameters: {
      type: Type.OBJECT,
      description: 'Saves a quick text note to the user vault.',
      properties: {
        content: { type: Type.STRING, description: 'The content of the note.' },
        title: { type: Type.STRING, description: 'Optional title for the note.' }
      },
      required: ['content']
    }
  }
];

export const executeAcademicTool = async (name: string, args: any, navigate: (path: string) => void) => {
  if (name === 'search_books') {
    navigate('/library');
    return { result: `Opened Library. Searching for "${args.query}" is available in the search bar.` };
  }

  if (name === 'check_assignments') {
    const tasks = await StorageService.getTasks();
    const pending = tasks.filter(t => t.status !== TaskStatus.COMPLETED);
    
    if (pending.length === 0) {
      return { result: "You have no pending assignments. Great job!" };
    }
    
    const count = pending.length;
    const topTask = pending[0];
    return { result: `You have ${count} pending assignments. The next one due is "${topTask.title}" for ${topTask.subject}.` };
  }

  if (name === 'analyze_workload') {
    const tasks = await StorageService.getTasks();
    const pending = tasks.filter(t => t.status !== TaskStatus.COMPLETED);
    
    if (pending.length === 0) return { result: "Your schedule is clear. You are free to rest or explore the Arcade." };

    const highPriority = pending.filter(t => t.priority === Priority.HIGH);
    const overdue = pending.filter(t => new Date(t.dueDate) < new Date());

    let advice = "";
    if (overdue.length > 0) {
        advice = `CRITICAL: You have ${overdue.length} overdue tasks, specifically ${overdue[0].title}. Tackle these immediately.`;
    } else if (highPriority.length > 0) {
        advice = `Focus on your ${highPriority.length} high priority tasks first, starting with ${highPriority[0].title}.`;
    } else {
        advice = `You have ${pending.length} tasks, but none are urgent. Maintain a steady pace.`;
    }

    return { result: advice };
  }

  if (name === 'take_quick_note') {
    await StorageService.saveNote({
        title: args.title || 'Voice Note',
        content: args.content,
        color: 'bg-blue-100', // Default color
        fontFamily: 'sans'
    });
    return { result: "Note saved to your personal vault." };
  }

  return null;
};