

export enum TributeStatus {
  Alive = 'Alive',
  Dead = 'Dead'
}

export type Trait = 'Ruthless' | 'Survivalist' | 'Coward' | 'Friendly' | 'Unstable' | 'Charming' | 'Trained' | 'Underdog' | 'Traumatized' | 'Broken' | 'Stoic' | 'Devious' | 'Clumsy' | 'Sharpshooter' | 'Naive' | 'Glutton';

export interface Tribute {
  id: string;
  name: string;
  district: number;
  gender: 'M' | 'F';
  age: number; 
  status: TributeStatus;
  killCount: number;
  inventory: string[];
  allianceId?: string; 
  
  // Hex Map Coordinates (Axial)
  coordinates: { q: number; r: number };

  // Betting & Skill
  odds: string;
  trainingScore: number;

  stats: {
    health: number; // 0-100 
    sanity: number; // 0-100 
    hunger: number; // 0-100 
    exhaustion: number; // 0-100 
    weaponSkill: number; // 0-100
  };
  traits: Trait[];
  relationships: Record<string, number>; 
  notes: string[]; 
  
  deathCause?: string;
  killerId?: string;
  killerName?: string;
}

export enum EventType {
  Bloodbath = 'Bloodbath',
  Day = 'Day',
  Night = 'Night',
  Feast = 'Feast',
  Arena = 'Arena',
  Training = 'Training',
  Reaping = 'Reaping'
}

export type WeatherType = 'Clear' | 'Rain' | 'Heatwave' | 'Fog' | 'Storm';

export interface GameEvent {
  text: string; 
  playerCount: number;
  fatalities: boolean;
  killerIndices: number[]; 
  victimIndices: number[]; 
  
  weight?: number; 
  tags?: string[]; 
  
  itemGain?: string[];      
  itemRequired?: string[];  
  consumesItem?: boolean | string[];   
  traitRequired?: Trait[];  
  
  healthDamage?: number; 
  movement?: boolean; // New: triggers coordinate update

  condition?: (actors: Tribute[]) => boolean;
}

export interface LogEntry {
  id: string;
  text: string;
  type: EventType;
  day: number; // Added for Timeline
  phase: string; // Added for Timeline
  deathNames?: string[];
  relatedTributeIds?: string[]; // Added for filtering
}

export interface RoundHistory {
  phase: string;
  day: number;
  logs: LogEntry[];
}

export interface GameSettings {
  gameSpeed: number; 
  fatalityRate: number; 
  enableWeather: boolean;
}

export interface GameState {
  tributes: Tribute[];
  day: number;
  phase: 'Setup' | 'Reaping' | 'Training' | 'Bloodbath' | 'Day' | 'Night' | 'Fallen' | 'Winner';
  logs: LogEntry[]; 
  history: RoundHistory[]; 
  fallenTributes: Tribute[]; 
  totalEvents: number;
  gameRunning: boolean;
  daysSinceLastDeath: number; 
  sponsorPoints: number; 
  currentWeather: WeatherType;
  weatherDuration: number; // Added for weather persistence
  
  userBet: string | null; // ID of tribute user bet on

  minDays: number;
  maxDays: number;
  isAutoPlaying: boolean;
  settings: GameSettings;
}