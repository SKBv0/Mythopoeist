import { MythicalEntity, Location, AncientWord } from '@/types/mythology';

export const DEFAULT_GENERATION_THRESHOLDS = {
  minEntities: 5,
  minLocations: 5,
  minVocabulary: 10,
  minTimelineEvents: 5,
  minStoryLength: 50,
  minStoryWordCount: 600
} as const;

export const DEFAULT_MIN_ENTITIES = DEFAULT_GENERATION_THRESHOLDS.minEntities;
export const DEFAULT_MIN_LOCATIONS = DEFAULT_GENERATION_THRESHOLDS.minLocations;
export const DEFAULT_MIN_VOCABULARY = DEFAULT_GENERATION_THRESHOLDS.minVocabulary;
export const DEFAULT_MIN_TIMELINE_EVENTS = DEFAULT_GENERATION_THRESHOLDS.minTimelineEvents;
export const DEFAULT_MIN_STORY_LENGTH = DEFAULT_GENERATION_THRESHOLDS.minStoryLength;
export const DEFAULT_MIN_STORY_WORD_COUNT = DEFAULT_GENERATION_THRESHOLDS.minStoryWordCount;

export const PROMPT_LIMITS = {
  storyTextPreview: 2000,
  entityDescriptionPreview: 200,
  storyExcerptPreview: 500,
  responsePreviewLength: 200
} as const;

export const RECOVERY_CONSTANTS = {
  MAX_RETRIES: 2,
  MIN_STORY_TEXT_LENGTH: 200
} as const;

export const TIMEOUT_CONSTANTS = {
  PHASE_TIMEOUT_MS: 300000,
  SMART_RECOVERY_TIMEOUT_MS: 600000
} as const;

export const VALIDATION_CONSTANTS = {
  MIN_ENTITY_NAME_LENGTH: 3,
  MIN_WORD_LENGTH: 3,
  GENERIC_ENTITY_NAMES: ['god', 'hero', 'monster', 'spirit', 'demon', 'angel', 'human'] as const,
  MIN_FIDELITY_SCORE: 85
} as const;

export const DEFAULT_ENTITIES: MythicalEntity[] = [
  { 
    id: "default-entity-1",
    name: "The First Being", 
    type: "god", 
    description: "Born from the story's essence",
    archetype: "primordial",
    stats: { power: 80, wisdom: 70, speed: 50, defense: 60, magic: 90, influence: 85 },
    elements: [],
    rarity: "mythic"
  },
  { 
    id: "default-entity-2",
    name: "The Cosmic Weaver", 
    type: "god", 
    description: "Shapes the threads of fate",
    archetype: "weaver",
    stats: { power: 70, wisdom: 95, speed: 60, defense: 50, magic: 100, influence: 90 },
    elements: [],
    rarity: "mythic"
  },
  { 
    id: "default-entity-3",
    name: "The Eternal Guardian", 
    type: "spirit", 
    description: "Protects the sacred realms",
    archetype: "guardian",
    stats: { power: 85, wisdom: 60, speed: 70, defense: 95, magic: 65, influence: 75 },
    elements: [],
    rarity: "legendary"
  }
];

export const DEFAULT_LOCATIONS: Location[] = [
  { name: "The Origin Realm", type: "mystical", description: "Where the legend began" },
  { name: "The Celestial Apex", type: "sacred", description: "The highest point of creation" },
  { name: "The Void Between", type: "liminal", description: "The space between worlds" },
  { name: "The Primordial Sea", type: "elemental", description: "Waters of pure potential" },
  { name: "The Eternal Threshold", type: "gateway", description: "Portal to distant realms" }
];

export const DEFAULT_VOCABULARY: AncientWord[] = [
  { word: "mythar", meaning: "beginning", pronunciation: "MIE-thar", runicScript: "⟨ᛗᚤᚦᚨᚱ⟩", category: "creation", rarity: "common", importance: "main_concept" },
  { word: "zephros", meaning: "spirit", pronunciation: "ZEF-rohs", runicScript: "⟨ᛉᛖᚺᚱᛟᛊ⟩", category: "magic", rarity: "common", importance: "main_concept" },
  { word: "lumina", meaning: "light", pronunciation: "loo-MEE-nah", runicScript: "⟨ᛚᚢᛗᛁᚾᚨ⟩", category: "gods", rarity: "common", importance: "supporting" },
  { word: "vorthal", meaning: "power", pronunciation: "VOR-thal", runicScript: "⟨ᚹᛟᚱᚦᚨᛚ⟩", category: "magic", rarity: "rare", importance: "main_concept" },
  { word: "aethos", meaning: "eternal", pronunciation: "AY-thos", runicScript: "⟨ᚨᛖᚦᛟᛊ⟩", category: "gods", rarity: "rare", importance: "main_concept" },
  { word: "nexura", meaning: "connection", pronunciation: "NEK-sur-ah", runicScript: "⟨ᚾᛖᚲᛊᚢᚱᚨ⟩", category: "magic", rarity: "common", importance: "supporting" },
  { word: "solmaris", meaning: "sun and sea", pronunciation: "sol-MAR-is", runicScript: "⟨ᛊᛟᛚᛗᚨᚱᛁᛊ⟩", category: "nature", rarity: "rare", importance: "supporting" },
  { word: "umbrath", meaning: "shadow realm", pronunciation: "UM-brath", runicScript: "⟨ᚢᛗᛒᚱᚨᚦ⟩", category: "death", rarity: "rare", importance: "supporting" },
  { word: "crystara", meaning: "clarity", pronunciation: "kris-TAR-ah", runicScript: "⟨ᚲᚱᚤᛊᛏᚨᚱᚨ⟩", category: "prophecy", rarity: "sacred", importance: "main_concept" },
  { word: "drakon", meaning: "ancient wisdom", pronunciation: "DRAH-kon", runicScript: "⟨ᛞᚱᚨᚲᛟᚾ⟩", category: "gods", rarity: "sacred", importance: "main_concept" }
];

export const calculateStoryWordCount = (text: string | undefined | null): number => {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  return text.split(/\s+/).filter((w: string) => w.length > 0).length;
};

export const GENERATION_PHASES = {
  PHASE1: 'phase1',
  PHASE2: 'phase2'
} as const;

export type GenerationPhase = typeof GENERATION_PHASES[keyof typeof GENERATION_PHASES];

export const FORBIDDEN_MYTHOLOGICAL_NAMES = [
  'atlas', 'helios', 'selene', 'zeus', 'thor', 'odin', 'anubis', 'shiva',
  'apollo', 'artemis', 'aphrodite', 'ares', 'athena', 'hades', 'poseidon',
  'demeter', 'hera', 'hestia', 'hermes', 'dionysus'
] as const;

