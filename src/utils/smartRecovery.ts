import { ComprehensiveAIResponse, MythMood } from '@/types/mythology';
import { logger } from './logger';
import { AIProviderConfig, AIProviderError } from '@/types/aiProviderTypes';
import { AIServiceFactory } from '@/services/aiProviderService';
import {
  ensureCompleteStructure,
  parseJSONWithStrategies,
  fixJSONCommonIssues
} from './jsonParsing';
import {
  DEFAULT_MIN_ENTITIES,
  DEFAULT_MIN_LOCATIONS,
  DEFAULT_MIN_VOCABULARY,
  DEFAULT_MIN_TIMELINE_EVENTS,
  DEFAULT_MIN_STORY_WORD_COUNT,
  PROMPT_LIMITS,
  RECOVERY_CONSTANTS
} from '@/constants/defaults';
import { normalizeToArray } from './responseValidation';

export interface RecoveryStatus {
  isRecovered: boolean;
  recoveredSections: string[];
  missingSections: string[];
  incompleteSections: string[];
}

export const getThreshold = (config: AIProviderConfig | undefined, key: keyof NonNullable<AIProviderConfig['generationThresholds']>, defaultValue: number): number => {
  return config?.generationThresholds?.[key] ?? defaultValue;
};

const findMatchingCloseBrace = (text: string, startIndex: number): number => {
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
  }

  return -1;
};

const extractValidSections = (brokenJson: string): Partial<ComprehensiveAIResponse> => {
  const validSections: Partial<ComprehensiveAIResponse> = {};

    try {
    const parsed = JSON.parse(brokenJson);
    if (typeof parsed === 'object') {
      return parsed as Partial<ComprehensiveAIResponse>;
    }
  } catch (e) {
  }

  const sectionNames = ['story', 'entities', 'worldMap', 'analysis', 'socialCode', 'ancientLanguage', 'extras'];

  for (const sectionName of sectionNames) {
    try {
      const sectionPattern = new RegExp(`"${sectionName}"\\s*:\\s*`, 'g');
      const match = sectionPattern.exec(brokenJson);

      if (match) {
        const startIndex = match.index + match[0].length;
        const extracted = extractNestedValue(brokenJson, startIndex);

        if (extracted) {
          const sectionJson = `{"${sectionName}": ${extracted}}`;
          const parsed = JSON.parse(sectionJson);
          validSections[sectionName as keyof ComprehensiveAIResponse] = parsed[sectionName];

          if (import.meta.env.DEV) {
            logger.debug('Section recovered', { sectionName });
          }
        }
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        logger.debug(`Section recovery failed: ${sectionName}`, { error: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  return validSections;
};

const extractNestedValue = (text: string, startIndex: number): string | null => {
  const firstChar = text[startIndex];

  if (firstChar === '{') {
    return extractBracketedContent(text, startIndex, '{', '}');
  } else if (firstChar === '[') {
    return extractBracketedContent(text, startIndex, '[', ']');
  } else if (firstChar === '"') {
    const endQuote = text.indexOf('"', startIndex + 1);
    if (endQuote !== -1) {
      return text.substring(startIndex, endQuote + 1);
    }
  }

  return null;
};

const extractBracketedContent = (text: string, startIndex: number, openChar: string, closeChar: string): string | null => {
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          return text.substring(startIndex, i + 1);
        }
      }
    }
  }

  return null;
};

const isIncomplete = (
  section: unknown,
  sectionType: string,
  thresholds?: {
    minEntities?: number;
    minLocations?: number;
    minVocabulary?: number;
    minTimelineEvents?: number;
  }
): boolean => {
  const minEntities = thresholds?.minEntities ?? DEFAULT_MIN_ENTITIES;
  const minLocations = thresholds?.minLocations ?? DEFAULT_MIN_LOCATIONS;
  const minVocabulary = thresholds?.minVocabulary ?? DEFAULT_MIN_VOCABULARY;
  const minTimelineEvents = thresholds?.minTimelineEvents ?? DEFAULT_MIN_TIMELINE_EVENTS;

  switch (sectionType) {
    case 'story':
      return !(section && typeof section === 'object' && 'text' in section) || ((section as { text?: string }).text?.length ?? 0) < RECOVERY_CONSTANTS.MIN_STORY_TEXT_LENGTH;
    case 'entities':
      return !Array.isArray(section) || section.length < minEntities;
    case 'worldMap':
      const worldMapSection = section as { locations?: unknown[] } | undefined;
      return !(section && typeof section === 'object' && 'locations' in section) || !Array.isArray(worldMapSection?.locations) || (worldMapSection?.locations?.length ?? 0) < minLocations;
    case 'analysis':
      const analysisSection = section as { timeline?: unknown[] } | undefined;
      return !(section && typeof section === 'object') || !('timeline' in section) || !('symbols' in section) || !Array.isArray(analysisSection?.timeline) || (analysisSection?.timeline?.length ?? 0) < minTimelineEvents;
    case 'socialCode':
      return !(section && typeof section === 'object') || !('sacred' in section) || !('forbidden' in section);
    case 'ancientLanguage':
      const langSection = section as { vocabulary?: unknown[] } | undefined;
      return !(section && typeof section === 'object' && 'vocabulary' in section) || !Array.isArray(langSection?.vocabulary) || (langSection?.vocabulary?.length ?? 0) < minVocabulary;
    default:
      return false;
  }
};

export const findMissingSections = (
  validSections: Partial<ComprehensiveAIResponse>,
  thresholds?: {
    minEntities?: number;
    minLocations?: number;
    minVocabulary?: number;
    minTimelineEvents?: number;
  }
) => {
  const requiredSections = ['story', 'entities', 'worldMap', 'analysis', 'socialCode', 'ancientLanguage'];
  const missing: string[] = [];
  const incomplete: string[] = [];

  for (const section of requiredSections) {
    if (!validSections[section as keyof ComprehensiveAIResponse]) {
      missing.push(section);
    } else if (isIncomplete(validSections[section as keyof ComprehensiveAIResponse], section, thresholds)) {
      incomplete.push(section);
    }
  }

  return { missing, incomplete };
};


export const generateMissingSections = async (
  sections: string[],
  currentResult: Partial<ComprehensiveAIResponse>,
  aiConfig: AIProviderConfig,
  retryCount = 0
): Promise<Partial<ComprehensiveAIResponse>> => {
  if (retryCount >= RECOVERY_CONSTANTS.MAX_RETRIES) {
    if (import.meta.env.DEV) {
      logger.warn('Max retries reached for generateMissingSections, returning empty sections');
    }
    return {};
  }
  
  const sectionPrompts: Record<string, string> = {
    story: `Write a complete mythological story (minimum ${DEFAULT_MIN_STORY_WORD_COUNT} words) that fits the existing mythology. Include title, text, and mood.`,
    entities: `Generate at least ${DEFAULT_MIN_ENTITIES} mythical entities with name, type, archetype, role, description, and relationships.`,
    worldMap: `Create a world map with at least ${DEFAULT_MIN_LOCATIONS} locations, each with name, type, description, coordinates, and importance.`,
    analysis: `Generate analysis including timeline (${DEFAULT_MIN_TIMELINE_EVENTS}+ events), symbols, archetype conflicts, thematic density, and characters.`,
    ancientLanguage: `⚠️ CRITICAL: Create an ancient language with AT LEAST ${DEFAULT_MIN_VOCABULARY} vocabulary words (NOT ${DEFAULT_MIN_VOCABULARY - 5}, NOT ${DEFAULT_MIN_VOCABULARY - 2}, but ${DEFAULT_MIN_VOCABULARY} or more!). Each word must have: word, meaning, category, rarity, pronunciation, storyUsage, storyContext, and importance. DO NOT leave vocabulary array empty!`,
    socialCode: `Define social code with sacred rules, forbidden acts, and forgivable transgressions.`
  };

  const essentialContext = {
    storyTitle: currentResult.story?.title || 'Unknown',
    storyExcerpt: currentResult.story?.text ? currentResult.story.text.substring(0, PROMPT_LIMITS.storyExcerptPreview) + '...' : '',
    entityNames: (currentResult.entities || []).map(e => e?.name).filter(Boolean),
    locationNames: (currentResult.worldMap?.locations || []).map(l => l?.name).filter(Boolean)
  };

  const sectionInstructions = sections.map(s => sectionPrompts[s] || `Generate ${s} section`).join('\n');

  const prompt = `Complete missing sections for: "${essentialContext.storyTitle}"

Context: ${essentialContext.storyExcerpt}
Entities: ${essentialContext.entityNames.join(', ') || 'None'}
Locations: ${essentialContext.locationNames.join(', ') || 'None'}

GENERATE: ${sections.join(', ')}
${sectionInstructions}

CRITICAL RULES:
1. OUTPUT MUST START WITH { (no text before)
2. OUTPUT MUST END WITH } (no text after)
   ⚠️ CRITICAL: If you add ANY text after }, the system will CRASH!
   ⚠️ Do NOT add explanations, comments, or any text after the closing brace!
   ⚠️ The JSON must be the ONLY content in your response!
3. No markdown code blocks
4. No explanations
5. If generating ancientLanguage, vocabulary array MUST have at least ${DEFAULT_MIN_VOCABULARY} items!
6. If generating analysis, timeline array MUST have at least ${DEFAULT_MIN_TIMELINE_EVENTS} events!

EXAMPLE FORMAT:
{
  "ancientLanguage": {
    "languageName": "Ancient Tongue",
    "description": "The language of the ancients",
    "writingSystem": "Runic",
    "vocabulary": [
      {"word": "vel", "meaning": "sky", "pronunciation": "VEL", "category": "nature", "rarity": "common", "storyUsage": "Used in prayers", "storyContext": "Mentioned when characters look to the heavens", "importance": "main_concept"}
    ]
  },
  "analysis": {
    "timeline": [
      {"id": "event-1", "step": 1, "title": "Event 1", "description": "Description"},
      {"id": "event-2", "step": 2, "title": "Event 2", "description": "Description"},
      {"id": "event-3", "step": 3, "title": "Event 3", "description": "Description"},
      {"id": "event-4", "step": 4, "title": "Event 4", "description": "Description"},
      {"id": "event-5", "step": 5, "title": "Event 5", "description": "Description"}
    ]
  }
}

⚠️ REMEMBER: 
- If vocabulary is requested, you MUST generate at least ${DEFAULT_MIN_VOCABULARY} words!
- If timeline is requested, you MUST generate at least ${DEFAULT_MIN_TIMELINE_EVENTS} events!
- Your response must END with } and NOTHING after it!

YOUR OUTPUT (start with { now):
`;

  let aiResponse: { text: string; provider?: string; model?: string } | null = null;
  let aiText = '';
  
  try {
    const aiService = AIServiceFactory.createService(aiConfig);
    
    try {
      aiResponse = await aiService.generateContent({
        prompt,
        maxTokens: 4000
      });
      aiText = aiResponse.text;
    } catch (serviceError) {
      const serviceErrorMessage = serviceError instanceof Error ? serviceError.message : String(serviceError);
      
      if (serviceError instanceof AIProviderError && serviceError.responseText) {
        aiText = serviceError.responseText;
        if (import.meta.env.DEV) {
          logger.debug('AI service call failed but extracted response text from error', {
            error: serviceErrorMessage,
            responseLength: aiText.length,
            responsePreview: aiText.substring(0, PROMPT_LIMITS.responsePreviewLength)
          });
        }
      } else {
        if (serviceError instanceof AIProviderError) {
          throw serviceError;
        }
        if (import.meta.env.DEV) {
          logger.debug('AI service call failed', {
            error: serviceErrorMessage,
            errorType: serviceError instanceof Error ? serviceError.constructor.name : typeof serviceError
          });
        }
        throw new AIProviderError(
          serviceErrorMessage,
          aiConfig.provider,
          undefined,
          serviceError instanceof Error ? { message: serviceError.message, stack: serviceError.stack } : { error: String(serviceError) },
          undefined
        );
      }
    }
    
    let parsed: Partial<ComprehensiveAIResponse> | null = null;

    if (import.meta.env.DEV) {
      logger.debug('generateMissingSections raw AI response', {
        length: aiText.length,
        preview: aiText.substring(0, PROMPT_LIMITS.responsePreviewLength),
        sections: sections
      });
    }

    let cleanedText = aiText.trim();

    const lines = cleanedText.split('\n');
    let jsonStartLine = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('{')) {
        jsonStartLine = i;
        break;
      }
    }
    if (jsonStartLine > 0) {
      cleanedText = lines.slice(jsonStartLine).join('\n');
      if (import.meta.env.DEV) {
        logger.debug(`Removed ${jsonStartLine} non-JSON lines from start`);
      }
    }

    const firstBrace = cleanedText.indexOf('{');
    if (firstBrace !== -1) {
      const jsonEnd = findMatchingCloseBrace(cleanedText, firstBrace);

      if (jsonEnd !== -1) {
        cleanedText = cleanedText.substring(firstBrace, jsonEnd + 1);
      } else {
        const lastBrace = cleanedText.lastIndexOf('}');
        if (lastBrace !== -1 && lastBrace > firstBrace) {
          cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
        }
      }
    }

    cleanedText = fixJSONCommonIssues(cleanedText);
    
    const firstBracePos = cleanedText.indexOf('{');
    if (firstBracePos !== -1) {
      const jsonEndPos = findMatchingCloseBrace(cleanedText, firstBracePos);

      if (jsonEndPos !== -1) {
        cleanedText = cleanedText.substring(firstBracePos, jsonEndPos + 1);
      } else {
        const lastBraceIndex = cleanedText.lastIndexOf('}');
        if (lastBraceIndex !== -1 && lastBraceIndex > firstBracePos) {
          cleanedText = cleanedText.substring(firstBracePos, lastBraceIndex + 1);
        }
      }
    }
    
    cleanedText = cleanedText.trim();
    
    if (!cleanedText.startsWith('{') || !cleanedText.endsWith('}')) {
      const firstBrace2 = cleanedText.indexOf('{');
      const lastBrace2 = cleanedText.lastIndexOf('}');
      if (firstBrace2 !== -1 && lastBrace2 !== -1 && lastBrace2 > firstBrace2) {
        cleanedText = cleanedText.substring(firstBrace2, lastBrace2 + 1);
      }
    }

    if (import.meta.env.DEV) {
      logger.debug('After aggressive cleaning', {
        length: cleanedText.length,
        preview: cleanedText.substring(0, 150),
        endsWith: cleanedText.substring(Math.max(0, cleanedText.length - 50))
      });
    }

    parsed = parseJSONWithStrategies(cleanedText);

    if (!parsed && sections.includes('ancientLanguage')) {
      const vocabMatch = cleanedText.match(/"vocabulary"\s*:\s*\[([\s\S]*?)\]/);
      if (vocabMatch) {
        const vocabJson = `{"ancientLanguage": {"vocabulary": [${vocabMatch[1]}]}}`;
        parsed = parseJSONWithStrategies(vocabJson);
      }
    }

    if (!parsed) {
      const wrappedError = new AIProviderError(
        'All JSON parsing strategies failed for generated sections',
        aiConfig.provider,
        undefined,
        { cleanedPreview: cleanedText.substring(0, PROMPT_LIMITS.responsePreviewLength) },
        aiText || cleanedText
      );
      throw wrappedError;
    }
    
    if (!parsed) {
      const noJsonError = new Error('No JSON found in AI response');
      const wrappedError = new AIProviderError(
        'No JSON found in AI response',
        aiConfig.provider,
        undefined,
        { message: noJsonError.message, stack: noJsonError.stack },
        aiText
      );
      throw wrappedError;
    }
    
    const newSections: Partial<ComprehensiveAIResponse> = {};
    sections.forEach(section => {
      const sectionKey = section as keyof ComprehensiveAIResponse;
      if (parsed && sectionKey in parsed && parsed[sectionKey]) {
        const value = parsed[sectionKey];
        if (value !== null && value !== undefined) {
          (newSections as Record<string, unknown>)[sectionKey] = value;

          if (import.meta.env.DEV) {
            logger.debug('Extracted section from parsed AI response', {
              section: sectionKey,
              hasValue: !!value,
              isAncientLanguage: sectionKey === 'ancientLanguage',
              vocabularyLength: sectionKey === 'ancientLanguage' ?
                (value as any)?.vocabulary?.length || 0 : 'N/A',
              vocabularySample: sectionKey === 'ancientLanguage' ?
                (value as any)?.vocabulary?.[0]?.word || 'none' : 'N/A'
            });
          }
        }
      } else if (import.meta.env.DEV) {
        logger.debug('Section not found in parsed response', {
          section: sectionKey,
          existsInParsed: sectionKey in parsed,
          hasValue: !!(parsed && parsed[sectionKey])
        });
      }
    });
    
    if (Object.keys(newSections).length === 0 && retryCount < RECOVERY_CONSTANTS.MAX_RETRIES) {
      if (import.meta.env.DEV) {
        logger.warn('No sections generated, retrying...', { retryCount, sections });
      }
      return generateMissingSections(sections, currentResult, aiConfig, retryCount + 1);
    }
    
    return newSections;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (import.meta.env.DEV) {
      logger.error('Error generating missing sections', {
        error: errorMessage,
        retryCount,
        sections,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        hasAiResponse: !!aiResponse,
        hasAiText: !!aiText,
        aiTextLength: aiText?.length || 0,
        aiResponseTextLength: aiResponse?.text?.length || 0,
        errorHasResponseText: error instanceof AIProviderError ? !!error.responseText : false,
        errorResponseTextLength: error instanceof AIProviderError ? error.responseText?.length || 0 : 0,
        errorDetailsKeys: error instanceof AIProviderError && error.details ? Object.keys(error.details) : []
      });
    }
    
    if (errorMessage.includes('after JSON') || errorMessage.includes('position')) {
      const positionMatch = errorMessage.match(/position (\d+)/);
      if (positionMatch) {
        const errorPosition = parseInt(positionMatch[1], 10);
        
        let responseText: string | undefined = aiResponse?.text || aiText;
        let responseSource = 'aiResponse/aiText';

        if (!responseText && error instanceof AIProviderError) {
          responseText = error.responseText;
          responseSource = 'error.responseText';
        }
        if (!responseText && error instanceof AIProviderError && error.details) {
          const details = error.details as { responseText?: string; fullResponse?: string };
          responseText = details.responseText || details.fullResponse;
          responseSource = details.responseText ? 'error.details.responseText' : 'error.details.fullResponse';
        }

        if (import.meta.env.DEV) {
          if (!responseText) {
            logger.debug('Cannot attempt position-based recovery - no response text available', {
              hasAiResponse: !!aiResponse,
              hasAiText: !!aiText,
              isAIProviderError: error instanceof AIProviderError,
              errorHasResponseText: error instanceof AIProviderError ? !!error.responseText : false,
              errorPosition
            });
          } else {
            logger.debug('Found response text for position-based recovery', {
              responseSource,
              responseLength: responseText.length,
              errorPosition
            });
          }
        }
        
        if (responseText && errorPosition > 0 && errorPosition < responseText.length) {
          if (import.meta.env.DEV) {
            logger.debug('Attempting position-based recovery in catch block', {
              errorPosition,
              responseLength: responseText.length,
              hasAiResponse: !!aiResponse,
              hasAiText: !!aiText,
              responsePreview: responseText.substring(0, Math.min(PROMPT_LIMITS.responsePreviewLength, errorPosition + 50)),
              responseAfterError: responseText.substring(errorPosition, Math.min(errorPosition + 50, responseText.length))
            });
          }
          
          try {
            const truncated = responseText.substring(0, errorPosition).trim();
            const lastBrace = truncated.lastIndexOf('}');
            if (lastBrace > 0 && truncated.startsWith('{')) {
              const validJson = truncated.substring(0, lastBrace + 1);
              const recovered = JSON.parse(validJson);
              
              const recoveredSections: Partial<ComprehensiveAIResponse> = {};
              sections.forEach(section => {
                const sectionKey = section as keyof ComprehensiveAIResponse;
                if (recovered && sectionKey in recovered && recovered[sectionKey]) {
                  recoveredSections[sectionKey] = recovered[sectionKey];
                }
              });
              
              if (Object.keys(recoveredSections).length > 0) {
                if (import.meta.env.DEV) {
                  logger.debug('Position-based recovery successful in catch block', {
                    recoveredSections: Object.keys(recoveredSections),
                    validJsonLength: validJson.length
                  });
                }
                return recoveredSections;
              }
            }
          } catch (recoveryError) {
            if (import.meta.env.DEV) {
              logger.debug('Position-based recovery failed in catch block', {
                recoveryError: recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
              });
            }
          }
        } else if (import.meta.env.DEV) {
          logger.debug('Cannot attempt position-based recovery', {
            hasResponseText: !!responseText,
            errorPosition,
            responseTextLength: responseText?.length || 0
          });
        }
      }
    }
    
    if (retryCount < RECOVERY_CONSTANTS.MAX_RETRIES) {
      return generateMissingSections(sections, currentResult, aiConfig, retryCount + 1);
    }
    
    throw error;
  }
};

function mergeArraysByKey<T extends Record<string, any>>(
  original: T[] | undefined,
  generated: T[] | undefined,
  keyField: keyof T
): T[] {
  if (!original || original.length === 0) return generated || [];
  if (!generated || generated.length === 0) return original || [];

  const merged = new Map<any, T>();

  original.forEach(item => {
    const key = item[keyField];
    if (key !== undefined && key !== null) {
      merged.set(key, item);
    }
  });

  generated.forEach(item => {
    const key = item[keyField];
    if (key !== undefined && key !== null) {
      merged.set(key, item);
    }
  });

  return Array.from(merged.values());
}

function mergeResponseSections(
  generated: Partial<ComprehensiveAIResponse>,
  original: Partial<ComprehensiveAIResponse>
): ComprehensiveAIResponse {
  const entities = mergeArraysByKey(
    original.entities,
    generated.entities,
    'name'
  );

  const worldMapLocations = mergeArraysByKey(
    original.worldMap?.locations,
    generated.worldMap?.locations,
    'name'
  );

  const vocabulary = mergeArraysByKey(
    original.ancientLanguage?.vocabulary,
    generated.ancientLanguage?.vocabulary,
    'word'
  );

  const timeline = mergeArraysByKey(
    original.analysis?.timeline,
    generated.analysis?.timeline,
    'title'
  );

  const symbols = mergeArraysByKey(
    original.analysis?.symbols,
    generated.analysis?.symbols,
    'symbol'
  );

  const relationships = [
    ...(original.analysis?.relationships || []),
    ...(generated.analysis?.relationships || [])
  ];

  const archetypeConflicts = [
    ...(original.analysis?.archetypeConflicts || []),
    ...(generated.analysis?.archetypeConflicts || [])
  ];

  const thematicDensity = [
    ...(original.analysis?.thematicDensity || []),
    ...(generated.analysis?.thematicDensity || [])
  ];

  return {
    story: generated.story || original.story || {
      title: '',
      text: '',
      mood: 'standard' as MythMood
    },
    entities: entities,
    worldMap: {
      locations: worldMapLocations,
      mapDescription: generated.worldMap?.mapDescription || original.worldMap?.mapDescription || '',
      totalArea: generated.worldMap?.totalArea || original.worldMap?.totalArea || ''
    },
    analysis: {
      timeline: timeline,
      symbols: symbols,
      archetypeConflicts: archetypeConflicts,
      thematicDensity: thematicDensity,
      socialCode: generated.analysis?.socialCode || original.analysis?.socialCode || {
        sacred: '',
        forbidden: '',
        forgivable: ''
      },
      characters: generated.analysis?.characters || original.analysis?.characters,
      relationships: relationships
    },
    ancientLanguage: {
      languageName: generated.ancientLanguage?.languageName || original.ancientLanguage?.languageName || '',
      description: generated.ancientLanguage?.description || original.ancientLanguage?.description || '',
      writingSystem: generated.ancientLanguage?.writingSystem || original.ancientLanguage?.writingSystem || '',
      vocabulary: vocabulary
    },
    extras: {
      ...(original.extras || {}),
      ...(generated.extras || {})
    }
  };
}

export const handleSmartRecovery = async (
  brokenJson: string,
  aiConfig: AIProviderConfig | undefined,
  setRecoveryStatus?: (status: RecoveryStatus | null) => void
): Promise<ComprehensiveAIResponse> => {
  try {
    if (import.meta.env.DEV) {
      logger.debug('Smart Recovery starting');
    }

    const thresholds = {
      minEntities: getThreshold(aiConfig, 'minEntities', DEFAULT_MIN_ENTITIES),
      minLocations: getThreshold(aiConfig, 'minLocations', DEFAULT_MIN_LOCATIONS),
      minVocabulary: getThreshold(aiConfig, 'minVocabulary', DEFAULT_MIN_VOCABULARY),
      minTimelineEvents: getThreshold(aiConfig, 'minTimelineEvents', DEFAULT_MIN_TIMELINE_EVENTS)
    };

    const validSections = extractValidSections(brokenJson);
    const { missing, incomplete } = findMissingSections(validSections, thresholds);

    if (import.meta.env.DEV) {
      logger.debug('Recovered sections', {
        recovered: Object.keys(validSections),
        missing,
        incomplete,
        thresholds,
        currentCounts: {
          entities: Array.isArray(validSections.entities) ? validSections.entities.length : 0,
          locations: Array.isArray(validSections.worldMap?.locations) ? validSections.worldMap.locations.length : 0,
          vocabulary: Array.isArray(validSections.ancientLanguage?.vocabulary) ? validSections.ancientLanguage.vocabulary.length : 0,
          timeline: Array.isArray(validSections.analysis?.timeline) ? validSections.analysis.timeline.length : 0
        }
      });
    }
    
    const partialResponse: Partial<ComprehensiveAIResponse> = {
      story: validSections.story || { text: '', title: '', mood: 'mystical' },
      entities: validSections.entities || [],
      worldMap: validSections.worldMap || { locations: [], mapDescription: '', totalArea: '' },
      analysis: validSections.analysis || {
        timeline: [],
        symbols: [],
        archetypeConflicts: [],
        thematicDensity: [],
        characters: [],
        socialCode: { sacred: '', forbidden: '', forgivable: '' }
      },
      ancientLanguage: validSections.ancientLanguage || { vocabulary: [], languageName: '', description: '', writingSystem: '' },
      extras: validSections.extras || { rituals: [], temples: [], prophecies: [], artifacts: [] }
    };
    
    const allMissing = [...missing, ...incomplete];
    if (allMissing.length > 0 && Object.keys(validSections).length > 0 && aiConfig) {
      try {
        if (setRecoveryStatus) {
          setRecoveryStatus({
            isRecovered: false,
            recoveredSections: Object.keys(validSections),
            missingSections: allMissing,
            incompleteSections: incomplete
          });
        }

        if (import.meta.env.DEV) {
          logger.debug('Attempting to generate missing sections with AI', {
            missingSections: allMissing,
            hasValidContent: Object.keys(validSections).length > 0
          });
        }

        const generatedSections = await generateMissingSections(allMissing, partialResponse, aiConfig);

        if (import.meta.env.DEV) {
          logger.debug('Before merge - DETAILED structure', {
            generatedSectionsKeys: Object.keys(generatedSections),
            requestedSections: allMissing,
            originalAncientLanguageExists: !!partialResponse.ancientLanguage,
            generatedAncientLanguageExists: !!generatedSections.ancientLanguage,
            original: {
              entities: partialResponse.entities?.length || 0,
              locations: partialResponse.worldMap?.locations?.length || 0,
              vocabulary: partialResponse.ancientLanguage?.vocabulary?.length || 0,
              timeline: partialResponse.analysis?.timeline?.length || 0
            },
            generated: {
              entities: generatedSections.entities?.length || 0,
              locations: generatedSections.worldMap?.locations?.length || 0,
              vocabulary: generatedSections.ancientLanguage?.vocabulary?.length || 0,
              timeline: generatedSections.analysis?.timeline?.length || 0
            },
            originalVocabSample: partialResponse.ancientLanguage?.vocabulary?.[0]?.word || 'none',
            generatedVocabSample: generatedSections.ancientLanguage?.vocabulary?.[0]?.word || 'none'
          });
        }

        const mergedResponse: ComprehensiveAIResponse = mergeResponseSections(generatedSections, partialResponse);

        if (import.meta.env.DEV) {
          logger.debug('After merge - section counts', {
            merged: {
              entities: mergedResponse.entities?.length || 0,
              locations: mergedResponse.worldMap?.locations?.length || 0,
              vocabulary: mergedResponse.ancientLanguage?.vocabulary?.length || 0,
              timeline: mergedResponse.analysis?.timeline?.length || 0
            }
          });
        }

        const mergedEntities = normalizeToArray(mergedResponse.entities);
        const mergedLocations = normalizeToArray(mergedResponse.worldMap?.locations);
        const mergedVocabulary = normalizeToArray(mergedResponse.ancientLanguage?.vocabulary);
        
        if (mergedEntities.length < thresholds.minEntities || 
            mergedLocations.length < thresholds.minLocations || 
            mergedVocabulary.length < thresholds.minVocabulary) {
          throw new Error('Merged response still incomplete after AI generation');
        }
        
        const finalResponse = mergedResponse as ComprehensiveAIResponse;
        
        if (import.meta.env.DEV) {
          logger.debug('Smart Recovery completed with AI generation', {
            finalEntities: finalResponse.entities.length,
            finalLocations: finalResponse.worldMap.locations.length,
            finalVocabulary: finalResponse.ancientLanguage.vocabulary.length,
            finalTimeline: finalResponse.analysis.timeline.length,
            generatedSections: Object.keys(generatedSections)
          });
        }
        
        if (setRecoveryStatus) {
          setRecoveryStatus({
            isRecovered: true,
            recoveredSections: [...Object.keys(validSections), ...Object.keys(generatedSections)],
            missingSections: [],
            incompleteSections: []
          });
        }

        return finalResponse;
      } catch (generateError) {
        if (import.meta.env.DEV) {
          logger.warn('Failed to generate missing sections with AI, falling back to placeholders', {
            error: generateError instanceof Error ? generateError.message : String(generateError)
          });
        }

        if (setRecoveryStatus) {
          setRecoveryStatus({
            isRecovered: false,
            recoveredSections: Object.keys(validSections),
            missingSections: allMissing,
            incompleteSections: incomplete
          });
        }
      }
    }

    const recoveredResponse = ensureCompleteStructure(partialResponse, thresholds) as ComprehensiveAIResponse;
    
    if (import.meta.env.DEV) {
      logger.debug('Smart Recovery completed', {
        finalEntities: recoveredResponse.entities.length,
        finalLocations: recoveredResponse.worldMap.locations.length,
        finalVocabulary: recoveredResponse.ancientLanguage.vocabulary.length,
        finalTimeline: recoveredResponse.analysis.timeline.length
      });
    }
    
    if (setRecoveryStatus) {
      setRecoveryStatus({
        isRecovered: true,
        recoveredSections: Object.keys(validSections),
        missingSections: missing,
        incompleteSections: incomplete
      });
    }
    
    return recoveredResponse;
    
  } catch (recoveryError) {
    logger.error('Smart Recovery failed', recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)));
    throw new Error('Both parsing and recovery failed. Please try again.');
  }
};

