import { ComprehensiveAIResponse } from '@/types/mythology';
import { CustomDescriptions } from '@/types/mythology';
import { logger } from './logger';
import { VALIDATION_CONSTANTS } from '@/constants/defaults';

export const validateFidelity = (aiResponse: ComprehensiveAIResponse, customDescriptions: CustomDescriptions): {
  isValid: boolean;
  missingFeatures: string[];
  fidelityScore: number;
} => {
  const missingFeatures: string[] = [];
  const storyText = aiResponse.story?.text?.toLowerCase() || '';
  
  const extractKeyTerms = (text: string): string[] => {
    return text.toLowerCase()
      .split(/[.,!?;:\s]+/)
      .filter(word => word.length >= VALIDATION_CONSTANTS.MIN_WORD_LENGTH)
      .filter(word => /[a-z]/.test(word));
  };
  
  const findSynonym = (term: string, text: string): boolean => {
    const synonymMap: Record<string, string[]> = {
      'seeks': ['desires', 'wants', 'pursues', 'yearns', 'longs', 'strives'],
      'craves': ['desires', 'wants', 'yearns', 'longs', 'hungers', 'thirsts'],
      'creates': ['generates', 'makes', 'forms', 'produces', 'brings', 'manifests', 'creates', 'fashions', 'shapes', 'crafts'],
      'create': ['generates', 'makes', 'forms', 'produces', 'brings', 'manifests', 'creates', 'fashions', 'shapes', 'crafts'],
      'become': ['transform', 'turn', 'evolve', 'change', 'develop'],
      'come': ['arrive', 'appear', 'emerge', 'manifest', 'surface'],
      'shapeshifting': ['transformation', 'morphing', 'changing', 'shifting'],
      'overlapping': ['intersecting', 'crossing', 'merging', 'blending'],
      'emotion': ['feeling', 'sentiment', 'mood', 'affect'],
      'creatures': ['beings', 'entities', 'monsters', 'beasts', 'creatures'],
      'unique': ['distinct', 'special', 'original', 'one-of-a-kind', 'unprecedented', 'novel'],
      'mythological': ['mythic', 'legendary', 'mythical', 'ancient', 'mythological'],
    };
    
    const synonyms = synonymMap[term] || [];
    if (text.includes(term.toLowerCase())) {
      return true;
    }
    return synonyms.some(synonym => text.includes(synonym.toLowerCase()));
  };
  
  Object.entries(customDescriptions).forEach(([category, description]) => {
    if (description) {
      const keyTerms = extractKeyTerms(description);
      keyTerms.forEach(term => {
        const termFound = storyText.includes(term.toLowerCase()) || findSynonym(term, storyText);
        if (!termFound) {
          missingFeatures.push(`${category}: "${term}"`);
        }
      });
    }
  });
  
  const totalTerms = Object.values(customDescriptions)
    .filter(Boolean)
    .map(desc => extractKeyTerms(desc!))
    .flat().length;

  const foundTerms = totalTerms - missingFeatures.length;

  const fidelityScore = totalTerms > 0 ? (foundTerms / totalTerms) * 100 : 100;
  
  if (import.meta.env.DEV) {
    logger.debug('🔍 Fidelity Validation', {
      totalKeyTerms: totalTerms,
      foundTerms: foundTerms,
      missingFeatures: missingFeatures.length > 0 ? missingFeatures : 'None',
      fidelityScore: `${fidelityScore.toFixed(1)}%`
    });
  }
  
  return {
    isValid: totalTerms === 0 ? true : fidelityScore >= VALIDATION_CONSTANTS.MIN_FIDELITY_SCORE,
    missingFeatures,
    fidelityScore
  };
};

