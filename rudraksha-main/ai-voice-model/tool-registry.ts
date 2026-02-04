
import { FunctionDeclaration, Type } from '@google/genai';
import { CALENDAR_TOOLS, executeCalendarTool } from './tools-calendar';
import { NAVIGATION_TOOLS, executeNavigationTool } from './tools-navigation';
import { ACADEMIC_TOOLS, executeAcademicTool } from './tools-academic';
import { HEALTH_TOOLS, executeHealthTool } from './tools-health';
import { KITCHEN_TOOLS, executeKitchenTool } from './tools-kitchen';
import { SAFETY_TOOLS, executeSafetyTool } from './tools-safety';
import { SYSTEM_TOOLS, executeSystemTool } from './tools-system';
import { SOCIAL_TOOLS, executeSocialTool } from './tools-social';
import { REWARDS_TOOLS, executeRewardsTool } from './tools-rewards';
import { ARCADE_TOOLS, executeArcadeTool } from './tools-arcade';
import { YOGA_TOOLS, executeYogaTool } from './tools-yoga';
import { KNOWLEDGE_TOOLS, executeKnowledgeTool } from './tools-knowledge';
import { StorageService } from '../services/storageService';
import { AirQualityService } from '../services/airQualityService';

export const ALL_RUDRA_TOOLS: any[] = [
  {
    functionDeclarations: [
      ...CALENDAR_TOOLS,
      ...NAVIGATION_TOOLS,
      ...ACADEMIC_TOOLS,
      ...HEALTH_TOOLS,
      ...KITCHEN_TOOLS,
      ...SAFETY_TOOLS,
      ...SYSTEM_TOOLS,
      ...SOCIAL_TOOLS,
      ...REWARDS_TOOLS,
      ...ARCADE_TOOLS,
      ...YOGA_TOOLS,
      ...KNOWLEDGE_TOOLS,
      {
        name: 'get_system_status',
        parameters: {
          type: Type.OBJECT,
          description: 'Retrieves current user metrics like karma, level or weather.',
          properties: {
            metric: {
              type: Type.STRING,
              enum: ['karma', 'level', 'environment_weather']
            }
          },
          required: ['metric']
        }
      }
    ]
  }
];

export const executeRudraTool = async (name: string, args: any, navigate: (path: string, state?: any) => void) => {
  // 1. Navigation & Apps
  const navResult = await executeNavigationTool(name, args, navigate);
  if (navResult) return navResult.result;

  // 2. Calendar
  const calResult = await executeCalendarTool(name, args);
  if (calResult) return calResult.result;

  // 3. Academic
  const acadResult = await executeAcademicTool(name, args, navigate);
  if (acadResult) return acadResult.result;

  // 4. Health
  const healthResult = await executeHealthTool(name, args, navigate);
  if (healthResult) return healthResult.result;

  // 5. Kitchen
  const kitchenResult = await executeKitchenTool(name, args, navigate);
  if (kitchenResult) {
      if (kitchenResult.result === "HANDOFF_TO_CHEF") return "HANDOFF_TO_CHEF";
      return kitchenResult.result;
  }

  // 6. Safety
  const safetyResult = await executeSafetyTool(name, args, navigate);
  if (safetyResult) return safetyResult.result;

  // 7. System (Handles Logout & Terminate Signals)
  const systemResult = await executeSystemTool(name, args, navigate);
  if (systemResult) {
      if (systemResult.result === "TERMINATE_SIGNAL") return "TERMINATE_SIGNAL";
      if (systemResult.result === "LOGOUT_SIGNAL") return "LOGOUT_SIGNAL";
      return systemResult.result;
  }

  // 8. Social
  const socialResult = await executeSocialTool(name, args, navigate);
  if (socialResult) return socialResult.result;

  // 9. Rewards
  const rewardsResult = await executeRewardsTool(name, args, navigate);
  if (rewardsResult) return rewardsResult.result;

  // 10. Arcade
  const arcadeResult = await executeArcadeTool(name, args, navigate);
  if (arcadeResult) return arcadeResult.result;

  // 11. Yoga
  const yogaResult = await executeYogaTool(name, args);
  if (yogaResult) return yogaResult.result;

  // 12. Knowledge (Web Search)
  const knowledgeResult = await executeKnowledgeTool(name, args);
  if (knowledgeResult) return knowledgeResult.result;

  // 13. General Status
  if (name === 'get_system_status') {
    const p = await StorageService.getProfile();
    if (args.metric === 'karma') return `Your current Karma balance is ${p?.points || 0}.`;
    if (args.metric === 'level') return `You are currently at Level ${Math.floor((p?.xp || 0)/500) + 1}.`;
    if (args.metric === 'environment_weather') {
        const w = await AirQualityService.getWeather();
        return `Current weather in ${w.location} is ${w.temp} degrees and ${w.condition}.`;
    }
  }

  return "Operation confirmed.";
};
