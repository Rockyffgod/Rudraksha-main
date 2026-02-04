
import { FunctionDeclaration, Type } from '@google/genai';
import { StorageService } from '../services/storageService';
import { AirQualityService } from '../services/airQualityService';

export const HEALTH_TOOLS: FunctionDeclaration[] = [
  {
    name: 'log_health_metric',
    parameters: {
      type: Type.OBJECT,
      description: 'Logs a daily health metric for the user.',
      properties: {
        metric: {
          type: Type.STRING,
          enum: ['water', 'sleep', 'mood'],
          description: 'The type of metric to log.'
        },
        value: {
          type: Type.STRING,
          description: 'The value (e.g., "1" for water glass, "8" for sleep hours, "Happy" for mood).'
        }
      },
      required: ['metric', 'value']
    }
  },
  {
    name: 'check_environment',
    parameters: {
      type: Type.OBJECT,
      description: 'Checks current air quality (AQI) or weather conditions.',
      properties: {
        type: { type: Type.STRING, enum: ['aqi', 'weather'] }
      },
      required: ['type']
    }
  },
  {
    name: 'get_weekly_health_report',
    parameters: {
      type: Type.OBJECT,
      description: 'Analyzes health logs from the past 7 days and provides a summary.',
      properties: {}
    }
  },
  {
    name: 'generate_workout_flashcard',
    parameters: {
      type: Type.OBJECT,
      description: 'Generates a visual exercise flashcard and guide when the user asks "How to do [exercise]".',
      properties: {
        exercise_name: { type: Type.STRING, description: 'The name of the exercise (e.g. "Pushups", "Squats").' }
      },
      required: ['exercise_name']
    }
  }
];

export const executeHealthTool = async (name: string, args: any, navigate?: (path: string) => void) => {
  const today = new Date().toISOString().split('T')[0];

  if (name === 'log_health_metric') {
    const log = await StorageService.getHealthLog(today);
    
    if (args.metric === 'water') {
      const glasses = parseInt(args.value) || 1;
      log.waterGlasses += glasses;
      await StorageService.saveHealthLog(log);
      return { result: `Logged ${glasses} glass(es) of water. Total today: ${log.waterGlasses}.` };
    }
    
    if (args.metric === 'sleep') {
      const hours = parseInt(args.value) || 7;
      log.sleepHours = hours;
      await StorageService.saveHealthLog(log);
      return { result: `Updated sleep log to ${hours} hours.` };
    }

    if (args.metric === 'mood') {
      // rudimentary mapping
      const moodMap: any = { 'happy': 'Happy', 'sad': 'Tired', 'stressed': 'Stressed', 'neutral': 'Neutral', 'tired': 'Tired', 'angry': 'Stressed' };
      const mood = moodMap[args.value.toLowerCase()] || 'Neutral';
      log.mood = mood;
      await StorageService.saveHealthLog(log);
      return { result: `Mood logged as ${mood}.` };
    }
  }

  if (name === 'check_environment') {
    if (args.type === 'aqi') {
      const aqi = await AirQualityService.getAQI();
      return { result: `The AQI in ${aqi.location} is ${aqi.aqi} (${aqi.status}). ${aqi.advice}` };
    }
    if (args.type === 'weather') {
      const w = await AirQualityService.getWeather();
      return { result: `It is currently ${w.condition} and ${w.temp}°C in ${w.location}.` };
    }
  }

  if (name === 'get_weekly_health_report') {
    let totalWater = 0;
    let totalSleep = 0;
    let daysCount = 0;
    
    // Check last 7 days
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const log = await StorageService.getHealthLog(dateStr);
        // Only count if data exists (default is 0 water)
        if (log.waterGlasses > 0 || log.sleepHours > 0) {
            totalWater += log.waterGlasses;
            totalSleep += log.sleepHours;
            daysCount++;
        }
    }

    if (daysCount === 0) return { result: "I don't have enough data from the past week to generate a report yet. Start logging today!" };

    const avgWater = (totalWater / daysCount).toFixed(1);
    const avgSleep = (totalSleep / daysCount).toFixed(1);

    let advice = "Your stats look stable.";
    if (parseFloat(avgWater) < 6) advice = "You need to hydrate more often.";
    if (parseFloat(avgSleep) < 7) advice += " Your sleep duration is below the recommended 7 hours.";

    return { result: `Weekly Average: ${avgWater} glasses of water and ${avgSleep} hours of sleep per day. ${advice}` };
  }

  if (name === 'generate_workout_flashcard') {
      if (navigate) navigate('/health');
      
      // Fast dispatch for quicker UI update
      setTimeout(() => {
          window.dispatchEvent(new CustomEvent('rudraksha-generate-workout', { 
              detail: { exerciseName: args.exercise_name } 
          }));
      }, 200);
      
      return { result: `Opening Fitness Studio and generating guide for ${args.exercise_name}.` };
  }

  return null;
};
