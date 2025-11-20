import { MythicPlayground } from "@/components/MythicPlayground";
import { StoryViewer } from "@/components/StoryViewer";
import { LoadingMythState } from "@/components/LoadingMythState";
import { useMythologyGenerator } from "@/hooks/useMythologyGenerator";
import { useAISettings } from "@/hooks/useAISettings";
import { CATEGORY_COLORS, CATEGORY_GLOWS, DEFAULTS } from "@/constants/ui";
import { MythologySelections, CustomDescriptions, Star as StarType } from "@/types/mythology";
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/useToast';

interface Star extends Omit<StarType, 'vx' | 'vy'> {
  categoryKey: string;
  category?: {
    key: keyof MythologySelections;
    title: string;
    icon: React.ElementType;
    color: string;
    glow: string;
    options?: Array<{ id: string; name: string; description: string }>;
  };
  vx: number;
  vy: number;
  duration?: number;
  delay?: number;
}


const DEFAULT_CUSTOM_DESCRIPTIONS = [
  'Create your own unique cosmological system.',
  'Create your own unique cosmological origin story.',
  'Design your own divine beings and pantheon.',
  'Design your own divine hierarchy or pantheon.',
  'Invent your own mythical creatures and entities.',
  'Develop your own archetypal character.',
  'Design your own character archetype or role.',
  'Explore your own thematic element or concept.',
  'Create your own meaningful symbol or motif.',
  'Design your own social rules or cultural norms.'
] as const;

const extractCustomDescriptions = (
  selections: MythologySelections,
  starPositions: Star[]
): CustomDescriptions => {
  const customDescriptions: CustomDescriptions = {};

  Object.entries(selections).forEach(([category, blockId]) => {
    if (blockId.includes('-custom')) {
      const star = starPositions.find(s => s.id === blockId);
      if (star?.description && !DEFAULT_CUSTOM_DESCRIPTIONS.includes(star.description as typeof DEFAULT_CUSTOM_DESCRIPTIONS[number])) {
        customDescriptions[category as keyof CustomDescriptions] = star.description;
      }
    }
  });

  return customDescriptions;
};

const Index = () => {
  const { toast } = useToast();
  const { aiConfig, handleActiveProviderChange, handleProviderConfigChange } = useAISettings();

  const {
    generationState,
    generateMythology,
    reset,
    streamingText,
    recoveryStatus,
    regenerateSpecificSections,
    acceptPartialResult
  } = useMythologyGenerator(aiConfig);

  const [selections, setSelections] = useState<MythologySelections>({
    cosmology: '',
    gods: '',
    beings: '',
    archetype: '',
    themes: '',
    symbols: '',
    socialcodes: '',
  });

  const [capturedStarPositions, setCapturedStarPositions] = useState<Star[]>([]);
  const starPositionsRef = useRef<Star[]>([]);
  const selectionOrderRef = useRef<string[]>([]);

  const isGenerationReady = Object.values(selections).filter(Boolean).length >= 2;
  const interpretiveWarning = Object.values(selections).filter(Boolean).length === 1 ? "You must select at least one more star..." : null;

  const handleSelectionMade = (category: string, value: string) => {
    setSelections(prev => ({ ...prev, [category]: value }));
  };

  const handleGenerate = async () => {
    const selectedBlocks = Object.values(selections).filter(Boolean);

    if (selectedBlocks.length < 2) {
      return;
    }

    setCapturedStarPositions(starPositionsRef.current);

    try {
      const customDescriptions = extractCustomDescriptions(selections, starPositionsRef.current);

      await generateMythology(selections, customDescriptions);
    } catch (error) {
      logger.error('Mythology generation failed', error instanceof Error ? error : new Error(String(error)));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        variant: 'destructive',
        title: 'Generation failed',
        description: errorMessage
      });

      reset();
    }
  };


  const handleCaptureStarPositions = (positions: Array<{
    id: string;
    categoryKey: string | number | keyof MythologySelections;
    x: number;
    y: number;
    name?: string;
    description?: string;
    vx?: number;
    vy?: number;
    category?: {
      color: string;
      glow: string;
    };
  }>, order: string[]) => {
    const convertedPositions: Star[] = positions.map(pos => {
      const categoryKey = String(pos.categoryKey || '');
      const categoryStyle = getCategoryStyle(categoryKey);
      return {
        id: pos.id,
        name: pos.name || pos.id,
        description: pos.description || '',
        categoryKey,
        x: pos.x,
        y: pos.y,
        vx: pos.vx ?? 0,
        vy: pos.vy ?? 0,
        category: pos.category ? {
          key: categoryKey as keyof MythologySelections,
          title: categoryKey,
          icon: () => null,
          color: pos.category.color,
          glow: pos.category.glow
        } : {
          key: categoryKey as keyof MythologySelections,
          title: categoryKey,
          icon: () => null,
          color: categoryStyle.color,
          glow: categoryStyle.glow
        }
      };
    });
    starPositionsRef.current = convertedPositions;
    selectionOrderRef.current = order;
    setCapturedStarPositions(convertedPositions);
  };

  const isStoryGenerated = generationState.hasStarted && generationState.result;
  const isGenerating = generationState.isLoading;

  const getSelectedStarsForLoading = () => {
    if (starPositionsRef.current.length === 0) return [];

    const orderMap = new Map(selectionOrderRef.current.map((id, index) => [id, index]));

    return starPositionsRef.current
      .filter(star => selections[star.categoryKey] === star.id)
      .sort((a, b) => (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER))
      .map(star => {
        const style = getCategoryStyle(star.categoryKey);
        return {
          id: star.id,
          x: star.x,
          y: star.y,
          categoryKey: String(star.categoryKey),
          category: style
        };
      });
  };

  const getCategoryStyle = (categoryKey: string | number) => {
    const keyStr = String(categoryKey);
    return {
      color: CATEGORY_COLORS[keyStr as keyof typeof CATEGORY_COLORS] || DEFAULTS.DEFAULT_COLOR,
      glow: CATEGORY_GLOWS[keyStr as keyof typeof CATEGORY_GLOWS] || DEFAULTS.DEFAULT_GLOW
    };
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* MythicPlayground - always mounted, only hide with opacity */}
      <motion.div 
        className="relative"
        animate={{ 
          opacity: (!isGenerating && !isStoryGenerated) ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
        style={{ 
          pointerEvents: (!isGenerating && !isStoryGenerated) ? 'auto' : 'none',
          zIndex: (!isGenerating && !isStoryGenerated) ? 10 : 5
        }}
      >
        <MythicPlayground 
          selections={selections}
          onSelectionMade={handleSelectionMade}
          isGenerationReady={isGenerationReady}
          onGenerate={handleGenerate}
          onCaptureStarPositions={handleCaptureStarPositions}
          isGenerating={generationState.isLoading}
          aiConfig={aiConfig}
          onActiveProviderChange={handleActiveProviderChange}
          onProviderConfigChange={handleProviderConfigChange}
        />
        {interpretiveWarning && !generationState.isLoading && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-long">
            <div className="bg-slate-800/80 backdrop-blur-sm text-slate-300 text-sm rounded-full px-4 py-2 shadow-lg border border-slate-700">
              {interpretiveWarning}
            </div>
          </div>
        )}
      </motion.div>

      {/* LoadingMythState */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            key="loading-myth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-20"
          >
            <LoadingMythState
              stars={getSelectedStarsForLoading()}
              selections={selections}
              selectionOrder={selectionOrderRef.current}
              streamingText={streamingText}
              progress={generationState.progress}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* StoryViewer */}
      <AnimatePresence>
        {isStoryGenerated && (
          <motion.div
            key="story-viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-30"
          >
            <StoryViewer 
              generationState={generationState} 
              selections={selections}
              isGenerationReady={isGenerationReady}
              onGenerate={handleGenerate}
              stars={capturedStarPositions}
              selectionOrder={selectionOrderRef.current}
              recoveryStatus={recoveryStatus}
              onRegenerateSections={regenerateSpecificSections}
              onAcceptPartialResult={acceptPartialResult}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { Index };