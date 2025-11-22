
import { GameEvent, Tribute } from '../types';

// Helper conditions
const isStarving = (t: Tribute) => t.stats.hunger > 80;
const isInsane = (t: Tribute) => t.stats.sanity < 40;
const isExhausted = (t: Tribute) => t.stats.exhaustion > 80;
const isInjured = (t: Tribute) => t.stats.sanity < 60 || t.stats.hunger > 50; 
const isDesperate = (t: Tribute) => t.stats.hunger > 90 || t.stats.sanity < 30;

// --- BLOODBATH ---
export const bloodbathEvents: GameEvent[] = [
  { text: "(P1) runs away from the Cornucopia.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 5.0, tags: ['Flee'] },
  { text: "(P1) grabs a shield leaning against the Cornucopia.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Supply'], itemGain: ['Shield'] },
  { text: "(P1) grabs a backpack, not realizing it is empty.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Supply'] },
  { text: "(P1) throws a knife into (P2)'s chest.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 1.0, tags: ['Kill'] },
  { text: "(P1) strips (P2) of their weapons and supplies.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Theft'] },
  { text: "(P1) and (P2) fight for a bag. (P1) strangles (P2) with the straps.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 1.0, tags: ['Kill'] },
  { text: "(P1) steps off the podium too soon and blows up.", playerCount: 1, fatalities: true, killerIndices: [], victimIndices: [0], weight: 0.05, tags: ['Fail'] },
  { text: "(P1) finds a bow, some arrows, and a quiver.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Supply'], itemGain: ['Bow & Arrows'] },
  { text: "(P1), (P2), and (P3) work together to get as many supplies as possible.", playerCount: 3, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social'] },
  { text: "(P1) kills (P2) with their own weapon.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 0.8, tags: ['Kill'] },
  { text: "(P1) bashes (P2)'s head against a rock.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 0.8, tags: ['Kill'] },
  { text: "(P1) snatches a First Aid Kit from the Cornucopia.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Supply'], itemGain: ['First Aid Kit'] },
  { text: "(P1) finds a crate of explosives.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.5, tags: ['Supply'], itemGain: ['Explosives'] },
  { text: "(P1) grabs a shovel.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Supply'], itemGain: ['Shovel'] },
  { text: "(P1) grabs a bottle of alcohol and a rag.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Supply'], itemGain: ['Molotov Components'] },
  { text: "(P1) finds a canteen full of water.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Supply'] },
  { text: "(P1) falls down and hurts themselves.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Fail'] },
  { text: "(P1) breaks (P2)'s nose for a basket of bread.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Attack', 'Food'] },
];

// --- GENERAL / DAY ---
export const generalEvents: GameEvent[] = [
  // Survival / Fluff
  { text: "(P1) picks flowers.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Idle'] },
  { text: "(P1) travels to higher ground.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Travel'] },
  { text: "(P1) hunts for other tributes.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Hunt'] },
  { text: "(P1) searches for a water source.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Survival'] },
  { text: "(P1) camouflages themselves in the bushes.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Survival', 'Sneak'] },
  { text: "(P1) questions their sanity.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.8, tags: ['Idle', 'Sanity'] },
  { text: "(P1) practices their archery.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Idle'], itemRequired: ['Bow & Arrows'] },
  { text: "(P1) thinks about home.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Idle'] },
  
  // Trait Specific: Survivalist
  { text: "(P1) constructs an elaborate shelter that is hidden from view.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 3.0, tags: ['Survival'], traitRequired: ['Survivalist'] },
  { text: "(P1) easily identifies edible plants, having a great meal.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 3.0, tags: ['Food'], traitRequired: ['Survivalist'] },

  // Trait Specific: Charming
  { text: "(P1) flashes a dazzling smile at a camera, receiving a gift from a sponsor.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 3.0, tags: ['Sponsor', 'Food'], traitRequired: ['Charming'] },
  { text: "(P1) convinces (P2) not to kill them using their charm.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Social', 'Mercy'], traitRequired: ['Charming'] },

  // Item Discovery & Crafting
  { text: "(P1) receives a First Aid Kit from a sponsor.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.5, tags: ['Sponsor'], itemGain: ['First Aid Kit'] },
  { text: "(P1) crafts a crude spear from a fallen branch.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Supply'], itemGain: ['Spear'] },
  { text: "(P1) discovers a hidden cave.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Travel'] },
  { text: "(P1) finds a dead tribute and loots their body.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.5, tags: ['Supply'] },

  // Item Usage
  { text: "(P1) uses their First Aid Kit to treat their wounds.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 10.0, tags: ['Heal'], itemRequired: ['First Aid Kit'], consumesItem: true, condition: (a) => isInjured(a[0]) },
  
  // Resource gathering
  { text: "(P1) finds a fruit tree and eats their fill.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Food'] },
  { text: "(P1) catches a fish in the nearby stream.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Food'] },
  { text: "(P1) receives fresh food from an unknown sponsor.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.5, tags: ['Food', 'Sponsor'] },
  { text: "(P1) steals eggs from a bird's nest.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Food'] },

  // Social
  { text: "(P1) begs for (P2) to kill them. (P2) refuses, keeping (P1) alive.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.5, tags: ['Social', 'Mercy'] },
  { text: "(P1) and (P2) hunt for other tributes.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social', 'Hunt'] },
  { text: "(P1) tends to (P2)'s wounds.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.8, tags: ['Social', 'Heal'] },
  { text: "(P1) and (P2) work together for the day.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social'] },
  { text: "(P1) stalks (P2).", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Hunt'] },
  { text: "(P1) sees smoke rising in the distance, but decides not to investigate.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Travel'] },

  // Starvation / Status
  { text: "(P1) passes out from hunger.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 5.0, tags: ['Starve'], condition: (a) => isStarving(a[0]) },
  { text: "(P1) eats toxic berries in desperation.", playerCount: 1, fatalities: true, killerIndices: [], victimIndices: [0], weight: 2.0, tags: ['Starve'], condition: (a) => isStarving(a[0]) },
  { text: "(P1) drinks tainted water and becomes ill.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Fail'] },
  
  // Insanity
  { text: "(P1) hallucinates that (P2) is a monster and attacks!", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 3.0, tags: ['Insanity'], condition: (a) => isInsane(a[0]) },
  { text: "(P1) screams at the sky, begging for it to end.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Insanity'], condition: (a) => isInsane(a[0]) },
  { text: "(P1) talks to a rock, convinced it is their ally.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Insanity'], condition: (a) => isInsane(a[0]) },

  // --- DESPERATE MEASURES (New) ---
  { text: "(P1), starving, attacks (P2) in a frenzy to steal their supplies!", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 5.0, tags: ['Desperate', 'Attack'], condition: (a) => isDesperate(a[0]) },
  { text: "(P1) eats raw meat from a dead animal out of desperation.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 4.0, tags: ['Desperate', 'Food'], condition: (a) => isDesperate(a[0]) },
  { text: "(P1) chases (P2) for miles, fueled purely by adrenaline and madness.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 4.0, tags: ['Desperate', 'Hunt'], condition: (a) => isDesperate(a[0]) },
  { text: "(P1) eats a handful of unknown mushrooms. They miraculously feel full.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Desperate', 'Food'], condition: (a) => isStarving(a[0]) },
  { text: "(P1) attempts to climb a cliff to reach a bird's nest but falls to their death.", playerCount: 1, fatalities: true, killerIndices: [], victimIndices: [0], weight: 2.0, tags: ['Desperate', 'Accident'], condition: (a) => isDesperate(a[0]) },
];

// --- FATAL ---
export const fatalEvents: GameEvent[] = [
  { text: "(P1) stabs (P2) while (P2)'s back is turned.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 1.0, tags: ['Kill', 'Sneak'] },
  { text: "(P1) ambushes (P2) and kills them.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 1.0, tags: ['Kill', 'Ambush'] },
  { text: "(P1) accidentally steps on a landmine.", playerCount: 1, fatalities: true, killerIndices: [], victimIndices: [0], weight: 0.2, tags: ['Accident'] },
  { text: "(P1) dies from hypothermia.", playerCount: 1, fatalities: true, killerIndices: [], victimIndices: [0], weight: 0.5, tags: ['Elements'] },
  { text: "(P1) falls into a pit and dies.", playerCount: 1, fatalities: true, killerIndices: [], victimIndices: [0], weight: 0.2, tags: ['Accident'] },
  { text: "(P1) tracks down and kills (P2).", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 1.0, tags: ['Kill', 'Hunt'] },
  { text: "(P1) sets (P2) on fire with a molotov.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 0.5, tags: ['Kill', 'Fire'] },
  { text: "(P1), (P2), and (P3) get into a fight. (P1) kills them both.", playerCount: 3, fatalities: true, killerIndices: [0], victimIndices: [1, 2], weight: 0.3, tags: ['Kill', 'Multi'] },
  { text: "(P1) severely injures (P2) and leaves them to die.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 0.8, tags: ['Kill', 'Cruel'] },
  { text: "(P1) pushes (P2) off a cliff during a struggle.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 0.8, tags: ['Kill', 'Environment'] },
  { text: "(P1) strangles (P2) with a rope.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 0.8, tags: ['Kill'] },
  { text: "(P1) bleeds out from untreated injuries.", playerCount: 1, fatalities: true, killerIndices: [], victimIndices: [0], weight: 2.0, tags: ['Death'], condition: (a) => isInjured(a[0]) },

  // Weapon Specific
  { text: "(P1) shoots an arrow into (P2)'s head.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 5.0, tags: ['Kill'], itemRequired: ['Bow & Arrows'] },
  { text: "(P1) throws a spear into (P2)'s chest.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 5.0, tags: ['Kill'], itemRequired: ['Spear'] },
  { text: "(P1) detonates explosives, killing (P2) and (P3) instantly.", playerCount: 3, fatalities: true, killerIndices: [0], victimIndices: [1, 2], weight: 10.0, tags: ['Kill', 'Explosive'], itemRequired: ['Explosives'], consumesItem: true },
  { text: "(P1) bashes (P2) with a shovel.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 5.0, tags: ['Kill'], itemRequired: ['Shovel'] },

  // Trait Specific Kills
  { text: "(P1) mercilessly snaps (P2)'s neck.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 3.0, tags: ['Kill'], traitRequired: ['Ruthless'] },
  { text: "(P1), in a fit of insanity, mistakes (P2) for a dummy and dismembers them.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 3.0, tags: ['Kill'], traitRequired: ['Unstable'] },
  
  // Desperate Kills
  { text: "(P1) overpowers (P2) in a frenzy, killing them for their backpack.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 5.0, tags: ['Kill', 'Desperate'], condition: (a) => isDesperate(a[0]) },
];

// --- NIGHT ---
export const nightEvents: GameEvent[] = [
  { text: "(P1) goes to sleep.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Sleep'] },
  { text: "(P1) starts a fire.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Camp'] },
  { text: "(P1) screams for help.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.5, tags: ['Fear'] },
  { text: "(P1) passes out from exhaustion.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 5.0, tags: ['Sleep'], condition: (a) => isExhausted(a[0]) },
  { text: "(P1) and (P2) tell stories about themselves to each other.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social'] },
  { text: "(P1) quietly hums.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.5, tags: ['Idle'] },
  { text: "(P1) climbs a tree to rest.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Sleep'] },
  { text: "(P1) stabs (P2) in their sleep.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 1.5, tags: ['Kill', 'Sneak'], traitRequired: ['Ruthless'] },
  { text: "(P1) cries themselves to sleep.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Sadness'] },
  { text: "(P1) stays awake all night.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Insomnia'] },
  { text: "(P1) tries to treat their infection.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Heal'], condition: (a) => isInjured(a[0]) },
  { text: "(P1) and (P2) huddle for warmth.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social'] },
  { text: "(P1) sees a fire in the distance but stays put.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Caution'] },
  { text: "(P1) loses their grip on reality.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Insanity'], condition: (a) => isInsane(a[0]) },
];
