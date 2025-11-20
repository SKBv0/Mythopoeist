import { MythologySelections, CustomDescriptions, MythMood } from '@/types/mythology';
import { mythBlocks } from '@/data/myth-blocks';
import { DEFAULT_MIN_STORY_WORD_COUNT, DEFAULT_MIN_ENTITIES, DEFAULT_MIN_LOCATIONS, DEFAULT_MIN_VOCABULARY, DEFAULT_MIN_TIMELINE_EVENTS, PROMPT_LIMITS } from '@/constants/defaults';

const getMoodDescriptions = (): Record<MythMood, string> => ({
  mystical: 'balanced and classic mythological style',
  gothic: 'in a dark and mysterious atmosphere, with gothic elements',
  fairytale: 'in a fairytale style, suitable for children',
  scifi: 'adding science fiction elements, with a futuristic approach',
  romantic: 'highlighting romantic elements, with a love theme',
  dramatic: 'with intense emotional conflicts and dramatic events',
  dark: 'with a pessimistic and dark tone',
  light: 'in an optimistic and bright atmosphere',
  epic: 'epic and large-scale',
  tragic: 'with a tragic end and sadness',
  comic: 'with funny and humorous elements',
  mysterious: 'with mysterious and enigmatic elements',
  heroic: 'with heroic and valiant themes',
  hopeful: 'with hopeful and optimistic themes',
  ancient: 'with ancient and timeless themes',
  standard: 'in a standard mythological style'
});

const getBlockInfo = (
  category: keyof MythologySelections,
  blockId: string
): { name: string; description: string } => {
  const categoryBlocks = mythBlocks[category] || [];
  const block = categoryBlocks.find((b) => b.id === blockId);
  return {
    name: block?.name || blockId,
    description: block?.description || ''
  };
};

const buildSelectionText = (
  category: keyof MythologySelections,
  selectionId: string,
  customDescriptions?: CustomDescriptions
): string => {
  const { name, description } = getBlockInfo(category, selectionId);
  
  const customDesc = customDescriptions?.[category];
  if (selectionId.includes('-custom') && customDesc) {
    return `${name}: ${description}\n\n⚠️ MANDATORY CUSTOM REQUIREMENT: "${customDesc}"`;
  }
  return `${name}: ${description}`;
};

const formatSelectionsForPrompt = (
  selections: MythologySelections,
  customDescriptions?: CustomDescriptions
): string => {
  return Object.entries(selections)
    .filter(([_, value]) => value)
    .map(([category, blockId]) => {
      const { name, description } = getBlockInfo(category as keyof MythologySelections, blockId);
      const customDesc = customDescriptions?.[category as keyof MythologySelections];
      if (blockId.includes('-custom') && customDesc) {
        return `${name}: ${description}\n\n⚠️ MANDATORY CUSTOM REQUIREMENT: "${customDesc}"`;
      }
      return `${name}: ${description}`;
    })
    .join('\n');
};

export const createStoryPrompt = (
  selections: MythologySelections,
  customDescriptions: CustomDescriptions = {},
  mood: MythMood = 'mystical',
  customPrompt?: string
): string => {
  if (customPrompt && customPrompt.trim()) {
    return customPrompt
      .replace(/{SELECTIONS}/g, formatSelectionsForPrompt(selections, customDescriptions))
      .replace(/{MOOD}/g, mood);
  }

  const moodDescriptions = getMoodDescriptions();

  return `You are a creative myth creator. Create a COMPLETELY ORIGINAL mythological story and entities.

SELECTIONS:
- Cosmology: ${buildSelectionText('cosmology', selections.cosmology, customDescriptions)}
- Gods: ${buildSelectionText('gods', selections.gods, customDescriptions)}
- Beings: ${buildSelectionText('beings', selections.beings, customDescriptions)}
- Archetype: ${buildSelectionText('archetype', selections.archetype, customDescriptions)}
- Themes: ${buildSelectionText('themes', selections.themes, customDescriptions)}
- Symbols: ${buildSelectionText('symbols', selections.symbols, customDescriptions)}
- Social Codes: ${buildSelectionText('socialcodes', selections.socialcodes, customDescriptions)}

STYLE: ${moodDescriptions[mood]}

🚫 FORBIDDEN: Zeus, Thor, Odin, Ra, Atlas, Helios, Selene, Anubis, Shiva, Buddha, Jesus, Muhammad and ALL known mythological names!

✅ PHASE 1 REQUIREMENTS:
1. Create a complete mythological STORY (minimum ${DEFAULT_MIN_STORY_WORD_COUNT} words) with title and text
2. Create at least ${DEFAULT_MIN_ENTITIES} ENTITIES with full details (name, type, description, powers, relationships)

STYLE: Rich detail, concrete scenes, sensory descriptions
- Show daily life (food, dress, dwellings), rituals, beliefs, hierarchy
- Use specific verbs, dialogue, sensory details (sight/sound/touch/smell)
- Embed 3-5 ancient words naturally (place names, titles, sacred terms)
- No abstract phrases like "mystical realm" - use concrete descriptions

Return ONLY this JSON format:
\`\`\`json
{
  "story": {
    "title": "Legend title",
    "text": "Full legend text (minimum ${DEFAULT_MIN_STORY_WORD_COUNT} words)",
    "mood": "${mood}"
  },
  "entities": [
    {
      "name": "Entity name",
      "type": "god/hero/monster/spirit/mortal/trickster/sage",
      "archetype": "Archetype",
      "description": "Detailed description",
      "powers": ["Power1", "Power2"],
      "relationships": [
        {"entityName": "Another entity name", "type": "ally", "description": "Relationship description"}
      ]
    }
  ]
}
\`\`\`

CRITICAL: Only return story and entities. Do NOT include worldMap, analysis, or ancientLanguage.`;
};

export const createRemainingComponentsPrompt = (
  story: { title: string; text: string; mood: string },
  entities: Array<{ name: string; type: string; description?: string }>,
  selections: MythologySelections,
  customPrompt?: string
): string => {
  if (customPrompt && customPrompt.trim()) {
    return customPrompt
      .replace(/{STORY}/g, `Title: ${story.title}\nText: ${story.text.substring(0, PROMPT_LIMITS.storyTextPreview)}${story.text.length > PROMPT_LIMITS.storyTextPreview ? '...' : ''}`)
      .replace(/{ENTITIES}/g, entities.map(e => `- ${e.name} (${e.type}): ${e.description?.substring(0, PROMPT_LIMITS.entityDescriptionPreview) || 'No description'}`).join('\n'))
      .replace(/{SELECTIONS}/g, formatSelectionsForPrompt(selections));
  }

  return `You are completing a mythological universe. Use the existing STORY and ENTITIES as reference.

ORIGINAL SELECTIONS:
- Cosmology: ${buildSelectionText('cosmology', selections.cosmology)}
- Gods: ${buildSelectionText('gods', selections.gods)}
- Beings: ${buildSelectionText('beings', selections.beings)}
- Archetype: ${buildSelectionText('archetype', selections.archetype)}
- Themes: ${buildSelectionText('themes', selections.themes)}
- Symbols: ${buildSelectionText('symbols', selections.symbols)}
- Social Codes: ${buildSelectionText('socialcodes', selections.socialcodes)}

EXISTING STORY:
Title: ${story.title}
Text: ${story.text.substring(0, PROMPT_LIMITS.storyTextPreview)}${story.text.length > PROMPT_LIMITS.storyTextPreview ? '...' : ''}

EXISTING ENTITIES:
${entities.map(e => `- ${e.name} (${e.type}): ${e.description?.substring(0, PROMPT_LIMITS.entityDescriptionPreview) || 'No description'}`).join('\n')}

✅ PHASE 2 REQUIREMENTS - Generate these components based on the story:
Requirements:
- worldMap: ⚠️ AT LEAST ${DEFAULT_MIN_LOCATIONS} locations (not ${DEFAULT_MIN_LOCATIONS - 1}, not ${DEFAULT_MIN_LOCATIONS - 2}, but ${DEFAULT_MIN_LOCATIONS} or more!) with terrain, climate, resources, history, sensory
- analysis: ⚠️ Timeline MUST have at least ${DEFAULT_MIN_TIMELINE_EVENTS} events (not ${DEFAULT_MIN_TIMELINE_EVENTS - 1}, not ${DEFAULT_MIN_TIMELINE_EVENTS - 2}, but ${DEFAULT_MIN_TIMELINE_EVENTS} or more!), symbols, conflicts, themes, social code
- ancientLanguage: ⚠️ CRITICAL - At least ${DEFAULT_MIN_VOCABULARY} vocabulary words (names, places, sacred terms) - THIS IS MANDATORY!

Return ONLY this JSON format:
\`\`\`json
{
  "worldMap": {
    "locations": [
      {
        "name": "Location Name",
        "type": "city/region/landmark/celestial",
        "description": "Description",
        "coordinates": {"x": 0, "y": 0},
        "importance": "major/minor",
        "terrain": "mountain/valley/coast/etc",
        "climate": "hot/cold/temperate/etc",
        "resources": ["resource1", "resource2"],
        "history": "Major event that happened here",
        "sensory": "What it looks/smells/sounds like"
      }
    ],
    "mapDescription": "Overall description",
    "totalArea": "Area description"
  },
  "analysis": {
    "timeline": [
      {"id": "id-1", "step": 1, "title": "Event 1", "description": "Description"},
      {"id": "id-2", "step": 2, "title": "Event 2", "description": "Description"},
      {"id": "id-3", "step": 3, "title": "Event 3", "description": "Description"},
      {"id": "id-4", "step": 4, "title": "Event 4", "description": "Description"},
      {"id": "id-5", "step": 5, "title": "Event 5", "description": "Description"}
    ],
    "symbols": [{"symbol": "Symbol", "target": "Meaning"}],
    "archetypeConflicts": [{"character1": "Name", "character2": "Name", "conflict": "Conflict"}],
    "thematicDensity": [{"section": "Section", "theme": "Theme"}],
    "socialCode": {
      "sacred": "Sacred rules",
      "forbidden": "Forbidden acts",
      "forgivable": "Forgivable transgressions"
    }
  },
  "ancientLanguage": {
    "languageName": "Language Name",
    "description": "Description",
    "writingSystem": "Writing system",
    "vocabulary": [
      {
        "word": "word",
        "pronunciation": "[pronunciation]",
        "meaning": "meaning",
        "category": "gods/nature/magic/emotion/social",
        "rarity": "common/rare/sacred",
        "storyUsage": "Where/how this appears in story",
        "storyContext": "Narrative context for this word",
        "importance": "main_concept/supporting/background"
      }
    ]
  }
}
\`\`\`

⚠️ CRITICAL REQUIREMENTS:
- vocabulary array MUST contain at least ${DEFAULT_MIN_VOCABULARY} items! Do NOT leave it empty!
- timeline array MUST contain at least ${DEFAULT_MIN_TIMELINE_EVENTS} events! Do NOT leave it incomplete!
- locations array MUST contain at least ${DEFAULT_MIN_LOCATIONS} locations! Do NOT leave it incomplete!
- All locations, events, and vocabulary must be consistent with the existing story and entities!`;
};

export const createEnhancedStoryPrompt = (
  selections: MythologySelections,
  customDescriptions: CustomDescriptions,
  mood: MythMood,
  missingFeatures: string[]
): string => {
  const basePrompt = createStoryPrompt(selections, customDescriptions, mood);
  
  const enhancedInstructions = `

🚨 CRITICAL RETRY INSTRUCTIONS:
The previous attempt failed to include these MANDATORY elements:
${missingFeatures.map(feature => `❌ MISSING: ${feature}`).join('\n')}

⚠️ ABSOLUTE REQUIREMENTS FOR THIS RETRY:
1. Each missing element MUST be explicitly mentioned in the story
2. Use the EXACT terminology from custom descriptions
3. DO NOT paraphrase or substitute words
4. Include ALL specific features mentioned by the user
5. Make sure entities reflect the missing features in their descriptions and powers

✅ SUCCESS CRITERIA:
- Every missing feature from the list above MUST appear in your response
- Story must explicitly mention each missing element
- Entities should embody or relate to the missing features
- Verify each requirement before finalizing

Remember: This is a RETRY because the previous version missed critical user requirements!`;

  return basePrompt + enhancedInstructions;
};

