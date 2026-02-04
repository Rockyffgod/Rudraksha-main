
export interface ThemeDefinition {
  id: string;
  name: string;
  category: 'Classic' | 'Heritage' | 'Nature' | 'Tech' | 'Soft' | 'Vibrant' | 'Precious' | 'Spiritual';
  uiMode: 'light' | 'dark' | 'auto';
  bgColor: string;
  darkBgColor?: string;
  bgPattern?: string;
  darkBgPattern?: string;
  bgPosition?: string;
  isPremium?: boolean;
  isAnimated?: boolean;
  colors: Record<string, string>;
}

export const THEME_REGISTRY: Record<string, ThemeDefinition> = {
  'default': {
    id: 'default', name: 'Rudraksha Standard', category: 'Classic', uiMode: 'auto',
    bgColor: '#fdfbf7', darkBgColor: '#09090b',
    bgPattern: "radial-gradient(circle at 0% 0%, rgba(255, 100, 100, 0.05) 0%, transparent 50%)",
    colors: { 
      '--color-red-500': '#dc2626', 
      '--color-red-600': '#991b1b', 
      '--color-orange-500': '#f97316' 
    }
  },

  'theme_rudra': {
    id: 'theme_rudra', name: 'Rudra Eternal', category: 'Spiritual', uiMode: 'dark', isPremium: true,
    bgColor: '#0a0a0a',
    bgPattern: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('https://wallpapers.com/images/featured/shiva-dark-okjgt0ga7br9glf7.jpg')",
    darkBgPattern: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url('https://wallpapers.com/images/featured/shiva-dark-okjgt0ga7br9glf7.jpg')",
    bgPosition: "right -15% center", // Shifted Shiva image further to the right edge
    colors: {
      '--color-red-500': '#ea580c', 
      '--color-red-600': '#9a3412',
      '--color-orange-500': '#fbbf24' 
    }
  },

  'theme_divine': {
    id: 'theme_divine', name: 'Divine Radiance', category: 'Spiritual', uiMode: 'dark', isPremium: true,
    bgColor: '#050505',
    bgPattern: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('https://wallpapers.com/images/hd/spiritual-desktop-wrpie18qrpz9f28n.jpg')",
    darkBgPattern: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('https://wallpapers.com/images/hd/spiritual-desktop-wrpie18qrpz9f28n.jpg')",
    bgPosition: "center",
    colors: {
      '--color-red-500': '#fbbf24', 
      '--color-red-600': '#d97706',
      '--color-orange-500': '#6366f1' 
    }
  },

  'theme_buddha': {
    id: 'theme_buddha', name: "Buddha's Path", category: 'Spiritual', uiMode: 'auto', isPremium: true,
    bgColor: '#fff1f2', darkBgColor: '#1a0505',
    bgPattern: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://wallpapercave.com/wp/wp11680379.jpg')",
    darkBgPattern: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://wallpapercave.com/wp/wp11680379.jpg')",
    colors: { 
      '--color-red-500': '#e11d48', 
      '--color-red-600': '#9f1239', 
      '--color-orange-500': '#1e40af' 
    }
  },

  'theme_cyberpunk': {
    id: 'theme_cyberpunk', name: 'Neon Protocol', category: 'Tech', uiMode: 'dark', isPremium: true,
    isAnimated: true,
    bgColor: '#09090b', 
    bgPattern: "linear-gradient(45deg, #09090b 25%, #1a1a2e 50%, #09090b 75%)",
    colors: { 
      '--color-red-500': '#ff0055', 
      '--color-red-600': '#b3003b', 
      '--color-orange-500': '#00f2ff' 
    }
  },

  'theme_gold': {
    id: 'theme_gold', name: 'Golden Karma', category: 'Precious', uiMode: 'light', isPremium: true,
    bgColor: '#fefce8', colors: { '--color-red-500': '#a16207', '--color-orange-500': '#eab308' }
  }
};

export const THEME_CATEGORIES = ['All', 'Classic', 'Heritage', 'Spiritual', 'Nature', 'Tech', 'Soft', 'Vibrant', 'Precious'];
