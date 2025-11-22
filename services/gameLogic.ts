
import { Tribute, TributeStatus, GameEvent, LogEntry, EventType, Trait } from '../types';
import { bloodbathEvents, generalEvents, fatalEvents, nightEvents, arenaEvents } from '../data/events';

// --- Config ---
const TRAITS: Trait[] = ['Ruthless', 'Survivalist', 'Coward', 'Friendly', 'Unstable', 'Charming', 'Trained', 'Underdog'];

// --- Initialization ---

const getRandomTraits = (district: number): Trait[] => {
  // Career Districts
  if ([1, 2, 4].includes(district)) {
      return Math.random() < 0.7 ? ['Trained', 'Ruthless'] : ['Trained', 'Arrogant' as any]; 
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
      stats: { sanity: 100, hunger: 0, exhaustion: 0, health: 100 },
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
      stats: { sanity: 100, hunger: 0, exhaustion: 0, health: 100 },
      traits: getRandomTraits(i),
      relationships: {},
      notes: []
    });
  }
  return tributes;
};

// --- Helpers ---

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
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedPlaceholder, 'g');
    
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

// --- Relationship Logic ---
const getRelationship = (from: Tribute, to: Tribute): number => {
  if (from.district === to.district) return from.relationships[to.id] ?? 50; // District partners start with trust
  return from.relationships[to.id] ?? 0;
};

const modifyRelationship = (from: Tribute, to: Tribute, amount: number) => {
  const current = getRelationship(from, to);
  from.relationships[to.id] = Math.max(-100, Math.min(100, current + amount));
};

// --- Event Scoring System (The Brain) ---
const calculateEventScore = (event: GameEvent, actors: Tribute[], phase: string, aggressionMultiplier: number, aliveCount: number): number => {
  const mainActor = actors[0];
  const hasVictim = actors.length > 1 && event.victimIndices.length > 0;
  const victim = hasVictim ? actors[event.victimIndices[0]] : null;

  // 0. HARD REQUIREMENTS (Traits & Items)
  // Check Item Requirements
  if (event.itemRequired) {
    for (const item of event.itemRequired) {
        if (!mainActor.inventory.includes(item)) return 0;
    }
  }
  // Check Trait Requirements
  if (event.traitRequired) {
      const hasTrait = event.traitRequired.some(t => mainActor.traits.includes(t));
      if (!hasTrait) return 0;
  }
  // Check Function Condition
  if (event.condition && !event.condition(actors)) return 0;

  let score = event.weight || 1.0;

  // 1. Trait Multipliers
  if (mainActor.traits.includes('Ruthless') && event.tags?.includes('Kill')) score *= 2.5;
  if (mainActor.traits.includes('Coward') && (event.tags?.includes('Flee') || event.tags?.includes('Sneak'))) score *= 3.0;
  if (mainActor.traits.includes('Survivalist') && (event.tags?.includes('Survival') || event.tags?.includes('Supply'))) score *= 2.5;
  if (mainActor.traits.includes('Friendly') && event.tags?.includes('Social')) score *= 2.0;
  if (mainActor.traits.includes('Unstable') && event.tags?.includes('Insanity')) score *= 3.0;
  
  // Charming Trait Logic
  if (mainActor.traits.includes('Charming')) {
      if (event.tags?.includes('Social')) score *= 2.5;
      if (event.tags?.includes('Sponsor')) score *= 3.0; // Charming people get more stuff
  }

  // 2. Need Multipliers
  if (event.tags?.includes('Food')) score *= (1 + mainActor.stats.hunger / 20); // Hungry people want food
  if (event.tags?.includes('Sleep')) score *= (1 + mainActor.stats.exhaustion / 20); // Tired people want sleep
  if (event.tags?.includes('Desperate')) score *= 5.0; // Desperate events trigger heavily when condition met
  if (event.tags?.includes('Heal')) {
      // If injured, highly prioritize healing
      if (mainActor.stats.health < 60 || mainActor.stats.sanity < 50) score *= 5.0;
  }

  // 3. Relationship Logic (Combat)
  if (hasVictim && victim) {
    const relation = getRelationship(mainActor, victim);
    if (event.fatalities) {
       const isDesperate = event.tags?.includes('Desperate');
       
       // BUG FIX: Immortal Friends Logic
       // If few people are left, friendships don't matter as much. Betrayal is necessary.
       if (aliveCount <= 4) {
            score *= 5.0; // Panic mode
            if (relation > 50) score *= 5.0; // Dramatic betrayal bonus
       } else {
            // Normal logic: Friends rarely kill friends
            if (relation > 50 && !mainActor.traits.includes('Ruthless') && !isDesperate) score *= 0.01;
            if (relation < -50) score *= 3.0; // Hated enemies
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
  daysSinceLastDeath: number
): PhaseResult => {
  // Deep copy tributes
  const tributesMap = new Map(currentTributes.map(t => [t.id, {
      ...t,
      stats: { ...t.stats },
      inventory: [...t.inventory],
      relationships: { ...t.relationships },
      notes: [...t.notes]
  }]));

  const logs: LogEntry[] = [];
  const fallen: Tribute[] = [];
  let deathsThisPhase = 0;

  // --- Global Arena Events (Chance) ---
  if (phase === 'Day' && Math.random() < 0.15) {
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
              
              // Arena deaths
              if (t.stats.health <= 0) {
                  t.status = TributeStatus.Dead;
                  t.stats.health = 0;
                  fallen.push(t);
                  deathsThisPhase++;
                  logs.push({
                      id: `arena-death-${t.id}`,
                      text: `${t.name} succumbed to the arena event.`,
                      type: EventType.Arena,
                      deathNames: [t.name]
                  });
              }
          }
      });
  }
  
  // --- Step 1: Stat Degradation ---
  if (phase !== 'Bloodbath') {
    tributesMap.forEach(t => {
      if (t.status === TributeStatus.Dead) return;
      
      // Trait Effects on Stats
      let hungerGain = Math.floor(Math.random() * 10) + 5;
      if (t.traits.includes('Survivalist')) hungerGain -= 3; 
      
      t.stats.hunger += Math.max(0, hungerGain);
      t.stats.exhaustion += phase === 'Day' ? 10 : -20; 
      
      // Recover Health slightly if well fed and sane
      if (t.stats.hunger < 20 && t.stats.sanity > 70 && t.stats.health < 100) {
          t.stats.health += 5;
      }

      Object.keys(t.relationships).forEach(relId => {
          if (t.relationships[relId] > 10) {
              t.relationships[relId] -= 2; 
          }
      });
      
      // Cap stats
      if (t.stats.exhaustion < 0) t.stats.exhaustion = 0;
      if (t.stats.hunger > 100) t.stats.hunger = 100;
      if (t.stats.health > 100) t.stats.health = 100;
    });
  }

  // --- Step 2: The Director ---
  let aggressionMultiplier = 1.0;
  const aliveCount = Array.from(tributesMap.values()).filter(t => t.status === TributeStatus.Alive).length;

  if (daysSinceLastDeath > 2) aggressionMultiplier = 3.0; 
  if (aliveCount < 5) aggressionMultiplier = 2.0; 
  if (phase === 'Bloodbath') aggressionMultiplier = 1.5;

  // Event Pool Selection
  let basePool: GameEvent[] = [];
  if (phase === 'Bloodbath') basePool = [...bloodbathEvents];
  else if (phase === 'Night') basePool = [...nightEvents, ...fatalEvents];
  else basePool = [...generalEvents, ...fatalEvents];

  // --- Step 3: Action Loop ---
  let aliveIds = shuffle(Array.from(tributesMap.values()).filter(t => t.status === TributeStatus.Alive).map(t => t.id));
  const processedIds = new Set<string>();

  let i = 0;
  while (i < aliveIds.length) {
    const actorId = aliveIds[i];
    if (processedIds.has(actorId)) { i++; continue; }
    if (tributesMap.get(actorId)?.status === TributeStatus.Dead) { i++; continue; } // Might have died in Arena event

    const actor = tributesMap.get(actorId)!;

    // --- Grouping Logic ---
    let groupIds: string[] = [actorId];
    
    // Determine desire
    let desire: 'Kill' | 'Social' | 'Solo' = 'Solo';
    if (actor.stats.sanity < 20 || actor.stats.hunger > 90) desire = 'Solo'; 
    else if (Math.random() < 0.3 || actor.traits.includes('Friendly') || actor.traits.includes('Charming')) desire = 'Social';
    else if (Math.random() < 0.1 || actor.traits.includes('Ruthless')) desire = 'Kill';

    if (desire !== 'Solo') {
        for (let j = i + 1; j < aliveIds.length; j++) {
            const targetId = aliveIds[j];
            if (processedIds.has(targetId)) continue;
            const target = tributesMap.get(targetId)!;
            if (target.status === TributeStatus.Dead) continue;
            
            const relation = getRelationship(actor, target);
            if (desire === 'Social' && relation >= 0) {
                groupIds.push(targetId);
                if (groupIds.length >= 2) break; 
            } else if (desire === 'Kill' && relation <= 0) {
                groupIds.push(targetId);
                break; 
            }
        }
    }

    const finalGroupSize = groupIds.length;
    const groupActors = groupIds.map(id => tributesMap.get(id)!);

    // --- Event Selection ---
    const possibleEvents = basePool.filter(e => e.playerCount === finalGroupSize);
    
    let totalWeight = 0;
    const weightedEvents = possibleEvents.map(event => {
        const w = calculateEventScore(event, groupActors, phase, aggressionMultiplier, aliveCount);
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

    // FIX: Group Fallback Logic
    if (!chosenEvent) {
        if (finalGroupSize === 1) {
            chosenEvent = { text: "(P1) wanders around aimlessly.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [] };
        } else {
            // New generic fallback for groups to prevent splitting loop bug
            chosenEvent = { text: "(P1) and the group huddle together quietly.", playerCount: finalGroupSize, fatalities: false, killerIndices: [], victimIndices: [] };
        }
    }
    
    groupIds.forEach(id => processedIds.add(id));

    // Execute Event
    const actors = groupIds.map(id => tributesMap.get(id)!);
    const parsedText = parseEventText(chosenEvent.text, actors, chosenEvent.tags);
    const deathNames: string[] = [];

    // --- Apply Consequences ---
    
    // 1. Item Logic (Gain/Use)
    if (chosenEvent.itemGain) {
        actors[0].inventory.push(...chosenEvent.itemGain);
    }
    if (chosenEvent.itemRequired && chosenEvent.consumesItem) {
        // Logic update: Check if consumesItem is array or boolean
        const itemsToRemove = Array.isArray(chosenEvent.consumesItem) 
            ? chosenEvent.consumesItem 
            : chosenEvent.itemRequired;

        itemsToRemove.forEach(item => {
            const idx = actors[0].inventory.indexOf(item);
            if (idx > -1) actors[0].inventory.splice(idx, 1);
        });
    }

    // 2. Stats Effect (Benefits)
    if (chosenEvent.tags?.includes('Food')) {
        actors[0].stats.hunger = Math.max(0, actors[0].stats.hunger - 40);
    }
    if (chosenEvent.tags?.includes('Heal')) {
        actors[0].stats.health = Math.min(100, actors[0].stats.health + 30);
        actors[0].stats.sanity = Math.min(100, actors[0].stats.sanity + 10);
    }
    if (chosenEvent.tags?.includes('Sleep')) {
        actors[0].stats.exhaustion = 0;
    }

    // 3. Health Damage (Fail / Accident)
    if (chosenEvent.healthDamage) {
        actors[0].stats.health -= chosenEvent.healthDamage;
        // Check for death by injury
        if (actors[0].stats.health <= 0 && !chosenEvent.fatalities) {
             actors[0].status = TributeStatus.Dead;
             fallen.push({...actors[0]});
             deathNames.push(actors[0].name);
             deathsThisPhase++;
             // Append death message to text
             chosenEvent.text += ` (P1) succumbs to their injuries.`;
        }
    }

    // 4. Fatalities & Relationships
    if (chosenEvent.fatalities) {
        deathsThisPhase += chosenEvent.victimIndices.length;
        
        chosenEvent.victimIndices.forEach(vIdx => {
            if (vIdx < actors.length) {
                const v = actors[vIdx];
                v.status = TributeStatus.Dead;
                v.stats.health = 0;
                fallen.push({ ...v });
                deathNames.push(v.name);
            }
        });

        chosenEvent.killerIndices.forEach(kIdx => {
            if (kIdx < actors.length) {
                const k = actors[kIdx];
                k.killCount++;
                if (!k.traits.includes('Ruthless')) {
                    k.stats.sanity -= 20;
                }
            }
        });
    } else {
        if (actors.length === 2) {
            const p1 = actors[0];
            const p2 = actors[1];
            if (chosenEvent.tags?.includes('Social') || chosenEvent.tags?.includes('Bond') || chosenEvent.tags?.includes('Heal')) {
                modifyRelationship(p1, p2, 15);
                modifyRelationship(p2, p1, 15);
            } else if (chosenEvent.tags?.includes('Attack') || chosenEvent.tags?.includes('Theft')) {
                modifyRelationship(p2, p1, -40);
                // Attacked person loses health
                p2.stats.health -= 10;
                if (p2.stats.health <= 0) {
                     p2.status = TributeStatus.Dead;
                     fallen.push({...p2});
                     deathNames.push(p2.name);
                     deathsThisPhase++;
                }
            }
        }
    }

    // Final parse (to include any appended death messages)
    const finalLogText = parseEventText(chosenEvent.text, actors, chosenEvent.tags);

    logs.push({
      id: Math.random().toString(36).substring(7),
      text: finalLogText,
      type: phase === 'Bloodbath' ? EventType.Bloodbath : (phase === 'Night' ? EventType.Night : EventType.Day),
      deathNames: deathNames.length > 0 ? deathNames : undefined
    });

    i++;
  }

  return {
    updatedTributes: Array.from(tributesMap.values()),
    logs,
    fallen,
    deathsInPhase: deathsThisPhase
  };
};
