
export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  SUBMITTED = 'Submitted', // Waiting for teacher
  COMPLETED = 'Completed'
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string; // Owner or Creator
  title: string;
  subject: string;
  dueDate: string; // ISO string
  priority: Priority;
  status: TaskStatus;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  description?: string;
  subtasks?: Subtask[];
  isAssignment?: boolean;
  targetClass?: string; // e.g., '10', '12', 'General'
  estimatedMinutes?: number;
}

export type UserRole = 'student' | 'teacher';

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  bannerUrl?: string;
  frameId?: string;
  schoolName?: string;
  schoolCode?: string; // New field for segregation
  grade?: string;
  profession?: string;
  bio?: string; // New Bio Field
  points: number;
  xp: number;
  unlockedItems?: string[];
  activeTheme?: string;
  createdAt?: number;
  lastDailyClaim?: number; // Timestamp for daily reward
  subscription?: {
    tier: 'weekly' | 'monthly' | 'lifetime';
    expiry: number; // Timestamp
  };
  highScores?: {
    danphe?: number;
    gorilla?: number;
    truth?: number;
    mandala?: number;
    speed?: number;
    memory?: number;
    attention?: number;
    flexibility?: number;
    logic?: number;
  };
  birthCertificateId?: string;
  studentId?: string;
  guardianName?: string;
  subjects?: string[];
  friends?: string[]; // List of user IDs
  friendRequests?: string[]; // List of user IDs who sent request
  sentRequests?: string[]; // List of user IDs I sent request to
}

// Added Transaction interface for the Karma Ledger
export interface Transaction {
  id: number;
  userId: string;
  amount: number;
  type: string;
  timestamp: number;
  itemId?: string;
  description?: string;
}

export interface StudyNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  color?: string; // Background color preset (class)
  textColor?: string; // Text color preset
  fontFamily?: 'sans' | 'serif' | 'mono';
  timestamp: number;
}

export interface AppSettings {
  soundEnabled: boolean;
  hapticFeedback: boolean;
  autoFocusMode: boolean;
  dataSaver: boolean;
  broadcastRadius: number;
  language: 'en' | 'ne';
  gpsAccuracy: 'high' | 'low'; // New Setting
  notifications: {
    studyReminders: boolean;
    communityAlerts: boolean;
    arcadeTasks: boolean;
  };
  permissions: {
    camera: boolean;
    microphone: boolean;
    location: boolean;
  };
}

export type RecipeCategory = 'daily' | 'far-west' | 'newari' | 'kirati' | 'tharu' | 'tamang' | 'veg' | 'non-veg' | 'beverages' | 'dessert' | 'snack' | 'festival';

export interface Sighting { 
  id: string; 
  time: string; 
  location: string; 
  info: string; 
  image?: string; 
  timestamp: number;
  userId?: string;
  userName?: string;
  isVerified?: boolean;
}

export interface FTLMission { id: string; type: 'pet' | 'person' | 'object'; title: string; location: string; time: string; status: 'active' | 'resolved'; bounty: number; description: string; sightings: Sighting[]; image: string; userId: string; isLost: boolean; timestamp: number; }
export interface RescueTag { id: string; name: string; contact: string; type: 'pet' | 'object' | 'person'; info: string; image?: string; timestamp: number; }
export interface ArcadeTask { id: string; title: string; reward: number; completed: boolean; type: 'score' | 'play' | 'win'; }
export interface ChatGroup { id: string; name: string; createdBy: string; members: string[]; createdAt: number; }
export interface CommunityMessage { id: string; groupId?: string; userId: string; userName: string; userRole: UserRole; avatarUrl?: string; text?: string; imageUrl?: string; type: 'text' | 'image'; timestamp: number; schoolCode?: string; }
export interface DirectMessage { id: string; senderId: string; receiverId: string; text: string; timestamp: number; read: boolean; type: 'text' | 'image' | 'karma'; imageUrl?: string; amount?: number; }
export interface StudySession { id: string; userId: string; subject: string; durationMinutes: number; timestamp: number; isFocusMode?: boolean; }
export interface ChatMessage { id: string; role: 'user' | 'model'; text: string; timestamp: number; image?: string; }
export interface HealthLog { date: string; waterGlasses: number; mood: 'Happy' | 'Neutral' | 'Stressed' | 'Tired'; sleepHours: number; }
export interface WeatherData { temp: number; condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy' | 'Foggy'; humidity: number; windSpeed: number; uvIndex: number; feelsLike: number; location: string; }
export interface AQIData { 
  aqi: number; 
  status: string; 
  color: string; 
  advice: string; 
  pollutant: string; 
  location: string;
  maskAdvice: string;
  activityAdvice: string;
}
export interface Recipe { id: string; title: string; author: string; description: string; ingredients: string[]; instructions: string; history?: string; videoUrl?: string; isPublic: boolean; likes: number; imageUrl?: string; prepTime?: number; tags?: RecipeCategory[]; }
export interface Review { id: string; targetId: string; userId: string; userName: string; rating: number; comment: string; timestamp: number; }
export interface HeritageSite { id: string; name: string; nameNe?: string; description: string; descriptionNe?: string; category: 'Temple' | 'Stupa' | 'Palace' | 'Nature' | 'Other'; region: string; latitude: number; longitude: number; imageUrl: string; history?: string; historyNe?: string; culturalSignificance?: string; culturalSignificanceNe?: string; }
export interface ProvinceData { id: number; name: string; nepaliName: string; capital: string; capitalNe: string; districts: number; area: string; population: string; density: string; color: string; borderColor: string; description: string; descriptionNe: string; attractions: string[]; attractionsNe: string[]; image: string; majorRivers: string; majorRiversNe: string; literacyRate: string; mainLanguages: string; mainLanguagesNe: string; lat: number; lng: number; }
export interface TriviaQuestion { question: string; options: string[]; correctAnswer: number; explanation: string; }
export interface Book { id: string; title: string; author: string; grade: string; subject: string; description: string; link: string; uploadedBy?: string; timestamp: number; }
export interface NepaliDate { bs_year: number; bs_month: number; bs_day: number; ad_year: number; ad_month: number; ad_day: number; weekday_str_en: string; weekday_str_np: string; bs_month_str_en: string; bs_month_str_np: string; tithi_str_en: string; tithi_str_np: string; is_holiday: boolean; events: { strEn: string; strNp: string; isHoliday: boolean; }[]; }
