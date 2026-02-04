
// LOCAL STORAGE KEY
const PLATFORM_KEY = 'rudraksha_linked_platforms';

export interface ConnectedAccount {
  provider: 'facebook' | 'google';
  connected: boolean;
  username?: string;
  email?: string;
  friends?: string[]; // Mock list of friends on that platform
}

export const PlatformService = {
  getConnections: (): ConnectedAccount[] => {
    const stored = localStorage.getItem(PLATFORM_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  isConnected: (provider: 'facebook' | 'google'): boolean => {
    const connections = PlatformService.getConnections();
    return connections.some(c => c.provider === provider && c.connected);
  },

  connect: (provider: 'facebook' | 'google', data?: Partial<ConnectedAccount>): void => {
    const connections = PlatformService.getConnections();
    const existingIdx = connections.findIndex(c => c.provider === provider);
    
    const newConnection: ConnectedAccount = {
      provider,
      connected: true,
      username: data?.username || (provider === 'facebook' ? 'fb_user' : 'google_user'),
      email: data?.email,
      friends: provider === 'facebook' ? ['Aarav', 'Sita', 'Ramesh', 'Hari', 'Gita'] : []
    };

    if (existingIdx >= 0) {
      connections[existingIdx] = { ...connections[existingIdx], ...newConnection };
    } else {
      connections.push(newConnection);
    }
    
    localStorage.setItem(PLATFORM_KEY, JSON.stringify(connections));
  },

  disconnect: (provider: 'facebook' | 'google'): void => {
    const connections = PlatformService.getConnections();
    const filtered = connections.filter(c => c.provider !== provider);
    localStorage.setItem(PLATFORM_KEY, JSON.stringify(filtered));
  },

  // Simulates searching for a friend on the external platform
  findFriend: (provider: 'facebook', query: string): string | null => {
    if (!PlatformService.isConnected(provider)) return null;
    const connections = PlatformService.getConnections();
    const account = connections.find(c => c.provider === provider);
    if (!account || !account.friends) return null;

    const match = account.friends.find(f => f.toLowerCase().includes(query.toLowerCase()));
    return match || null;
  }
};
