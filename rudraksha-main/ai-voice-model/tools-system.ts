
import { FunctionDeclaration, Type } from '@google/genai';
import { StorageService } from '../services/storageService';
import { YouTubeService } from '../services/youtubeService';

export const SYSTEM_TOOLS: FunctionDeclaration[] = [
  {
    name: 'configure_system',
    parameters: {
      type: Type.OBJECT,
      description: 'Changes system settings like theme, focus mode, or language.',
      properties: {
        setting: { type: Type.STRING, enum: ['focus_mode', 'theme', 'language'] },
        value: { type: Type.STRING, description: 'Value for the setting (e.g., "on/off", "dark/light", "nepali/english").' }
      },
      required: ['setting', 'value']
    }
  },
  {
    name: 'open_external_link',
    parameters: {
      type: Type.OBJECT,
      description: 'Opens external websites, apps, or plays videos. Intelligently distinguishes between direct site navigation (e.g., "Open Facebook") and search queries.',
      properties: {
        platform: { type: Type.STRING, description: 'The target site, app, or platform name (e.g., facebook, messenger.com, youtube).' },
        action: { type: Type.STRING, enum: ['open', 'search', 'play'], description: 'Use "open" for sites, "play" for media, "search" for queries.' },
        query: { type: Type.STRING, description: 'Specific search term or video topic. Leave empty for homepage.' },
        new_tab: { type: Type.BOOLEAN, description: 'Set to true ONLY if user explicitly asks for a "new tab".' }
      },
      required: ['platform']
    }
  },
  {
    name: 'search_news',
    parameters: {
      type: Type.OBJECT,
      description: 'Searches for latest news on specific topics or general headlines, opening a dedicated news tab.',
      properties: {
        topic: { type: Type.STRING, description: 'Specific news topic (e.g., "Politics", "Sports", "Nepal").' },
        source: { type: Type.STRING, description: 'Preferred source (e.g., "ekantipur", "google", "onlinekhabar"). Defaults to Google News.' }
      }
    }
  },
  {
    name: 'terminate_voice_session',
    parameters: {
        type: Type.OBJECT,
        description: 'Ends the current voice conversation/link. The system will continue listening for the wake word.',
        properties: {}
    }
  },
  {
    name: 'system_logout',
    parameters: {
        type: Type.OBJECT,
        description: 'Logs the user out of the application completely.',
        properties: {}
    }
  }
];

// KNOWN DIRECT PLATFORMS MAPPING
const DIRECT_SITES: Record<string, string> = {
    'facebook': 'https://www.facebook.com',
    'messenger': 'https://www.messenger.com',
    'instagram': 'https://www.instagram.com',
    'twitter': 'https://twitter.com',
    'x': 'https://twitter.com',
    'linkedin': 'https://www.linkedin.com',
    'github': 'https://github.com',
    'reddit': 'https://www.reddit.com',
    'netflix': 'https://www.netflix.com',
    'spotify': 'https://open.spotify.com',
    'amazon': 'https://www.amazon.com',
    'daraz': 'https://www.daraz.com.np',
    'esewa': 'https://esewa.com.np',
    'khalti': 'https://khalti.com',
    'hamropatro': 'https://www.hamropatro.com',
    'onlinekhabar': 'https://www.onlinekhabar.com',
    'ekantipur': 'https://ekantipur.com',
    'setopati': 'https://setopati.com',
    'ratopati': 'https://ratopati.com',
    'gmail': 'https://mail.google.com',
    'chatgpt': 'https://chat.openai.com',
    'youtube': 'https://www.youtube.com'
};

export const executeSystemTool = async (name: string, args: any, navigate: (path: string) => void) => {
  if (name === 'configure_system') {
    if (args.setting === 'focus_mode') {
        const turnOn = args.value.includes('on') || args.value.includes('active') || args.value.includes('start');
        localStorage.setItem('rudraksha_focus_mode', turnOn ? 'true' : 'false');
        window.dispatchEvent(new Event('rudraksha-focus-update'));
        return { result: `Focus Mode ${turnOn ? 'Activated' : 'Deactivated'}.` };
    }

    if (args.setting === 'theme') {
        const isDark = args.value.includes('dark') || args.value.includes('night');
        const profile = await StorageService.getProfile();
        if (profile) {
            const newTheme = isDark ? 'theme_midnight' : 'default';
            await StorageService.updateProfile({ activeTheme: newTheme });
            window.dispatchEvent(new Event('rudraksha-profile-update'));
            return { result: `Switched to ${isDark ? 'Dark' : 'Light'} visual theme.` };
        }
    }

    if (args.setting === 'language') {
        const isNepali = args.value.toLowerCase().includes('nep');
        localStorage.setItem('rudraksha_lang', isNepali ? 'ne' : 'en');
        window.location.reload(); 
        return { result: `Switching language to ${isNepali ? 'Nepali' : 'English'}...` };
    }
  }

  if (name === 'open_external_link') {
    let p = args.platform.toLowerCase().replace(/\s+/g, ''); // normalize 'face book' to 'facebook'
    const q = args.query ? args.query.trim() : '';
    const encodedQ = encodeURIComponent(q);
    const isNewTab = args.new_tab === true;
    
    let url = '';
    let targetName = isNewTab ? '_blank' : 'Rudraksha_Media'; // Default tab reuse

    // 1. YouTube Specific Handling (Play vs Open)
    if (p.includes('youtube')) {
      if (args.action === 'play' && q) {
          const directUrl = await YouTubeService.findVideoUrl(q);
          if (directUrl) {
              const separator = directUrl.includes('?') ? '&' : '?';
              url = `${directUrl}${separator}autoplay=1`;
          } else {
              url = `https://www.youtube.com/results?search_query=${encodedQ}`;
          }
      } else if (q) {
          url = `https://www.youtube.com/results?search_query=${encodedQ}`;
      } else {
          url = 'https://www.youtube.com';
      }
    } 
    // 2. Direct Domain Handling (e.g. "messenger.com", "example.org", "gov.np")
    else if (p.includes('.') && (p.endsWith('.com') || p.endsWith('.org') || p.endsWith('.net') || p.endsWith('.io') || p.endsWith('.np') || p.endsWith('.edu'))) {
        url = p.startsWith('http') ? p : `https://${p}`;
        targetName = '_blank';
    }
    // 3. Known Platform Shortcuts (e.g. "facebook", "messenger")
    else if (DIRECT_SITES[p]) {
        if (q && args.action === 'search') {
            // If user explicitly wants to search INSIDE the site (e.g. "Search for shoes on Daraz")
            // This is complex as every site has different search query params.
            // For now, we fallback to Google site search or just open home if complex.
            url = `https://www.google.com/search?q=${encodedQ}+site:${new URL(DIRECT_SITES[p]).hostname}`;
        } else {
            url = DIRECT_SITES[p];
        }
    }
    // 4. Wikipedia Specific
    else if (p.includes('wikipedia') || p.includes('wiki')) {
      targetName = 'Rudraksha_Info';
      url = q ? `https://en.wikipedia.org/wiki/${encodedQ}` : 'https://www.wikipedia.org';
    }
    // 5. Google / General Search Fallback
    else {
      targetName = 'Rudraksha_Search';
      if (p.includes('google') || args.action === 'search') {
         url = q ? `https://www.google.com/search?q=${encodedQ}` : 'https://www.google.com';
      } else {
         // User said "Open X" but X is unknown. Default to searching X or X.com
         url = `https://www.google.com/search?q=${p}+${q}`;
      }
    }

    window.open(url, targetName);
    return { result: `Opening ${url} in ${targetName === '_blank' ? 'new' : 'shared'} tab.` };
  }

  if (name === 'search_news') {
      const topic = args.topic || '';
      const source = args.source?.toLowerCase() || 'google';
      let url = '';
      const targetName = 'Rudraksha_News';

      if (source.includes('ekantipur') || source.includes('kantipur')) {
          url = topic ? `https://ekantipur.com/search?q=${encodeURIComponent(topic)}` : 'https://ekantipur.com';
      } else if (source.includes('onlinekhabar')) {
          url = topic ? `https://www.onlinekhabar.com/?s=${encodeURIComponent(topic)}` : 'https://www.onlinekhabar.com';
      } else {
          url = `https://news.google.com/search?q=${encodeURIComponent(topic + ' Nepal')}`;
      }

      window.open(url, targetName);
      return { result: `Searching news for "${topic}" on ${source}. Tab opened.` };
  }

  if (name === 'terminate_voice_session') {
      return { result: "TERMINATE_SIGNAL" };
  }

  if (name === 'system_logout') {
      return { result: "LOGOUT_SIGNAL" };
  }

  return null;
};
