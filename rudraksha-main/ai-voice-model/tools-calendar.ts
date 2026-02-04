import { FunctionDeclaration, Type } from '@google/genai';
import { CalendarService } from '../services/calendarService';

export const CALENDAR_TOOLS: FunctionDeclaration[] = [
  {
    name: 'check_calendar_event',
    parameters: {
      type: Type.OBJECT,
      description: 'Checks for holidays or events on a specific Nepali date.',
      properties: {
        day: { type: Type.NUMBER, description: 'The day of the month (1-32).' },
        month: { type: Type.STRING, description: 'The Nepali month name (e.g., Baishakh, Jestha).' },
        year: { type: Type.NUMBER, description: 'The Nepali year (default 2082).' }
      },
      required: ['day', 'month']
    }
  }
];

export const executeCalendarTool = async (name: string, args: any) => {
  if (name === 'check_calendar_event') {
    const monthMap: Record<string, number> = {
      'baishakh': 1, 'jestha': 2, 'ashadh': 3, 'shrawan': 4, 'bhadra': 5, 'ashwin': 6,
      'kartik': 7, 'mangsir': 8, 'poush': 9, 'magh': 10, 'falgun': 11, 'chaitra': 12
    };

    const monthName = args.month.toLowerCase();
    const monthIndex = monthMap[monthName] || 1;
    const year = args.year || 2082;

    const dates = await CalendarService.getDatesForMonth(year, monthIndex);
    const targetDate = dates.find(d => d.bs_day === args.day);

    if (targetDate) {
      if (targetDate.is_holiday && targetDate.events && targetDate.events.length > 0) {
        return { 
          result: `On ${args.month} ${args.day}, the event is: ${targetDate.events[0].strEn} (${targetDate.events[0].strNp}).` 
        };
      } else {
        return { 
          result: `There are no specific public holidays listed for ${args.month} ${args.day}, ${year}. It is a ${targetDate.weekday_str_en}.` 
        };
      }
    }
    return { result: "Date not found in the calendar." };
  }
  return null;
};