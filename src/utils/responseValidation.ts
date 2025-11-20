import { ComprehensiveAIResponse, AncientWord } from '@/types/mythology';
import { logger } from './logger';
import {
  DEFAULT_MIN_ENTITIES,
  DEFAULT_MIN_LOCATIONS,
  DEFAULT_MIN_VOCABULARY,
  DEFAULT_MIN_TIMELINE_EVENTS,
  DEFAULT_MIN_STORY_LENGTH,
  DEFAULT_MIN_STORY_WORD_COUNT,
  calculateStoryWordCount,
  GENERATION_PHASES,
  FORBIDDEN_MYTHOLOGICAL_NAMES,
  VALIDATION_CONSTANTS,
  type GenerationPhase
} from '@/constants/defaults';

export const normalizeToArray = <T = unknown>(input: unknown): T[] => {
  if (Array.isArray(input)) {
    return input as T[];
  }
  if (input && typeof input === 'object') {
    return Object.values(input as Record<string, unknown>) as T[];
  }
  return [];
};

const validateRunicUniqueness = (vocabulary: AncientWord[]): boolean => {
  const runicScripts = new Set<string>();
  const duplicates: string[] = [];

  for (const word of vocabulary) {
    if (word.runicScript) {
      const script = word.runicScript.trim();
      if (runicScripts.has(script)) {
        duplicates.push(`"${word.word}" shares runes with another word: ${script}`);
      }
      runicScripts.add(script);
    }
  }

  if (duplicates.length > 0) {
    if (import.meta.env.DEV) {
      logger.warn('Duplicate runes detected', { duplicates });
    }
    return false;
  }

  return true;
};

const validateAncientWords = (vocabulary: AncientWord[]): boolean => {
  const issues: string[] = [];

  for (const word of vocabulary) {
    const ancientWord = (word.word || '').trim();

    if (/\s+/.test(ancientWord)) {
      issues.push(`"${ancientWord}" is a multi-word phrase (should be single word like "thalarion")`);
      continue;
    }

    const wordParts = ancientWord.toLowerCase().split(/[\s-_]+/);
    if (wordParts.length > 1) {
      issues.push(`"${ancientWord}" looks like compound English (should be single invented word)`);
    }
  }

  if (issues.length > 0) {
    if (import.meta.env.DEV) {
      logger.warn('English phrases detected in ancient language', { issues });
    }
    return false;
  }

  return true;
};

export const isResponseComplete = (
  response: Partial<ComprehensiveAIResponse>,
  currentPhase?: GenerationPhase,
  thresholds?: {
    minEntities: number;
    minLocations: number;
    minVocabulary: number;
    minTimelineEvents: number;
    minStoryLength: number;
    minStoryWordCount: number;
  }
): boolean => {
  const MIN_ENTITIES = thresholds?.minEntities ?? DEFAULT_MIN_ENTITIES;
  const MIN_LOCATIONS = thresholds?.minLocations ?? DEFAULT_MIN_LOCATIONS;
  const MIN_VOCABULARY = thresholds?.minVocabulary ?? DEFAULT_MIN_VOCABULARY;
  const MIN_TIMELINE_EVENTS = thresholds?.minTimelineEvents ?? DEFAULT_MIN_TIMELINE_EVENTS;
  const MIN_STORY_LENGTH = thresholds?.minStoryLength ?? DEFAULT_MIN_STORY_LENGTH;
  const MIN_STORY_WORD_COUNT = thresholds?.minStoryWordCount ?? DEFAULT_MIN_STORY_WORD_COUNT;

  if (currentPhase === GENERATION_PHASES.PHASE1) {
    if (!response.story?.text || response.story.text.length < MIN_STORY_LENGTH) {
      if (import.meta.env.DEV) {
        logger.warn('Phase 1: Story too short', { storyLength: response.story?.text?.length || 0, minLength: MIN_STORY_LENGTH });
      }
      return false;
    }

    const storyWordCount = calculateStoryWordCount(response.story.text);
    if (storyWordCount < MIN_STORY_WORD_COUNT) {
      if (import.meta.env.DEV) {
        logger.warn('Phase 1: Story word count too low', { wordCount: storyWordCount, minCount: MIN_STORY_WORD_COUNT });
      }
      return false;
    }

    const entities = normalizeToArray(response.entities);
    if (entities.length < MIN_ENTITIES) {
      if (import.meta.env.DEV) {
        logger.warn('Phase 1: Insufficient entities', { entityCount: entities.length, minEntities: MIN_ENTITIES });
      }
      return false;
    }

    if (import.meta.env.DEV) {
      logger.debug('Phase 1 validation passed', { entities: entities.length, words: storyWordCount });
    }
    return true;
  }

  if (currentPhase === GENERATION_PHASES.PHASE2) {
    const locations = normalizeToArray(response.worldMap?.locations);
    const vocabulary = normalizeToArray(response.ancientLanguage?.vocabulary);
    const timelineEvents = normalizeToArray(response.analysis?.timeline);

    if (locations.length < MIN_LOCATIONS) {
      if (import.meta.env.DEV) {
        logger.warn('Phase 2: Insufficient locations', { locationCount: locations.length, minLocations: MIN_LOCATIONS });
      }
      return false;
    }

    if (vocabulary.length < MIN_VOCABULARY) {
      if (import.meta.env.DEV) {
        logger.warn('Phase 2: Insufficient vocabulary', { vocabularyCount: vocabulary.length, minVocabulary: MIN_VOCABULARY });
      }
      return false;
    }

    if (timelineEvents.length < MIN_TIMELINE_EVENTS) {
      if (import.meta.env.DEV) {
        logger.warn('Phase 2: Insufficient timeline events', { timelineCount: timelineEvents.length, minTimeline: MIN_TIMELINE_EVENTS });
      }
      return false;
    }

    if (import.meta.env.DEV) {
      logger.debug('Phase 2 validation passed', { locations: locations.length, vocabulary: vocabulary.length, timeline: timelineEvents.length });
    }
    return true;
  }

  if (!response.story?.text || response.story.text.length < MIN_STORY_LENGTH) {
    if (import.meta.env.DEV) {
      logger.warn('Rejecting: Story too short', { storyLength: response.story?.text?.length || 0, minLength: MIN_STORY_LENGTH });
    }
    return false;
  }

  const storyWordCount = calculateStoryWordCount(response.story.text);
  if (storyWordCount < MIN_STORY_WORD_COUNT) {
    if (import.meta.env.DEV) {
      logger.warn('Rejecting: Story word count too low', { wordCount: storyWordCount, minCount: MIN_STORY_WORD_COUNT });
    }
    return false;
  }

  const entities = normalizeToArray(response.entities);
  const locations = normalizeToArray(response.worldMap?.locations);
  const vocabulary = normalizeToArray(response.ancientLanguage?.vocabulary);

  if (entities.length < MIN_ENTITIES) {
    if (import.meta.env.DEV) {
      logger.warn('Rejecting: Insufficient entities', { entityCount: entities.length, minEntities: MIN_ENTITIES });
    }
    return false;
  }

  if (locations.length < MIN_LOCATIONS) {
    if (import.meta.env.DEV) {
      logger.warn('Rejecting: Insufficient locations', { locationCount: locations.length, minLocations: MIN_LOCATIONS });
    }
    return false;
  }

  if (vocabulary.length < MIN_VOCABULARY - 2) {
    if (import.meta.env.DEV) {
      logger.warn('Rejecting: Insufficient vocabulary', { vocabularyCount: vocabulary.length, minVocabulary: MIN_VOCABULARY });
    }
    return false;
  }

  if (import.meta.env.DEV) {
    logger.debug('Validation passed', { entities: entities.length, locations: locations.length, vocabulary: vocabulary.length, words: storyWordCount });
  }
  return true;
};

export const isResponseCreative = (
  response: Partial<ComprehensiveAIResponse>,
  currentPhase?: GenerationPhase
): boolean => {
  if (currentPhase === GENERATION_PHASES.PHASE2) {
    return true;
  }
  
  const textsToCheck = [];
  const entityList = normalizeToArray(response.entities);
  const characterList = normalizeToArray(response.analysis?.characters);
  const locationList = normalizeToArray(response.worldMap?.locations);

  if (response.story?.title) {
    textsToCheck.push(response.story.title);
  }

  for (const entity of entityList) {
    if (entity && typeof entity === "object" && "name" in entity) {
      const name = typeof entity.name === 'string' ? entity.name : '';
      if (name) textsToCheck.push(name);
    }
  }

  for (const character of characterList) {
    if (character && typeof character === "object" && "name" in character) {
      const name = typeof character.name === 'string' ? character.name : '';
      if (name) textsToCheck.push(name);
    }
  }

  for (const location of locationList) {
    if (location && typeof location === "object" && "name" in location) {
      const name = typeof location.name === 'string' ? location.name : '';
      if (name) textsToCheck.push(name);
    }
  }
  
  for (const text of textsToCheck) {
    const lowerText = text.toLowerCase();
    for (const name of FORBIDDEN_MYTHOLOGICAL_NAMES) {
      const regex = new RegExp(`(^|[^a-zA-Z])${name}([^a-zA-Z]|$)`, 'i');
      if (regex.test(lowerText)) {
        if (import.meta.env.DEV) {
          logger.warn(`Creativity error: "${name}" mythological name detected in "${text}"!`);
        }
        return false;
      }
    }
  }

  for (const rawEntity of entityList) {
    const entity = rawEntity as { name?: string } | null | undefined;
    const entityName = entity?.name?.toString().trim();
    if (!entityName) {
      continue;
    }
    if (entityName.length < VALIDATION_CONSTANTS.MIN_ENTITY_NAME_LENGTH) {
      if (import.meta.env.DEV) {
        logger.warn('Creativity error: Entity name too short', { entityName });
      }
      return false;
    }
    const nameLower = entityName.toLowerCase();
    if (VALIDATION_CONSTANTS.GENERIC_ENTITY_NAMES.some(generic => nameLower === generic || nameLower === `the ${generic}`)) {
      if (import.meta.env.DEV) {
        logger.warn('Creativity error: Entity name too generic', { entityName });
      }
      return false;
    }
  }

  const vocabulary = normalizeToArray<AncientWord>(response.ancientLanguage?.vocabulary);

  if (!validateRunicUniqueness(vocabulary)) {
    if (import.meta.env.DEV) {
      logger.warn('Ancient language validation failed: duplicate runic scripts');
    }
    return false;
  }

  if (!validateAncientWords(vocabulary)) {
    if (import.meta.env.DEV) {
      logger.warn('Ancient language validation failed: English phrases detected');
    }
    return false;
  }

  return true;
};


