import { GameEvent, Tribute } from '../types';

// Helper conditions
const isStarving = (t: Tribute) => t.stats.hunger > 80;
const isInsane = (t: Tribute) => t.stats.sanity < 40;
const isExhausted = (t: Tribute) => t.stats.exhaustion > 80;
const isInjured = (t: Tribute) => t.stats.health < 60 || t.stats.sanity < 60; 
const isDesperate = (t: Tribute) => t.stats.hunger > 90 || t.stats.sanity < 30 || t.stats.health < 30;

// --- TRAINING EVENTS ---
export const trainingEvents: GameEvent[] = [
  { text: "(P1) practices their aim at the archery range.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Skill', 'Bow'] },
  { text: "(P1) lifts weights to build strength.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Skill', 'Strength'] },
  { text: "(P1) studies edible plants in the survival station.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Skill', 'Survival'] },
  { text: "(P1) works on camouflage techniques.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Skill', 'Stealth'] },
  { text: "(P1) and (P2) spar with wooden swords.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Skill', 'Social', 'Combat'] },
  { text: "(P1) and (P2) share a meal and discuss their districts.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Social'] },
  { text: "(P1) tries to intimidate (P2) during training.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social', 'Intimidate'] },
  { text: "(P1) shows off their skills to the Gamemakers.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Skill', 'Showoff'] },
  { text: "(P1) sits in the corner, observing the others.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Idle'] },
  { text: "(P1) and (P2) form a temporary pact.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social', 'Alliance'] },
  // New
  { text: "(P1), (P2), and (P3) form a temporary pyramid to reach a high ledge.", playerCount: 3, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Social', 'Skill'] },
  { text: "(P1) instructs (P2) and (P3) on how to tie knots.", playerCount: 3, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Skill', 'Education'] },
  { text: "(P1), (P2), (P3) and (P4) play a card game in the corner.", playerCount: 4, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Social', 'Idle'] },
];

// --- BLOODBATH SUPPLY (Low Lethality) ---
export const bloodbathEvents: GameEvent[] = [
  { text: "(P1) runs away from the Cornucopia.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 5.0, tags: ['Flee', 'Travel'] },
  { text: "(P1) grabs a shield leaning against the Cornucopia.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Supply'], itemGain: ['Shield'] },
  { text: "(P1) grabs a backpack, not realizing it is empty.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Supply'] },
  { text: "(P1) strips (P2) of their weapons and supplies.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Theft'] },
  { text: "(P1) finds a bow and a quiver of arrows.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Supply'], itemGain: ['Bow', 'Arrows'] },
  { text: "(P1), (P2), and (P3) work together to get as many supplies as possible.", playerCount: 3, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social'] },
  { text: "(P1) snatches a First Aid Kit from the Cornucopia.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Supply'], itemGain: ['First Aid Kit'] },
  { text: "(P1) finds a crate of explosives.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.5, tags: ['Supply'], itemGain: ['Explosives'] },
  { text: "(P1) grabs a shovel.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Supply'], itemGain: ['Shovel'] },
  { text: "(P1) grabs a bottle of alcohol and a rag.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Supply'], itemGain: ['Molotov Components'] },
  { text: "(P1) finds a canteen full of water.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Supply'] },
  { text: "(P1) falls down and hurts themselves.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Fail'], healthDamage: 15 },
  { text: "(P1) breaks (P2)'s nose for a basket of bread.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Attack', 'Food'], healthDamage: 10 },
  { text: "(P1) finds a trident.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Supply'], itemGain: ['Trident'] },
  { text: "(P1) grabs a spear from inside the Cornucopia.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Supply'], itemGain: ['Spear'] },
  // New
  { text: "(P1) hides inside the Cornucopia until the initial chaos ends.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 3.0, tags: ['Hide', 'Coward'] },
  { text: "(P1) accidentally drops their weapon while running.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Clumsy', 'Fail'] },
  { text: "(P1) and (P2) engage in a fist fight over a loaf of bread.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Social', 'Food', 'Attack'], healthDamage: 10 },
];

// --- BLOODBATH FATAL (High Lethality) ---
export const bloodbathDeathEvents: GameEvent[] = [
  // Modified: Added condition for 1% chance
  { text: "(P1) steps off the podium too soon and blows up.", playerCount: 1, fatalities: true, killerIndices: [], victimIndices: [0], weight: 1.0, tags: ['Fail'], condition: () => Math.random() < 0.01 },
  { text: "(P1) throws a knife into (P2)'s chest.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 5.0, tags: ['Kill'] },
  { text: "(P1) and (P2) fight for a bag. (P1) strangles (P2) with the straps.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 4.0, tags: ['Kill'] },
  { text: "(P1) kills (P2) with their own weapon.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 3.0, tags: ['Kill'] },
  { text: "(P1) bashes (P2)'s head against the Cornucopia wall.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 4.0, tags: ['Kill'] },
  { text: "(P1) spears (P2) in the abdomen.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 4.0, tags: ['Kill'] },
  { text: "(P1) slashes (P2)'s throat with a machete.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 4.0, tags: ['Kill'] },
  { text: "(P1) catches (P2) trying to run and snaps their neck.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 3.0, tags: ['Kill'] },
  { text: "(P1) decapitates (P2) with a sword.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 2.0, tags: ['Kill'] },
  { text: "(P1) repeatedly stabs (P2) while they are down.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 3.0, tags: ['Kill', 'Ruthless'] },
  { text: "(P1) pushes (P2) into a pack of waiting mutts.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 1.0, tags: ['Kill', 'Environment'] },
  { text: "(P1) finds a scythe and cuts (P2) in half.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 1.5, tags: ['Kill'] },
];

// --- FEAST EVENTS ---
export const feastEvents: GameEvent[] = [
  { text: "(P1) gathers as much food as they can into a bag before sprinting away.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 5.0, tags: ['Feast', 'Supply'], itemGain: ['Food', 'Water'] },
  { text: "(P1) decides not to go to The Feast.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Feast', 'Safe'] },
  { text: "(P1) gorges themselves on the banquet immediately.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 3.0, tags: ['Feast', 'Food', 'Glutton'] },
  { text: "(P1) and (P2) decide to split the supplies found at the feast.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Feast', 'Social', 'Alliance'] },
  { text: "(P1) ambushes (P2) as they reach for a backpack.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 5.0, tags: ['Feast', 'Kill', 'Ambush'] },
  { text: "(P1) throws a knife at (P2) across the table.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 4.0, tags: ['Feast', 'Kill'] },
  { text: "(P1) destroys the supplies to prevent others from getting them.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Feast', 'Ruthless'] },
  { text: "(P1) battles (P2) for the lone backpack at the center. (P1) overpowers them.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 3.0, tags: ['Feast', 'Kill'] },
  { text: "(P1) poisons the wine at the feast, killing (P2).", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 2.0, tags: ['Feast', 'Kill', 'Poison', 'Devious'] },
];


// --- GENERAL / DAY ---
export const generalEvents: GameEvent[] = [
  // Survival / Fluff
  { text: "(P1) travels to higher ground.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Travel'] },
  { text: "(P1) moves further into the forest.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Travel'] },
  { text: "(P1) retreats to a new sector.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Travel'] },
  { text: "(P1) hunts for other tributes.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Hunt', 'Travel'] },
  { text: "(P1) searches for a water source.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Survival', 'Travel'] },
  { text: "(P1) picks flowers.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Idle'] },
  { text: "(P1) camouflages themselves in the brush.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Survival', 'Sneak'] },
  { text: "(P1) questions their sanity.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.8, tags: ['Idle', 'Sanity'] },
  { text: "(P1) practices their archery.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Idle'], itemRequired: ['Bow', 'Arrows'] },
  { text: "(P1) thinks about home.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Idle'] },
  
  // Trait Specific: Survivalist
  { text: "(P1) constructs an elaborate shelter that is hidden from view.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 3.0, tags: ['Survival'], traitRequired: ['Survivalist'] },
  { text: "(P1) easily identifies edible plants, having a great meal.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 3.0, tags: ['Food'], traitRequired: ['Survivalist'] },

  // Trait Specific: Charming
  { text: "(P1) flashes a dazzling smile at a camera, receiving a gift from a sponsor.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 3.0, tags: ['Sponsor', 'Food'], traitRequired: ['Charming'] },
  { text: "(P1) convinces (P2) not to kill them using their charm.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Social', 'Mercy'], traitRequired: ['Charming'] },

  // Trait Specific: Trained (Career)
  { text: "(P1) spars with a dummy, showing off their training.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 3.0, tags: ['Idle'], traitRequired: ['Trained'] },
  { text: "(P1) intimidates (P2) into giving up their food.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 3.0, tags: ['Social', 'Theft'], traitRequired: ['Trained'] },

  // Trait Specific: Underdog
  { text: "(P1) manages to stay hidden despite nearly being stepped on.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 3.0, tags: ['Sneak'], traitRequired: ['Underdog'] },

  // Item Discovery & Crafting
  { text: "(P1) receives a First Aid Kit from a sponsor.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.5, tags: ['Sponsor'], itemGain: ['First Aid Kit'] },
  { text: "(P1) crafts a crude spear from a fallen branch.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Supply'], itemGain: ['Spear'] },
  { text: "(P1) discovers a hidden cave.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Travel'] },
  { text: "(P1) finds a dead tribute and loots their body.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.5, tags: ['Supply'] },
  { text: "(P1) sharpens their weapons.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Idle'] },

  // Item Usage
  { text: "(P1) uses their First Aid Kit to treat their wounds.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 10.0, tags: ['Heal'], itemRequired: ['First Aid Kit'], consumesItem: true, condition: (a) => isInjured(a[0]) },
  
  // Resource gathering
  { text: "(P1) finds a fruit tree and eats their fill.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Food'] },
  { text: "(P1) catches a fish in the nearby water source.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Food'] },
  { text: "(P1) receives fresh food from an unknown sponsor.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.5, tags: ['Food', 'Sponsor'] },
  { text: "(P1) steals eggs from a nest.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Food'] },

  // Social
  { text: "(P1) begs for (P2) to kill them. (P2) refuses, keeping (P1) alive.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.5, tags: ['Social', 'Mercy'] },
  { text: "(P1) and (P2) hunt for other tributes.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social', 'Hunt', 'Travel'] },
  { text: "(P1) tends to (P2)'s wounds.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.8, tags: ['Social', 'Heal'] },
  { text: "(P1) and (P2) work together for the day.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social'] },
  { text: "(P1) stalks (P2).", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Hunt', 'Travel'] },
  { text: "(P1) sees smoke rising in the distance, but decides not to investigate.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Travel'] },
  { text: "(P1) and (P2) hold hands.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 0.5, tags: ['Social'] },

  // Starvation / Status / Fail
  { text: "(P1) passes out from hunger.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 5.0, tags: ['Starve'], condition: (a) => isStarving(a[0]), healthDamage: 10 },
  { text: "(P1) eats toxic berries in desperation.", playerCount: 1, fatalities: true, killerIndices: [], victimIndices: [0], weight: 2.0, tags: ['Starve'], condition: (a) => isStarving(a[0]) },
  { text: "(P1) drinks tainted water and becomes ill.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Fail'], healthDamage: 25 },
  { text: "(P1) sprains their ankle while running.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Fail'], healthDamage: 15 },
  
  // Insanity
  { text: "(P1) hallucinates that (P2) is a monster and attacks!", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 3.0, tags: ['Insanity', 'Attack'], condition: (a) => isInsane(a[0]), healthDamage: 10 },
  { text: "(P1) screams at the sky, begging for it to end.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Insanity'], condition: (a) => isInsane(a[0]) },
  { text: "(P1) talks to a rock, convinced it is their ally.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Insanity'], condition: (a) => isInsane(a[0]) },

  // --- DESPERATE MEASURES (New) ---
  { text: "(P1), starving, attacks (P2) in a frenzy to steal their supplies!", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 5.0, tags: ['Desperate', 'Attack'], condition: (a) => isDesperate(a[0]), healthDamage: 5 },
  { text: "(P1) eats raw meat from a dead animal out of desperation.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 4.0, tags: ['Desperate', 'Food'], condition: (a) => isDesperate(a[0]), healthDamage: 5 },
  { text: "(P1) chases (P2) for miles, fueled purely by adrenaline and madness.", playerCount: 2, fatalities: false, killerIndices: [], victimIndices: [], weight: 4.0, tags: ['Desperate', 'Hunt', 'Travel'], condition: (a) => isDesperate(a[0]) },
  { text: "(P1) eats a handful of unknown mushrooms. They miraculously feel full.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 2.0, tags: ['Desperate', 'Food'], condition: (a) => isStarving(a[0]) },
  { text: "(P1) attempts to climb to reach a bird's nest but falls to their death.", playerCount: 1, fatalities: true, killerIndices: [], victimIndices: [0], weight: 2.0, tags: ['Desperate', 'Accident'], condition: (a) => isDesperate(a[0]) },
  
  // --- LARGE GROUPS (3-8) ---
  { text: "(P1), (P2), and (P3) discuss their strategy.", playerCount: 3, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social'] },
  { text: "The alliance of (P1), (P2), (P3), and (P4) secures a perimeter.", playerCount: 4, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Social'] },
  { text: "(P1), (P2), (P3), (P4), and (P5) hunt for other tributes together.", playerCount: 5, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Social', 'Hunt', 'Travel'] },
  { text: "A large group including (P1), (P2), (P3), (P4), (P5), and (P6) gathers to share supplies.", playerCount: 6, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social'] },
  { text: "(P1), (P2), (P3), (P4), (P5), (P6), and (P7) make a truce for the night.", playerCount: 7, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social'] },
  { text: "The remaining tributes (P1), (P2), (P3), (P4), (P5), (P6), (P7), and (P8) stare each other down.", playerCount: 8, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social'] },
  { text: "(P1), (P2), (P3) and (P4) raid (P5)'s camp, stealing their supplies.", playerCount: 5, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Theft', 'Attack'] },

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
  { text: "(P1) can no longer bear the nightmare and ends their own life.", playerCount: 1, fatalities: true, killerIndices: [], victimIndices: [0], weight: 0.1, tags: ['Suicide'] },
  { text: "(P1) steps on a bear trap and bleeds out.", playerCount: 1, fatalities: true, killerIndices: [], victimIndices: [0], weight: 0.5, tags: ['Accident'] },

  // Weapon Specific - FIXED Infinite Ammo
  { text: "(P1) shoots an arrow into (P2)'s head.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 5.0, tags: ['Kill'], itemRequired: ['Bow', 'Arrows'], consumesItem: ['Arrows'] },
  { text: "(P1) throws a spear into (P2)'s chest.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 5.0, tags: ['Kill'], itemRequired: ['Spear'] },
  { text: "(P1) detonates explosives, killing (P2) and (P3) instantly.", playerCount: 3, fatalities: true, killerIndices: [0], victimIndices: [1, 2], weight: 10.0, tags: ['Kill', 'Explosive'], itemRequired: ['Explosives'], consumesItem: true },
  { text: "(P1) bashes (P2) with a shovel.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 5.0, tags: ['Kill'], itemRequired: ['Shovel'] },
  { text: "(P1) stabs (P2) with a trident.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 5.0, tags: ['Kill'], itemRequired: ['Trident'] },

  // Trait Specific Kills
  { text: "(P1) mercilessly snaps (P2)'s neck.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 3.0, tags: ['Kill'], traitRequired: ['Ruthless'] },
  { text: "(P1), in a fit of insanity, mistakes (P2) for a dummy and dismembers them.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 3.0, tags: ['Kill'], traitRequired: ['Unstable'] },
  
  // Desperate Kills
  { text: "(P1) overpowers (P2) in a frenzy, killing them for their backpack.", playerCount: 2, fatalities: true, killerIndices: [0], victimIndices: [1], weight: 5.0, tags: ['Kill', 'Desperate'], condition: (a) => isDesperate(a[0]) },

  // Larger Kills
  { text: "(P1) ambushes the group, killing (P2) and (P3).", playerCount: 4, fatalities: true, killerIndices: [0], victimIndices: [1, 2], weight: 0.5, tags: ['Kill', 'Ambush'] },
  { text: "(P1) poisons the group's food supply, killing (P2), (P3), and (P4).", playerCount: 5, fatalities: true, killerIndices: [0], victimIndices: [1, 2, 3], weight: 0.2, tags: ['Kill', 'Poison'] },
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
  { text: "The group of (P1), (P2), and (P3) sleep in shifts.", playerCount: 3, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.5, tags: ['Social', 'Sleep'] },
  { text: "(P1), (P2), (P3) and (P4) huddle together for warmth.", playerCount: 4, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Social'] },
  { text: "(P1) looks at the night sky.", playerCount: 1, fatalities: false, killerIndices: [], victimIndices: [], weight: 1.0, tags: ['Idle'] },
];

// --- ARENA EVENTS (Global) ---
export const arenaEvents = [
    { text: "A thick, acidic fog rolls into the arena.", damage: 25, type: 'Weather' },
    { text: "A feast is announced at the Cornucopia!", heal: 50, feed: 100, type: 'Feast' },
    { text: "Wolf mutts are unleashed on the arena.", damage: 35, type: 'Beast' },
    { text: "The temperature drops below freezing.", damage: 15, type: 'Weather' },
    { text: "A forest fire forces tributes into a smaller area.", damage: 15, type: 'Weather' },
    { text: "A loud, maddening buzzing noise fills the arena.", damage: 0, type: 'Psychological' }, 
];