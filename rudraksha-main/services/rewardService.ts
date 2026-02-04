
import { StorageService } from './storageService';

export const RewardService = {
  transferKarma: async (senderId: string, receiverId: string, amount: number): Promise<{ success: boolean; message: string }> => {
    try {
      if (senderId === receiverId) return { success: false, message: "Cannot send karma to self." };
      if (amount <= 0) return { success: false, message: "Amount must be positive." };

      const users = await StorageService.getAvailableUsers(); // This will help us find the receiver safely if in list
      // Note: We need full access to update users, so we'll access StorageService internal logic via public methods where possible
      // But StorageService.rewardUser updates ANY user by ID, which is what we want.
      
      const sender = await StorageService.getProfile();
      if (!sender || sender.id !== senderId) return { success: false, message: "Authentication error." };
      
      if (sender.points < amount) {
        return { success: false, message: `Insufficient Karma. Balance: ${sender.points}` };
      }

      // Deduct from sender
      await StorageService.updateProfile({ points: sender.points - amount });
      
      // Add to receiver
      await StorageService.rewardUser(receiverId, amount);

      return { success: true, message: `Transferred ${amount} Karma successfully.` };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Transaction failed." };
    }
  }
};
