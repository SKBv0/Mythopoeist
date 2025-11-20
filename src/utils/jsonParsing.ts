import { ComprehensiveAIResponse } from '@/types/mythology';
import {
  DEFAULT_MIN_ENTITIES,
  DEFAULT_MIN_LOCATIONS,
  DEFAULT_MIN_VOCABULARY,
  DEFAULT_MIN_TIMELINE_EVENTS,
  DEFAULT_ENTITIES,
  DEFAULT_LOCATIONS,
  DEFAULT_VOCABULARY
} from '@/constants/defaults';

const performAdvancedJSONCompletion = (incompleteJson: string): string => {
  let cleaned = incompleteJson.trim();

  const jsonStartPatterns = [
    /^.*?```json\s*/i,
    /^.*?here's the json:?\s*/i,
    /^.*?json response:?\s*/i,
    /^.*?response:?\s*/i,
    /^[^{]*/
  ];

  for (const pattern of jsonStartPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[0]) {
      const remainingAfterMatch = cleaned.substring(match[0].length);
      if (remainingAfterMatch.trim().startsWith('{')) {
        cleaned = remainingAfterMatch.trim();
        break;
      }
    }
  }

  cleaned = cleaned.replace(/```\s*$/, '').trim();

  if (!cleaned.startsWith('{')) {
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace !== -1) {
      cleaned = cleaned.substring(firstBrace);
    } else {
      return '{"story":{"text":"","mood":"","theme":""},"entities":[],"worldMap":{"locations":[],"paths":[]},"analysis":{"timeline":[],"symbols":[],"characters":[]},"ancientLanguage":{"vocabulary":[],"name":""},"socialCode":{"values":[],"customs":[]}}';
    }
  }

  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    return completeIncompleteStructure(cleaned);
  }
};

const completeIncompleteStructure = (incompleteJson: string): string => {
  let working = incompleteJson.trim();

  const braceStack: string[] = [];
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < working.length; i++) {
    const char = working[i];

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
        braceStack.push('object');
      } else if (char === '[') {
        braceStack.push('array');
      } else if (char === '}' && braceStack.length > 0) {
        braceStack.pop();
      } else if (char === ']' && braceStack.length > 0) {
        braceStack.pop();
      }
    }
  }

  while (braceStack.length > 0) {
    const context = braceStack.pop();
    if (context === 'object') {
      if (working.trim().endsWith(':')) {
        working += '""';
      } else if (working.trim().endsWith(',')) {
        working = working.trim().slice(0, -1);
      }
      working += '}';
    } else if (context === 'array') {
      if (working.trim().endsWith(',')) {
        working = working.trim().slice(0, -1);
      }
      working += ']';
    }
  }

  try {
    const parsed = JSON.parse(working);
    return JSON.stringify(ensureCompleteStructure(parsed), null, 0);
  } catch {
    return '{"story":{"text":"Incomplete response received","mood":"mystical","theme":"mystery"},"entities":[{"type":"character","name":"Unknown","description":"Response was incomplete"}],"worldMap":{"locations":[{"name":"Unknown Land","type":"realm","description":"Mysterious realm"}],"paths":[]},"analysis":{"timeline":[{"event":"Story incomplete","period":"unknown"}],"symbols":[{"symbol":"...","meaning":"Incomplete"}],"characters":[{"name":"Unknown","role":"mysterious"}]},"ancientLanguage":{"vocabulary":[{"word":"mysteries","meaning":"unknown","pronunciation":"unknown"}],"name":"Ancient Tongue"},"socialCode":{"values":["mystery"],"customs":["unknown"]}}';
  }
};

export const ensureCompleteStructure = (parsed: Partial<ComprehensiveAIResponse>, thresholds?: {
  minEntities: number;
  minLocations: number;
  minVocabulary: number;
  minTimelineEvents: number;
}): ComprehensiveAIResponse => {
  const MIN_ENTITIES = thresholds?.minEntities ?? DEFAULT_MIN_ENTITIES;
  const MIN_LOCATIONS = thresholds?.minLocations ?? DEFAULT_MIN_LOCATIONS;
  const MIN_VOCABULARY = thresholds?.minVocabulary ?? DEFAULT_MIN_VOCABULARY;
  const MIN_TIMELINE_EVENTS = thresholds?.minTimelineEvents ?? DEFAULT_MIN_TIMELINE_EVENTS;

  const parsedEntities = Array.isArray(parsed?.entities) ? parsed.entities : undefined;
  const parsedLocations = Array.isArray(parsed?.worldMap?.locations) ? parsed.worldMap.locations : undefined;
  const parsedTimeline = Array.isArray(parsed?.analysis?.timeline) ? parsed.analysis.timeline : undefined;
  const parsedSymbols = Array.isArray(parsed?.analysis?.symbols) ? parsed.analysis.symbols : undefined;
  const parsedCharacters = Array.isArray(parsed?.analysis?.characters) ? parsed.analysis.characters : undefined;
  const parsedVocabulary = Array.isArray(parsed?.ancientLanguage?.vocabulary) ? parsed.ancientLanguage.vocabulary : undefined;

  const base = {
    story: {
      text: parsed?.story?.text || "A legend was born from the cosmic void...",
      mood: "mystical",
      theme: "creation",
      title: parsed?.story?.title || "The Unnamed Legend"
    },
    entities: parsedEntities && parsedEntities.length >= MIN_ENTITIES ? parsedEntities : DEFAULT_ENTITIES,
    worldMap: {
      locations: parsedLocations && parsedLocations.length >= MIN_LOCATIONS ? parsedLocations : DEFAULT_LOCATIONS,
      paths: [],
      mapDescription: "A realm shaped by legend",
      totalArea: "Infinite"
    },
    analysis: {
      timeline: parsedTimeline && parsedTimeline.length >= MIN_TIMELINE_EVENTS ? parsedTimeline : [
        { id: "beginning", step: 1, title: "The Dawn", description: "When all things began" },
        { id: "rise", step: 2, title: "The Rising", description: "When powers awakened and forces stirred" },
        { id: "conflict", step: 3, title: "The Great Conflict", description: "When opposing forces clashed and the world trembled" },
        { id: "transformation", step: 4, title: "The Transformation", description: "When the world changed forever" },
        { id: "resolution", step: 5, title: "The New Order", description: "When balance was restored and a new age began" }
      ],
      symbols: parsedSymbols && parsedSymbols.length > 0 ? parsedSymbols : [
        { symbol: "The Circle", target: "Eternal cycles" }
      ],
      characters: parsedCharacters && parsedCharacters.length > 0 ? parsedCharacters : [
        { name: "The Protagonist", role: "hero" }
      ],
      archetypeConflicts: [],
      thematicDensity: [],
      socialCode: { sacred: "Truth", forbidden: "Falsehood", forgivable: "Mistakes" }
    },
    ancientLanguage: {
      vocabulary: parsedVocabulary && parsedVocabulary.length >= MIN_VOCABULARY ? parsedVocabulary : DEFAULT_VOCABULARY,
      languageName: "Ancient Tongue",
      description: "The language of legends",
      writingSystem: "Symbolic"
    },
    extras: {
      rituals: [],
      temples: [],
      prophecies: [],
      artifacts: []
    }
  };

  const merge = (target: Record<string, any>, source: Record<string, any>): Record<string, any> => {
    for (const key in source) {
      if (Array.isArray(source[key])) {
        target[key] = Array.isArray(target[key]) && target[key].length > 0 ? target[key] : source[key];
      } else if (source[key] && typeof source[key] === 'object') {
        target[key] = target[key] && typeof target[key] === 'object' ? target[key] : {};
        merge(target[key], source[key]);
      } else {
        target[key] = source[key] !== undefined && source[key] !== "" ? source[key] : target[key];
      }
    }
    return target;
  };

  return merge(parsed || {}, base) as ComprehensiveAIResponse;
};

export const fixJSONCommonIssues = (text: string): string => {
  return text
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
    .replace(/:\s*'([^']*)'/g, ': "$1"')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
};

const tryParseJson = (candidate?: string | null): Partial<ComprehensiveAIResponse> | null => {
  if (!candidate) {
    return null;
  }

  try {
    return JSON.parse(candidate) as Partial<ComprehensiveAIResponse>;
  } catch {
    return null;
  }
};

export const parseJSONWithStrategies = (aiText: string): Partial<ComprehensiveAIResponse> | null => {
  const trimmed = (aiText ?? '').trim();

  const directMatch = trimmed.match(/\{[\s\S]*\}/);
  if (directMatch) {
    const parsed = tryParseJson(directMatch[0]);
    if (parsed) return parsed;
    try {
      const completed = performAdvancedJSONCompletion(directMatch[0]);
      const completedParsed = tryParseJson(completed);
      if (completedParsed) return completedParsed;
    } catch {}
  }

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    const parsed = tryParseJson(codeBlockMatch[1]);
    if (parsed) return parsed;
    try {
      const completed = performAdvancedJSONCompletion(codeBlockMatch[1]);
      const completedParsed = tryParseJson(completed);
      if (completedParsed) return completedParsed;
    } catch {}
  }

  const firstBraceIndex = trimmed.indexOf('{');
  const lastBraceIndex = trimmed.lastIndexOf('}');
  if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
    const between = trimmed.substring(firstBraceIndex, lastBraceIndex + 1);
    const parsed = tryParseJson(between);
    if (parsed) return parsed;
    try {
      const completed = performAdvancedJSONCompletion(between);
      const completedParsed = tryParseJson(completed);
      if (completedParsed) return completedParsed;
    } catch {}
  }

  const fixedText = fixJSONCommonIssues(trimmed);
  const fixedMatch = fixedText.match(/\{[\s\S]*\}/);
  if (fixedMatch) {
    const parsed = tryParseJson(fixedMatch[0]);
    if (parsed) return parsed;
    try {
      const completed = performAdvancedJSONCompletion(fixedMatch[0]);
      const completedParsed = tryParseJson(completed);
      if (completedParsed) return completedParsed;
    } catch {}
  }

  return null;
};

