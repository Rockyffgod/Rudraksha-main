
import { FunctionDeclaration, Type } from '@google/genai';
import { StorageService } from '../services/storageService';
import { PlatformService } from '../services/platformService';

export const SOCIAL_TOOLS: FunctionDeclaration[] = [
  {
    name: 'post_community_message',
    parameters: {
      type: Type.OBJECT,
      description: 'Posts a text message to the global community chat.',
      properties: {
        message: { type: Type.STRING, description: 'The text to post.' }
      },
      required: ['message']
    }
  },
  {
    name: 'get_latest_messages',
    parameters: {
      type: Type.OBJECT,
      description: 'Retrieves the most recent messages from the community chat.',
      properties: {
        limit: { type: Type.NUMBER, description: 'Number of messages to retrieve (default 3).' }
      }
    }
  },
  {
    name: 'send_direct_message',
    parameters: {
      type: Type.OBJECT,
      description: 'Sends a direct message to a specific user within the app.',
      properties: {
        target_name: { type: Type.STRING, description: 'Name or username of the recipient.' },
        message: { type: Type.STRING, description: 'The message content.' },
        send_as_rudra: { type: Type.BOOLEAN, description: 'If true, the message is sent from the Rudra AI system account.' }
      },
      required: ['target_name', 'message']
    }
  },
  {
    name: 'send_messenger_message',
    parameters: {
      type: Type.OBJECT,
      description: 'Sends a message via Facebook Messenger. Use this for external contacts or Rudra Pall.',
      properties: {
        recipient_name: { type: Type.STRING, description: 'Name of the friend (e.g. Rudra Pall).' },
        message_body: { type: Type.STRING, description: 'Content of the message.' }
      },
      required: ['recipient_name', 'message_body']
    }
  }
];

export const executeSocialTool = async (name: string, args: any, navigate: (path: string) => void) => {
  if (name === 'post_community_message') {
    const result = await StorageService.sendCommunityMessage(args.message);
    if (result) {
        navigate('/community-chat');
        return { result: "Message posted to Global Chat." };
    }
    return { result: "Failed to post message. Please try again." };
  }

  if (name === 'get_latest_messages') {
    const msgs = await StorageService.getCommunityMessages();
    const limit = args.limit || 3;
    const recent = msgs.slice(-limit).map(m => `${m.userName}: ${m.text}`).join('\n');
    return { result: `Recent chatter:\n${recent}` };
  }

  if (name === 'send_direct_message') {
    const availableUsers = await StorageService.getAvailableUsers();
    const target = args.target_name.toLowerCase();
    
    let user = availableUsers.find(u => 
        u.username?.toLowerCase() === target || 
        u.name.toLowerCase() === target
    );

    if (!user) {
        user = availableUsers.find(u => 
            u.name.toLowerCase().includes(target) || 
            (u.username && u.username.toLowerCase().includes(target))
        );
    }

    if (user) {
        const senderOverride = args.send_as_rudra ? 'rudra-ai-system' : undefined;
        await StorageService.sendDirectMessage(user.id, args.message, 'text', { senderOverride });
        navigate('/community-chat');
        return { result: `Message successfully routed to ${user.name}${senderOverride ? " from Rudra Core" : ""}.` };
    } else {
        return { result: `User identification failure: "${args.target_name}" not found in local user registry.` };
    }
  }

  if (name === 'send_messenger_message') {
      const recipient = args.recipient_name.toLowerCase();
      
      // Special Handling for "Rudra Pall"
      if (recipient.includes('rudra') || recipient.includes('pall') || recipient.includes('baiman')) {
          const url = 'https://www.messenger.com/e2ee/t/1401169708085744';
          window.open(url, '_blank');
          
          // Try to put message in clipboard if API allows (often restricted without direct user event, but worth a try in some contexts)
          // We return a text response telling the user what happened.
          return { result: `Secure E2EE Channel opened for Rudra Pall. Please paste or type: "${args.message_body}" and hit Enter.` };
      }

      // Check if Facebook is linked for other friends
      if (!PlatformService.isConnected('facebook')) {
          return { result: "Facebook account is not linked. Please login to Facebook in the app settings or login page first." };
      }

      // Check if friend exists (Simulated)
      const friend = PlatformService.findFriend('facebook', args.recipient_name);
      
      if (friend) {
          window.open(`https://www.messenger.com/t/${encodeURIComponent(args.recipient_name)}`, '_blank');
          return { result: `Opened Messenger for ${friend}. Message draft: "${args.message_body}". Please confirm send in the new tab.` };
      } else {
          return { result: `Could not find "${args.recipient_name}" in your linked Facebook friend list.` };
      }
  }

  return null;
};
