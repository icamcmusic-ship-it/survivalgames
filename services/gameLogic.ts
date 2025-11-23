

import { Tribute, TributeStatus, GameEvent, LogEntry, EventType, Trait, WeatherType } from '../types';
import { bloodbathEvents, bloodbathDeathEvents, generalEvents, fatalEvents, nightEvents, arenaEvents, trainingEvents, feastEvents } from '../data/events';

// --- Config ---
const TRAITS: Trait[] = ['Ruthless', 'Survivalist', 'Coward', 'Friendly', 'Unstable', 'Charming', 'Trained', 'Underdog', 'Stoic', 'Devious', 'Clumsy', 'Sharpshooter', 'Naive', 'Glutton', 'Traumatized', 'Broken'];

const ITEM_VALUES: Record<string, number> = {
    'Explosives': 30, 'Gun': 25, 'Ammo': 10, 'Scythe': 20, 'Bow': 20, 'Arrows': 10, 'Sword': 18, 'Spear': 16, 'Trident': 16, 'Axe': 15, 'Knife': 12, 'Machete': 12, 'Antidote': 20, 'First Aid Kit': 15, 'Bandages': 10, 'Shield': 12, 'Molotov Components': 12, 'Shovel': 8, 'Bread': 6, 'Backpack': 5, 'Water': 5, 'Food': 4, 'Rope': 3, 'Wire': 3, 'Sheet Plastic': 2, 'Rock': 1, 'Stick': 0
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
          if (t1.allianceId && t1.allianceId === t2.allianceId) t1.relationships[t2.id] = 60;
          else if (t1.district === t2.district) t1.relationships[t2.id] = 40;
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

const moveTribute = (t: Tribute, target?: {q: number, r: number}) => {
    const directions = [
        {q: 1, r: 0}, {q: 1, r: -1}, {q: 0, r: -1},
        {q: -1, r: 0}, {q: -1, r: 1}, {q: 0, r: 1}
    ];
    
    // Boundary check (radius 5)
    const isValid = (q: number, r: number) => Math.abs(q) <= 5 && Math.abs(r) <= 5 && Math.abs(q+r) <= 5;
    
    let bestDir = directions[Math.floor(Math.random() * directions.length)];

    if (target) {
        // Find direction that minimizes distance
        let minDst = 999;
        const currentDist = (Math.abs(t.coordinates.q - target.q) + Math.abs(t.coordinates.q + t.coordinates.r - (target.q + target.r)) + Math.abs(t.coordinates.r - target.r)) / 2;
        
        for (const d of directions) {
             const nq = t.coordinates.q + d.q;
             const nr = t.coordinates.r + d.r;
             if (isValid(nq, nr)) {
                 const dst = (Math.abs(nq - target.q) + Math.abs(nq + nr - (target.q + target.r)) + Math.abs(nr - target.r)) / 2;
                 if (dst < minDst) {
                     minDst = dst;
                     bestDir = d;
                 }
             }
        }
    } else {
        // Random wander but avoid walking off map
        let attempts = 0;
        while (!isValid(t.coordinates.q + bestDir.q, t.coordinates.r + bestDir.r) && attempts < 10) {
            bestDir = directions[Math.floor(Math.random() * directions.length)];
            attempts++;
        }
    }

    t.coordinates.q += bestDir.q;
    t.coordinates.r += bestDir.r;
};

const getWeaponPower = (t: Tribute): number => {
    let power = 0;
    t.inventory.forEach(item => {
        power = Math.max(power, ITEM_VALUES[item] || 0);
    });
    return power;
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
      
      // Weapon Advantage
      if (actors.length > 1) {
          const p1Power = getWeaponPower(main);
          const p2Power = getWeaponPower(actors[1]);
          if (p1Power > p2Power + 5) score *= 2.0; // Significant advantage
          if (p1Power < p2Power - 5) score *= 0.1; // Suicidal to attack
      }

      if (main.traits.includes('Ruthless')) score *= 2.0;
      if (main.stats.sanity < 30) score *= 2.0;
      
      // Relationship checks for kill
      if (actors.length > 1 && actors[1]) {
          const rel = main.relationships[actors[1].id] || 0;
          if (rel > 50 && main.stats.sanity > 30) score *= 0.01; // Don't kill friends unless crazy
          if (rel < -20) score *= 2.5; // Prefer enemies
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

  // Weather Impact on Scoring
  if (weather === 'Rain' && event.tags?.includes('Shelter')) score *= 2.0;
  if (weather === 'Storm' && event.tags?.includes('Travel')) score *= 0.5; // Less travel in storm
  if (weather === 'Fog' && event.tags?.includes('Hunt')) score *= 0.5; // Hard to hunt in fog
  
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
        
        // Weather Damage
        if (currentWeather === 'Storm' && phase === 'Day' && Math.random() < 0.1) {
            t.stats.health -= 5; // Debris/Wind
        }
        if (currentWeather === 'Heatwave' && phase === 'Day') {
            t.stats.hunger += 10; // Thirst simulated as hunger
            if (Math.random() < 0.2) t.stats.exhaustion += 10;
        }
        if (currentWeather === 'Rain' && phase === 'Night' && Math.random() < 0.3) {
            t.stats.health -= 2; // Hypothermia
        }

        // Hunger & Exhaustion
        t.stats.hunger += (Math.random() * 8 + 4);
        t.stats.exhaustion += (phase === 'Day' ? 8 : -25); // Recover at night
        
        // Passive Recovery
        if (phase === 'Night') {
             if (t.stats.exhaustion < 0) {
                 // Good sleep
                 t.stats.sanity += 5;
                 t.stats.health += 5;
             }
             if (t.stats.health < 100 && t.stats.hunger < 50 && t.inventory.includes('First Aid Kit')) {
                 // Auto-use kit at night if injured
                 t.stats.health += 30;
                 const idx = t.inventory.indexOf('First Aid Kit');
                 if (idx > -1) t.inventory.splice(idx, 1);
                 logs.push({
                     id: crypto.randomUUID(),
                     text: `${t.name} uses a First Aid Kit to patch up wounds during the night.`,
                     type: EventType.Night, day, phase, relatedTributeIds: [t.id]
                 });
             }
        }
        
        // Inventory Cap (Drop random items if > 5)
        if (t.inventory.length > 5) {
            // Prefer keeping weapons/food
            const dropIdx = Math.floor(Math.random() * t.inventory.length);
            t.inventory.splice(dropIdx, 1);
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

      // 1. Try Alliance (High priority if nearby)
      if (actor.allianceId) {
          const allies = queue
            .map(id => tributesMap.get(id)!)
            .filter(t => t.allianceId === actor.allianceId && !processedThisTurn.has(t.id) && getDistance(actor, t) <= 1)
            .slice(0, maxGroupSize - 1);
          allies.forEach(a => {
              group.push(a);
              processedThisTurn.add(a.id);
              const idx = queue.indexOf(a.id);
              if (idx > -1) queue.splice(idx, 1);
          });
      }

      // 2. Proximity Checking (Hex Grid Logic)
      if (group.length < maxGroupSize) {
          // Filter valid neighbors from queue
          const neighbors = queue
            .map(id => tributesMap.get(id)!)
            .filter(t => !processedThisTurn.has(t.id));
          
          // Sort neighbors by actual distance + Relationship Bias
          neighbors.sort((a, b) => {
              const distA = getDistance(actor, a);
              const distB = getDistance(actor, b);
              // Closer is better
              if (distA !== distB) return distA - distB;
              // Relationship tie-breaker
              return Math.abs(actor.relationships[b.id] || 0) - Math.abs(actor.relationships[a.id] || 0);
          });
          
          // Only pick if distance <= 2 (Visibility range)
          // Exception: Bloodbath (distance irrelevant)
          const range = phase === 'Bloodbath' ? 999 : 2;

          while (group.length < maxGroupSize && neighbors.length > 0) {
              const neighbor = neighbors.shift()!;
              if (getDistance(actor, neighbor) > range && Math.random() > 0.1) continue; // 10% chance to spot far away
              
              group.push(neighbor);
              processedThisTurn.add(neighbor.id);
              const idx = queue.indexOf(neighbor.id);
              if (idx > -1) queue.splice(idx, 1);
          }
      }
      
      processedThisTurn.add(actorId);

      // --- Event Selection ---
      let chosenEvent: GameEvent | null = null;
      
      // Retry loop for group downsizing
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
              if (group.length > 1) {
                  const removed = group.pop()!;
                  processedThisTurn.delete(removed.id);
                  queue.push(removed.id); // Put back in pool
              } else {
                  // Fallback for 1 person
                  chosenEvent = { text: "(P1) survives another hour.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1 };
              }
          }
      }

      // --- Event Execution ---
      if (chosenEvent) {
          // Movement
          if (chosenEvent.movement) {
              if (chosenEvent.tags?.includes('Hunt') && group.length === 1) {
                  // Find nearest enemy
                  let target: Tribute | undefined;
                  let minDist = 999;
                  tributesMap.forEach(t => {
                      if (t.id !== group[0].id && t.status === TributeStatus.Alive) {
                          const d = getDistance(group[0], t);
                          if (d < minDist) { minDist = d; target = t; }
                      }
                  });
                  moveTribute(group[0], target?.coordinates);
              } else {
                  group.forEach(t => moveTribute(t));
              }
          }

          // Items
          if (chosenEvent.itemGain) group[0].inventory.push(...chosenEvent.itemGain);
          
          // Robust Item Consumption
          if (chosenEvent.consumesItem) {
             const itemsToRemove = Array.isArray(chosenEvent.consumesItem) 
                ? chosenEvent.consumesItem 
                : (chosenEvent.itemRequired || []);
             
             itemsToRemove.forEach(item => {
                 const idx = group[0].inventory.indexOf(item);
                 if (idx > -1) group[0].inventory.splice(idx, 1);
             });
          }

          // Damage
          if (chosenEvent.healthDamage) {
              const targets = chosenEvent.playerCount > 1 ? group : [group[0]];
              targets.forEach(t => {
                  t.stats.health -= chosenEvent!.healthDamage!;
                  if (t.stats.health <= 0 && !chosenEvent!.fatalities) {
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
                      // Prevent self-kill unless suicide tag
                      if (killer && killer.id === victim.id && !chosenEvent?.tags?.includes('Suicide') && !chosenEvent?.tags?.includes('Fail')) {
                          return; 
                      }

                      victim.status = TributeStatus.Dead;
                      victim.stats.health = 0;
                      victim.deathCause = resolveEventTextPlain(chosenEvent!.text, group);
                      
                      if (killer && killer.id !== victim.id) {
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
               // Relationship effects
               if (chosenEvent.tags?.includes('Social')) {
                   modifyRelationship(group[0], group[1], 5);
                   modifyRelationship(group[1], group[0], 5);
               } else if (chosenEvent.tags?.includes('Attack') || chosenEvent.tags?.includes('Theft')) {
                   modifyRelationship(group[0], group[1], -15);
                   modifyRelationship(group[1], group[0], -25);
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

  // --- Cleanup: Arena Events ---
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
                 // Shelter checks
                 if (ae.type === 'Weather' && t.traits.includes('Survivalist')) return; // Safe

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