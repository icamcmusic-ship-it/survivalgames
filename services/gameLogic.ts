
import { Tribute, TributeStatus, GameEvent, LogEntry, EventType, Trait } from '../types';
import { bloodbathEvents, generalEvents, fatalEvents, nightEvents } from '../data/events';

// --- Config ---
const TRAITS: Trait[] = ['Ruthless', 'Survivalist', 'Coward', 'Friendly', 'Unstable', 'Charming'];

// --- Initialization ---

const getRandomTraits = (): Trait[] => {
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
      stats: { sanity: 100, hunger: 0, exhaustion: 0 },
      traits: getRandomTraits(),
      relationships: {}, // Will populate dynamically
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
      stats: { sanity: 100, hunger: 0, exhaustion: 0 },
      traits: getRandomTraits(),
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
    const isDesperate = actor.stats.hunger > 90 || actor.stats.sanity < 30;
    const extraClass = isDesperate ? 'text-red-400' : 'text-gold';

    result = result.replace(regex, `<span class="font-bold ${extraClass} group relative cursor-help">
      ${actor.name}
      <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-max bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
        ${actor.traits.join(', ')}
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
const calculateEventScore = (event: GameEvent, actors: Tribute[], phase: string, aggressionMultiplier: number): number => {
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
      if (mainActor.stats.sanity < 60 || mainActor.stats.hunger > 50) score *= 5.0;
  }

  // 3. Relationship Logic (Combat)
  if (hasVictim && victim) {
    const relation = getRelationship(mainActor, victim);
    if (event.fatalities) {
       // People rarely kill friends unless Ruthless or Unstable or Desperate
       const isDesperate = event.tags?.includes('Desperate');
       if (relation > 50 && !mainActor.traits.includes('Ruthless') && !isDesperate) score *= 0.01;
       if (relation < -50) score *= 3.0; // Hated enemies
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
  // Deep copy tributes to prevent state mutation issues
  const tributesMap = new Map(currentTributes.map(t => [t.id, {
      ...t,
      stats: { ...t.stats },
      inventory: [...t.inventory],
      relationships: { ...t.relationships },
      notes: [...t.notes]
  }]));

  const logs: LogEntry[] = [];
  const fallen: Tribute[] = [];
  
  // --- Step 1: Stat Degradation & Relationship Decay ---
  if (phase !== 'Bloodbath') {
    tributesMap.forEach(t => {
      if (t.status === TributeStatus.Dead) return;
      
      // Trait Effects on Stats
      let hungerGain = Math.floor(Math.random() * 10) + 5;
      if (t.traits.includes('Survivalist')) hungerGain -= 3; // Survivalists starve slower
      
      t.stats.hunger += Math.max(0, hungerGain);
      t.stats.exhaustion += phase === 'Day' ? 10 : -20; // Recover sleep at night
      
      // Relationship Decay: Friends drift apart without interaction
      Object.keys(t.relationships).forEach(relId => {
          if (t.relationships[relId] > 10) {
              t.relationships[relId] -= 2; // Slow decay of friendship
          }
      });
      
      // Cap stats
      if (t.stats.exhaustion < 0) t.stats.exhaustion = 0;
      if (t.stats.hunger > 100) t.stats.hunger = 100; // Max hunger
    });
  }

  // --- Step 2: The Director (Aggression Calculation) ---
  let aggressionMultiplier = 1.0;
  if (daysSinceLastDeath > 2) aggressionMultiplier = 3.0; // Boring? Force action.
  if (currentTributes.length < 5) aggressionMultiplier = 2.0; // End game frenzy.
  if (phase === 'Bloodbath') aggressionMultiplier = 1.5;

  // Event Pool Selection
  let basePool: GameEvent[] = [];
  if (phase === 'Bloodbath') basePool = [...bloodbathEvents];
  else if (phase === 'Night') basePool = [...nightEvents, ...fatalEvents];
  else basePool = [...generalEvents, ...fatalEvents];

  // --- Step 3: Action Loop ---
  let aliveIds = shuffle(Array.from(tributesMap.values()).filter(t => t.status === TributeStatus.Alive).map(t => t.id));
  const processedIds = new Set<string>();
  let deathsThisPhase = 0;

  let i = 0;
  while (i < aliveIds.length) {
    const actorId = aliveIds[i];
    if (processedIds.has(actorId)) { i++; continue; }

    const actor = tributesMap.get(actorId)!;

    // --- Grouping Logic based on Needs/Relationships ---
    let groupIds: string[] = [actorId];
    
    // Determine desired interaction type
    let desire: 'Kill' | 'Social' | 'Solo' = 'Solo';
    
    // Check "Urges"
    if (actor.stats.sanity < 20 || actor.stats.hunger > 90) desire = 'Solo'; // Too crazy or hungry to be social, usually
    else if (Math.random() < 0.3 || actor.traits.includes('Friendly') || actor.traits.includes('Charming')) desire = 'Social';
    else if (Math.random() < 0.1 || actor.traits.includes('Ruthless')) desire = 'Kill';

    // Try to find partners based on desire
    if (desire !== 'Solo') {
        // Look ahead in the list for a partner
        for (let j = i + 1; j < aliveIds.length; j++) {
            const targetId = aliveIds[j];
            if (processedIds.has(targetId)) continue;
            
            const target = tributesMap.get(targetId)!;
            const relation = getRelationship(actor, target);

            if (desire === 'Social' && relation >= 0) {
                groupIds.push(targetId);
                if (groupIds.length >= 2) break; // Cap social at 2 for now mostly
            } else if (desire === 'Kill' && relation <= 0) {
                groupIds.push(targetId);
                break; // Max 1 victim for simplified logic usually
            }
        }
    }

    // If we failed to find a group for our desire, we revert to solo or whatever group we found
    const finalGroupSize = groupIds.length;
    const groupActors = groupIds.map(id => tributesMap.get(id)!);

    // --- Event Selection ---
    // Filter events by size
    const possibleEvents = basePool.filter(e => e.playerCount === finalGroupSize);
    
    // Weighted Random Selection
    let totalWeight = 0;
    const weightedEvents = possibleEvents.map(event => {
        const w = calculateEventScore(event, groupActors, phase, aggressionMultiplier);
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
        // Fallback
        chosenEvent = { text: "(P1) wanders around aimlessly.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [] };
        // If group was > 1 but no event matched, split them up (logic simplification: just process leader solo)
        if (finalGroupSize > 1) {
            groupIds = [actorId]; 
            processedIds.add(actorId);
        }
    }
    
    // Mark processed
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
    if (chosenEvent.consumesItem && chosenEvent.itemRequired) {
        chosenEvent.itemRequired.forEach(item => {
            const idx = actors[0].inventory.indexOf(item);
            if (idx > -1) actors[0].inventory.splice(idx, 1);
        });
    }

    // 2. Stats Effect
    if (chosenEvent.tags?.includes('Food')) {
        actors[0].stats.hunger = Math.max(0, actors[0].stats.hunger - 40);
    }
    if (chosenEvent.tags?.includes('Heal')) {
        actors[0].stats.sanity = Math.min(100, actors[0].stats.sanity + 20);
        // Could also abstractly heal injuries here
    }
    if (chosenEvent.tags?.includes('Sleep')) {
        actors[0].stats.exhaustion = 0;
    }
    if (chosenEvent.tags?.includes('Desperate')) {
         // Risky maneuver success - maybe restore sanity a bit?
         actors[0].stats.sanity = Math.min(100, actors[0].stats.sanity + 10);
    }

    // 3. Fatalities & Relationships
    if (chosenEvent.fatalities) {
        deathsThisPhase += chosenEvent.victimIndices.length;
        
        chosenEvent.victimIndices.forEach(vIdx => {
            if (vIdx < actors.length) {
                const v = actors[vIdx];
                v.status = TributeStatus.Dead;
                v.stats.sanity = 0; // Dead people aren't sane
                fallen.push({ ...v });
                deathNames.push(v.name);
            }
        });

        chosenEvent.killerIndices.forEach(kIdx => {
            if (kIdx < actors.length) {
                const k = actors[kIdx];
                k.killCount++;
                // Killing hurts sanity unless ruthless
                if (!k.traits.includes('Ruthless')) {
                    k.stats.sanity -= 20;
                }
            }
        });
    } else {
        // Non-fatal interaction updates relationships
        if (actors.length === 2) {
            const p1 = actors[0];
            const p2 = actors[1];
            if (chosenEvent.tags?.includes('Social') || chosenEvent.tags?.includes('Bond') || chosenEvent.tags?.includes('Heal')) {
                modifyRelationship(p1, p2, 15);
                modifyRelationship(p2, p1, 15);
            } else if (chosenEvent.tags?.includes('Attack') || chosenEvent.tags?.includes('Theft')) {
                modifyRelationship(p2, p1, -40); // P2 hates P1 now
            }
        }
    }

    logs.push({
      id: Math.random().toString(36).substring(7),
      text: parsedText,
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
