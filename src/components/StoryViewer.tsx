import { useEffect, useState, CSSProperties, useCallback, useMemo, memo } from 'react';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GenerationState, MythologySelections, Star } from '@/types/mythology';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useMousePosition } from '@/hooks/useMousePosition';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { ANCIENT_CHARACTERS } from '@/constants/ui';
import { LogoPanel, AnalysisPanel } from './AnalysisPanels';
import { ForgeCore } from './ForgeCore';
import { RecoveryStatusAlert } from './RecoveryStatusAlert';
import './StoryViewer.css';

type UIStage = 'SELECTION' | 'READY_TO_FORGE' | 'FORGED';
type ViewMode = 'DEFAULT' | 'FULLSCREEN';

interface StoryViewerProps {
  generationState: GenerationState;
  selections: MythologySelections;
  isGenerationReady: boolean;
  onGenerate: () => void;
  stars: Star[];
  recoveryStatus?: {
    isRecovered: boolean;
    recoveredSections: string[];
    missingSections: string[];
    incompleteSections: string[];
  } | null;
  onRegenerateSections: (sections: string[]) => void | Promise<void>;
  onAcceptPartialResult: () => void;
}

const MemoizedAnalysisPanel = memo(AnalysisPanel);
const MemoizedLogoPanel = memo(LogoPanel, (prevProps, nextProps) => {
  return prevProps.stars === nextProps.stars && 
         prevProps.selections === nextProps.selections;
});
const MemoizedForgeCore = memo(ForgeCore, (prevProps, nextProps) => {
  return prevProps.isGenerationReady === nextProps.isGenerationReady &&
         prevProps.generationState === nextProps.generationState &&
         prevProps.selections === nextProps.selections;
});

export const StoryViewer = ({ 
  generationState, 
  selections, 
  isGenerationReady, 
  onGenerate, 
  stars,
  recoveryStatus,
  onRegenerateSections,
  onAcceptPartialResult
}: StoryViewerProps) => {
  const { x, y } = useMousePosition();
  const [uiStage, setUiStage] = useState<UIStage>('SELECTION');
  const [viewMode, setViewMode] = useState<ViewMode>('DEFAULT');
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const mouseAuraStyle = useMemo(() => ({
    '--x': `${x}px`,
    '--y': `${y}px`,
    background: `radial-gradient(
      800px circle at var(--x) var(--y),
      var(--color-highlight-secondary),
      transparent 40%
    )`
  } as CSSProperties), [x, y]);

  const headerClassNames = useMemo(() => cn(
    "mb-4 lg:mb-6 text-center relative flex-shrink-0",
    isMobile ? "px-4" : "px-8"
  ), [isMobile]);

  const titleClassNames = useMemo(() => cn(
    "relative font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-title)] via-[var(--color-text-primary)] to-[var(--color-text-title)] mb-2 mystical-glow",
    isMobile ? "text-2xl" : "text-3xl md:text-4xl"
  ), [isMobile]);

  const subtitleClassNames = useMemo(() => cn(
    "relative text-[var(--color-text-secondary)] font-light",
    isMobile ? "text-xs tracking-widest" : "text-sm tracking-[0.2em]"
  ), [isMobile]);

  const dividerClassNames = useMemo(() => cn(
    "relative bg-gradient-to-r from-transparent via-[var(--color-border-primary)] to-transparent mx-auto mb-2 opacity-50",
    isMobile ? "w-20 h-px" : "w-32 h-px"
  ), [isMobile]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768);
      }, 100);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timeoutId);
    };
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => {
      const newMode = prev === 'FULLSCREEN' ? 'DEFAULT' : 'FULLSCREEN';
      requestAnimationFrame(() => {
        document.body.style.overflow = newMode === 'FULLSCREEN' ? 'hidden' : 'auto';
      });
      return newMode;
    });
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const calculatedUIStage = useMemo(() => {
    if (generationState.result) return 'FORGED';
    if (isGenerationReady) return 'READY_TO_FORGE';
    return 'SELECTION';
  }, [isGenerationReady, generationState.result]);

  useEffect(() => {
    setUiStage(calculatedUIStage);
  }, [calculatedUIStage]);


  const centerColumnClasses = useMemo(() => cn(
    "h-full relative min-h-0",
    uiStage === 'FORGED' ? "lg:col-span-6" : "lg:col-span-9"
  ), [uiStage]);

  const containerClasses = useMemo(() => cn(
    "h-screen w-screen font-sans relative overflow-hidden",
    viewMode === 'FULLSCREEN' && "p-0"
  ), [viewMode]);

  const contentClasses = useMemo(() => cn(
    "relative h-full w-full flex flex-col transition-padding duration-500",
    viewMode === 'FULLSCREEN' ? "p-2 sm:p-4" : "p-4 md:p-6 lg:p-8"
  ), [viewMode]);

  return (
    <div className={containerClasses}>
      {!prefersReducedMotion && <AncientScript />}
      {!prefersReducedMotion && <FloatingEmbers />}
      <div className="absolute inset-0">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 3 }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,var(--color-highlight-secondary),transparent_70%)]"
        />
      </div>
      
      <div 
        className="interactive-aura" 
        style={mouseAuraStyle}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/10" />
      <AnimatePresence>
        {recoveryStatus?.isRecovered && (
          <RecoveryStatusAlert
            recoveredSections={recoveryStatus.recoveredSections}
            missingSections={recoveryStatus.missingSections}
            incompleteSections={recoveryStatus.incompleteSections}
            onRegenerateRequest={onRegenerateSections}
            onAcceptAsIs={onAcceptPartialResult}
          />
        )}
      </AnimatePresence>

      <div className={contentClasses}>
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={headerClassNames}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,var(--color-highlight-secondary),transparent_70%)]" />
          
          {isMobile && (
            <div className="absolute top-0 right-0 flex gap-2 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleViewMode}
                className="w-10 h-10 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-highlight-secondary)]"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          <motion.h1 
            className={titleClassNames}
            style={{ fontFamily: 'Cinzel, serif', letterSpacing: isMobile ? '0.2em' : '0.4em' }}
          >
                                MYTHOPOEIST
          </motion.h1>
          
          <motion.div className={dividerClassNames} />
          
          <motion.p 
            className={subtitleClassNames}
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Mythological Story Creator
          </motion.p>
        </motion.div>

        <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full lg:col-span-3 flex flex-col gap-6 lg:gap-8 min-h-0 max-w-sm lg:max-w-none"
          >
            <MemoizedLogoPanel stars={stars} selections={selections} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className={centerColumnClasses}
          >
            <div className="relative h-full">
                <MemoizedForgeCore
                  isGenerationReady={isGenerationReady}
                  generationState={generationState}
                  onGenerate={onGenerate}
                  selections={selections}
                />
              </div>
          </motion.div>

          <AnimatePresence>
            {uiStage === 'FORGED' && (
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full lg:col-span-3 min-h-0 max-w-sm lg:max-w-none"
              >
                <MemoizedAnalysisPanel analysis={generationState.result?.analysis || null} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const FloatingEmbers = () => {
  const [embers, setEmbers] = useState<Array<{
    id: number;
    x: number;
    y: number;
    delay: number;
    duration: number;
    size: number;
  }>>([]);

  const regenerateEmbers = useCallback(() => {
    const newEmbers = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 20 + Math.random() * 15,
      size: 1 + Math.random() * 2,
    }));
    setEmbers(newEmbers);
  }, []);

  useEffect(() => {
    let isPageVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    regenerateEmbers();
    const interval = setInterval(() => {
      if (isPageVisible) {
        regenerateEmbers();
      }
    }, 40000);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [regenerateEmbers]);

  return (
    <div className="floating-embers">
      {embers.map((ember) => (
        <motion.div
          key={ember.id}
          className="ember"
          style={{
            left: `${ember.x}%`,
            width: `${ember.size}px`,
            height: `${ember.size}px`,
            background: `radial-gradient(circle, var(--color-highlight-primary), transparent 80%)`,
            boxShadow: `0 0 8px var(--color-highlight-primary)`,
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
          initial={{ y: "100vh", opacity: 0, scale: 0 }}
          animate={{ 
            y: "-100px", 
            opacity: [0, 0.8, 0.8, 0],
            scale: [0, 1, 1, 0],
            x: [0, Math.random() * 50 - 25]
          }}
          transition={{
            duration: ember.duration,
            delay: ember.delay,
            ease: "linear",
            repeat: Infinity
          }}
        />
      ))}
    </div>
  );
};

const AncientScript = memo(() => {
  const [chars, setChars] = useState<Array<{
    id: number;
    char: string;
    x: number;
    delay: number;
    duration: number;
    size: number;
  }>>([]);

  const regenerateChars = useCallback(() => {
    const newChars = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      char: ANCIENT_CHARACTERS[Math.floor(Math.random() * ANCIENT_CHARACTERS.length)],
      x: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 12 + Math.random() * 12,
      size: 12 + Math.random() * 8,
    }));
    setChars(newChars);
  }, []);

  useEffect(() => {
    let isPageVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    regenerateChars();
    const interval = setInterval(() => {
      if (isPageVisible) {
        regenerateChars();
      }
    }, 40000);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [regenerateChars]);

  return (
    <div className="ancient-script">
      {chars.map((char) => (
        <motion.div
          key={char.id}
          className="script-char"
          style={{ 
            left: `${char.x}%`,
            fontSize: `${char.size}px`,
            color: 'var(--color-text-secondary)',
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
          initial={{ y: "-100vh", opacity: 0 }}
          animate={{ y: "100vh", opacity: [0, 0.3, 0] }}
          transition={{
            duration: char.duration,
            delay: char.delay,
            ease: "linear",
            repeat: Infinity
          }}
        >
          {char.char}
        </motion.div>
      ))}
    </div>
  );
});

AncientScript.displayName = 'AncientScript';