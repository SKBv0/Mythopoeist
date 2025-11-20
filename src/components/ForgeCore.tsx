import { useState, useMemo, useEffect } from 'react';
import { Sparkles, FileText, Crown, MapPin, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GenerationState, MythologySelections } from '@/types/mythology';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingParticles } from './FloatingParticles';
import { AnimatedStoryText } from './AnimatedStoryText';
import { MythicalEntityCard } from './MythicalEntityCard';
import { FantasyMap } from './FantasyMap';
import { AncientLanguage } from './AncientLanguage';
import { getCulturalSignificance } from '@/utils/locationUtils';
import { cn } from '@/lib/utils';
import './ForgeCore.css';
import { LoadingMythState } from './LoadingMythState';

interface ForgeCoreProps {
  isGenerationReady: boolean;
  generationState: GenerationState;
  onGenerate: () => void;
  selections: MythologySelections;
}

const ResultState = ({ result }: { 
  result: GenerationState['result']
}) => {
  const [activeTab, setActiveTab] = useState("legend");
  const cleanedLegendText = useMemo(() => {
    const storyText = result?.storyText ?? '';
    if (!storyText.trim()) return '';

    const normalized = storyText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    let cleaned = normalized.replace(/^\s*new\s+myth\s*(\n+|$)/i, '').trimStart();
    cleaned = cleaned.replace(/\n\s*new\s+myth\s*\n/i, '\n');
    cleaned = cleaned.replace(/\n\s*new\s+myth\s*$/i, '');
    
    return cleaned.trim();
  }, [result?.storyText]);

  useEffect(() => {
    const handleSwitchToMap = (_event: Event) => {
      setActiveTab("worldmap");
    };

    window.addEventListener('switchToMapTab', handleSwitchToMap);
    return () => {
      window.removeEventListener('switchToMapTab', handleSwitchToMap);
    };
  }, []);

  return (
    <motion.div 
      key="result" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="h-full flex flex-col"
    >
      <div className="relative flex-1">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(124,58,237,0.1),transparent_50%)]" />
        
        {/* Main content */}
        <div className="relative h-full p-6">


          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-shrink-0 mb-4">
            <TabsList className="grid w-full grid-cols-4 bg-[var(--color-panel-background)] border border-[var(--color-border-secondary)] gap-0.5">
              <TabsTrigger 
                value="legend" 
                className="text-[var(--color-text-secondary)] data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:bg-[var(--color-highlight-secondary)] font-['Cinzel']"
              >
                <FileText className="w-4 h-4 mr-1" />
                Legend
              </TabsTrigger>
              <TabsTrigger 
                value="entities" 
                className="text-[var(--color-text-secondary)] data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:bg-[var(--color-highlight-secondary)] font-['Cinzel']"
              >
                <Crown className="w-4 h-4 mr-1" />
                Entities
              </TabsTrigger>
              <TabsTrigger 
                value="worldmap" 
                className="text-[var(--color-text-secondary)] data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:bg-[var(--color-highlight-secondary)] font-['Cinzel']"
              >
                <MapPin className="w-4 h-4 mr-1" />
                Map
              </TabsTrigger>
              <TabsTrigger 
                value="language" 
                className="text-[var(--color-text-secondary)] data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:bg-[var(--color-highlight-secondary)] font-['Cinzel']"
              >
                <Languages className="w-4 h-4 mr-1" />
                Ancient Language
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 min-h-0 relative">
            <TabsContent value="legend" className="absolute inset-0 m-0">
              <div className="h-full overflow-y-scroll epic-scroll bg-[var(--color-panel-background)] rounded-xl border border-[var(--color-border-secondary)] p-6">
                <div className="epic-script max-w-4xl mx-auto legendary-text">
                  <div className="legend-body">
                    <AnimatedStoryText 
                      text={cleanedLegendText} 
                      onComplete={() => {}}
                      className="legend-body-content"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="entities" className="absolute inset-0 m-0">
              <div className="h-full overflow-y-scroll epic-scroll p-3">
                <div className="entities-grid w-full">
                  {(result?.entities || result?.analysis?.entities || []).map((entity, index) => (
                    <MythicalEntityCard 
                      key={entity.id || `entity-${index}`}
                      entity={entity} 
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="worldmap" className="absolute inset-0 m-0">
              <div className="h-full overflow-y-scroll epic-scroll">
                {(() => {
                  const mappedLocations = (result?.analysis?.locations || []).map((loc, index) => {
                    const regions = ['MAIN_CONTINENT', 'NORTH_ISLES', 'EAST_CONTINENT', 'SOUTH_CONTINENT', 'WEST_ISLES'];
                    const regionIndex = index % regions.length;
                    const region = regions[regionIndex];
                    
                    const hash = (loc.name || '').split('').reduce((a, b) => {
                      a = ((a << 5) - a) + b.charCodeAt(0);
                      return a & a;
                    }, 0);
                    
                    const offsetX = -12 + (Math.abs(hash) % 1000) / 1000 * 24; // -12 to +12
                    const offsetY = -8 + (Math.abs(hash >> 10) % 1000) / 1000 * 16; // -8 to +8

                    const locationRituals = result?.analysis?.rituals?.filter(ritual => 
                      ritual.toLowerCase().includes((loc.name || '').toLowerCase()) ||
                      (loc.description || '').toLowerCase().includes(ritual.toLowerCase())
                    ) || [];

                    const generateCulturalSymbols = (type: string, description: string): string[] => {
                      const symbols: string[] = [];
                      const lowerType = (type || '').toLowerCase();
                      const lowerDesc = (description || '').toLowerCase();
                      
                      if (lowerType.includes('mountain') || lowerDesc.includes('mountain')) symbols.push('mountain');
                      if (lowerType.includes('water') || lowerType.includes('sea') || lowerType.includes('river') || 
                          lowerDesc.includes('water') || lowerDesc.includes('sea')) symbols.push('water');
                      if (lowerType.includes('forest') || lowerType.includes('tree') || lowerDesc.includes('forest')) symbols.push('tree');
                      if (lowerType.includes('fire') || lowerType.includes('volcano') || lowerDesc.includes('fire')) symbols.push('fire');
                      if (lowerType.includes('star') || lowerType.includes('celestial') || lowerDesc.includes('star')) symbols.push('star');
                      if (lowerType.includes('temple') || lowerType.includes('sacred')) symbols.push('sun');
                      if (lowerType.includes('dark') || lowerType.includes('shadow')) symbols.push('moon');
                      if (lowerType.includes('spiral') || lowerDesc.includes('spiral')) symbols.push('spiral');
                      if (lowerType.includes('crown') || lowerType.includes('royal') || lowerDesc.includes('king')) symbols.push('crown');
                      if (lowerType.includes('eye') || lowerType.includes('oracle') || lowerDesc.includes('vision')) symbols.push('eye');
                      
                      return symbols.length > 0 ? symbols : ['star']; // Default symbol
                    };

                    const culturalSignificance = getCulturalSignificance(loc.type || '', loc.description || '');
                    
                    return {
                      ...loc,
                      id: `loc-${index}`,
                      region: region,
                      offset: {
                        x: offsetX,
                        y: offsetY
                      },
                      culturalSignificance,
                      socialCode: culturalSignificance !== 'neutral' ? {
                        sacred: result?.analysis?.socialCode?.sacred || 'Unknown sacred principles',
                        forbidden: result?.analysis?.socialCode?.forbidden || 'Unknown forbidden acts',
                        forgivable: result?.analysis?.socialCode?.forgivable || 'Unknown forgivable actions'
                      } : undefined,
                      rituals: locationRituals.length > 0 ? locationRituals : undefined,
                      culturalSymbols: generateCulturalSymbols(loc.type, loc.description),
                      mythologicalConnection: `Part of the ${result?.storyText?.split(' ').slice(0, 10).join(' ') || 'ancient legend'}...`
                    };
                  });

                  if (mappedLocations.length === 0) {
                    return (
                      <div className="w-full h-[70vh] min-h-[400px] flex items-center justify-center">
                        <p className="text-slate-400 text-sm font-['Cinzel']">No world map data available.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="w-full h-[70vh] min-h-[600px] mb-8">
                      <FantasyMap locations={mappedLocations} />
                    </div>
                  );
                })()}
              </div>
            </TabsContent>

            <TabsContent value="language" className="absolute inset-0 m-0">
              <div className="h-full overflow-y-scroll epic-scroll">
                <AncientLanguage 
                  vocabulary={(result?.ancientLanguage?.vocabulary || result?.analysis?.ancientLanguage?.vocabulary || [])}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  </motion.div>
  );
};

const ReadyState = ({ onGenerate }: { onGenerate: () => void }) => {
  return (
    <motion.div 
      key="ready" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="h-full flex flex-col items-center justify-center relative"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_70%)]" />
      <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,rgba(124,58,237,0.05)_0%,transparent_25%,transparent_75%,rgba(124,58,237,0.05)_100%)]" />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-lg"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200 bg-clip-text text-transparent">
            Destiny Pen Ready
          </h2>
          <p className="mt-4 text-lg text-purple-200/80">
            Sources gathered, seals broken. Speak the final word to create a new legend.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={onGenerate} 
              className={cn(
                "bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg px-8 py-6 rounded-full",
                "shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]",
                "transition-all duration-300"
              )}
            >
              <Sparkles className="w-6 h-6 mr-3" />
              Forge the Legend
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const InitialState = () => (
  <motion.div 
    key="initial" 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    className="h-full flex flex-col items-center justify-center relative"
  >
    {/* Background effects */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_70%)]" />
    
    {/* Main content */}
    <div className="relative z-10 flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-lg"
      >
        <h2 className="text-3xl font-bold text-slate-200">
          Altar Awaits
        </h2>
        <p className="mt-4 text-lg text-slate-400">
          Listen to the whispers of the cosmos and select sources to plant the seeds of legend.
        </p>
      </motion.div>
    </div>
  </motion.div>
);

export const ForgeCore = ({ 
  isGenerationReady, 
  generationState, 
  onGenerate, 
  selections
}: ForgeCoreProps) => {
  const renderContent = () => {
    if (generationState.isLoading) {
      return (
        <LoadingMythState
          stars={[]}
          selections={selections}
          selectionOrder={[]}
          streamingText=""
          progress={generationState.progress}
        />
      );
    }

    if (generationState.result) {
      return (
        <ResultState 
          result={generationState.result}
        />
      );
    }

    if (isGenerationReady) {
      return <ReadyState onGenerate={onGenerate} />;
    }

    return <InitialState />;
  }

  return (
    <div className="h-full flex flex-col relative bg-slate-950/90 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
      <FloatingParticles />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </div>
  );
}; 