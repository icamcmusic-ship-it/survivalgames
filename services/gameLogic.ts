

import { Tribute, TributeStatus, GameEvent, LogEntry, EventType, Trait, WeatherType } from '../types';
import { bloodbathEvents, bloodbathDeathEvents, generalEvents, fatalEvents, nightEvents, arenaEvents, trainingEvents } from '../data/events';

// --- Config ---
const TRAITS: Trait[] = ['Ruthless', 'Survivalist', 'Coward', 'Friendly', 'Unstable', 'Charming', 'Trained', 'Underdog', 'Stoic', 'Devious', 'Clumsy', 'Sharpshooter', 'Naive', 'Glutton'];

const ITEM_VALUES: Record<string, number> = {
    'Explosives': 20,
    'Gun': 18,
    'Scythe': 16,
    'Bow': 15,
    'Arrows': 15,
    'Sword': 15,
    'Spear': 14,
    'Trident': 14,
    'Axe': 13,
    'Knife': 12,
    'Machete': 12,
    'Antidote': 16,
    'First Aid Kit': 10,
    'Bandages': 10,
    'Shield': 8,
    'Molotov Components': 8,
    'Shovel': 7,
    'Bread': 6,
    'Backpack': 5,
    'Water': 5,
    'Food': 4,
    'Rope': 3,
    'Wire': 3,
    'Sheet Plastic': 2,
    'Rock': 1,
    'Stick': 0
};

// --- Initialization ---

const getRandomTraits = (district: number): Trait[] => {
  // Career Districts
  if ([1, 2, 4].includes(district)) {
      return Math.random() < 0.7 ? ['Trained', 'Ruthless'] : ['Trained', 'Charming']; 
  }
  // Underdog Districts
  if ([11, 12].includes(district)) {
      return Math.random() < 0.6 ? ['Underdog', 'Survivalist'] : ['Underdog', 'Coward'];
  }

  const num = Math.random() > 0.7 ? 2 : 1;
  const shuffled = [...TRAITS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
};

// Monte Carlo Simulation for Odds - Exported for re-calc
export const calculateSimulatedOdds = (targetTribute: Tribute, allTributes: Tribute[], simulations = 600): string => {
    let wins = 0;
    
    for (let i = 0; i < simulations; i++) {
        // Create simplified roster with Randomized Power (Form)
        let roster = allTributes.map(t => {
            let power = 50; 
            
            // Skill
            power += t.stats.weaponSkill; 
            
            // Traits
            if (t.traits.includes('Trained')) power += 20;
            if (t.traits.includes('Ruthless')) power += 15;
            if (t.traits.includes('Survivalist')) power += 15;
            if (t.traits.includes('Sharpshooter')) power += 10;
            if (t.traits.includes('Devious')) power += 10;
            if (t.traits.includes('Stoic')) power += 8;
            if (t.traits.includes('Underdog')) power += 8;
            if (t.traits.includes('Charming')) power += 5;

            // Random Day-to-Day variance
            power += Math.random() * 40; 

            return {
                id: t.id,
                power: power,
                alive: true
            };
        });

        let activeCount = roster.length;
        
        while (activeCount > 1) {
            let idx1 = Math.floor(Math.random() * roster.length);
            while (!roster[idx1].alive) idx1 = Math.floor(Math.random() * roster.length);

            let idx2 = Math.floor(Math.random() * roster.length);
            while (idx2 === idx1 || !roster[idx2].alive) idx2 = Math.floor(Math.random() * roster.length);

            const f1 = roster[idx1];
            const f2 = roster[idx2];
            
            const totalPower = f1.power + f2.power;
            const roll = Math.random() * totalPower;

            if (roll < f1.power) {
                f2.alive = false;
                f1.power += 5; 
            } else {
                f1.alive = false;
                f2.power += 5;
            }
            activeCount--;
        }

        const winner = roster.find(r => r.alive);
        if (winner && winner.id === targetTribute.id) {
            wins++;
        }
    }

    const winRate = wins / simulations;
    
    if (winRate >= 0.30) return "Evens";
    if (winRate >= 0.20) return "2/1";
    if (winRate >= 0.15) return "3/1";
    if (winRate >= 0.10) return "5/1";
    if (winRate >= 0.08) return "8/1";
    if (winRate >= 0.06) return "10/1";
    if (winRate >= 0.05) return "12/1";
    if (winRate >= 0.04) return "15/1";
    if (winRate >= 0.03) return "20/1";
    if (winRate >= 0.02) return "30/1";
    if (winRate >= 0.01) return "50/1";
    return "75/1";
};

export const recalculateAllOdds = (tributes: Tribute[]): Tribute[] => {
    return tributes.map(t => ({
        ...t,
        odds: calculateSimulatedOdds(t, tributes)
    }));
};

export const generateTributes = (): Tribute[] => {
  const tributes: Tribute[] = [];
  const careerAllianceId = `alliance-career-pack`;

  for (let i = 1; i <= 12; i++) {
    const isCareer = [1, 2, 4].includes(i);
    
    const dir = (i / 12) * 2 * Math.PI;
    const dist = 3;
    const q = Math.round(dist * Math.cos(dir));
    const r = Math.round(dist * Math.sin(dir));
    
    const ageM = Math.floor(Math.random() * (18 - 12 + 1)) + 12;
    const traitsM = getRandomTraits(i);
    
    tributes.push({
      id: `d${i}_m`,
      name: `District ${i} Male`,
      district: i,
      gender: 'M',
      age: ageM,
      status: TributeStatus.Alive,
      killCount: 0,
      inventory: [], 
      allianceId: isCareer ? careerAllianceId : undefined,
      coordinates: { q, r },
      stats: { sanity: 100, hunger: 0, exhaustion: 0, health: 100, weaponSkill: isCareer ? 20 : 0 },
      traits: traitsM,
      relationships: {}, 
      notes: [],
      odds: "TBD", 
      trainingScore: 0
    });

    const ageF = Math.floor(Math.random() * (18 - 12 + 1)) + 12;
    const traitsF = getRandomTraits(i);

    tributes.push({
      id: `d${i}_f`,
      name: `District ${i} Female`,
      district: i,
      gender: 'F',
      age: ageF,
      status: TributeStatus.Alive,
      killCount: 0,
      inventory: [],
      allianceId: isCareer ? careerAllianceId : undefined,
      coordinates: { q, r }, 
      stats: { sanity: 100, hunger: 0, exhaustion: 0, health: 100, weaponSkill: isCareer ? 20 : 0 },
      traits: traitsF,
      relationships: {},
      notes: [],
      odds: "TBD",
      trainingScore: 0
    });
  }

  // Initial Relationships
  tributes.forEach(t1 => {
      tributes.forEach(t2 => {
          if (t1.id === t2.id) return;
          if (t1.allianceId === careerAllianceId && t2.allianceId === careerAllianceId) {
              t1.relationships[t2.id] = 50;
          }
          if (t1.district === t2.district) {
              t1.relationships[t2.id] = 30;
          }
      });
  });

  // Calculate Odds
  tributes.forEach(t => {
      t.odds = calculateSimulatedOdds(t, tributes);
  });

  return tributes;
};

// --- Helpers ---

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
};

const shuffle = <T,>(array: T[]): T[] => {
  let currentIndex = array.length, randomIndex;
  const newArray = [...array];
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
  }
  return newArray;
};

// Axial distance calculation
const getDistance = (t1: Tribute, t2: Tribute): number => {
    const dq = t1.coordinates.q - t2.coordinates.q;
    const dr = t1.coordinates.r - t2.coordinates.r;
    return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
};

const parseEventText = (text: string, actors: Tribute[], eventTags: string[] = []): string => {
  let result = text;
  actors.forEach((actor, index) => {
    const placeholder = `(P${index + 1})`;
    const regex = new RegExp(escapeRegExp(placeholder), 'g');
    
    const isDesperate = actor.stats.hunger > 90 || actor.stats.sanity < 30 || actor.stats.health < 30;
    const extraClass = isDesperate ? 'text-red-400' : 'text-gold';

    result = result.replace(regex, `<span class="font-bold ${extraClass} group relative cursor-help">
      ${actor.name}
      <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-max bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
        ${actor.traits.join(', ')} (${actor.stats.health} HP)
      </span>
    </span>`);
  });
  return result;
};

export const resolveEventTextPlain = (text: string, actors: Tribute[]): string => {
  let result = text;
  actors.forEach((actor, index) => {
    const placeholder = `(P${index + 1})`;
    result = result.split(placeholder).join(actor.name);
  });
  return result;
};

const getRelationship = (from: Tribute, to: Tribute): number => {
  return from.relationships[to.id] ?? 0;
};

const modifyRelationship = (from: Tribute, to: Tribute, amount: number) => {
  const current = getRelationship(from, to);
  from.relationships[to.id] = Math.max(-100, Math.min(100, current + amount));
};

// Helper conditions
const isStarving = (t: Tribute) => t.stats.hunger > 80;
const isInsane = (t: Tribute) => t.stats.sanity < 40;
const isExhausted = (t: Tribute) => t.stats.exhaustion > 80;
const isInjured = (t: Tribute) => t.stats.health < 60 || t.stats.sanity < 60; 
const isDesperate = (t: Tribute) => t.stats.hunger > 90 || t.stats.sanity < 30 || t.stats.health < 30;


const hasSynergy = (actors: Tribute[], type: 'Combat' | 'Survival'): boolean => {
    const allTraits = actors.flatMap(t => t.traits);
    if (type === 'Combat') return allTraits.includes('Ruthless') && allTraits.includes('Trained');
    if (type === 'Survival') return allTraits.includes('Coward') && allTraits.includes('Friendly');
    return false;
};

const calculateEventScore = (
    event: GameEvent, 
    actors: Tribute[], 
    phase: string, 
    aggressionMultiplier: number, 
    aliveCount: number, 
    day: number,
    minDays: number,
    maxDays: number,
    weather: WeatherType
): number => {
  const mainActor = actors[0];
  const hasVictim = actors.length > 1 && event.victimIndices.length > 0;
  const victim = hasVictim ? actors[event.victimIndices[0]] : null;

  if (event.itemRequired) {
    for (const item of event.itemRequired) {
        if (!mainActor.inventory.includes(item)) return 0;
    }
  }
  if (event.traitRequired) {
      const hasTrait = event.traitRequired.some(t => mainActor.traits.includes(t));
      if (!hasTrait) return 0;
  }
  if (event.condition && !event.condition(actors)) return 0;

  let score = event.weight || 1.0;

  // Age bias
  if (mainActor.age >= 16 && (event.tags?.includes('Kill') || event.tags?.includes('Attack'))) score *= 1.2;
  if (mainActor.age <= 13 && (event.tags?.includes('Flee') || event.tags?.includes('Hide'))) score *= 1.2;

  // Synergies
  if (actors.length > 1) {
      if (hasSynergy(actors, 'Combat') && event.tags?.includes('Kill')) score *= 4.0;
      if (hasSynergy(actors, 'Survival') && (event.tags?.includes('Social') || event.tags?.includes('Survival'))) score *= 3.0;
  }

  // Traits
  if (mainActor.traits.includes('Clumsy') && (event.tags?.includes('Fail') || event.tags?.includes('Accident'))) score *= 3.0;
  if (mainActor.traits.includes('Sharpshooter') && event.tags?.includes('Kill') && (mainActor.inventory.includes('Bow') || mainActor.inventory.includes('Gun'))) score *= 5.0;
  if (mainActor.traits.includes('Glutton') && (event.tags?.includes('Food') || event.tags?.includes('Feast'))) score *= 3.0;

  // Weather
  if (weather === 'Rain' || weather === 'Storm') {
      if (event.tags?.includes('Fire') || event.tags?.includes('Camp')) score *= 0.1;
      if (event.tags?.includes('Shelter')) score *= 2.0;
  }
  if (weather === 'Fog') {
      if (event.tags?.includes('Sneak') || event.tags?.includes('Ambush')) score *= 2.5;
      if (event.tags?.includes('Hunt')) score *= 0.5; 
  }
  if (weather === 'Heatwave') {
      if (event.tags?.includes('Water') || event.tags?.includes('Exhaustion')) score *= 3.0;
  }

  // Pacing
  if (day < minDays && phase !== 'Bloodbath') {
      if (event.fatalities || event.tags?.includes('Kill')) score *= 0.1;
  }
  if (day > maxDays) {
       if (event.fatalities) score *= 10.0;
  }

  // Traits Multipliers
  if (mainActor.traits.includes('Ruthless') && event.tags?.includes('Kill')) score *= 2.5;
  if (mainActor.traits.includes('Coward') && (event.tags?.includes('Flee') || event.tags?.includes('Sneak'))) score *= 3.0;
  if (mainActor.traits.includes('Survivalist') && (event.tags?.includes('Survival') || event.tags?.includes('Supply'))) score *= 2.5;
  if (mainActor.traits.includes('Friendly') && event.tags?.includes('Social')) score *= 2.0;
  if (mainActor.traits.includes('Unstable') && event.tags?.includes('Insanity')) score *= 3.0;
  
  if (mainActor.traits.includes('Charming')) {
      if (event.tags?.includes('Social')) score *= 2.5;
      if (event.tags?.includes('Sponsor')) score *= 3.0;
  }

  // Needs
  if (event.tags?.includes('Food')) score *= (1 + mainActor.stats.hunger / 20);
  if (event.tags?.includes('Sleep')) score *= (1 + mainActor.stats.exhaustion / 20);
  if (event.tags?.includes('Desperate')) score *= 5.0;
  if (event.tags?.includes('Heal')) {
      if (mainActor.stats.health < 60 || mainActor.stats.sanity < 50) score *= 5.0;
  }

  if (actors.length === 1 && event.tags?.includes('Suicide')) {
      if (mainActor.stats.sanity < 10 && mainActor.stats.health < 30) score *= 100.0;
      else score = 0;
  }

  // Relationship (Combat)
  if (hasVictim && victim) {
    const relation = getRelationship(mainActor, victim);
    
    if (mainActor.district === victim.district && event.fatalities && !mainActor.traits.includes('Ruthless') && aliveCount > 4) {
        score -= 500;
    }

    if (event.fatalities) {
       const isDesperate = event.tags?.includes('Desperate');
       
       let betrayalThreshold = 50;
       if (aliveCount <= 4) betrayalThreshold = 80;
       if (aliveCount <= 2) betrayalThreshold = 95;

       if (aliveCount <= 4 || day > maxDays) {
            score *= 5.0; 
            if (relation > betrayalThreshold) score *= 0.1; 
            else score *= 5.0;
       } else {
            if (relation > 30 && !mainActor.traits.includes('Ruthless') && !isDesperate) score *= 0.01;
            if (relation < -50) score *= 3.0; 
       }
    }
    
    if (event.tags?.includes('Social')) {
        if (relation < 0) score *= 0.01;
        if (relation > 50) score *= 2.0;
    }
  }

  if (event.fatalities) {
    score *= aggressionMultiplier;
  }

  return Math.max(0, score);
};

// --- Training Simulation (New Robust Logic) ---
export const simulateTraining = (currentTributes: Tribute[]): { updatedTributes: Tribute[], logs: LogEntry[] } => {
    const logs: LogEntry[] = [];
    const tributesMap = new Map(currentTributes.map(t => [t.id, {...t, relationships: {...t.relationships}, stats: {...t.stats}, traits: [...t.traits]}]));
    const tributes = Array.from(tributesMap.values());
    const availableIds = shuffle(tributes.map(t => t.id));

    while (availableIds.length > 0) {
        const actorId = availableIds.pop();
        if (!actorId) break;
        const actor = tributesMap.get(actorId)!;

        // Grouping
        let groupSize = Math.random() < 0.7 ? 1 : 2;
        const group: Tribute[] = [actor];

        if (groupSize === 2 && availableIds.length > 0) {
            const partnerId = availableIds.pop();
            if (partnerId) group.push(tributesMap.get(partnerId)!);
        }

        // Pick Event
        const validEvents = trainingEvents.filter(e => e.playerCount === group.length);
        const event = validEvents[Math.floor(Math.random() * validEvents.length)];

        // Effects
        group.forEach(t => {
            if (event.tags?.includes('Skill')) {
                t.stats.weaponSkill = Math.min(100, t.stats.weaponSkill + 5);
                t.trainingScore += 10;
            }
            if (event.tags?.includes('Social') && group.length > 1) {
                const other = group.find(g => g.id !== t.id);
                if (other) {
                    modifyRelationship(t, other, 10);
                }
            }
            if (event.tags?.includes('Intimidate') && group.length > 1) {
                 const other = group.find(g => g.id !== t.id);
                 if (other) {
                     modifyRelationship(t, other, -5);
                     modifyRelationship(other, t, -10);
                 }
            }
            if (event.tags?.includes('Stealth')) {
                if (!t.traits.includes('Devious') && Math.random() < 0.2) t.traits.push('Devious');
            }
        });

        logs.push({
            id: crypto.randomUUID(),
            text: parseEventText(event.text, group),
            type: EventType.Training
        });
    }

    return { updatedTributes: tributes, logs };
};


// --- Phase Simulation ---

interface PhaseResult {
  updatedTributes: Tribute[];
  logs: LogEntry[];
  fallen: Tribute[];
  deathsInPhase: number;
}

export const simulatePhase = (
  currentTributes: Tribute[],
  phase: 'Bloodbath' | 'Day' | 'Night',
  daysSinceLastDeath: number,
  day: number,
  minDays: number,
  maxDays: number,
  currentWeather: WeatherType,
  fatalityRate: number,
  enableWeather: boolean
): PhaseResult => {
  // Deep copy
  const tributesMap = new Map(currentTributes.map(t => [t.id, {
      ...t,
      stats: { ...t.stats },
      inventory: [...t.inventory],
      relationships: { ...t.relationships },
      notes: [...t.notes],
      traits: [...t.traits],
      coordinates: { ...t.coordinates }
  }]));

  const logs: LogEntry[] = [];
  const fallen: Tribute[] = [];
  let deathsThisPhase = 0;

  // --- FEAST LOGIC ---
  let isFeast = false;
  if (phase === 'Day' && day === Math.floor(minDays / 2) && day > 1) {
      isFeast = true;
      logs.push({
          id: `feast-${crypto.randomUUID()}`,
          text: `<span class="text-orange-500 font-bold text-lg">THE FEAST BEGINS!</span> A cornucopia of supplies has appeared.`,
          type: EventType.Feast
      });
      tributesMap.forEach(t => {
          if (t.status === TributeStatus.Alive) {
              t.stats.hunger = 0;
              t.stats.health = Math.min(100, t.stats.health + 20);
              t.coordinates = { q: 0, r: 0 };
          }
      });
  }

  // --- Global Arena Events ---
  let arenaChance = 0.15;
  if (day > maxDays) arenaChance = 0.5;

  if (phase === 'Day' && Math.random() < arenaChance && !isFeast) {
      const arenaEvent = arenaEvents[Math.floor(Math.random() * arenaEvents.length)];
      logs.push({
          id: `arena-${crypto.randomUUID()}`,
          text: `<span class="text-red-500 font-bold uppercase tracking-widest">ARENA EVENT:</span> ${arenaEvent.text}`,
          type: EventType.Arena
      });
      
      tributesMap.forEach(t => {
          if (t.status === TributeStatus.Alive) {
              if (arenaEvent.damage) t.stats.health -= arenaEvent.damage;
              if (arenaEvent.heal) t.stats.health = 100;
              if (arenaEvent.feed) t.stats.hunger = 0;
              
              if (t.stats.health <= 0) {
                  t.status = TributeStatus.Dead;
                  t.stats.health = 0;
                  t.deathCause = "Arena Event";
                  fallen.push(t);
                  deathsThisPhase++;
                  logs.push({
                      id: `arena-death-${t.id}`,
                      text: `${t.name} succumbed to the arena event.`,
                      type: EventType.Arena,
                      deathNames: [t.name]
                  });
              }
              if (arenaEvent.type === 'Psychological') {
                  t.stats.sanity -= 20;
              }
          }
      });
  }
  
  // --- Step 1: Stats & Weather ---
  if (phase !== 'Bloodbath') {
    tributesMap.forEach(t => {
      if (t.status === TributeStatus.Dead) return;
      
      let hungerGain = Math.floor(Math.random() * 10) + 5;
      let exhaustionGain = phase === 'Day' ? 10 : -20;

      if (enableWeather) {
        if (currentWeather === 'Heatwave') hungerGain += 5;
        if (currentWeather === 'Storm' && phase === 'Day') exhaustionGain += 10;
      }
      if (t.traits.includes('Survivalist')) hungerGain -= 3; 
      
      t.stats.hunger += Math.max(0, hungerGain);
      t.stats.exhaustion += exhaustionGain;
      
      if (phase === 'Night' && t.stats.hunger < 50 && t.stats.exhaustion < 20) {
          t.stats.sanity = Math.min(100, t.stats.sanity + 15);
      }
      if (t.stats.hunger < 20 && t.stats.sanity > 70 && t.stats.health < 100) {
          t.stats.health += 5;
      }

      tributesMap.forEach(other => {
          if (t.id === other.id || other.status === TributeStatus.Dead) return;
          const currentRel = t.relationships[other.id] || 0;
          if (currentRel > 5) t.relationships[other.id] -= 2;     
          else if (currentRel < -5) t.relationships[other.id] += 1; 
          
          if (t.district === other.district) modifyRelationship(t, other, 5);
          if (t.allianceId && t.allianceId === other.allianceId) modifyRelationship(t, other, 5);
      });
      
      if (t.stats.exhaustion < 0) t.stats.exhaustion = 0;
      if (t.stats.hunger > 100) t.stats.hunger = 100;
      if (t.stats.health > 100) t.stats.health = 100;
    });
  }

  // --- Step 2: Director / Aggression ---
  let aggressionMultiplier = fatalityRate;
  const aliveCount = Array.from(tributesMap.values()).filter(t => t.status === TributeStatus.Alive).length;

  if (daysSinceLastDeath > 2) aggressionMultiplier *= 2.0; 
  if (aliveCount <= 4) aggressionMultiplier *= 3.0; 
  if (isFeast) aggressionMultiplier = 2.0;
  if (phase === 'Bloodbath') aggressionMultiplier = 5.0;

  // Event Pool
  let basePool: GameEvent[] = [];
  if (phase === 'Bloodbath') {
      basePool = [...bloodbathEvents, ...bloodbathDeathEvents];
  }
  else if (phase === 'Night') basePool = [...nightEvents, ...fatalEvents];
  else basePool = [...generalEvents, ...fatalEvents];

  // --- Step 3: Action Loop ---
  let availableIds = Array.from(tributesMap.values())
      .filter(t => t.status === TributeStatus.Alive)
      .map(t => t.id);
  availableIds = shuffle(availableIds);
  
  while (availableIds.length > 0) {
    const actorId = availableIds.pop();
    if (!actorId) break;
    
    const actor = tributesMap.get(actorId)!;
    if (actor.status === TributeStatus.Dead) continue;

    let groupIds: string[] = [actorId];
    
    // Ally pull-in
    if (actor.allianceId) {
        const allies = Array.from(tributesMap.values())
            .filter(t => t.status === TributeStatus.Alive && t.allianceId === actor.allianceId && t.id !== actor.id && availableIds.includes(t.id) && getDistance(actor, t) <= 1)
            .map(t => t.id);
        if (allies.length > 0) groupIds.push(...allies);
    }

    // Determine Desire (Hierarchy of Needs)
    let desire: 'Kill' | 'Social' | 'Solo' = 'Solo';
    
    // 1. Critical Survival
    if (actor.stats.hunger > 90 || actor.stats.health < 30) {
        desire = 'Solo'; // Look for food/meds events
    }
    // 2. Insanity
    else if (actor.stats.sanity < 30) {
         desire = Math.random() < 0.5 ? 'Kill' : 'Solo';
    }
    // 3. Aggression
    else if (daysSinceLastDeath > 3 && aliveCount > 2) desire = 'Kill';
    else if ((actor.traits.includes('Ruthless') || aliveCount <= 4) && Math.random() < 0.3) desire = 'Kill';
    else if (phase === 'Bloodbath' && Math.random() < 0.7) desire = 'Kill';
    // 4. Social
    else if (actor.traits.includes('Friendly') || actor.traits.includes('Charming') || Math.random() < 0.4) desire = 'Social';

    // Form Groups based on desire
    const maxGroupSize = Math.random() < 0.9 ? 2 : (Math.floor(Math.random() * 4) + 3);
    
    while (groupIds.length < maxGroupSize && availableIds.length > 0) {
        let bestTargetId: string | null = null;
        let bestScore = -999;
        
        for (const targetId of availableIds) {
             if (groupIds.includes(targetId)) continue;
             const target = tributesMap.get(targetId)!;
             if (getDistance(actor, target) > 1) continue;

             const relation = getRelationship(actor, target);
             let score = 0;

             if (desire === 'Kill') {
                 score = -relation; 
                 // Target weak
                 if (target.stats.health < 50) score += 50;
                 if (actor.district === target.district) score -= 100;
             } else if (desire === 'Social') {
                 score = relation;
                 if (target.allianceId === actor.allianceId) score += 50;
             }

             score += Math.random() * 30; 
             
             if (score > bestScore) {
                 bestScore = score;
                 bestTargetId = targetId;
             }
        }

        if (bestTargetId) {
             const relation = getRelationship(actor, tributesMap.get(bestTargetId)!);
             // Thresholds to interact
             if (desire === 'Social' && relation > -20) groupIds.push(bestTargetId);
             else if (desire === 'Kill' && (relation < 20 || aliveCount <= 4)) groupIds.push(bestTargetId);
             else break; // No good targets
        } else {
            break;
        }
    }

    // Remove group members from available pool
    groupIds.forEach(id => {
        if (id !== actorId) {
            const idx = availableIds.indexOf(id);
            if (idx > -1) availableIds.splice(idx, 1);
        }
    });

    const finalGroupSize = groupIds.length;
    const groupActors = groupIds.map(id => tributesMap.get(id)!);

    // Alliance Logic fix: Only form NEW alliance if not already in one or large social group
    if (desire === 'Social' && finalGroupSize > 1 && !actor.allianceId) {
        const avgRel = groupActors.reduce((acc, t) => acc + (t.relationships[actor.id]||0), 0) / finalGroupSize;
        if (avgRel > 20) {
            const newAllianceId = `alliance-${day}-${Math.random().toString(36).substr(2, 5)}`;
            // Only pull in people who aren't in a strong alliance
            groupActors.forEach(t => {
                if (!t.allianceId) t.allianceId = newAllianceId;
            });
        }
    }

    let possibleEvents = basePool.filter(e => e.playerCount === finalGroupSize);

    if (phase === 'Bloodbath') {
         if (Math.random() < 0.6) { 
             possibleEvents = possibleEvents.filter(e => e.fatalities || e.tags?.includes('Kill'));
         }
    }

    if (desire === 'Kill') possibleEvents = possibleEvents.filter(e => e.fatalities || e.tags?.includes('Attack') || e.playerCount > 1);
    else if (desire === 'Social') possibleEvents = possibleEvents.filter(e => !e.fatalities && !e.tags?.includes('Attack'));
    
    if (possibleEvents.length === 0) possibleEvents = basePool.filter(e => e.playerCount === finalGroupSize);
    
    // Filter non-fatalities if pacing requires it
    if (day < minDays && deathsThisPhase > 4 && phase !== 'Bloodbath') possibleEvents = possibleEvents.filter(e => !e.fatalities);

    let chosenEvent: GameEvent | null = null;
    let totalWeight = 0;
    
    const weightedEvents = possibleEvents.map(event => {
        const w = calculateEventScore(event, groupActors, phase, aggressionMultiplier, aliveCount, day, minDays, maxDays, currentWeather);
        totalWeight += w;
        return { event, weight: w };
    }).filter(item => item.weight > 0);

    if (weightedEvents.length > 0) {
        let r = Math.random() * totalWeight;
        for (const item of weightedEvents) {
            r -= item.weight;
            if (r <= 0) {
                chosenEvent = item.event;
                break;
            }
        }
    }

    if (!chosenEvent) {
         if (finalGroupSize === 1) chosenEvent = { text: "(P1) wanders aimlessly.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [] };
         else {
             const names = groupActors.map((_, i) => `(P${i+1})`).join(', ');
             chosenEvent = { 
                 text: `The group of ${names} huddle together nervously.`, 
                 playerCount: finalGroupSize, 
                 fatalities: false, 
                 killerIndices: [], 
                 victimIndices: [] 
            };
         }
    }
    
    const actors = groupIds.map(id => tributesMap.get(id)!);
    const deathNames: string[] = [];

    if (chosenEvent.itemGain) actors[0].inventory.push(...chosenEvent.itemGain);
    if (chosenEvent.itemRequired && chosenEvent.consumesItem) {
        const itemsToRemove = Array.isArray(chosenEvent.consumesItem) ? chosenEvent.consumesItem : chosenEvent.itemRequired;
        itemsToRemove.forEach(item => {
            const idx = actors[0].inventory.indexOf(item);
            if (idx > -1) actors[0].inventory.splice(idx, 1);
        });
    }
    
    // Inventory Limit
    if (actors[0].inventory.length > 4) {
        actors[0].inventory.sort((a, b) => (ITEM_VALUES[b] || 0) - (ITEM_VALUES[a] || 0));
        actors[0].inventory = actors[0].inventory.slice(0, 4); 
    }

    // Stats
    if (chosenEvent.tags?.includes('Food')) actors[0].stats.hunger = Math.max(0, actors[0].stats.hunger - 40);
    if (chosenEvent.tags?.includes('Heal')) {
        actors[0].stats.health = Math.min(100, actors[0].stats.health + 30);
        actors[0].stats.sanity = Math.min(100, actors[0].stats.sanity + 10);
    }
    if (chosenEvent.tags?.includes('Sleep')) actors[0].stats.exhaustion = 0;

    // Travel logic (Hex Map) - Fixes Drift
    if (chosenEvent.tags?.includes('Travel') || chosenEvent.tags?.includes('Flee') || chosenEvent.tags?.includes('Hunt')) {
        const directions = [
            {q: 1, r: 0}, {q: 1, r: -1}, {q: 0, r: -1},
            {q: -1, r: 0}, {q: -1, r: 1}, {q: 0, r: 1}
        ];
        const move = directions[Math.floor(Math.random() * directions.length)];
        actors.forEach(a => {
            const prevQ = a.coordinates.q;
            const prevR = a.coordinates.r;
            a.coordinates.q += move.q;
            a.coordinates.r += move.r;
            // Hex boundary check (Distance from center <= 5)
            if (Math.abs(a.coordinates.q + a.coordinates.r) > 5 || Math.abs(a.coordinates.q) > 5 || Math.abs(a.coordinates.r) > 5) {
                a.coordinates.q = prevQ;
                a.coordinates.r = prevR;
            }
        });
    }

    if (chosenEvent.healthDamage) {
        actors[0].stats.health -= chosenEvent.healthDamage;
        if (actors[0].stats.health <= 0 && !chosenEvent.fatalities) {
             actors[0].status = TributeStatus.Dead;
             actors[0].deathCause = "Succumbed to injuries";
             fallen.push({...actors[0]});
             deathNames.push(actors[0].name);
             deathsThisPhase++;
             chosenEvent.text += ` (P1) succumbs to their injuries.`;
        }
    }

    if (chosenEvent.fatalities) {
        deathsThisPhase += chosenEvent.victimIndices.length;
        const killer = chosenEvent.killerIndices.length > 0 ? actors[chosenEvent.killerIndices[0]] : null;
        
        chosenEvent.victimIndices.forEach(vIdx => {
            if (vIdx < actors.length) {
                const v = actors[vIdx];
                v.status = TributeStatus.Dead;
                v.stats.health = 0;
                v.deathCause = resolveEventTextPlain(chosenEvent!.text, actors);
                if (killer) v.killerId = killer.id;
                
                if (killer && v.inventory.length > 0) {
                    killer.inventory.push(...v.inventory);
                    v.inventory = [];
                    if (killer.inventory.length > 4) {
                        killer.inventory.sort((a, b) => (ITEM_VALUES[b] || 0) - (ITEM_VALUES[a] || 0));
                        killer.inventory = killer.inventory.slice(0, 4); 
                    }
                }
                
                fallen.push({ ...v });
                deathNames.push(v.name);
            }
        });

        if (killer) {
             killer.killCount += chosenEvent.victimIndices.length;
             if (!killer.traits.includes('Ruthless')) killer.stats.sanity -= 20;

             if (killer.traits.includes('Coward') && killer.killCount >= 2) {
                 killer.traits = killer.traits.filter(t => t !== 'Coward');
                 killer.traits.push('Ruthless');
                 logs.push({ id: `ev-${crypto.randomUUID()}`, text: `<span class="text-purple-400 font-bold">TRAIT EVOLUTION:</span> ${killer.name} has shed their cowardice.`, type: EventType.Day });
             }
             if (killer.traits.includes('Underdog') && killer.killCount >= 3) {
                 killer.traits = killer.traits.filter(t => t !== 'Underdog');
                 killer.traits.push('Trained');
             }
        }
    } else {
        if (actors.length === 2 && (chosenEvent.tags?.includes('Attack') || chosenEvent.tags?.includes('Theft'))) {
            const p1 = actors[0];
            const p2 = actors[1];
            modifyRelationship(p2, p1, -40);
        }
    }

    const finalLogText = parseEventText(chosenEvent.text, actors, chosenEvent.tags);

    logs.push({
      id: crypto.randomUUID(),
      text: finalLogText,
      type: phase === 'Bloodbath' ? EventType.Bloodbath : (phase === 'Night' ? EventType.Night : (isFeast ? EventType.Feast : EventType.Day)),
      deathNames: deathNames.length > 0 ? deathNames : undefined
    });
  }

  // --- Cleanup: Fragmentation ---
  // Check for 1-person alliances and disband them
  const allianceCounts = new Map<string, number>();
  tributesMap.forEach(t => {
      if (t.status === TributeStatus.Alive && t.allianceId && !t.allianceId.includes('career')) {
          allianceCounts.set(t.allianceId, (allianceCounts.get(t.allianceId) || 0) + 1);
      }
  });
  tributesMap.forEach(t => {
      if (t.status === TributeStatus.Alive && t.allianceId && !t.allianceId.includes('career')) {
          if (allianceCounts.get(t.allianceId)! < 2) {
              t.allianceId = undefined;
          }
      }
  });


  return {
    updatedTributes: Array.from(tributesMap.values()),
    logs,
    fallen,
    deathsInPhase: deathsThisPhase
  };
};
