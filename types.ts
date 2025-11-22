
export enum TributeStatus {
  Alive = 'Alive',
  Dead = 'Dead'
}

export type Trait = 'Ruthless' | 'Survivalist' | 'Coward' | 'Friendly' | 'Unstable' | 'Charming';

export interface Tribute {
  id: string;
  name: string;
  district: number;
  gender: 'M' | 'F';
  status: TributeStatus;
  killCount: number;
  inventory: string[];
  // New Deep Sim Stats
  stats: {
    sanity: number; // 0-100 (Low = Hallucinations/Suicide)
    hunger: number; // 0-100 (High = Starvation)
    exhaustion: number; // 0-100 (High = Sleep/Vulnerable)
  };
  traits: Trait[];
  relationships: Record<string, number>; // id -> -100 (Hate) to 100 (Love)
  notes: string[]; // Memories/Public Status (e.g., "Injured", "Grieving")
}

export enum EventType {
  Bloodbath = 'Bloodbath',
  Day = 'Day',
  Night = 'Night',
  Feast = 'Feast',
  Arena = 'Arena'
}

export interface GameEvent {
  text: string; // e.g., "(P1) stabs (P2)."
  playerCount: number;
  fatalities: boolean;
  killerIndices: number[]; // Indices relative to the involved players array (0-based)
  victimIndices: number[]; // Indices relative to the involved players array
  
  // Advanced Logic
  weight?: number; // Default 1.0. Higher = more likely.
  tags?: string[]; // 'Kill', 'Social', 'Food', 'Sleep', 'Sanity', 'Heal', 'Desperate'
  
  // New Memory/Constraint System
  itemGain?: string[];      // Items added to P1's inventory
  itemRequired?: string[];  // Items P1 MUST have for this event
  consumesItem?: boolean;   // If true, removes the required items from P1
  traitRequired?: Trait[];  // P1 must have one of these traits

  // Logic checks
  condition?: (actors: Tribute[]) => boolean;
}

export interface LogEntry {
  id: string;
  text: string;
  type: EventType;
  deathNames?: string[]; // For highlighting deaths
}

export interface RoundHistory {
  phase: string;
  day: number;
  logs: LogEntry[];
}

export interface GameState {
  tributes: Tribute[];
  day: number;
  phase: 'Reaping' | 'Bloodbath' | 'Day' | 'Night' | 'Fallen' | 'Winner';
  logs: LogEntry[]; // Current round logs
  history: RoundHistory[]; // Past rounds
  fallenTributes: Tribute[]; // For the "Fallen" phase
  totalEvents: number;
  gameRunning: boolean;
  daysSinceLastDeath: number; // For "The Director" pacing
}
