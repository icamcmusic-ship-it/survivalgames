

import { Tribute, TributeStatus, GameEvent, LogEntry, EventType, Trait, WeatherType } from '../types';
import { bloodbathEvents, bloodbathDeathEvents, generalEvents, fatalEvents, nightEvents, arenaEvents, trainingEvents, feastEvents } from '../data/events';

// --- Config ---
const TRAITS: Trait[] = ['Ruthless', 'Survivalist', 'Coward', 'Friendly', 'Unstable', 'Charming', 'Trained', 'Underdog', 'Stoic', 'Devious', 'Clumsy', 'Sharpshooter', 'Naive', 'Glutton', 'Traumatized', 'Broken'];

const ITEM_VALUES: Record<string, number> = {
    'Explosives': 20, 'Gun': 18, 'Ammo': 8, 'Scythe': 16, 'Bow': 15, 'Arrows': 8, 'Sword': 15, 'Spear': 14, 'Trident': 14, 'Axe': 13, 'Knife': 12, 'Machete': 12, 'Antidote': 16, 'First Aid Kit': 10, 'Bandages': 10, 'Shield': 8, 'Molotov Components': 8, 'Shovel': 7, 'Bread': 6, 'Backpack': 5, 'Water': 5, 'Food': 4, 'Rope': 3, 'Wire': 3, 'Sheet Plastic': 2, 'Rock': 1, 'Stick': 0
};

// --- Initialization ---
const getRandomTraits = (district: number): Trait[] => {
  if ([1, 2, 4].includes(district)) return Math.random() < 0.7 ? ['Trained', 'Ruthless'] : ['Trained', 'Charming']; 
  if ([11, 12].includes(district)) return Math.random() < 0.6 ? ['Underdog', 'Survivalist'] : ['Underdog', 'Coward'];
  const num = Math.random() > 0.7 ? 2 : 1;
  const shuffled = [...TRAITS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
};

export const calculateSimulatedOdds = (targetTribute: Tribute, allTributes: Tribute[], simulations = 600): string => {
    let wins = 0;
    for (let i = 0; i < simulations; i++) {
        let roster = allTributes.map(t => {
            if (t.status === TributeStatus.Dead) return { id: t.id, power: 0, alive: false };
            let power = 50 + t.stats.weaponSkill + (t.trainingScore / 2);
            if (t.stats.health < 40) power -= 20;
            if (t.stats.hunger > 80) power -= 10;
            if (t.inventory.some(it => ITEM_VALUES[it] > 10)) power += 15;
            if (t.traits.includes('Trained')) power += 20;
            if (t.traits.includes('Ruthless')) power += 25;
            return { id: t.id, power: Math.max(1, power), alive: true };
        });
        let activeCount = roster.filter(r => r.alive).length;
        if (activeCount === 0) continue; 
        while (activeCount > 1) {
            let idx1 = Math.floor(Math.random() * roster.length);
            while (!roster[idx1].alive) idx1 = Math.floor(Math.random() * roster.length);
            let idx2 = Math.floor(Math.random() * roster.length);
            while (idx2 === idx1 || !roster[idx2].alive) idx2 = Math.floor(Math.random() * roster.length);
            
            // Simple clash
            if (Math.random() * (roster[idx1].power + roster[idx2].power) < roster[idx1].power) {
                roster[idx2].alive = false; roster[idx1].power += 5;
            } else {
                roster[idx1].alive = false; roster[idx2].power += 5;
            }
            activeCount--;
        }
        if (roster.find(r => r.alive)?.id === targetTribute.id) wins++;
    }
    const winRate = wins / simulations;
    if (winRate >= 0.30) return "Evens";
    if (winRate >= 0.20) return "2/1";
    if (winRate >= 0.15) return "3/1";
    if (winRate >= 0.10) return "5/1";
    if (winRate >= 0.05) return "10/1";
    if (winRate >= 0.02) return "25/1";
    return "50/1";
};

export const recalculateAllOdds = (tributes: Tribute[]): Tribute[] => {
    return tributes.map(t => ({ ...t, odds: calculateSimulatedOdds(t, tributes) }));
};

export const generateTributes = (): Tribute[] => {
  const tributes: Tribute[] = [];
  const careerAllianceId = `alliance-career-pack`;
  for (let i = 1; i <= 12; i++) {
    const isCareer = [1, 2, 4].includes(i);
    // Spiral placement
    const dir = (i / 12) * 2 * Math.PI;
    const q = Math.round(3 * Math.cos(dir));
    const r = Math.round(3 * Math.sin(dir));
    
    ['M', 'F'].forEach(gender => {
        const id = `d${i}_${gender.toLowerCase()}`;
        tributes.push({
            id, name: `District ${i} ${gender === 'M' ? 'Male' : 'Female'}`,
            district: i, gender: gender as 'M' | 'F',
            age: Math.floor(Math.random() * 7) + 12,
            status: TributeStatus.Alive, killCount: 0, inventory: [],
            allianceId: isCareer ? careerAllianceId : undefined,
            coordinates: { q, r },
            stats: { sanity: 100, hunger: 0, exhaustion: 0, health: 100, weaponSkill: isCareer ? 20 : 0 },
            traits: getRandomTraits(i),
            relationships: {}, notes: [], odds: "TBD", trainingScore: 0
        });
    });
  }
  // Initial Relationships
  tributes.forEach(t1 => {
      tributes.forEach(t2 => {
          if (t1.id === t2.id) return;
          if (t1.allianceId && t1.allianceId === t2.allianceId) t1.relationships[t2.id] = 50;
          else if (t1.district === t2.district) t1.relationships[t2.id] = 30;
          else t1.relationships[t2.id] = 0;
      });
  });
  return recalculateAllOdds(tributes);
};

// --- Helpers ---
const shuffle = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

const getDistance = (t1: Tribute, t2: Tribute): number => {
    const dq = t1.coordinates.q - t2.coordinates.q;
    const dr = t1.coordinates.r - t2.coordinates.r;
    return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
};

const parseEventText = (text: string, actors: Tribute[], eventTags: string[] = []): string => {
  let result = text;
  actors.forEach((actor, index) => {
    const placeholder = `(P${index + 1})`;
    const isDesperate = actor.stats.hunger > 90 || actor.stats.sanity < 30 || actor.stats.health < 30;
    const extraClass = isDesperate ? 'text-red-400' : 'text-gold';
    // Escape regex special characters in placeholder just in case
    const safePlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    result = result.replace(new RegExp(safePlaceholder, 'g'), 
      `<span class="font-bold ${extraClass} group relative cursor-help">
        ${actor.name}
        <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-max bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
          ${actor.traits.join(', ')} (${actor.stats.health} HP)
        </span>
      </span>`);
  });
  return result;
};

const resolveEventTextPlain = (text: string, actors: Tribute[]): string => {
  let result = text;
  actors.forEach((actor, index) => result = result.split(`(P${index + 1})`).join(actor.name));
  return result;
};

const modifyRelationship = (from: Tribute, to: Tribute, amount: number) => {
  const current = from.relationships[to.id] || 0;
  from.relationships[to.id] = Math.max(-100, Math.min(100, current + amount));
};

const clampStats = (t: Tribute) => {
    t.stats.health = Math.max(0, Math.min(100, t.stats.health));
    t.stats.hunger = Math.max(0, Math.min(100, t.stats.hunger));
    t.stats.sanity = Math.max(0, Math.min(100, t.stats.sanity));
    t.stats.exhaustion = Math.max(0, Math.min(100, t.stats.exhaustion));
    t.stats.weaponSkill = Math.max(0, Math.min(100, t.stats.weaponSkill));
};

// --- Scoring ---
const calculateEventScore = (event: GameEvent, actors: Tribute[], phase: string, aggressionMultiplier: number, weather: WeatherType): number => {
  const main = actors[0];
  
  // Hard Constraints
  if (event.playerCount !== actors.length) return 0;
  if (event.itemRequired && !event.itemRequired.every(i => main.inventory.includes(i))) return 0;
  if (event.traitRequired && !event.traitRequired.some(t => main.traits.includes(t))) return 0;
  if (event.condition && !event.condition(actors)) return 0;

  let score = event.weight || 1.0;

  // Context Multipliers
  if (event.fatalities || event.tags?.includes('Kill') || event.tags?.includes('Attack')) {
      score *= aggressionMultiplier;
      if (main.traits.includes('Ruthless')) score *= 2.0;
      if (main.stats.sanity < 30) score *= 2.0;
      
      // Relationship checks for kill
      if (actors.length > 1 && actors[1]) {
          const rel = main.relationships[actors[1].id] || 0;
          if (rel > 50 && main.stats.sanity > 30) score *= 0.01; // Don't kill friends unless crazy
          if (rel < -20) score *= 2.0; // Prefer enemies
      }
  }

  if (event.tags?.includes('Social')) {
      if (actors.length > 1 && actors[1]) {
           const rel = main.relationships[actors[1].id] || 0;
           if (rel < -20) score *= 0.1; // Don't chat with enemies
           if (rel > 20) score *= 1.5;
      }
      if (main.traits.includes('Friendly')) score *= 1.5;
  }

  // Needs
  if (event.tags?.includes('Food')) score *= (1 + main.stats.hunger / 25);
  if (event.tags?.includes('Sleep')) score *= (1 + main.stats.exhaustion / 25);
  if (event.tags?.includes('Heal') && main.stats.health < 60) score *= 3.0;

  // Weather
  if (weather === 'Rain' && event.tags?.includes('Shelter')) score *= 2.0;
  
  return score;
};

// --- Training Phase ---
export const simulateTraining = (currentTributes: Tribute[]): { updatedTributes: Tribute[], logs: LogEntry[] } => {
    const logs: LogEntry[] = [];
    // Create map for reference
    const tributesMap = new Map(currentTributes.map(t => [t.id, JSON.parse(JSON.stringify(t))])); 
    const tributes = Array.from(tributesMap.values());
    
    // Everyone gets to do something
    let queue = shuffle(tributes.map(t => t.id));
    const processed = new Set<string>();

    while (queue.length > 0) {
        const actorId = queue.pop()!;
        if (processed.has(actorId)) continue;

        const actor = tributesMap.get(actorId);
        const group = [actor];
        processed.add(actorId);

        // Chance to interact with others
        if (queue.length > 0 && Math.random() < 0.4) {
            const partnerId = queue.pop()!;
            const partner = tributesMap.get(partnerId);
            group.push(partner);
            processed.add(partnerId);
        }

        const validEvents = trainingEvents.filter(e => e.playerCount === group.length);
        const event = validEvents[Math.floor(Math.random() * validEvents.length)] || trainingEvents[0]; // Fallback

        // Apply Stats
        group.forEach(t => {
            if (event.tags?.includes('Skill')) {
                t.stats.weaponSkill += 5; 
                t.trainingScore += 10;
            }
            if (event.tags?.includes('Social') && group.length > 1) {
                group.forEach(other => { if (t.id !== other.id) modifyRelationship(t, other, 5); });
            }
            clampStats(t);
        });

        logs.push({
            id: crypto.randomUUID(),
            text: parseEventText(event.text, group),
            type: EventType.Training,
            day: 0,
            phase: 'Training',
            relatedTributeIds: group.map(t => t.id)
        });
    }
    
    return { updatedTributes: Array.from(tributesMap.values()), logs };
};

// --- Main Phase Simulation ---
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
): { updatedTributes: Tribute[], logs: LogEntry[], fallen: Tribute[], deathsInPhase: number } => {

  const tributesMap = new Map(currentTributes.map(t => [t.id, JSON.parse(JSON.stringify(t))])); 
  const logs: LogEntry[] = [];
  const fallen: Tribute[] = [];
  let deathsInPhase = 0;

  // --- Pre-Phase Logic (Stats & Weather) ---
  if (phase !== 'Bloodbath') {
    tributesMap.forEach(t => {
        if (t.status === TributeStatus.Dead) return;
        
        // Hunger & Exhaustion
        t.stats.hunger += (Math.random() * 10 + 5) + (currentWeather === 'Heatwave' ? 5 : 0);
        t.stats.exhaustion += (phase === 'Day' ? 10 : -20); // Recover at night
        
        if (phase === 'Night' && t.stats.exhaustion < 0) {
            t.stats.sanity += 5; // Good sleep helps sanity
            t.stats.health += 5;
        }
        
        clampStats(t);
    });
  }

  // --- Aggression Calculation ---
  let aggression = fatalityRate;
  const aliveCount = Array.from(tributesMap.values()).filter(t => t.status === TributeStatus.Alive).length;
  
  if (phase === 'Bloodbath') aggression = 5.0;
  else if (daysSinceLastDeath > 2) aggression *= 2.5; // Boring game fixer
  else if (aliveCount <= 4) aggression *= 3.0; // Finale
  
  if (day > maxDays) aggression *= 10.0; // Sudden death

  // --- Event Pool Selection ---
  let pool: GameEvent[] = [];
  if (phase === 'Bloodbath') pool = [...bloodbathEvents, ...bloodbathDeathEvents];
  else if (phase === 'Night') pool = [...nightEvents, ...fatalEvents.filter(e => e.tags?.includes('Sneak'))];
  else pool = [...generalEvents, ...fatalEvents];

  // --- Action Loop (Turn-Based Queue) ---
  let queue = shuffle(Array.from(tributesMap.values()).filter(t => t.status === TributeStatus.Alive).map(t => t.id));
  const processedThisTurn = new Set<string>();

  while (queue.length > 0) {
      const actorId = queue.pop();
      if (!actorId || processedThisTurn.has(actorId)) continue;

      const actor = tributesMap.get(actorId)!;
      
      // Stamina Check: If too exhausted, they just sleep/rest (skip turn)
      if (actor.stats.exhaustion > 90 && phase !== 'Bloodbath') {
          logs.push({ 
              id: crypto.randomUUID(), 
              text: `${actor.name} collapses from exhaustion and sleeps through the chaos.`, 
              type: phase === 'Night' ? EventType.Night : EventType.Day,
              day, phase, relatedTributeIds: [actor.id]
          });
          actor.stats.exhaustion = 0;
          processedThisTurn.add(actorId);
          continue;
      }

      // --- Group Formation ---
      const group: Tribute[] = [actor];
      const maxGroupSize = Math.floor(Math.random() * 3) + 2; // 2 to 4

      // 1. Try Alliance
      if (actor.allianceId) {
          const allies = queue
            .map(id => tributesMap.get(id)!)
            .filter(t => t.allianceId === actor.allianceId && !processedThisTurn.has(t.id))
            .slice(0, maxGroupSize - 1);
          allies.forEach(a => {
              group.push(a);
              processedThisTurn.add(a.id);
              // Remove from queue
              const idx = queue.indexOf(a.id);
              if (idx > -1) queue.splice(idx, 1);
          });
      }

      // 2. If still room, try Proximity/Random
      if (group.length < maxGroupSize) {
          // Filter valid neighbors from queue
          const neighbors = queue
            .map(id => tributesMap.get(id)!)
            .filter(t => !processedThisTurn.has(t.id) && getDistance(actor, t) <= 1);
          
          // Sort neighbors by relationship (Friends or Enemies preferred over neutral)
          neighbors.sort((a, b) => Math.abs(actor.relationships[b.id] || 0) - Math.abs(actor.relationships[a.id] || 0));

          while (group.length < maxGroupSize && neighbors.length > 0) {
              const neighbor = neighbors.shift()!;
              group.push(neighbor);
              processedThisTurn.add(neighbor.id);
              const idx = queue.indexOf(neighbor.id);
              if (idx > -1) queue.splice(idx, 1);
          }
      }
      
      processedThisTurn.add(actorId);

      // --- Event Selection ---
      // Try to find an event for the current group size. If fails, pop a member and try smaller size.
      let chosenEvent: GameEvent | null = null;
      
      while (group.length > 0 && !chosenEvent) {
          const possibleEvents = pool.filter(e => e.playerCount === group.length);
          
          // Weighted Random Choice
          let totalWeight = 0;
          const weighted = possibleEvents.map(e => {
              const w = calculateEventScore(e, group, phase, aggression, currentWeather);
              totalWeight += w;
              return { e, w };
          }).filter(i => i.w > 0);

          if (weighted.length > 0) {
              let r = Math.random() * totalWeight;
              for (const item of weighted) {
                  r -= item.w;
                  if (r <= 0) {
                      chosenEvent = item.e;
                      break;
                  }
              }
          }

          if (!chosenEvent) {
              // If no event found for this group size, remove the last added member (unless it's the actor)
              // and return them to the queue (unless it's the actor)
              if (group.length > 1) {
                  const removed = group.pop()!;
                  processedThisTurn.delete(removed.id);
                  queue.push(removed.id); // Put back in pool
              } else {
                  // Desperate fallback for 1 person
                  chosenEvent = { text: "(P1) survives another hour.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1 };
              }
          }
      }

      // --- Event Execution ---
      if (chosenEvent) {
          // Items
          if (chosenEvent.itemGain) group[0].inventory.push(...chosenEvent.itemGain);
          if (chosenEvent.consumesItem && chosenEvent.itemRequired) {
             chosenEvent.itemRequired.forEach(i => {
                 const idx = group[0].inventory.indexOf(i);
                 if (idx > -1) group[0].inventory.splice(idx, 1);
             });
          }

          // Damage
          if (chosenEvent.healthDamage) {
              const targets = chosenEvent.playerCount > 1 ? group : [group[0]];
              targets.forEach(t => {
                  t.stats.health -= chosenEvent!.healthDamage!;
                  if (t.stats.health <= 0 && !chosenEvent!.fatalities) {
                       // Accidental death logic
                       t.status = TributeStatus.Dead;
                       t.deathCause = "Succumbed to injuries";
                       fallen.push({...t});
                       deathsInPhase++;
                  }
              });
          }

          // Fatalities
          const deathNames: string[] = [];
          if (chosenEvent.fatalities) {
              const killer = chosenEvent.killerIndices.length > 0 ? group[chosenEvent.killerIndices[0]] : null;
              
              chosenEvent.victimIndices.forEach(vIdx => {
                  if (group[vIdx]) {
                      const victim = group[vIdx];
                      victim.status = TributeStatus.Dead;
                      victim.stats.health = 0;
                      victim.deathCause = resolveEventTextPlain(chosenEvent!.text, group);
                      if (killer) {
                          victim.killerId = killer.id;
                          victim.killerName = killer.name;
                          killer.killCount++;
                          killer.inventory.push(...victim.inventory); // Loot
                          victim.inventory = [];
                      }
                      fallen.push({...victim});
                      deathNames.push(victim.name);
                      deathsInPhase++;
                  }
              });
          } else if (group.length > 1) {
               // Relationship effects for non-fatal interactions
               if (chosenEvent.tags?.includes('Social')) {
                   modifyRelationship(group[0], group[1], 10);
                   modifyRelationship(group[1], group[0], 10);
               } else if (chosenEvent.tags?.includes('Attack') || chosenEvent.tags?.includes('Theft')) {
                   modifyRelationship(group[0], group[1], -20);
                   modifyRelationship(group[1], group[0], -40);
               }
          }

          // Logging
          logs.push({
              id: crypto.randomUUID(),
              text: parseEventText(chosenEvent.text, group),
              type: phase === 'Bloodbath' ? EventType.Bloodbath : (phase === 'Night' ? EventType.Night : EventType.Day),
              day, phase,
              deathNames: deathNames.length > 0 ? deathNames : undefined,
              relatedTributeIds: group.map(t => t.id)
          });
      }
  }

  // --- Cleanup: Arena Events (Global) ---
  // Small chance for global event *after* individual turns
  if (phase === 'Day' && Math.random() < 0.15) {
      const ae = arenaEvents[Math.floor(Math.random() * arenaEvents.length)];
      logs.push({ 
          id: `arena-${day}`, 
          text: `<span class="text-red-500 font-bold">ARENA EVENT:</span> ${ae.text}`, 
          type: EventType.Arena, day, phase 
      });
      if (ae.damage) {
          tributesMap.forEach(t => {
             if (t.status === TributeStatus.Alive) {
                 t.stats.health -= ae.damage!;
                 if (t.stats.health <= 0) {
                     t.status = TributeStatus.Dead;
                     t.deathCause = "Arena Event";
                     fallen.push({...t});
                     deathsInPhase++;
                     logs.push({ id: `ae-death-${t.id}`, text: `${t.name} died from the arena event.`, type: EventType.Arena, day, phase, deathNames: [t.name] });
                 }
             }
          });
      }
  }

  return { updatedTributes: Array.from(tributesMap.values()), logs, fallen, deathsInPhase };
};