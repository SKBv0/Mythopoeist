export interface MythBlock {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;
  expectedElements?: string[];
}

export interface MythologySelections {
  [categoryKey: string]: string;
}

export interface Star {
  id: string;
  name: string;
  description: string;
  categoryKey: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export type MythMood = 'epic' | 'mysterious' | 'tragic' | 'heroic' | 'dark' | 'hopeful' | 'ancient' | 'mystical' | 'standard' | 'gothic' | 'fairytale' | 'scifi' | 'romantic' | 'dramatic' | 'light' | 'comic';

export interface CustomDescriptions {
  cosmology?: string;
  gods?: string;
  beings?: string;
  archetype?: string;
  themes?: string;
  symbols?: string;
  socialcodes?: string;
  [key: string]: string | undefined;
}

export interface GenerationState {
  hasStarted: boolean;
  isLoading: boolean;
  result: GenerationResult | null;
  mood?: MythMood;
  progress?: GenerationProgress;
}

export interface GenerationResult {
  storyText: string;
  analysis: MythAnalysis;
  entities?: MythicalEntity[];
  ancientLanguage?: AncientLanguageData;
}

export interface GenerationProgress {
  phase: 'idle' | 'preparing' | 'requesting' | 'parsing' | 'validating' | 'auto-completing' | 'fidelity-check' | 'finalizing' | 'complete';
  percent: number;
  detail?: string;
  section?: 'entities' | 'worldMap' | 'ancientLanguage' | 'story' | 'analysis' | 'extras';
}



export interface CharacterNode {
  id: string;
  name: string;
  archetype: string;
  role: string;
  description: string;
}

export interface RelationshipEdge {
  source: string;
  target: string;
  description: string;
  type: 'bond' | 'conflict' | 'betrayal' | 'support' | 'ally' | 'enemy' | 'family' | 'creator' | 'creation' | 'lover' | 'rival';
}

export interface SymbolConnection {
  symbol: string;
  target: string;
}

export interface TimelineEvent {
  id:string;
  step: number;
  title: string;
  description: string;
}

export interface ThematicDensity {
  section: 'First Section' | 'Middle Section' | 'Last Section';
  theme: string;
}

export interface ArchetypeConflict {
  character1: string;
  character2: string;
  conflict: string;
}

export interface Location {
  name: string;
  type: string;
  description: string;
}

export interface SocialCode {
  sacred: string;
  forbidden: string;
  forgivable: string;
}

export interface MythicalEntity {
  id: string;
  name: string;
  type: 'god' | 'hero' | 'monster' | 'spirit' | 'mortal' | 'trickster' | 'sage';
  archetype: string;
  role?: string;
  description: string;
  powers?: string[];
  weaknesses?: string[];
  domains?: string[];
  symbols?: string[];
  relationships?: EntityRelationship[];
  appearance?: EntityAppearance;
  origin?: string;
  significance?: string;
  quotes?: string[];
  avatar?: string;
  stats: EntityStats;
  elements: ElementAffinity[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
}

export interface EntityStats {
  power: number;
  wisdom: number;
  speed: number;
  defense: number;
  magic: number;
  influence: number;
}

export interface ElementAffinity {
  element: 'fire' | 'water' | 'earth' | 'air' | 'light' | 'dark' | 'spirit' | 'void';
  strength: number;
  type: 'strong' | 'weak' | 'neutral' | 'immunity';
}

export interface EntityRelationship {
  entityId: string;
  entityName: string;
  type: 'ally' | 'enemy' | 'family' | 'creator' | 'creation' | 'lover' | 'rival';
  description: string;
}

export interface EntityAppearance {
  physicalForm: string;
  distinguishingFeatures: string;
  aura?: string;
  size?: 'tiny' | 'small' | 'human' | 'large' | 'giant' | 'cosmic';
}

export interface MythAnalysis {
  timeline: TimelineEvent[];
  symbols: SymbolConnection[];
  archetypeConflicts: ArchetypeConflict[];
  thematicDensity: ThematicDensity[];
  socialCode: SocialCode;
  characters?: CharacterNode[];
  relationships?: RelationshipEdge[];
  locations?: Location[];
  entities?: MythicalEntity[];
  ancientLanguage?: AncientLanguageData;
  rituals?: string[];
  temples?: string[];
}

export interface AncientWord {
  word: string;
  runicScript?: string;
  pronunciation: string;
  meaning: string;
  etymology?: string;
  usage?: string;
  category: 'gods' | 'nature' | 'magic' | 'warfare' | 'love' | 'death' | 'creation' | 'prophecy' | 'emotion' | 'social';
  rarity: 'common' | 'rare' | 'sacred' | 'forbidden';
  relatedWords?: string[];
  artifacts?: { name: string; description: string; power: string }[];
  storyUsage?: string;
  storyContext?: string;
  importance?: 'main_concept' | 'supporting' | 'background';
}

export interface AncientLanguageData {
  languageName: string;
  description: string;
  writingSystem: string;
  vocabulary: AncientWord[];
}

export interface EnhancedLocation {
  name: string;
  type: string;
  description: string;
  coordinates: { x: number; y: number };
  importance: 'minor' | 'moderate' | 'major' | 'legendary';
  connections?: string[];
  inhabitants?: string[];
  secrets?: string;
  terrain?: string;
  climate?: string;
  resources?: string[];
  history?: string;
  sensory?: string;
}

export interface ComprehensiveAIResponse {
  story: {
    title: string;
    text: string;
    mood: MythMood;
  };
  
  analysis: {
    timeline: TimelineEvent[];
    symbols: { symbol: string; target: string }[];
    archetypeConflicts: { character1: string; character2: string; conflict: string }[];
    thematicDensity: { section: string; theme: string }[];
    socialCode: { sacred: string; forbidden: string; forgivable: string };
    characters?: CharacterNode[];
    relationships?: RelationshipEdge[];
  };
  
  entities: MythicalEntity[];
  
  worldMap: {
    locations: EnhancedLocation[];
    mapDescription: string;
    totalArea: string;
  };
  
  ancientLanguage: {
    languageName: string;
    description: string;
    writingSystem: string;
    vocabulary: AncientWord[];
  };
  
  extras: {
    rituals?: string[];
    temples?: string[];
    prophecies?: string[];
    artifacts?: { name: string; description: string; power: string }[];
  };
}
