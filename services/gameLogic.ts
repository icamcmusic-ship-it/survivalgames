
import { Tribute, TributeStatus, GameEvent, LogEntry, EventType, Trait, WeatherType } from '../types';
import { bloodbathEvents, generalEvents, fatalEvents, nightEvents, arenaEvents } from '../data/events';

// --- Config ---
const TRAITS: Trait[] = ['Ruthless', 'Survivalist', 'Coward', 'Friendly', 'Unstable', 'Charming', 'Trained', 'Underdog'];

// Item Value Map for Inventory sorting (Higher = keep)
const ITEM_VALUES: Record<string, number> = {
    'Explosives': 20,
    'Bow': 15,
    'Arrows': 15,
    'Sword': 15,
    'Spear': 14,
    'Trident': 14,
    'Axe': 13,
    'Knife': 12,
    'Machete': 12,
    'First Aid Kit': 10,
    'Shield': 8,
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

export const generateTributes = (): Tribute[] => {
  const tributes: Tribute[] = [];
  for (let i = 1; i <= 12; i++) {
    // Male
    tributes.push({
      id: `d${i}_m`,
      name: `District ${i} Male`,
      district: i,
      gender: 'M',
      status: TributeStatus.Alive,
      killCount: 0,
      inventory: [],
      stats: { sanity: 100, hunger: 0, exhaustion: 0, health: 100, weaponSkill: 0 },
      traits: getRandomTraits(i),
      relationships: {}, 
      notes: []
    });
    // Female
    tributes.push({
      id: `d${i}_f`,
      name: `District ${i} Female`,
      district: i,
      gender: 'F',
      status: TributeStatus.Alive,
      killCount: 0,
      inventory: [],
      stats: { sanity: 100, hunger: 0, exhaustion: 0, health: 100, weaponSkill: 0 },
      traits: getRandomTraits(i),
      relationships: {},
      notes: []
    });
  }
  return tributes;
};

// --- Helpers ---

// FIX: RegEx Injection Vulnerability
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

const parseEventText = (text: string, actors: Tribute[], eventTags: string[] = []): string => {
  let result = text;
  actors.forEach((actor, index) => {
    const placeholder = `(P${index + 1})`;
    // FIX: Use escapeRegExp
    const regex = new RegExp(escapeRegExp(placeholder), 'g');
    
    // Highlight if they are in a desperate state
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

// Plain text resolver for death causes
export const resolveEventTextPlain = (text: string, actors: Tribute[]): string => {
  let result = text;
  actors.forEach((actor, index) => {
    const placeholder = `(P${index + 1})`;
    result = result.split(placeholder).join(actor.name);
  });
  return result;
};

// --- Relationship Logic ---
const getRelationship = (from: Tribute, to: Tribute): number => {
  // District Advantage
  if (from.district === to.district) return from.relationships[to.id] ?? 75; // Higher base trust
  return from.relationships[to.id] ?? 0;
};

const modifyRelationship = (from: Tribute, to: Tribute, amount: number) => {
  const current = getRelationship(from, to);
  from.relationships[to.id] = Math.max(-100, Math.min(100, current + amount));
};

// --- Trait Synergy Checker ---
const hasSynergy = (actors: Tribute[], type: 'Combat' | 'Survival'): boolean => {
    const allTraits = actors.flatMap(t => t.traits);
    
    if (type === 'Combat') {
        // Ruthless + Trained = Deadly
        return allTraits.includes('Ruthless') && allTraits.includes('Trained');
    }
    if (type === 'Survival') {
        // Coward + Friendly = Watch each others backs
        return allTraits.includes('Coward') && allTraits.includes('Friendly');
    }
    return false;
};

// --- Event Scoring System (The Brain) ---
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

  // 0. HARD REQUIREMENTS (Traits & Items)
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

  // --- TRAIT SYNERGIES (New Feature) ---
  if (actors.length > 1) {
      if (hasSynergy(actors, 'Combat') && event.tags?.includes('Kill')) {
          score *= 4.0; // Massive boost to killing effectiveness
      }
      if (hasSynergy(actors, 'Survival') && (event.tags?.includes('Social') || event.tags?.includes('Survival'))) {
          score *= 3.0; // Boost to surviving together
      }
  }

  // --- WEATHER MODIFIERS (New Feature) ---
  if (weather === 'Rain' || weather === 'Storm') {
      if (event.tags?.includes('Fire') || event.tags?.includes('Camp')) score *= 0.1;
      if (event.tags?.includes('Shelter')) score *= 2.0;
  }
  if (weather === 'Fog') {
      if (event.tags?.includes('Sneak') || event.tags?.includes('Ambush')) score *= 2.5;
      if (event.tags?.includes('Hunt')) score *= 0.5; // Harder to find people
  }
  if (weather === 'Heatwave') {
      if (event.tags?.includes('Water') || event.tags?.includes('Exhaustion')) score *= 3.0;
  }

  // --- PACING LOGIC ---
  if (day < minDays && phase !== 'Bloodbath') {
      if (event.fatalities || event.tags?.includes('Kill')) {
          score *= 0.1;
      }
  }
  if (day > maxDays) {
       if (event.fatalities) {
           score *= 10.0;
       }
  }

  // 1. Trait Multipliers
  if (mainActor.traits.includes('Ruthless') && event.tags?.includes('Kill')) score *= 2.5;
  if (mainActor.traits.includes('Coward') && (event.tags?.includes('Flee') || event.tags?.includes('Sneak'))) score *= 3.0;
  if (mainActor.traits.includes('Survivalist') && (event.tags?.includes('Survival') || event.tags?.includes('Supply'))) score *= 2.5;
  if (mainActor.traits.includes('Friendly') && event.tags?.includes('Social')) score *= 2.0;
  if (mainActor.traits.includes('Unstable') && event.tags?.includes('Insanity')) score *= 3.0;
  
  if (mainActor.traits.includes('Charming')) {
      if (event.tags?.includes('Social')) score *= 2.5;
      if (event.tags?.includes('Sponsor')) score *= 3.0;
  }

  // 2. Need Multipliers
  if (event.tags?.includes('Food')) score *= (1 + mainActor.stats.hunger / 20);
  if (event.tags?.includes('Sleep')) score *= (1 + mainActor.stats.exhaustion / 20);
  if (event.tags?.includes('Desperate')) score *= 5.0;
  if (event.tags?.includes('Heal')) {
      if (mainActor.stats.health < 60 || mainActor.stats.sanity < 50) score *= 5.0;
  }

  // Suicide Logic
  if (actors.length === 1 && event.tags?.includes('Suicide')) {
      if (mainActor.stats.sanity < 10 && mainActor.stats.health < 30) {
          score *= 100.0;
      } else {
          score = 0;
      }
  }

  // 3. Relationship Logic (Combat)
  if (hasVictim && victim) {
    const relation = getRelationship(mainActor, victim);
    if (event.fatalities) {
       const isDesperate = event.tags?.includes('Desperate');
       
       // FIX: Immortal Friends Paradox (Betrayal Curve)
       let betrayalThreshold = 50;
       if (aliveCount <= 4) betrayalThreshold = 80;
       if (aliveCount <= 2) betrayalThreshold = 95;

       if (aliveCount <= 4 || day > maxDays) {
            score *= 5.0; // Panic mode
            if (relation > betrayalThreshold) score *= 0.1; // Still hard to kill best friend
            else score *= 5.0; // Betrayal likely
       } else {
            if (relation > 30 && !mainActor.traits.includes('Ruthless') && !isDesperate) score *= 0.01;
            if (relation < -50) score *= 3.0; 
       }
    }
    // Social events require good terms
    if (event.tags?.includes('Social')) {
        if (relation < 0) score *= 0.01;
        if (relation > 50) score *= 2.0;
    }
  }

  // 4. Director / Aggression Scaling
  if (event.fatalities) {
    score *= aggressionMultiplier;
  }

  return score;
};

// --- Training Simulation (Setup Phase) ---
export const simulateTraining = (tributes: Tribute[]): LogEntry[] => {
    const logs: LogEntry[] = [];
    // Simulate some relationship building and skill acquisition
    for (let i = 0; i < 50; i++) {
        const t1 = tributes[Math.floor(Math.random() * tributes.length)];
        const t2 = tributes[Math.floor(Math.random() * tributes.length)];
        
        if (t1.id === t2.id) continue;

        const roll = Math.random();
        if (roll < 0.3) {
            // Alliance forming
            modifyRelationship(t1, t2, 10);
            modifyRelationship(t2, t1, 10);
        } else if (roll > 0.8) {
            // Rivalry
            modifyRelationship(t1, t2, -10);
            modifyRelationship(t2, t1, -10);
        }

        // Skill gain
        if (Math.random() < 0.2) {
            t1.stats.weaponSkill += 5;
        }
    }
    
    logs.push({
        id: 'training',
        text: "The tributes have completed their training. Alliances have formed, and rivals have been chosen.",
        type: EventType.Day
    });

    return logs;
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
  fatalityRate: number
): PhaseResult => {
  // Deep copy tributes
  const tributesMap = new Map(currentTributes.map(t => [t.id, {
      ...t,
      stats: { ...t.stats },
      inventory: [...t.inventory],
      relationships: { ...t.relationships },
      notes: [...t.notes],
      traits: [...t.traits] // Copy traits for evolution
  }]));

  const logs: LogEntry[] = [];
  const fallen: Tribute[] = [];
  let deathsThisPhase = 0;

  // --- FEAST LOGIC ---
  let isFeast = false;
  if (phase === 'Day' && day === Math.floor(minDays / 2) && day > 1) {
      isFeast = true;
      logs.push({
          id: `feast-${Date.now()}`,
          text: `<span class="text-orange-500 font-bold text-lg">THE FEAST BEGINS!</span> A cornucopia of supplies has appeared in the center.`,
          type: EventType.Feast
      });
      
      tributesMap.forEach(t => {
          if (t.status === TributeStatus.Alive) {
              t.stats.hunger = 0;
              t.stats.health = Math.min(100, t.stats.health + 20);
          }
      });
  }

  // --- Global Arena Events ---
  let arenaChance = 0.15;
  if (day > maxDays) arenaChance = 0.5;

  if (phase === 'Day' && Math.random() < arenaChance && !isFeast) {
      const arenaEvent = arenaEvents[Math.floor(Math.random() * arenaEvents.length)];
      logs.push({
          id: `arena-${Date.now()}`,
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
  
  // --- Step 1: Stat Degradation, Weather & Passive Bonding ---
  if (phase !== 'Bloodbath') {
    tributesMap.forEach(t => {
      if (t.status === TributeStatus.Dead) return;
      
      let hungerGain = Math.floor(Math.random() * 10) + 5;
      let exhaustionGain = phase === 'Day' ? 10 : -20;

      // Weather Effects
      if (currentWeather === 'Heatwave') hungerGain += 5;
      if (currentWeather === 'Storm' && phase === 'Day') exhaustionGain += 10;
      if (t.traits.includes('Survivalist')) hungerGain -= 3; 
      
      t.stats.hunger += Math.max(0, hungerGain);
      t.stats.exhaustion += exhaustionGain;
      
      // Sanity Recovery Logic (Fix for Death Spiral)
      if (phase === 'Night' && t.stats.hunger < 50 && t.stats.exhaustion < 20) {
          t.stats.sanity = Math.min(100, t.stats.sanity + 15);
      }

      // Recover Health
      if (t.stats.hunger < 20 && t.stats.sanity > 70 && t.stats.health < 100) {
          t.stats.health += 5;
      }

      // Passive Relationship Logic
      tributesMap.forEach(other => {
          if (t.id === other.id || other.status === TributeStatus.Dead) return;
          if (t.relationships[other.id] > 10) t.relationships[other.id] -= 2; 
          
          if (t.district === other.district) modifyRelationship(t, other, 5);
      });
      
      if (t.stats.exhaustion < 0) t.stats.exhaustion = 0;
      if (t.stats.hunger > 100) t.stats.hunger = 100;
      if (t.stats.health > 100) t.stats.health = 100;
    });
  }

  // --- Step 2: The Director ---
  let aggressionMultiplier = fatalityRate;
  const aliveCount = Array.from(tributesMap.values()).filter(t => t.status === TributeStatus.Alive).length;

  if (daysSinceLastDeath > 2) aggressionMultiplier *= 2.0; 
  if (aliveCount <= 4) aggressionMultiplier *= 3.0; // Endgame
  if (phase === 'Bloodbath') aggressionMultiplier = 1.5;
  if (isFeast) aggressionMultiplier = 2.0;

  // Event Pool Selection
  let basePool: GameEvent[] = [];
  if (phase === 'Bloodbath') basePool = [...bloodbathEvents];
  else if (phase === 'Night') basePool = [...nightEvents, ...fatalEvents];
  else basePool = [...generalEvents, ...fatalEvents];

  // --- Step 3: Action Loop ---
  let availableIds = shuffle(Array.from(tributesMap.values()).filter(t => t.status === TributeStatus.Alive).map(t => t.id));
  
  while (availableIds.length > 0) {
    const actorId = availableIds.pop();
    if (!actorId) break;
    
    const actor = tributesMap.get(actorId)!;
    if (actor.status === TributeStatus.Dead) continue;

    let groupIds: string[] = [actorId];
    
    // Determine desire
    let desire: 'Kill' | 'Social' | 'Solo' = 'Solo';
    if (actor.stats.sanity < 20 || actor.stats.hunger > 90) desire = 'Solo'; 
    else if (Math.random() < 0.3 || actor.traits.includes('Friendly') || actor.traits.includes('Charming')) desire = 'Social';
    else if (Math.random() < 0.1 || actor.traits.includes('Ruthless') || aliveCount <= 4) desire = 'Kill';

    // Matchmaking
    if (desire !== 'Solo' && availableIds.length > 0) {
        let bestTargetId: string | null = null;
        let bestScore = -999;

        for (const targetId of availableIds) {
             const target = tributesMap.get(targetId)!;
             const relation = getRelationship(actor, target);
             let score = desire === 'Social' ? relation : -relation;
             score += Math.random() * 50; 
             
             if (score > bestScore) {
                 bestScore = score;
                 bestTargetId = targetId;
             }
        }

        if (bestTargetId) {
             const relation = getRelationship(actor, tributesMap.get(bestTargetId)!);
             if (desire === 'Social' && relation > -20) groupIds.push(bestTargetId);
             else if (desire === 'Kill' && (relation < 20 || aliveCount <= 4)) groupIds.push(bestTargetId);
        }
    }

    // Remove chosen partners from available pool
    groupIds.forEach(id => {
        if (id !== actorId) {
            const idx = availableIds.indexOf(id);
            if (idx > -1) availableIds.splice(idx, 1);
        }
    });

    // Fix: Turn Order Bias / Interruption logic (Simplified)
    // Small chance for a 3rd party to join if 2 people are interacting
    if (groupIds.length === 2 && availableIds.length > 0 && Math.random() < 0.2) {
        const interloper = availableIds.pop();
        if (interloper) groupIds.push(interloper);
    }

    const finalGroupSize = groupIds.length;
    const groupActors = groupIds.map(id => tributesMap.get(id)!);

    // Filter Events
    let possibleEvents = basePool.filter(e => e.playerCount === finalGroupSize);

    if (desire === 'Kill') possibleEvents = possibleEvents.filter(e => e.fatalities || e.tags?.includes('Attack') || e.playerCount > 1);
    else if (desire === 'Social') possibleEvents = possibleEvents.filter(e => !e.fatalities && !e.tags?.includes('Attack'));
    
    // Safety Net
    if (possibleEvents.length === 0) possibleEvents = basePool.filter(e => e.playerCount === finalGroupSize);
    if (day < minDays && deathsThisPhase > 4) possibleEvents = possibleEvents.filter(e => !e.fatalities);

    let totalWeight = 0;
    const weightedEvents = possibleEvents.map(event => {
        const w = calculateEventScore(event, groupActors, phase, aggressionMultiplier, aliveCount, day, minDays, maxDays, currentWeather);
        totalWeight += w;
        return { event, weight: w };
    }).filter(item => item.weight > 0);

    let chosenEvent: GameEvent | null = null;
    
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
         chosenEvent = { text: finalGroupSize === 1 ? "(P1) wanders aimlessly." : "(P1) and the group sit in silence.", playerCount: finalGroupSize, fatalities: false, killerIndices: [], victimIndices: [] };
    }
    
    // Execute Event
    const actors = groupIds.map(id => tributesMap.get(id)!);
    const deathNames: string[] = [];

    // 1. Item Logic
    if (chosenEvent.itemGain) actors[0].inventory.push(...chosenEvent.itemGain);
    if (chosenEvent.itemRequired && chosenEvent.consumesItem) {
        const itemsToRemove = Array.isArray(chosenEvent.consumesItem) ? chosenEvent.consumesItem : chosenEvent.itemRequired;
        itemsToRemove.forEach(item => {
            const idx = actors[0].inventory.indexOf(item);
            if (idx > -1) actors[0].inventory.splice(idx, 1);
        });
    }
    
    // Fix: Inventory Dropping Bug (Sort by value)
    if (actors[0].inventory.length > 4) {
        actors[0].inventory.sort((a, b) => (ITEM_VALUES[b] || 0) - (ITEM_VALUES[a] || 0));
        actors[0].inventory = actors[0].inventory.slice(0, 4); 
    }

    // 2. Stats Effect
    if (chosenEvent.tags?.includes('Food')) actors[0].stats.hunger = Math.max(0, actors[0].stats.hunger - 40);
    if (chosenEvent.tags?.includes('Heal')) {
        actors[0].stats.health = Math.min(100, actors[0].stats.health + 30);
        actors[0].stats.sanity = Math.min(100, actors[0].stats.sanity + 10);
    }
    if (chosenEvent.tags?.includes('Sleep')) actors[0].stats.exhaustion = 0;

    // 3. Health Damage
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

    // 4. Fatalities & Trait Evolution
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
                }
                
                fallen.push({ ...v });
                deathNames.push(v.name);
            }
        });

        if (killer) {
             killer.killCount += chosenEvent.victimIndices.length;
             if (!killer.traits.includes('Ruthless')) killer.stats.sanity -= 20;

             // New Feature: Trait Evolution
             // Coward -> Ruthless
             if (killer.traits.includes('Coward') && killer.killCount >= 2) {
                 killer.traits = killer.traits.filter(t => t !== 'Coward');
                 killer.traits.push('Ruthless');
                 logs.push({ id: `ev-${killer.id}`, text: `<span class="text-purple-400 font-bold">TRAIT EVOLUTION:</span> ${killer.name} has shed their cowardice.`, type: EventType.Day });
             }
             // Underdog -> Trained (Battle hardened)
             if (killer.traits.includes('Underdog') && killer.killCount >= 3) {
                 killer.traits = killer.traits.filter(t => t !== 'Underdog');
                 killer.traits.push('Trained');
             }
        }
    } else {
        // Non-fatal Trait Evolution
        if (actors.length === 2 && (chosenEvent.tags?.includes('Attack') || chosenEvent.tags?.includes('Theft'))) {
            const p1 = actors[0];
            const p2 = actors[1];
            modifyRelationship(p2, p1, -40);
            
            // Friendly -> Trust Issues (Traumatized)
            if (p2.traits.includes('Friendly')) {
                 p2.traits = p2.traits.filter(t => t !== 'Friendly');
                 p2.traits.push('Traumatized');
                 logs.push({ id: `ev-${p2.id}`, text: `<span class="text-purple-400 font-bold">TRAIT EVOLUTION:</span> ${p2.name} will no longer trust easily.`, type: EventType.Day });
            }
        }
    }

    const finalLogText = parseEventText(chosenEvent.text, actors, chosenEvent.tags);

    logs.push({
      id: Math.random().toString(36).substring(7),
      text: finalLogText,
      type: phase === 'Bloodbath' ? EventType.Bloodbath : (phase === 'Night' ? EventType.Night : (isFeast ? EventType.Feast : EventType.Day)),
      deathNames: deathNames.length > 0 ? deathNames : undefined
    });
  }

  return {
    updatedTributes: Array.from(tributesMap.values()),
    logs,
    fallen,
    deathsInPhase: deathsThisPhase
  };
};
