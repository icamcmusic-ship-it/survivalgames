
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

// --- Event Scoring System (The Brain) ---
const calculateEventScore = (
    event: GameEvent, 
    actors: Tribute[], 
    phase: string, 
    aggressionMultiplier: number, 
    aliveCount: number,
    day: number,
    minDays: number,
    maxDays: number
): number => {
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

  // --- PACING LOGIC ---
  // Early Game protection
  if (day < minDays && phase !== 'Bloodbath') {
      if (event.fatalities || event.tags?.includes('Kill')) {
          score *= 0.1;
      }
  }
  // Sudden Death
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

  // NEW: Suicide Logic
  if (actors.length === 1 && event.tags?.includes('Suicide')) {
      if (mainActor.stats.sanity < 10 && mainActor.stats.health < 30) {
          score *= 100.0; // Almost guaranteed if this event is pulled
      } else {
          score = 0; // Healthy/Sane people do not do this
      }
  }

  // 3. Relationship Logic (Combat)
  if (hasVictim && victim) {
    const relation = getRelationship(mainActor, victim);
    if (event.fatalities) {
       const isDesperate = event.tags?.includes('Desperate');
       
       // BUG FIX: Immortal Friends Logic
       // If few people are left, friendships don't matter as much. Betrayal is necessary.
       if (aliveCount <= 4 || day > maxDays) {
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
  daysSinceLastDeath: number,
  day: number,
  minDays: number,
  maxDays: number
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

  // --- FEAST LOGIC ---
  let isFeast = false;
  if (phase === 'Day' && day === Math.floor(minDays / 2) && day > 1) {
      isFeast = true;
      logs.push({
          id: `feast-${Date.now()}`,
          text: `<span class="text-orange-500 font-bold text-lg">THE FEAST BEGINS!</span> A cornucopia of supplies has appeared in the center.`,
          type: EventType.Feast
      });
      
      // Refill Everyone
      tributesMap.forEach(t => {
          if (t.status === TributeStatus.Alive) {
              t.stats.hunger = 0;
              t.stats.health = Math.min(100, t.stats.health + 20);
          }
      });
  }

  // --- Global Arena Events (Chance) ---
  // Increased chance in late game
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
              
              // Arena deaths
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
              // Psychological damage
              if (arenaEvent.type === 'Psychological') {
                  t.stats.sanity -= 20;
              }
          }
      });
  }
  
  // --- Step 1: Stat Degradation & Passive Bonding ---
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

      // Passive Relationship Logic
      tributesMap.forEach(other => {
          if (t.id === other.id || other.status === TributeStatus.Dead) return;
          
          // Decay
          if (t.relationships[other.id] > 10) {
              t.relationships[other.id] -= 2; 
          }
          
          // "Shared Trauma" & District Bond
          if (t.district === other.district) {
               modifyRelationship(t, other, 5); // Higher bond for district partners
          } else if (Math.random() < 0.05) {
               modifyRelationship(t, other, 3);
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
  if (aliveCount <= 4) aggressionMultiplier = 4.0; // Endgame panic
  if (phase === 'Bloodbath') aggressionMultiplier = 1.5;
  if (isFeast) aggressionMultiplier = 2.0; // Feast violence

  // Event Pool Selection
  let basePool: GameEvent[] = [];
  if (phase === 'Bloodbath') basePool = [...bloodbathEvents];
  else if (phase === 'Night') basePool = [...nightEvents, ...fatalEvents];
  else basePool = [...generalEvents, ...fatalEvents];

  // --- Step 3: Action Loop (Improved Matchmaking) ---
  let availableIds = shuffle(Array.from(tributesMap.values()).filter(t => t.status === TributeStatus.Alive).map(t => t.id));
  
  while (availableIds.length > 0) {
    const actorId = availableIds.pop(); // Take last one
    if (!actorId) break;
    
    const actor = tributesMap.get(actorId)!;
    if (actor.status === TributeStatus.Dead) continue;

    let groupIds: string[] = [actorId];
    
    // Determine desire
    let desire: 'Kill' | 'Social' | 'Solo' = 'Solo';
    if (actor.stats.sanity < 20 || actor.stats.hunger > 90) desire = 'Solo'; 
    else if (Math.random() < 0.3 || actor.traits.includes('Friendly') || actor.traits.includes('Charming')) desire = 'Social';
    else if (Math.random() < 0.1 || actor.traits.includes('Ruthless') || aliveCount <= 4) desire = 'Kill';

    // Matchmaking Phase
    if (desire !== 'Solo' && availableIds.length > 0) {
        // Scan ALL available tributes for the best match
        let bestTargetId: string | null = null;
        let bestScore = -999;

        for (const targetId of availableIds) {
             const target = tributesMap.get(targetId)!;
             const relation = getRelationship(actor, target);
             
             let score = 0;
             if (desire === 'Social') {
                 score = relation; // Higher is better
             } else {
                 score = -relation; // Lower relation (higher negative) is better target
             }
             
             // Random variance
             score += Math.random() * 50; 
             
             if (score > bestScore) {
                 bestScore = score;
                 bestTargetId = targetId;
             }
        }

        // Filter logic: Only group if score meets threshold
        if (bestTargetId) {
             const relation = getRelationship(actor, tributesMap.get(bestTargetId)!);
             if (desire === 'Social' && relation > -20) {
                  groupIds.push(bestTargetId);
             } else if (desire === 'Kill' && (relation < 20 || aliveCount <= 4)) {
                  groupIds.push(bestTargetId);
             }
        }
    }

    // Remove chosen partners from available pool
    groupIds.forEach(id => {
        if (id !== actorId) {
            const idx = availableIds.indexOf(id);
            if (idx > -1) availableIds.splice(idx, 1);
        }
    });

    const finalGroupSize = groupIds.length;
    const groupActors = groupIds.map(id => tributesMap.get(id)!);

    // --- Event Selection ---
    // Filter basePool based on DESIRE
    let possibleEvents = basePool.filter(e => e.playerCount === finalGroupSize);

    if (desire === 'Kill') {
        // If they want to kill, force events that are fatal or attacks
        const killEvents = possibleEvents.filter(e => e.fatalities || e.tags?.includes('Attack'));
        if (killEvents.length > 0) {
            possibleEvents = killEvents;
        }
    } else if (desire === 'Social') {
        // If social, avoid murder unless forced
        const socialEvents = possibleEvents.filter(e => !e.fatalities && !e.tags?.includes('Attack'));
        if (socialEvents.length > 0) {
            possibleEvents = socialEvents;
        }
    }
    
    // Safety Net: If too many deaths this day/phase and early game, prevent more deaths
    if (day < minDays && deathsThisPhase > 4) {
        possibleEvents = possibleEvents.filter(e => !e.fatalities);
    }

    let totalWeight = 0;
    const weightedEvents = possibleEvents.map(event => {
        const w = calculateEventScore(event, groupActors, phase, aggressionMultiplier, aliveCount, day, minDays, maxDays);
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
        if (finalGroupSize === 1) {
            chosenEvent = { text: "(P1) wanders around aimlessly.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [] };
        } else {
            chosenEvent = { text: "(P1) and the group huddle together quietly.", playerCount: finalGroupSize, fatalities: false, killerIndices: [], victimIndices: [] };
        }
    }
    
    // Execute Event
    const actors = groupIds.map(id => tributesMap.get(id)!);
    const deathNames: string[] = [];

    // --- Apply Consequences ---
    
    // 1. Item Logic (Gain/Use)
    if (chosenEvent.itemGain) {
        actors[0].inventory.push(...chosenEvent.itemGain);
    }
    // Fixed Consumable Logic
    if (chosenEvent.itemRequired && chosenEvent.consumesItem) {
        const itemsToRemove = Array.isArray(chosenEvent.consumesItem) 
            ? chosenEvent.consumesItem 
            : chosenEvent.itemRequired;

        itemsToRemove.forEach(item => {
            const idx = actors[0].inventory.indexOf(item);
            if (idx > -1) actors[0].inventory.splice(idx, 1);
        });
    }
    
    // Corpse Looting Cleanup (Inventory Management)
    if (actors[0].inventory.length > 4) {
        // Keep only last 4 items or consolidate
        actors[0].inventory = actors[0].inventory.slice(-4); 
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
        if (actors[0].stats.health <= 0 && !chosenEvent.fatalities) {
             actors[0].status = TributeStatus.Dead;
             actors[0].deathCause = "Succumbed to injuries";
             fallen.push({...actors[0]});
             deathNames.push(actors[0].name);
             deathsThisPhase++;
             chosenEvent.text += ` (P1) succumbs to their injuries.`;
        }
    }

    // 4. Fatalities, Looting & Relationships
    if (chosenEvent.fatalities) {
        deathsThisPhase += chosenEvent.victimIndices.length;
        const killer = chosenEvent.killerIndices.length > 0 ? actors[chosenEvent.killerIndices[0]] : null;
        
        chosenEvent.victimIndices.forEach(vIdx => {
            if (vIdx < actors.length) {
                const v = actors[vIdx];
                v.status = TributeStatus.Dead;
                v.stats.health = 0;
                // Fix: Use plain text resolver for death cause
                v.deathCause = resolveEventTextPlain(chosenEvent!.text, actors);
                if (killer) v.killerId = killer.id;
                
                // LOOTING LOGIC
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
             if (!killer.traits.includes('Ruthless')) {
                 killer.stats.sanity -= 20;
             }
        }
    } else {
        if (actors.length === 2) {
            const p1 = actors[0];
            const p2 = actors[1];
            if (chosenEvent.tags?.includes('Social') || chosenEvent.tags?.includes('Bond') || chosenEvent.tags?.includes('Heal')) {
                modifyRelationship(p1, p2, 15);
                modifyRelationship(p2, p1, 15);
            } else if (chosenEvent.tags?.includes('Attack') || chosenEvent.tags?.includes('Theft')) {
                modifyRelationship(p2, p1, -40);
                p2.stats.health -= 10;
                if (p2.stats.health <= 0) {
                     p2.status = TributeStatus.Dead;
                     p2.deathCause = `Killed by ${p1.name}`;
                     p2.killerId = p1.id;
                     fallen.push({...p2});
                     deathNames.push(p2.name);
                     deathsThisPhase++;
                }
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
