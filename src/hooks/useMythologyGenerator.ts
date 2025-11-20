import { useState, useCallback, useRef } from 'react';
import { 
  MythologySelections, 
  CustomDescriptions,
  GenerationState, 
  MythMood, 
  ComprehensiveAIResponse,
  MythAnalysis,
  GenerationResult,
  RelationshipEdge,
  ThematicDensity,
  EntityRelationship
} from '@/types/mythology';
import { logger } from '@/utils/logger';
import { AIProviderConfig } from '@/types/aiProviderTypes';
import { AIServiceFactory } from '@/services/aiProviderService';
import { mythBlocks } from '@/data/myth-blocks';
import {
  parseJSONWithStrategies
} from '@/utils/jsonParsing';
import {
  DEFAULT_MIN_ENTITIES,
  DEFAULT_MIN_LOCATIONS,
  DEFAULT_MIN_VOCABULARY,
  DEFAULT_MIN_TIMELINE_EVENTS,
  DEFAULT_MIN_STORY_LENGTH,
  DEFAULT_MIN_STORY_WORD_COUNT,
  calculateStoryWordCount,
  GENERATION_PHASES,
  TIMEOUT_CONSTANTS,
  PROMPT_LIMITS,
  VALIDATION_CONSTANTS,
  type GenerationPhase
} from '@/constants/defaults';
import { validateFidelity } from '@/utils/fidelityValidation';
import { normalizeToArray, isResponseComplete, isResponseCreative } from '@/utils/responseValidation';
import {
  handleSmartRecovery,
  generateMissingSections,
  getThreshold,
  type RecoveryStatus
} from '@/utils/smartRecovery';
import {
  createStoryPrompt,
  createRemainingComponentsPrompt,
  createEnhancedStoryPrompt
} from '@/utils/promptGenerators';
import { toRunic } from '@/utils/runicConverter';

interface UseMythologyGeneratorReturn {
  generationState: GenerationState;
  generateMythology: (selections: MythologySelections, customDescriptions?: CustomDescriptions, mood?: MythMood) => Promise<void>;
  regenerateWithMood: (mood: MythMood) => Promise<void>;
  reset: () => void;
  streamingText: string;
  recoveryStatus: RecoveryStatus | null;
  regenerateSpecificSections: (sections: string[]) => Promise<void>;
  acceptPartialResult: () => void;
  cancelGeneration: () => void;
}


export const useMythologyGenerator = (aiConfig?: AIProviderConfig): UseMythologyGeneratorReturn => {
  const [generationState, setGenerationState] = useState<GenerationState>({
  hasStarted: false,
  isLoading: false,
  result: null,
  mood: 'standard'
  });

  const [lastSelections, setLastSelections] = useState<MythologySelections | null>(null);
  const [lastAIResponse, setLastAIResponse] = useState<ComprehensiveAIResponse | null>(null);
  const [streamingText, setStreamingText] = useState<string>('');
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus | null>(null);
  const streamBufferRef = useRef<string>('');
  const streamLastEmitRef = useRef<number>(0);
  const fullResponseBufferRef = useRef<string>('');

  const sanitizeCompletedSentence = (raw: string): string => {
    if (!raw) return '';
    let s = raw.replace(/\s+/g, ' ').trim();
    // Keep only up to the last terminal punctuation with optional closing quote
    const m = s.match(/([\s\S]*?[.!?�](?:["'��])?)/);
    if (m && m[1]) {
      s = m[1];
    }
    // Remove dangling unmatched quotes or commas/dashes at end
    s = s.replace(/[-,:;\s]*(["'��])?\s*$/, (_, q) => (q ? q : '')).trim();
    return s;
  };

  const formatForDisplay = (raw: string): string => {
    if (!raw) return '';
    const text = raw.trim();

    if (/[{}[\]]/.test(text) || /"\s*:\s*"/.test(text)) {
      const targetMatch = text.match(/"target"\s*:\s*"([^"]+)"/i);
      if (targetMatch) return targetMatch[1];
      const descMatch = text.match(/"description"\s*:\s*"([^"]+)"/i);
      if (descMatch) return descMatch[1];
      const textMatch = text.match(/"text"\s*:\s*"([^"]+)"/i);
      if (textMatch) return textMatch[1];
      const valueQuotes = [...text.matchAll(/"([^"]{12,})"/g)].map(m => m[1]);
      if (valueQuotes.length > 0) return valueQuotes[0];
      return '';
    }

    // If too many symbols (likely structural), skip
    const symbolRatio = (text.match(/[^\w\s.,;:'���-]/g)?.length || 0) / Math.max(1, text.length);
    if (symbolRatio > 0.2) return '';
    return text;
  };


  const convertToLegacyFormat = (aiResponse: Partial<ComprehensiveAIResponse>): GenerationResult => {
    const normalizeEntityName = (value?: string | null) =>
      value ? value.toLowerCase().trim() : undefined;

    const analysis: MythAnalysis = {
      timeline: aiResponse.analysis?.timeline || [],
      symbols: aiResponse.analysis?.symbols || [],
      archetypeConflicts: aiResponse.analysis?.archetypeConflicts || [],
      thematicDensity: (aiResponse.analysis?.thematicDensity || []).map((td) => {
        const section = (['First Section', 'Middle Section', 'Last Section'].includes(td.section || '') 
          ? td.section 
          : 'First Section') as ThematicDensity['section'];
        return {
          section,
          theme: td.theme || ''
        };
      }),
      socialCode: aiResponse.analysis?.socialCode || { sacred: '', forbidden: '', forgivable: '' },
      characters: aiResponse.entities?.map(entity => ({
        id: entity.id,
        name: entity.name,
        archetype: entity.archetype,
        role: entity.role || 'unknown',
        description: entity.description
      })) || [],
      relationships: aiResponse.entities?.flatMap(entity => {
        const relationshipEntries = normalizeToArray<EntityRelationship | string | Record<string, unknown>>(entity.relationships);
        if (relationshipEntries.length === 0) {
          return [];
        }
        return relationshipEntries.map(rel => {
          const allEntityNames = (aiResponse.entities || [])
            .map(e => normalizeEntityName(e.name))
            .filter((name): name is string => Boolean(name));
          
          if (typeof rel === 'string') {
            const relString = rel.trim();
            if (!relString) return null;
            
            let target = '';
            let type: RelationshipEdge['type'] = 'bond';
            let description = relString;
            
            const entityNameMatch = allEntityNames.find(entityName => {
              const lowerRel = relString.toLowerCase();
              const lowerEntity = entityName.toLowerCase();
              return lowerRel.includes(lowerEntity) && lowerEntity.length >= VALIDATION_CONSTANTS.MIN_WORD_LENGTH;
            });
            
            if (entityNameMatch) {
              const matchedEntity = aiResponse.entities?.find(
                e => normalizeEntityName(e.name) === entityNameMatch
              );
              if (matchedEntity) {
                target = matchedEntity.name || '';
                
                const lowerRel = relString.toLowerCase();
                if (lowerRel.includes('created') || lowerRel.includes('made') || lowerRel.includes('formed')) {
                  type = 'creator';
                } else if (lowerRel.includes('taught') || lowerRel.includes('trained') || lowerRel.includes('mentored')) {
                  type = 'bond';
                } else if (lowerRel.includes('fought') || lowerRel.includes('opposed') || lowerRel.includes('against')) {
                  type = 'conflict';
                } else if (lowerRel.includes('guardian') || lowerRel.includes('protect')) {
                  type = 'support';
                } else if (lowerRel.includes('apprentice') || lowerRel.includes('student')) {
                  type = 'bond';
                }
              }
            }
            
            if (!target) {
              const words = relString.split(/\s+/);
              for (const word of words) {
                const cleanWord = word.replace(/[.,!?;:]/g, '');
                const foundEntity = allEntityNames.find(en => en === cleanWord.toLowerCase() || en.includes(cleanWord.toLowerCase()));
                if (foundEntity && cleanWord.length >= VALIDATION_CONSTANTS.MIN_WORD_LENGTH) {
                  const matchedEntity = aiResponse.entities?.find(
                    e => normalizeEntityName(e.name) === foundEntity
                  );
                  if (matchedEntity) {
                    target = matchedEntity.name || '';
                    break;
                  }
                }
              }
            }
            
            if (!target) {
              if (import.meta.env.DEV) {
                logger.debug('Could not extract entity name from string relationship', { 
                  source: entity.name, 
                  relationship: relString 
                });
              }
              return null;
            }
            
            return {
              source: entity.name,
              target: target,
              type: type,
              description: description
            } as RelationshipEdge;
          }
          
          const relObject = rel as Record<string, unknown>;
          const target =
            (typeof relObject.entityName === 'string' ? relObject.entityName : '') ||
            (typeof relObject.target === 'string' ? relObject.target : '') ||
            (typeof relObject.name === 'string' ? relObject.name : '') ||
            '';
          const type = ((typeof relObject.type === 'string' ? relObject.type : '') || 'bond') as RelationshipEdge['type'];
          const description = typeof relObject.description === 'string' ? relObject.description : '';
          
          if (!target || target.trim() === '') {
            if (import.meta.env.DEV) {
              logger.warn('Skipping relationship with missing target', { 
                source: entity.name, 
                relationship: rel 
              });
            }
            return null;
          }
          
          const targetIsEntity = allEntityNames.includes(target.toLowerCase().trim());
          
          if (!targetIsEntity) {
            const hasLocationKeywords = /(Tree|Mountain|Valley|Sea|River|Forest|Temple|City|Realm|Land|Place|Area|Region|Path|Road|Bridge|Gate|Portal|Shrine|Sanctuary|Tower|Castle|Fortress|Kingdom|Empire|Domain)/i.test(target);
            const isTooLong = target.length > 50;
            const looksLikeLocation = hasLocationKeywords && (isTooLong || target.includes(' of ') || target.includes(' the '));
            
            if (looksLikeLocation) {
              if (import.meta.env.DEV) {
                logger.warn('Skipping relationship - target appears to be a location name, not an entity name', { 
                  source: entity.name, 
                  target: target,
                  relationship: rel,
                  note: 'Relationships must be between entities, not locations. Use entity names only.'
                });
              }
              return null;
            }
          }
          
          return {
            source: entity.name,
            target: target,
            type: type,
            description: description
          } as RelationshipEdge;
        }).filter((rel): rel is RelationshipEdge => rel !== null);
      }) || [],
      locations: aiResponse.worldMap?.locations || [],
      rituals: aiResponse.extras?.rituals || [],
      temples: aiResponse.extras?.temples || [],
      entities: aiResponse.entities || [],
      ancientLanguage: aiResponse.ancientLanguage,
    };

    return {
      storyText: aiResponse.story?.text || '',
      analysis: analysis,
      entities: aiResponse.entities || [],
      ancientLanguage: aiResponse.ancientLanguage,
    };
  };

  const callAIAPI = async (prompt: string, phase?: GenerationPhase): Promise<ComprehensiveAIResponse> => {
    const config = aiConfig || {
      provider: 'openrouter' as const,
      model: 'openrouter/auto',
      apiKey: '',
      baseUrl: 'https://openrouter.ai/api/v1'
    };

    const MIN_ENTITIES = getThreshold(config, 'minEntities', DEFAULT_MIN_ENTITIES);
    const MIN_LOCATIONS = getThreshold(config, 'minLocations', DEFAULT_MIN_LOCATIONS);
    const MIN_VOCABULARY = getThreshold(config, 'minVocabulary', DEFAULT_MIN_VOCABULARY);
    const MIN_TIMELINE_EVENTS = getThreshold(config, 'minTimelineEvents', DEFAULT_MIN_TIMELINE_EVENTS);
    const MIN_STORY_LENGTH = getThreshold(config, 'minStoryLength', DEFAULT_MIN_STORY_LENGTH);
    const MIN_STORY_WORD_COUNT = getThreshold(config, 'minStoryWordCount', DEFAULT_MIN_STORY_WORD_COUNT);

    if (import.meta.env.DEV) {
      logger.debug('AI Config', { 
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        promptLength: prompt.length, 
        promptPreview: prompt.substring(0, 500) 
      });
    }

    if (!config.apiKey && config.provider !== 'ollama') {
      throw new Error(`API key required for ${config.provider}. Please configure it in settings.`);
    }

    let maxTokens = config.provider === 'ollama' ? 16384 : 16384;
    let retryCount = 0;
    const maxRetries = 3;
    const tokenReductionSteps = [16384, 8192, 4096, 2048];

    while (retryCount <= maxRetries) {
      try {
        const service = AIServiceFactory.createService(config);
        const response = await service.generateContent({
          prompt,
          temperature: 0.9,
          maxTokens: maxTokens,
        onStream: config.provider === 'ollama'
          ? (chunk: string) => {
              const sanitized = chunk.replace(/\s+/g, ' ');
              streamBufferRef.current += sanitized;
              fullResponseBufferRef.current += sanitized;
              const buf = streamBufferRef.current;

              const now = Date.now();
              const timeSinceLast = now - (streamLastEmitRef.current || 0);

              // Paragraph boundary
              const paraIndex = buf.indexOf('\n\n');
              // Last full sentence end
              const sentenceEndRegex = /[.!?�](?:["'��])?(?:\s|$)/g;
              let lastEndIndex = -1;
              let match: RegExpExecArray | null;
              while ((match = sentenceEndRegex.exec(buf)) !== null) {
                lastEndIndex = match.index + match[0].length;
              }

              const shouldEmit = (paraIndex !== -1) || (lastEndIndex > 0 && timeSinceLast > 2000) || buf.length > 400;

              if (shouldEmit && lastEndIndex > 0) {
                const completed = buf.slice(0, lastEndIndex);
                const remainder = buf.slice(lastEndIndex);
                streamBufferRef.current = remainder;
                streamLastEmitRef.current = now;

                const sentences = completed
                  .split(/(?<=[.!?�](?:["'��])?)(?:\s+|$)/)
                  .map(s => s.trim())
                  .filter(Boolean);
                const slice = sentences.slice(-2);
                const joined = slice.join(' ');
                const cleaned = sanitizeCompletedSentence(joined);
                const display = formatForDisplay(cleaned);
                if (display) {
                  setStreamingText(display);
                }
              }
            }
          : undefined
      });

      const streamedFallback = fullResponseBufferRef.current.trim();
      const responseText = typeof response.text === 'string' ? response.text.trim() : '';
      const aiText = responseText || streamedFallback;
      
      fullResponseBufferRef.current = aiText;
      
      if (!aiText) {
        logger.error('AI returned an empty response', {
          provider: config.provider,
          model: config.model,
          phase
        });
        throw new Error('AI service returned an empty response. Please try again.');
      }
      
      const parsedResponse = parseJSONWithStrategies(aiText);
      
      if (!parsedResponse) {
        logger.error('All JSON parsing strategies failed', { aiResponseLength: aiText.length });
        if (import.meta.env.DEV) {
          logger.error('All JSON parsing strategies failed, attempting smart recovery', new Error('JSON parsing failed'));
        }
        
        const smartRecoveryTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Smart Recovery timed out after ${TIMEOUT_CONSTANTS.SMART_RECOVERY_TIMEOUT_MS / 1000} seconds. The AI service may be slow or unresponsive.`));
          }, TIMEOUT_CONSTANTS.SMART_RECOVERY_TIMEOUT_MS);
        });
        
        return Promise.race([
          handleSmartRecovery(aiText, aiConfig, setRecoveryStatus),
          smartRecoveryTimeoutPromise
        ]);
      }
      
      if (import.meta.env.DEV) {
        logger.debug('JSON parsing successful, response structure (before ensureCompleteStructure)', {
          hasStory: !!parsedResponse.story,
          hasEntities: !!parsedResponse.entities,
          hasWorldMap: !!parsedResponse.worldMap,
          hasAnalysis: !!parsedResponse.analysis,
          hasAncientLanguage: !!parsedResponse.ancientLanguage,
          hasExtras: !!parsedResponse.extras,
          entitiesCount: Array.isArray(parsedResponse.entities) ? parsedResponse.entities.length : 0,
          locationsCount: parsedResponse.worldMap?.locations ? parsedResponse.worldMap.locations.length : 0,
          vocabularyCount: parsedResponse.ancientLanguage?.vocabulary ? parsedResponse.ancientLanguage.vocabulary.length : 0
        });
      }

      const responseComplete = isResponseComplete(parsedResponse, phase, {
        minEntities: MIN_ENTITIES,
        minLocations: MIN_LOCATIONS,
        minVocabulary: MIN_VOCABULARY,
        minTimelineEvents: MIN_TIMELINE_EVENTS,
        minStoryLength: MIN_STORY_LENGTH,
        minStoryWordCount: MIN_STORY_WORD_COUNT
      });
      const responseCreative = isResponseCreative(parsedResponse, phase);
      
      const normalizedEntities = normalizeToArray(parsedResponse.entities) as ComprehensiveAIResponse['entities'];
      const normalizedLocations = normalizeToArray(parsedResponse.worldMap?.locations) as ComprehensiveAIResponse['worldMap']['locations'];
      const rawVocabulary = normalizeToArray(parsedResponse.ancientLanguage?.vocabulary) as ComprehensiveAIResponse['ancientLanguage']['vocabulary'];
      
      const normalizedVocabulary = rawVocabulary.map(word => {
        if (!word.runicScript && word.word) {
          return {
            ...word,
            runicScript: toRunic(word.word)
          };
        }
        return word;
      }) as ComprehensiveAIResponse['ancientLanguage']['vocabulary'];
      const normalizedTimeline = normalizeToArray(parsedResponse.analysis?.timeline) as ComprehensiveAIResponse['analysis']['timeline'];
      const normalizedSymbols = normalizeToArray(parsedResponse.analysis?.symbols) as ComprehensiveAIResponse['analysis']['symbols'];
      const normalizedArchetypeConflicts = normalizeToArray(parsedResponse.analysis?.archetypeConflicts) as ComprehensiveAIResponse['analysis']['archetypeConflicts'];
      const normalizedThematicDensity = normalizeToArray(parsedResponse.analysis?.thematicDensity) as ComprehensiveAIResponse['analysis']['thematicDensity'];
      const normalizedAnalysisCharacters = normalizeToArray(parsedResponse.analysis?.characters) as NonNullable<ComprehensiveAIResponse['analysis']['characters']>;
      const normalizedRituals = normalizeToArray(parsedResponse.extras?.rituals) as string[];
      const normalizedTemples = normalizeToArray(parsedResponse.extras?.temples) as string[];
      const normalizedProphecies = normalizeToArray(parsedResponse.extras?.prophecies) as string[];
      
      const normalizedRelationships = (() => {
        const legacyFormat = convertToLegacyFormat(parsedResponse);
        return legacyFormat.analysis.relationships || [];
      })();
      
      if (import.meta.env.DEV) {
        logger.debug('Parsing AI Response Components', {
          entities: normalizedEntities.length,
          locations: normalizedLocations.length,
          vocabulary: normalizedVocabulary.length,
          timeline: normalizedTimeline.length,
          symbols: normalizedSymbols.length,
          archetypeConflicts: normalizedArchetypeConflicts.length,
          thematicDensity: normalizedThematicDensity.length,
          analysisCharacters: normalizedAnalysisCharacters.length,
          relationships: normalizedRelationships.length,
          rituals: normalizedRituals.length,
          temples: normalizedTemples.length,
          prophecies: normalizedProphecies.length
        });
        
        if (normalizedRelationships.length > 0) {
          const invalidRelationships = normalizedRelationships.filter(rel => !rel.target || rel.target.trim() === '');
          if (invalidRelationships.length > 0) {
            logger.warn('Found relationships with missing targets', {
              total: normalizedRelationships.length,
              invalid: invalidRelationships.length,
              invalidRelationships: invalidRelationships.map(rel => ({ source: rel.source, target: rel.target }))
            });
          }
        } else {
          const entitiesWithRelationships = normalizedEntities.filter(entity => 
            entity.relationships && entity.relationships.length > 0
          );
          if (entitiesWithRelationships.length > 0) {
            logger.warn('Entities have relationships but none were parsed', {
              entitiesWithRelationships: entitiesWithRelationships.map(e => ({
                name: e.name,
                relationshipsCount: e.relationships?.length || 0,
                relationships: e.relationships
              }))
            });
          }
        }
      }
      
      const normalizeArtifacts = (input: unknown): { name: string; description: string; power: string }[] => {
        const arr = normalizeToArray(input);
        return arr.map((raw) => {
          if (typeof raw === 'string') {
            return { name: raw, description: 'Legendary artifact of unclear origin', power: 'Unknown power' };
          }
          if (raw && typeof raw === 'object') {
            const obj = raw as Record<string, unknown>;
            const name = (obj.name as string) || 'Unnamed Artifact';
            const description = (obj.description as string) || 'No description';
            const power = (obj.power as string) || 'Unknown power';
            return { name, description, power };
          }
          return { name: 'Unknown Artifact', description: 'No description', power: 'Unknown power' };
        });
      };
      const normalizedArtifacts = normalizeArtifacts(parsedResponse.extras?.artifacts);
      if (import.meta.env.DEV) {
        logger.debug('Artifacts found', { count: normalizedArtifacts.length });
      }

      if (!responseComplete) {
        if (import.meta.env.DEV) {
          logger.warn('AI response appears incomplete:', {
            storyLength: parsedResponse.story?.text?.length || 0,
            entityCount: normalizedEntities.length,
            locationCount: normalizedLocations.length,
            vocabularyCount: normalizedVocabulary.length
          });
        }

        const storyWordCount = calculateStoryWordCount(parsedResponse.story?.text);
        const isCloseEnough = (
          normalizedEntities.length >= MIN_ENTITIES - 1 && // Allow 1 less entity (4 instead of 5)
          normalizedLocations.length >= MIN_LOCATIONS - 1 && // Allow 1 less location (4 instead of 5)
          normalizedVocabulary.length >= MIN_VOCABULARY - 2 && // Allow 2 less vocabulary words (8 instead of 10)
          storyWordCount >= MIN_STORY_WORD_COUNT * 0.8 // Require at least 80% of minimum word count
        );

        if (!isCloseEnough) {
          if (import.meta.env.DEV) {
            logger.warn(`${phase === GENERATION_PHASES.PHASE2 ? 'Phase 2' : 'Phase 1'} response incomplete - attempting Smart Recovery`);
          }
          
          const smartRecoveryTimeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Smart Recovery timed out after ${TIMEOUT_CONSTANTS.SMART_RECOVERY_TIMEOUT_MS / 1000} seconds. The AI service may be slow or unresponsive.`));
            }, TIMEOUT_CONSTANTS.SMART_RECOVERY_TIMEOUT_MS);
          });
          
          return Promise.race([
            handleSmartRecovery(aiText, aiConfig, setRecoveryStatus),
            smartRecoveryTimeoutPromise
          ]);
        } else {
          if (import.meta.env.DEV) {
            logger.debug('Accepting near-complete response (close enough to thresholds)');
          }
        }
      }

      if (!responseCreative) {
        if (import.meta.env.DEV) {
          logger.warn('AI response is uncreative - copying from known mythologies!');
        }
      }

      const validatedResponse: ComprehensiveAIResponse = {
        story: phase === GENERATION_PHASES.PHASE2 
          ? { title: '', text: '', mood: 'mystical' }
          : {
              title: parsedResponse.story?.title || 'Untitled Legend',
              text: parsedResponse.story?.text || 'Legend text could not be generated.',
              mood: parsedResponse.story?.mood || 'mystical'
            },
        analysis: {
          timeline: normalizedTimeline,
          symbols: normalizedSymbols,
          archetypeConflicts: normalizedArchetypeConflicts,
          thematicDensity: normalizedThematicDensity,
          socialCode: parsedResponse.analysis?.socialCode || {
            sacred: 'Unknown',
            forbidden: 'Unknown',
            forgivable: 'Unknown'
          },
          characters: normalizedAnalysisCharacters,
          relationships: normalizedRelationships
        },
        entities: phase === GENERATION_PHASES.PHASE2 
          ? []
          : normalizedEntities,
        worldMap: {
          locations: normalizedLocations,
          mapDescription: parsedResponse.worldMap?.mapDescription || 'World map information not available',
          totalArea: parsedResponse.worldMap?.totalArea || 'Unknown'
        },
        ancientLanguage: {
          languageName: parsedResponse.ancientLanguage?.languageName || 'Ancient Language',
          description: parsedResponse.ancientLanguage?.description || 'Language description not available',
          writingSystem: parsedResponse.ancientLanguage?.writingSystem || 'Unknown',
          vocabulary: normalizedVocabulary
        },
        extras: {
          rituals: normalizedRituals,
          temples: normalizedTemples,
          prophecies: normalizedProphecies,
          artifacts: normalizedArtifacts
        }
      };
      
      if (import.meta.env.DEV) {
        logger.debug('?? Generated Myth Details', {
          story: {
            title: validatedResponse.story.title,
            textLength: validatedResponse.story.text.length,
            textPreview: validatedResponse.story.text.substring(0, PROMPT_LIMITS.responsePreviewLength) + '...',
            mood: validatedResponse.story.mood
          }
        });
        
        logger.debug('?? Generated Entities', {
          count: validatedResponse.entities.length,
          entities: validatedResponse.entities.map(e => ({
            name: e.name,
            type: e.type,
            archetype: e.archetype,
            relationshipsCount: e.relationships?.length || 0
          }))
        });
        
        logger.debug('??? Generated World Map', {
          locationsCount: validatedResponse.worldMap.locations.length,
          locations: validatedResponse.worldMap.locations.map(loc => ({
            name: loc.name,
            type: loc.type,
            importance: loc.importance,
            coordinates: loc.coordinates
          })),
          mapDescription: validatedResponse.worldMap.mapDescription,
          totalArea: validatedResponse.worldMap.totalArea
        });
        
        logger.debug('?? Generated Relationships', {
          count: normalizedRelationships.length,
          relationships: normalizedRelationships.map(rel => ({
            source: rel.source,
            target: rel.target,
            type: rel.type,
            description: rel.description?.substring(0, 100) || 'No description'
          }))
        });
        
        logger.debug('?? Generated Ancient Language', {
          languageName: validatedResponse.ancientLanguage.languageName,
          vocabularyCount: validatedResponse.ancientLanguage.vocabulary.length,
          vocabulary: validatedResponse.ancientLanguage.vocabulary.map(v => ({
            word: v.word,
            meaning: v.meaning,
            category: v.category,
            rarity: v.rarity
          })),
          writingSystem: validatedResponse.ancientLanguage.writingSystem
        });
        
        logger.debug('?? Final Validated Response Summary', {
          story: {
            title: validatedResponse.story.title,
            textLength: validatedResponse.story.text.length,
            mood: validatedResponse.story.mood
          },
          analysis: {
            timelineCount: validatedResponse.analysis.timeline.length,
            symbolsCount: validatedResponse.analysis.symbols.length,
            archetypeConflictsCount: validatedResponse.analysis.archetypeConflicts.length,
            thematicDensityCount: validatedResponse.analysis.thematicDensity.length,
            charactersCount: validatedResponse.analysis.characters?.length || 0,
            relationshipsCount: normalizedRelationships.length,
            socialCode: validatedResponse.analysis.socialCode
          },
          entities: validatedResponse.entities.length,
          worldMap: {
            locationsCount: validatedResponse.worldMap.locations.length,
            mapDescription: validatedResponse.worldMap.mapDescription.substring(0, 50) + '...',
            totalArea: validatedResponse.worldMap.totalArea
          },
          ancientLanguage: {
            languageName: validatedResponse.ancientLanguage.languageName,
            vocabularyCount: validatedResponse.ancientLanguage.vocabulary.length,
            writingSystem: validatedResponse.ancientLanguage.writingSystem.substring(0, 50) + '...'
          },
          extras: {
            ritualsCount: validatedResponse.extras?.rituals?.length || 0,
            templesCount: validatedResponse.extras?.temples?.length || 0,
            propheciesCount: validatedResponse.extras?.prophecies?.length || 0,
            artifactsCount: validatedResponse.extras?.artifacts?.length || 0
          }
        });
      }

      if (import.meta.env.DEV) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let statusText = 'Complete & Creative';
        
        if (!responseComplete && !responseCreative) {
          statusText = 'Incomplete & Copied';
        } else if (!responseComplete) {
          statusText = 'Incomplete Response';
        } else if (!responseCreative) {
          statusText = 'Copied Names';
        }
        
        if (import.meta.env.DEV) {
          logger.debug(`${statusText} (${timestamp})`, {
            processedJSON: validatedResponse,
            phase: phase === GENERATION_PHASES.PHASE2 ? 'Phase 2 (story/entities will be merged from Phase 1)' : 'Phase 1',
            storyLength: validatedResponse.story.text.length,
            entityCount: validatedResponse.entities.length,
            locationCount: validatedResponse.worldMap.locations.length,
            vocabularyCount: validatedResponse.ancientLanguage.vocabulary.length,
            isComplete: responseComplete,
            isCreative: responseCreative
          });
          
          if (!responseComplete) {
            logger.warn('This response contains incomplete data - AI likely left the JSON half-finished');
          }
          if (!responseCreative) {
            logger.warn('This response is uncreative - AI is copying from known mythologies');
          }
          if (responseComplete && responseCreative) {
            logger.debug('A complete and creative legend has been successfully generated!', {});
          }
        }
      }
      
      return validatedResponse;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isMaxTokensError = errorMessage.toLowerCase().includes('context length') || 
                                 errorMessage.toLowerCase().includes('max_tokens') ||
                                 errorMessage.toLowerCase().includes('maximum context') ||
                                 errorMessage.toLowerCase().includes('token');
        
        if (isMaxTokensError && retryCount < maxRetries && config.provider !== 'ollama') {
          const nextTokenIndex = tokenReductionSteps.indexOf(maxTokens);
          if (nextTokenIndex < tokenReductionSteps.length - 1) {
            maxTokens = tokenReductionSteps[nextTokenIndex + 1];
            retryCount++;
            if (import.meta.env.DEV) {
              logger.warn(`Max tokens error detected, retrying with ${maxTokens} tokens (attempt ${retryCount}/${maxRetries})`, {
                error: errorMessage,
                previousMaxTokens: tokenReductionSteps[nextTokenIndex],
                newMaxTokens: maxTokens
              });
            }
            continue;
          }
        }
        
        logger.error('AI API call failed', error as Error);
        throw error;
      }
    }
    
    throw new Error('Max retries exceeded for max_tokens adjustment');
  };

  const generateMythology = useCallback(async (selections: MythologySelections, customDescriptions: CustomDescriptions = {}, mood: MythMood = 'standard') => {
    let streamingInterval: NodeJS.Timeout | null = null;

    const startTime = performance.now();
    if (import.meta.env.DEV) {
      const selectedBlocksDetails = Object.entries(selections)
        .filter(([_, value]) => value)
        .map(([category, blockId]) => {
          const categoryBlocks = mythBlocks[category as keyof typeof mythBlocks] || [];
          const block = categoryBlocks.find(b => b.id === blockId);
          return {
            category,
            blockId,
            blockName: block?.name || 'Unknown',
            blockDescription: block?.description || 'No description'
          };
        });
      
      logger.debug('🚀 Generation Started', {
        timestamp: new Date().toISOString(),
        aiProvider: aiConfig?.provider || 'openrouter',
        aiModel: aiConfig?.model || 'openrouter/auto',
        selectedBlocks: selectedBlocksDetails.map(b => `${b.category}: ${b.blockName}`).join(', '),
        selectedBlocksCount: selectedBlocksDetails.length,
        selectedBlocksDetails: selectedBlocksDetails,
        customDescriptions: Object.keys(customDescriptions).length > 0 ? customDescriptions : 'None',
        customDescriptionsDetails: Object.keys(customDescriptions).length > 0 
          ? Object.entries(customDescriptions).map(([category, desc]) => ({
              category,
              description: desc,
              hasCustom: true
            }))
          : [],
        mood
      });
    }

    try {
      setGenerationState(prev => ({
        ...prev,
        hasStarted: true,
        isLoading: true,
        mood
      }));

      setLastSelections(selections);
      setStreamingText('');
      streamBufferRef.current = '';
      fullResponseBufferRef.current = '';

      if (import.meta.env.DEV) {
        logger.debug('Phase 1: Generating story and entities...', {});
      }
      
      const phase1Prompt = createStoryPrompt(selections, customDescriptions, mood, aiConfig?.systemMessages?.phase1Story);
      
      const isOllama = (aiConfig?.provider || 'openrouter') === 'ollama';
      if (!isOllama && import.meta.env.DEV) {
        logger.debug('Starting fake streaming');
      }
      const elegantMessages = [
        "Invoking the ancient spirits...",
        "Weaving threads of cosmic destiny...",
        "Breathing life into primordial essence...",
        "Carving names into the fabric of time...",
        "Forging bonds between realms...",
        "Inscribing the sacred and forbidden...",
        "Awakening the first consciousness...",
        "Shaping the eternal dance of existence...",
        "Writing the language of creation...",
        "Binding the legend to reality..."
      ];

      let messageIndex = 0;
      if (!isOllama) {
        let lastUpdateTime = 0;
        const THROTTLE_MS = 1200;
        
        streamingInterval = setInterval(() => {
          const now = Date.now();
          if (now - lastUpdateTime < THROTTLE_MS) {
            return;
          }
          lastUpdateTime = now;
          
          if (messageIndex < elegantMessages.length) {
            if (import.meta.env.DEV) {
              logger.debug('Setting streaming text', { index: messageIndex, message: elegantMessages[messageIndex] });
            }
            requestAnimationFrame(() => {
              setStreamingText(elegantMessages[messageIndex]);
            });
            messageIndex++;
          } else {
            if (import.meta.env.DEV) {
              logger.debug('All streaming messages shown, cycling');
            }
            messageIndex = 0;
          }
        }, 800);
      }

      let phase1Response: ComprehensiveAIResponse;
      try {
        const phase1TimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Phase 1 (Story + Entities) timed out after ${TIMEOUT_CONSTANTS.PHASE_TIMEOUT_MS / 1000} seconds. The AI service may be slow or unresponsive.`));
          }, TIMEOUT_CONSTANTS.PHASE_TIMEOUT_MS);
        });

        phase1Response = await Promise.race([
          callAIAPI(phase1Prompt, GENERATION_PHASES.PHASE1),
          phase1TimeoutPromise
        ]);
      } catch (timeoutError) {
        if (import.meta.env.DEV) {
          logger.warn('Phase 1 timeout - attempting to recover partial response', {
            bufferLength: fullResponseBufferRef.current.length,
            bufferPreview: fullResponseBufferRef.current.substring(0, PROMPT_LIMITS.responsePreviewLength)
          });
        }

        const partialText = fullResponseBufferRef.current.trim();
        if (partialText.length > 100) {
          try {
            phase1Response = await handleSmartRecovery(partialText, aiConfig, setRecoveryStatus);
            if (import.meta.env.DEV) {
              logger.debug('Recovered partial Phase 1 response from timeout', {
                storyLength: phase1Response.story?.text?.length || 0,
                entitiesCount: phase1Response.entities?.length || 0
              });
            }
          } catch (recoveryError) {
            throw timeoutError;
          }
        } else {
          throw timeoutError;
        }
      }

      const story = phase1Response.story || { title: '', text: '', mood };
      const entities = phase1Response.entities || [];

      if (import.meta.env.DEV) {
        logger.debug('✅ Phase 1 completed', {
          aiProvider: aiConfig?.provider || 'openrouter',
          aiModel: aiConfig?.model || 'openrouter/auto',
          storyTitle: story.title,
          storyLength: story.text.length,
          storyText: story.text,
          entitiesCount: entities.length,
          entities: entities.map(e => ({
            name: e.name,
            type: e.type,
            archetype: e.archetype,
            rarity: e.rarity,
            stats: e.stats,
            powers: e.powers,
            domains: e.domains
          })),
          selectedBlocks: Object.entries(selections)
            .filter(([_, value]) => value)
            .map(([category, blockId]) => {
              const categoryBlocks = mythBlocks[category as keyof typeof mythBlocks] || [];
              const block = categoryBlocks.find(b => b.id === blockId);
              return `${category}: ${block?.name || blockId}`;
            }).join(', ')
        });
      }

      if (streamingInterval) {
        clearInterval(streamingInterval);
        streamingInterval = null;
      }
      setStreamingText('');
      fullResponseBufferRef.current = '';
      
      if (import.meta.env.DEV) {
        logger.debug('Phase 2: Generating worldMap, analysis, and ancientLanguage...', {});
      }

      const phase2Prompt = createRemainingComponentsPrompt(story, entities, selections, aiConfig?.systemMessages?.phase2Remaining);
      
      let phase2Response: ComprehensiveAIResponse;
      try {
        const phase2TimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Phase 2 (World Map + Analysis + Language) timed out after ${TIMEOUT_CONSTANTS.SMART_RECOVERY_TIMEOUT_MS / 1000} seconds. The AI service may be slow or unresponsive.`));
          }, TIMEOUT_CONSTANTS.SMART_RECOVERY_TIMEOUT_MS);
        });
        
        phase2Response = await Promise.race([
          callAIAPI(phase2Prompt, GENERATION_PHASES.PHASE2),
          phase2TimeoutPromise
        ]);
      } catch (timeoutError) {
        if (import.meta.env.DEV) {
          logger.warn('Phase 2 timeout - attempting to recover partial response', {
            bufferLength: fullResponseBufferRef.current.length,
            bufferPreview: fullResponseBufferRef.current.substring(0, PROMPT_LIMITS.responsePreviewLength)
          });
        }

        const partialText = fullResponseBufferRef.current.trim();
        if (partialText.length > 100) {
          try {
            phase2Response = await handleSmartRecovery(partialText, aiConfig, setRecoveryStatus);
            if (import.meta.env.DEV) {
              logger.debug('Recovered partial Phase 2 response from timeout', {
                locationsCount: phase2Response.worldMap?.locations?.length || 0,
                vocabularyCount: phase2Response.ancientLanguage?.vocabulary?.length || 0,
                timelineCount: phase2Response.analysis?.timeline?.length || 0
              });
            }
          } catch (recoveryError) {
            if (import.meta.env.DEV) {
              logger.warn('Smart Recovery failed on timeout, using Phase 1 + placeholders', {
                error: recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
              });
            }
            phase2Response = {
              story: story,
              entities: entities,
              worldMap: { locations: [], mapDescription: '', totalArea: '' },
              analysis: {
                timeline: [],
                symbols: [],
                archetypeConflicts: [],
                thematicDensity: [],
                characters: [],
                socialCode: { sacred: '', forbidden: '', forgivable: '' }
              },
              ancientLanguage: { vocabulary: [], languageName: '', description: '', writingSystem: '' },
              extras: { rituals: [], temples: [], prophecies: [], artifacts: [] }
            };
          }
        } else {
          if (import.meta.env.DEV) {
            logger.warn('Not enough partial content to recover, using Phase 1 + placeholders');
          }
          phase2Response = {
            story: story,
            entities: entities,
            worldMap: { locations: [], mapDescription: '', totalArea: '' },
            analysis: {
              timeline: [],
              symbols: [],
              archetypeConflicts: [],
              thematicDensity: [],
              characters: [],
              socialCode: { sacred: '', forbidden: '', forgivable: '' }
            },
            ancientLanguage: { vocabulary: [], languageName: '', description: '', writingSystem: '' },
            extras: { rituals: [], temples: [], prophecies: [], artifacts: [] }
          };
        }
      }

      if (import.meta.env.DEV) {
        logger.debug('✅ Phase 2 completed', {
          aiProvider: aiConfig?.provider || 'openrouter',
          aiModel: aiConfig?.model || 'openrouter/auto',
          storyTitle: story.title,
          locationsCount: phase2Response.worldMap?.locations?.length || 0,
          locations: phase2Response.worldMap?.locations?.map(loc => ({
            name: loc.name,
            type: loc.type,
            description: loc.description,
            coordinates: loc.coordinates,
            importance: loc.importance,
            connections: loc.connections,
            inhabitants: loc.inhabitants,
            secrets: loc.secrets
          })) || [],
          vocabularyCount: phase2Response.ancientLanguage?.vocabulary?.length || 0,
          vocabulary: phase2Response.ancientLanguage?.vocabulary || [],
          languageName: phase2Response.ancientLanguage?.languageName,
          writingSystem: phase2Response.ancientLanguage?.writingSystem,
          timelineEventsCount: phase2Response.analysis?.timeline?.length || 0,
          timelineEvents: phase2Response.analysis?.timeline || [],
          symbolsCount: phase2Response.analysis?.symbols?.length || 0,
          symbols: phase2Response.analysis?.symbols || [],
          archetypeConflictsCount: phase2Response.analysis?.archetypeConflicts?.length || 0,
          archetypeConflicts: phase2Response.analysis?.archetypeConflicts || [],
          thematicDensityCount: phase2Response.analysis?.thematicDensity?.length || 0,
          thematicDensity: phase2Response.analysis?.thematicDensity || []
        });
      }

      const aiResponse: ComprehensiveAIResponse = {
        story: story,
        entities: entities,
        worldMap: phase2Response.worldMap || { locations: [], mapDescription: '', totalArea: '' },
        analysis: {
          timeline: phase2Response.analysis?.timeline || [],
          symbols: phase2Response.analysis?.symbols || [],
          archetypeConflicts: phase2Response.analysis?.archetypeConflicts || [],
          thematicDensity: phase2Response.analysis?.thematicDensity || [],
          characters: phase2Response.analysis?.characters || entities.map(entity => ({
            id: entity.id,
            name: entity.name,
            archetype: entity.archetype,
            role: entity.role || 'unknown',
            description: entity.description
          })),
          socialCode: phase2Response.analysis?.socialCode || { sacred: '', forbidden: '', forgivable: '' },
          relationships: [] // Will be populated by convertToLegacyFormat
        },
        ancientLanguage: phase2Response.ancientLanguage || {
          vocabulary: [],
          languageName: '',
          description: '',
          writingSystem: ''
        },
        extras: phase2Response.extras || { rituals: [], temples: [], prophecies: [], artifacts: [] }
      };

      if (streamingInterval) {
        clearInterval(streamingInterval);
      }

      setLastAIResponse(aiResponse);

              const hasCustomDescriptions = Object.keys(customDescriptions).length > 0;
        if (import.meta.env.DEV) {
          const customDetails = Object.entries(customDescriptions).map(([category, desc]) => ({
            category,
            description: desc,
            length: desc?.length || 0
          }));
          logger.debug('Custom Descriptions Debug', { 
            customDescriptions, 
            hasCustomDescriptions,
            count: customDetails.length,
            details: customDetails,
            categories: customDetails.map(d => d.category).join(', ')
          });
        }
        if (hasCustomDescriptions) {
          const fidelityCheck = validateFidelity(aiResponse, customDescriptions);
        
        if (import.meta.env.DEV) {
          logger.debug('FIDELITY REPORT', {
            score: fidelityCheck.fidelityScore.toFixed(1) + '%',
            isValid: fidelityCheck.isValid,
            missingFeatures: fidelityCheck.missingFeatures.length > 0 ? fidelityCheck.missingFeatures : undefined
          });
          
          if (fidelityCheck.missingFeatures.length > 0) {
            logger.warn('Missing Features:', { missingFeatures: fidelityCheck.missingFeatures });
          }
        }
        
        if (!fidelityCheck.isValid) {

          
          if (fidelityCheck.fidelityScore < 70) {
            if (import.meta.env.DEV) {
              logger.debug('Fidelity too low, attempting enhanced retry (Phase 1 only)');
            }
            
            try {
              const enhancedPhase1Prompt = aiConfig?.systemMessages?.enhancedRetry && aiConfig.systemMessages.enhancedRetry.trim()
                ? aiConfig.systemMessages.enhancedRetry
                    .replace(/{SELECTIONS}/g, Object.entries(selections)
                      .filter(([_, value]) => value)
                      .map(([category, blockId]) => {
                        const categoryBlocks = mythBlocks[category as keyof typeof mythBlocks] || [];
                        const block = categoryBlocks.find(b => b.id === blockId);
                        const realName = block?.name || blockId;
                        const description = block?.description || '';
                        const customDesc = customDescriptions[category];
                        if (blockId.includes('-custom') && customDesc) {
                          return `${realName}: ${description}\n\n?? MANDATORY CUSTOM REQUIREMENT: "${customDesc}"`;
                        }
                        return `${realName}: ${description}`;
                      })
                      .join('\n'))
                    .replace(/{MOOD}/g, mood)
                    .replace(/{MISSING_FEATURES}/g, fidelityCheck.missingFeatures.map(f => `? MISSING: ${f}`).join('\n'))
                : createEnhancedStoryPrompt(selections, customDescriptions, mood, fidelityCheck.missingFeatures);
              
              const retryPhase1TimeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                  reject(new Error(`Retry Phase 1 (Enhanced Story + Entities) timed out after ${TIMEOUT_CONSTANTS.PHASE_TIMEOUT_MS / 1000} seconds. The AI service may be slow or unresponsive.`));
                }, TIMEOUT_CONSTANTS.PHASE_TIMEOUT_MS);
              });
              
              const retryPhase1Response = await Promise.race([
                callAIAPI(enhancedPhase1Prompt, GENERATION_PHASES.PHASE1),
                retryPhase1TimeoutPromise
              ]);
              
              const retryStory = retryPhase1Response.story || { title: '', text: '', mood };
              const retryEntities = retryPhase1Response.entities || [];
              
              const retryMergedResponse: ComprehensiveAIResponse = {
                story: retryStory,
                entities: retryEntities,
                worldMap: aiResponse.worldMap,
                analysis: aiResponse.analysis,
                ancientLanguage: aiResponse.ancientLanguage,
                extras: aiResponse.extras
              };
              
              const retryCheck = validateFidelity(retryMergedResponse, customDescriptions);
              
              if (retryCheck.fidelityScore > fidelityCheck.fidelityScore) {
                if (import.meta.env.DEV) {
                  logger.debug('Retry improved fidelity', { 
                    originalScore: fidelityCheck.fidelityScore.toFixed(1) + '%',
                    retryScore: retryCheck.fidelityScore.toFixed(1) + '%'
                  });
                }
                const betterResult = convertToLegacyFormat(retryMergedResponse);
                setLastAIResponse(retryMergedResponse);
                setGenerationState(prev => ({
                  ...prev,
                  isLoading: false,
                  result: betterResult,
                  mood
                }));
                
                return; // Early return to skip original result setting
              } else {
                if (import.meta.env.DEV) {
                  logger.debug('Retry did not improve fidelity, keeping original result');
                }
              }
            } catch (retryError) {
              if (import.meta.env.DEV) {
                logger.warn('Enhanced retry failed', { error: retryError instanceof Error ? retryError.message : String(retryError) });
              }
            }
          }
        }
      }
      
      const legacyResult = convertToLegacyFormat(aiResponse);

      setGenerationState(prev => ({
        ...prev,
        isLoading: false,
        result: legacyResult,
        mood
      }));

      setStreamingText('');
      streamBufferRef.current = '';

      const endTime = performance.now();
      const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);
      const estimatedTokens = Math.ceil(aiResponse.story.text.length / 4);

      if (import.meta.env.DEV) {
        logger.debug('📊 Generation Performance Metrics', {
          aiProvider: aiConfig?.provider || 'openrouter',
          aiModel: aiConfig?.model || 'openrouter/auto',
          storyTitle: aiResponse.story.title,
          selectedBlocks: Object.entries(selections)
            .filter(([_, value]) => value)
            .map(([category, blockId]) => {
              const categoryBlocks = mythBlocks[category as keyof typeof mythBlocks] || [];
              const block = categoryBlocks.find(b => b.id === blockId);
              return `${category}: ${block?.name || blockId}`;
            }).join(', '),
          totalDuration: `${durationSeconds}s`,
          storyLength: aiResponse.story.text.length,
          estimatedTokens: `~${estimatedTokens}`,
          tokensPerSecond: `~${(estimatedTokens / parseFloat(durationSeconds)).toFixed(1)}`
        });

        logger.debug('📖 Complete Myth Details', {
          story: {
            title: aiResponse.story.title,
            text: aiResponse.story.text,
            mood: aiResponse.story.mood,
            wordCount: calculateStoryWordCount(aiResponse.story.text)
          },
          entities: aiResponse.entities.map(e => ({
            id: e.id,
            name: e.name,
            type: e.type,
            archetype: e.archetype,
            rarity: e.rarity,
            description: e.description,
            role: e.role,
            powers: e.powers,
            weaknesses: e.weaknesses,
            domains: e.domains,
            symbols: e.symbols,
            stats: e.stats,
            elements: e.elements,
            relationships: e.relationships,
            appearance: e.appearance,
            origin: e.origin,
            significance: e.significance,
            quotes: e.quotes
          })),
          worldMap: {
            locations: aiResponse.worldMap.locations.map(loc => ({
              name: loc.name,
              type: loc.type,
              description: loc.description,
              coordinates: loc.coordinates,
              importance: loc.importance,
              connections: loc.connections,
              inhabitants: loc.inhabitants,
              secrets: loc.secrets
            })),
            mapDescription: aiResponse.worldMap.mapDescription,
            totalArea: aiResponse.worldMap.totalArea
          },
          ancientLanguage: {
            languageName: aiResponse.ancientLanguage.languageName,
            description: aiResponse.ancientLanguage.description,
            writingSystem: aiResponse.ancientLanguage.writingSystem,
            vocabulary: aiResponse.ancientLanguage.vocabulary
          },
          analysis: {
            timeline: aiResponse.analysis.timeline,
            symbols: aiResponse.analysis.symbols,
            archetypeConflicts: aiResponse.analysis.archetypeConflicts,
            thematicDensity: aiResponse.analysis.thematicDensity,
            socialCode: aiResponse.analysis.socialCode,
            characters: aiResponse.analysis.characters,
            relationships: aiResponse.analysis.relationships
          },
          extras: {
            rituals: aiResponse.extras?.rituals || [],
            temples: aiResponse.extras?.temples || [],
            prophecies: aiResponse.extras?.prophecies || [],
            artifacts: aiResponse.extras?.artifacts || []
          }
        });
      }

    } catch (error) {
      if (streamingInterval) {
        clearInterval(streamingInterval);
      }

      logger.error('Generation failed', error as Error);
      setGenerationState(prev => ({
        ...prev,
        isLoading: false,
        result: null
      }));

      setStreamingText('');
      streamBufferRef.current = '';
    }
  }, [aiConfig]);

  const regenerateWithMood = useCallback(async (mood: MythMood) => {
    if (!lastSelections) {
      return;
    }

    await generateMythology(lastSelections, {}, mood);
  }, [lastSelections, generateMythology]);

  const reset = useCallback(() => {
    setGenerationState({
      hasStarted: false,
      isLoading: false,
      result: null,
      mood: 'standard'
    });
    setLastSelections(null);
    setLastAIResponse(null);
    setStreamingText('');
    streamBufferRef.current = '';
    streamLastEmitRef.current = 0;
  }, []);


  const regenerateSpecificSections = async (sections: string[]) => {
    setRecoveryStatus(null); // Close alert
    setGenerationState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const currentResult = lastAIResponse;
      if (!currentResult) {
        throw new Error('No current result to extend');
      }
      
      if (!aiConfig) {
        throw new Error('AI config is required for regenerating sections');
      }
      const newSections = await generateMissingSections(sections, currentResult, aiConfig);
      
      const updatedResponse: ComprehensiveAIResponse = {
        ...currentResult,
        ...newSections
      };
      
      const updatedResult = convertToLegacyFormat(updatedResponse);
      
      setLastAIResponse(updatedResponse);
      setGenerationState(prev => ({
        ...prev,
        isLoading: false,
        result: updatedResult
      }));
      
      if (import.meta.env.DEV) {
        logger.debug('Sections completed', { count: sections.length });
      }
      
    } catch (error) {
      setGenerationState(prev => ({ ...prev, isLoading: false }));
      logger.error('Error regenerating sections', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  const acceptPartialResult = () => {
    setRecoveryStatus(null);
    if (import.meta.env.DEV) {
      logger.debug('Partial result accepted by user');
    }
  };

  const cancelGeneration = useCallback(() => {
    setGenerationState(prev => ({
      ...prev,
      isLoading: false
    }));
    setStreamingText('');
    streamBufferRef.current = '';
    streamLastEmitRef.current = 0;
    if (import.meta.env.DEV) {
      logger.debug('Generation cancelled by user');
    }
  }, []);

  return {
    generationState,
    generateMythology,
    regenerateWithMood,
    reset,
    streamingText,
    cancelGeneration,
    regenerateSpecificSections,
    acceptPartialResult,
    recoveryStatus
  };
};


