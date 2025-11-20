import React, { useState, useRef, useCallback, memo } from 'react';
import { Copy, Download, Sparkles, Gem, BookText, BrainCircuit, Globe, LandPlot, Link, Map, Scale, Shield, Swords, TreePine, Users, Feather, Zap, ChevronDown, ChevronUp, Crown, Star as StarIcon, ArrowRight, Mountain, Clock, MapPin, Palette, Heart, Target, Flame, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MythologySelections, MythAnalysis, Star as StarType } from '@/types/mythology';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { blockCategories, mythBlocks } from '@/data/myth-blocks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { MythicLogo } from './MythicLogo';
import html2canvas from 'html2canvas';
import { logger } from '@/utils/logger';
import { getLocationTypeColor } from '@/constants/ui';

const categoryIconMap: { [key: string]: React.ElementType } = {
  cosmology: Globe, gods: Sparkles, beings: Users, archetype: BrainCircuit,
  themes: BookText, symbols: TreePine, socialcodes: Shield,
};

const analysisIconMap: { [key: string]: React.ElementType } = {
  characters: Users, relationships: Link, symbols: Gem, timeline: Map,
  archetypeConflicts: Swords, thematicDensity: BookText, locations: LandPlot, socialCode: Scale,
  entities: Crown,
};

const AnalysisPlaceholder = ({ text, icon: Icon }: { text: string; icon: React.ElementType }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-500">
    <Icon className="w-12 h-12 mb-4 opacity-50" />
    <p className="text-sm italic">{text}</p>
  </div>
);

const ForgePanel = memo(({ 
  title, 
  icon: Icon, 
  children, 
  position, 
  isCollapsible = false,
  defaultExpanded = true,
  className = "",
  ariaLabel
}: { 
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  position: 'left' | 'right';
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  ariaLabel?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isHovered, setIsHovered] = useState(false);
  

  const handleToggle = useCallback(() => {
    if (isCollapsible) {
      setIsExpanded(prev => !prev);
      
    }
  }, [isCollapsible]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: position === 'left' ? -100 : 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
      className={cn("h-full relative group", className)}
      role="region"
      aria-label={ariaLabel || title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute -inset-1.5 bg-gradient-to-br from-amber-500/30 via-transparent to-amber-500/30 rounded-3xl blur-xl transition-all duration-700 opacity-0 group-hover:opacity-20" />
      
      <div className="relative h-full ancient-parchment rounded-2xl flex flex-col overflow-hidden">
        <div className="ancient-magic-circle opacity-5" />
        <div 
          className={cn(
            "relative flex items-center gap-4 p-4 lg:p-5 border-b border-white/10 flex-shrink-0 bg-black/30 transition-all duration-300",
            isCollapsible && "cursor-pointer hover:bg-black/50"
          )}
          onClick={isCollapsible ? handleToggle : undefined}
          role={isCollapsible ? "button" : undefined}
          aria-expanded={isCollapsible ? isExpanded : undefined}
          tabIndex={isCollapsible ? 0 : undefined}
          onKeyDown={(e) => {
            if (isCollapsible && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              handleToggle();
            }
          }}
        >
          <motion.div 
            className={cn(
              "w-10 h-10 lg:w-11 lg:h-11 rounded-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/20 flex items-center justify-center shadow-md shadow-black/30 transition-all duration-500",
              isHovered && "border-amber-500/50"
            )}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <Icon className={cn(
              "w-5 h-5 lg:w-6 lg:h-6 text-white/60 group-hover:text-white transition-colors duration-300",
            )} />
          </motion.div>
          
          <div className="flex flex-col flex-1 min-w-0">
            <h2 className={cn(
              "text-sm lg:text-base font-bold text-amber-300 tracking-widest uppercase truncate font-['Cinzel']",
              "group-hover:text-amber-200 transition-colors"
            )}>
              {title}
            </h2>
          </div>

          {isCollapsible && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-300",
                "text-white/60 group-hover:text-white"
              )}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          )}
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={isCollapsible ? { height: 0, opacity: 0 } : false}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="relative overflow-y-auto epic-scroll flex-grow"
            >
              <div className="p-4 lg:p-5 space-y-4 relative z-10">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

const SelectionSlot = memo(({ icon: Icon, label, value, active }: { icon: React.ElementType, label: string, value: string, active: boolean }) => {
  return (
    <motion.div
      initial="inactive"
      animate={active ? "active" : "inactive"}
      whileHover="hover"
      className={cn(
        "group flex items-center gap-3 lg:gap-4 p-3 rounded-xl border transition-all duration-300 relative overflow-hidden cursor-pointer",
        active 
          ? "bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-500/20" 
          : "bg-slate-800/50 border-white/20 hover:border-amber-500/40 hover:bg-slate-800/70"
      )}
    >
      {active && (
        <div className="divine-shimmer absolute inset-0 opacity-50" />
      )}
      
      <motion.div 
        className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border transition-all duration-300 relative z-10",
          active 
            ? "bg-gradient-to-br from-amber-500/20 to-transparent border-amber-500/60 text-amber-300" 
            : "bg-black/50 border-white/20 text-white/60 group-hover:text-white group-hover:border-amber-500/40"
        )}
      >
        <Icon className="w-6 h-6" />
      </motion.div>
      <div className="flex flex-col min-w-0 relative z-10 flex-1">
        <h3 className={cn(
          "text-xs font-semibold uppercase tracking-widest transition-colors duration-300 mb-0.5 font-['Cinzel']",
          active ? "text-amber-300" : "text-white/60 group-hover:text-white"
        )}>{label}</h3>
        <p className={cn(
          "text-sm font-medium overflow-hidden text-ellipsis transition-colors duration-300",
          active ? "text-white" : "text-white/70 group-hover:text-white/90",
          "font-['Playfair_Display']"
        )}>{value || 'Awaiting Selection'}</p>
      </div>

      {active && (
        <motion.div
          layoutId="active-selection-indicator"
          className="absolute top-2 right-2 w-2 h-2"
        >
          <div className="w-full h-full bg-amber-500 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
        </motion.div>
      )}
    </motion.div>
  );
});

interface LogoPanelProps {
  stars: StarType[];
  selections: MythologySelections;
}

export const LogoPanel = ({ stars, selections }: LogoPanelProps) => {
  const logoRef = useRef(null);

  const handleDownload = () => {
    if (logoRef.current) {
      html2canvas(logoRef.current, {
        backgroundColor: 'transparent',
        scale: 3,
        useCORS: true,
      }).then((canvas) => {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = 'constellation.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }).catch(err => {
        logger.error('Error downloading constellation', err instanceof Error ? err : new Error(String(err)));
      });
    }
  };
  
  return (
    <ForgePanel title="Mythic Sources" icon={Crown} position="left" isCollapsible={true} defaultExpanded={true} className="flex-shrink-0 h-auto">
      <div className="space-y-4">
        <div className="p-2 bg-black/20 rounded-lg relative group/logo">
          <div className="text-xs font-['Cinzel'] text-amber-300 mb-2 uppercase tracking-wider">Constellation</div>
          <div ref={logoRef} className="h-48">
            <MythicLogo stars={stars} selections={selections} />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="absolute top-2 right-2 w-8 h-8 rounded-lg text-white/60 bg-black/20 backdrop-blur-sm opacity-0 group-hover/logo:opacity-100 hover:bg-amber-500/20 hover:text-white transition-all"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-black/80 border-white/20 text-white font-['Cinzel']">
                <p>Download as PNG</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div>
          <div className="text-xs font-['Cinzel'] text-amber-300 mb-3 uppercase tracking-wider">Sources</div>
          <SelectionsPanel selections={selections} />
        </div>
      </div>
    </ForgePanel>
  );
};

const SelectionsPanel = ({ selections }: { selections: MythologySelections }) => {
    return (
        <div className="space-y-4">
            {blockCategories.map((cat) => {
                const selectedId = selections[cat.key as keyof MythologySelections];
                const block = selectedId ? mythBlocks[cat.key]?.find(b => b.id === selectedId) : null;
                const IconComponent = categoryIconMap[cat.key] || Users;
                return (
                <SelectionSlot
                    key={cat.key}
                    icon={IconComponent}
                    label={cat.title}
                    value={block?.name || 'Awaiting Selection'}
                    active={!!block}
                />
                );
            })}
        </div>
    );
};

const TimelineAnalysis = ({ timeline }: { timeline: { step: number; title: string; description: string }[] }) => {
  if (!timeline || timeline.length === 0) return <p className="text-sm text-slate-400 italic">Timeline data not found.</p>;

  return (
      <div className="relative py-4">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--color-highlight-primary)]/20 via-[var(--color-highlight-primary)]/60 to-[var(--color-highlight-primary)]/20"></div>
          
          <div className="space-y-8">
          {timeline.map((item, index) => (
                  <motion.div 
                      key={index} 
                      className="relative pl-16"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                      <div className="absolute left-3 top-2 flex items-center justify-center">
                          <motion.div 
                              className="w-6 h-6 rounded-full bg-[var(--color-highlight-primary)] flex items-center justify-center border-2 border-[var(--color-panel-background)] shadow-lg"
                              whileHover={{ scale: 1.2 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                              <span className="text-xs font-bold text-white">{item.step}</span>
                          </motion.div>
                          
                          <div className="absolute left-6 top-3 w-8 h-0.5 bg-[var(--color-highlight-primary)]/40"></div>
                  </div>
                      
                      <div className="bg-black/20 border border-white/20 rounded-lg p-4 hover:border-amber-400/70 transition-all hover:bg-black/30 group">
                          <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase font-['Cinzel']">Step {item.step}</p>
                              <div className="flex-1 h-px bg-white/20"></div>
              </div>
                          <h4 className="font-medium text-amber-300 mb-2 text-sm font-['Cinzel'] group-hover:text-amber-200 transition-colors">{item.title}</h4>
                          <p className="text-slate-300 text-xs leading-relaxed legendary-text">{item.description}</p>
                      </div>
                  </motion.div>
          ))}
          </div>
      </div>
  )
}

const SymbolsAnalysis = ({ symbols }: { symbols: { symbol: string; target: string; }[] }) => {
    if (!symbols || symbols.length === 0) return <p className="text-sm text-[var(--color-text-secondary)] italic">Symbol data not found.</p>;

    return (
      <div className="space-y-4">
        {symbols.map((item, index) => (
          <motion.div 
              key={index} 
                                      className="relative bg-black/20 border border-white/20 rounded-lg p-4 transition-all hover:bg-black/30 hover:border-amber-400/70 group overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
          >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-xl"></div>
              
              <div className="relative flex items-center gap-4">
                  <motion.div 
                      className="relative flex-shrink-0"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                  >
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center border border-purple-500/30 group-hover:border-purple-500/50 transition-colors">
                          <Gem className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
            </div>
                      
                      <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </motion.div>
                  
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-1">
                          <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-[var(--color-text-title)] text-sm font-['Cinzel'] mb-1 group-hover:text-purple-300 transition-colors">{item.symbol}</h4>
                              
                              <div className="flex items-center gap-2 mb-2">
                                  <div className="h-px bg-gradient-to-r from-purple-500/50 to-transparent flex-1"></div>
                                  <ArrowRight className="w-3 h-3 text-purple-400 animate-pulse" />
                                  <div className="h-px bg-gradient-to-l from-purple-500/50 to-transparent flex-1"></div>
          </div>
                              
                              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed legendary-text group-hover:text-[var(--color-text-primary)]/80 transition-colors">{item.target}</p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="flex gap-1">
                          {[...Array(3)].map((_, i) => (
                              <motion.div
                                  key={i}
                                  className="w-1.5 h-1.5 bg-purple-400 rounded-full"
                                  initial={{ opacity: 0.3 }}
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{ 
                                      duration: 1.5,
                                      repeat: Infinity,
                                      delay: i * 0.2
                                  }}
                              />
                          ))}
                      </div>
                      <span className="text-xs text-purple-400 font-medium uppercase tracking-wider font-['Cinzel']">Mystical</span>
                  </div>
              </div>
          </motion.div>
        ))}
      </div>
    )
}



const ArchetypeConflictAnalysis = ({ conflicts }: { conflicts: { character1: string; character2: string; conflict: string }[] }) => {
  if (!conflicts || conflicts.length === 0) return <p className="text-sm text-[var(--color-text-secondary)] italic">Archetype conflict data not found.</p>;

  return (
    <div className="space-y-4">
      {conflicts.map((item, index) => (
        <motion.div 
            key={index} 
                            className="relative bg-black/20 border border-white/20 rounded-lg overflow-hidden hover:border-amber-400/70 transition-all hover:bg-black/30 group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
        >
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-blue-500/5"></div>
            
            <div className="relative p-4">
                {/* Conflict title */}
                <div className="text-center mb-4">
                    <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider font-['Cinzel'] mb-1">Conflict</p>
                    <h4 className="text-sm font-medium text-[var(--color-text-title)] italic font-['Playfair_Display']">"{item.conflict}"</h4>
          </div>
                
                {/* Battle visualization */}
                <div className="flex items-center justify-between">
                    {/* Character 1 */}
                    <motion.div 
                        className="flex-1 text-center"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-2">
                            <Crown className="w-4 h-4 text-red-400 mx-auto mb-1" />
                            <p className="font-medium text-[var(--color-text-title)] text-xs font-['Cinzel'] truncate">{item.character1}</p>
        </div>
                    </motion.div>
                    
                    {/* Battle indicator */}
                    <div className="flex items-center gap-2 px-4">
                        <motion.div
                            animate={{ 
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                            className="relative"
                        >
                            <Swords className="w-6 h-6 text-[var(--color-destructive)]" />
                            <div className="absolute inset-0 bg-[var(--color-destructive)]/20 rounded-full blur-sm animate-pulse"></div>
                        </motion.div>
                    </div>
                    
                    {/* Character 2 */}
                    <motion.div 
                        className="flex-1 text-center"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 mb-2">
                            <Crown className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                            <p className="font-medium text-[var(--color-text-title)] text-xs font-['Cinzel'] truncate">{item.character2}</p>
                        </div>
                    </motion.div>
                </div>
                
                {/* Conflict intensity indicator */}
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-secondary)] font-['Cinzel'] uppercase tracking-wider">Intensity:</span>
                    <div className="flex-1 h-1 bg-black/30 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-red-500/60 to-orange-500/60"
                            initial={{ width: "0%" }}
                            animate={{ width: "85%" }}
                            transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                        />
                    </div>
                    <span className="text-xs text-[var(--color-highlight-primary)] font-medium">High</span>
                </div>
            </div>
        </motion.div>
      ))}
    </div>
  )
}

const ThematicDensityAnalysis = ({ themes }: { themes: { section: string; theme: string }[] }) => {
  const { copy } = useCopyToClipboard();

  if (!themes || themes.length === 0) {
    return <AnalysisPlaceholder text="No significant thematic densities identified." icon={BookText} />;
  }

  return (
    <div className="space-y-3">
      {themes.map(({ section, theme }, index) => (
        <div 
          key={index}
          className="p-3 bg-slate-800/40 rounded-lg border border-white/10 flex items-start gap-3 transition-all hover:bg-slate-800/70 hover:border-white/20"
        >
          <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-md flex items-center justify-center border border-indigo-500/30">
            <BookText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">{section}</p>
            <p className="text-sm text-white/90">{theme}</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-7 h-7 flex-shrink-0 text-white/60 hover:text-white hover:bg-white/10" onClick={() => copy(theme)}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-900/80 border-slate-700 text-slate-200 backdrop-blur-sm text-xs">Copy Theme</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ))}
    </div>
  );
};

const LocationAnalysis = ({ locations }: { locations: { name: string; type: string; description: string }[] }) => {
  const { copy } = useCopyToClipboard();

  if (!locations || locations.length === 0) {
    return <AnalysisPlaceholder text="No specific locations were generated." icon={LandPlot} />;
  }
  

  const getLocationIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('city') || lowerType.includes('capital')) return Users;
    if (lowerType.includes('forest') || lowerType.includes('grove')) return TreePine;
    if (lowerType.includes('mountain') || lowerType.includes('peak')) return Mountain;
    if (lowerType.includes('river') || lowerType.includes('sea')) return Zap;
    if (lowerType.includes('temple') || lowerType.includes('shrine')) return Shield;
    if (lowerType.includes('ruin') || lowerType.includes('ancient')) return Clock;
    return MapPin;
  };

  return (
    <div className="space-y-4">
      {locations.map((location, index) => {
        const LocationIcon = getLocationIcon(location.type);
        const color = getLocationTypeColor(location.type);
        return (
          <div key={index} className="p-3 bg-slate-800/40 rounded-lg border border-white/10 flex items-start gap-4 transition-all hover:bg-slate-800/70 hover:border-white/20">
            <div 
              className="w-10 h-10 flex-shrink-0 rounded-md flex items-center justify-center border"
              style={{ 
                borderColor: `${color}40`,
                background: `radial-gradient(circle, ${color}20, transparent 70%)`
              }}
            >
              <LocationIcon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm" style={{ color }}>{location.name}</h4>
                  <p className="text-xs text-white/50">{location.type}</p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-7 h-7 flex-shrink-0 text-white/60 hover:text-white hover:bg-white/10" onClick={() => copy(location.description)}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-slate-900/80 border-slate-700 text-slate-200 backdrop-blur-sm text-xs">Copy Description</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-white/80 mt-2">{location.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  );
};

const SocialCodeAnalysis = ({ code }: { code: { sacred: string; forbidden: string; forgivable: string } }) => {
  if (!code) return <p className="text-sm text-[var(--color-text-secondary)] italic">Social code data not found.</p>;
  
  const items = [
    { 
      title: 'Sacred', 
      value: code.sacred, 
      icon: Sparkles, 
      color: 'from-yellow-900/30 to-amber-900/20',
      borderColor: 'border-yellow-500/40',
      iconColor: 'text-yellow-400'
    },
    { 
      title: 'Forbidden', 
      value: code.forbidden, 
      icon: Shield, 
      color: 'from-red-900/30 to-rose-900/20',
      borderColor: 'border-red-500/40',
      iconColor: 'text-red-400'
    },
    { 
      title: 'Forgivable', 
      value: code.forgivable, 
      icon: Feather, 
      color: 'from-green-900/30 to-emerald-900/20',
      borderColor: 'border-green-500/40',
      iconColor: 'text-green-400'
    },
  ];

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <motion.div 
          key={index} 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          className={`relative p-4 rounded-xl border ${item.borderColor} bg-gradient-to-r ${item.color} backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 group overflow-hidden`}
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl" />
          
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 p-2 rounded-lg bg-black/30">
              <item.icon className={`w-5 h-5 ${item.iconColor} group-hover:scale-110 transition-transform duration-300`} />
          </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-100 uppercase tracking-[0.1em] text-sm font-['Cinzel'] mb-2">
                {item.title}
              </h4>
              <p className="text-slate-200 text-sm leading-relaxed legendary-text">
                {item.value}
              </p>
        </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

const SacredPlacesAnalysis = ({ 
  items, 
  placeholderText, 
  placeholderIcon, 
  icons, 
  bgColorClass,
  iconColorClass,
  borderColorClass
}: { 
  items: string[];
  placeholderText: string;
  placeholderIcon: React.ElementType;
  icons: React.ElementType[];
  bgColorClass: string;
  iconColorClass: string;
  borderColorClass: string;
}) => {
  if (!items || items.length === 0) {
    return <AnalysisPlaceholder text={placeholderText} icon={placeholderIcon} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((item, index) => {
        const Icon = icons[index % icons.length];
        return (
          <div key={index} className="p-3 bg-slate-800/40 rounded-lg border border-white/10 flex items-start gap-3">
            <div className={`w-8 h-8 flex-shrink-0 bg-gradient-to-br ${bgColorClass} to-transparent rounded-md flex items-center justify-center border ${borderColorClass}`}>
              <Icon className={`w-4 h-4 ${iconColorClass}`} />
            </div>
            <p className="text-sm text-white/90 flex-1">{item}</p>
          </div>
        )
      })}
    </div>
  );
};

const RitualsAnalysis = ({ rituals }: { rituals: string[] }) => {
  return (
    <SacredPlacesAnalysis
      items={rituals}
      placeholderText="No specific rituals were detailed."
      placeholderIcon={Feather}
      icons={[Flame, Moon, StarIcon, Heart, Target]}
      bgColorClass="from-pink-500/20"
      iconColorClass="text-pink-400"
      borderColorClass="border-pink-500/30"
    />
  );
};

const TemplesAnalysis = ({ temples }: { temples: string[] }) => {
  return (
    <SacredPlacesAnalysis
      items={temples}
      placeholderText="No specific temples were detailed."
      placeholderIcon={Shield}
      icons={[Shield, Crown, Sparkles, Gem, Globe]}
      bgColorClass="from-amber-500/20"
      iconColorClass="text-amber-400"
      borderColorClass="border-amber-500/30"
    />
  );
};

const RelationshipsAnalysis = ({ relationships }: { relationships: { source: string; target: string; type: string; description: string }[] }) => {

  if (!relationships || relationships.length === 0) {
    return <AnalysisPlaceholder text="No significant relationships were identified." icon={Link} />;
  }

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'ally': return <Shield className="w-4 h-4 text-green-400" />;
      case 'enemy': return <Swords className="w-4 h-4 text-red-400" />;
      case 'family': return <Heart className="w-4 h-4 text-pink-400" />;
      default: return <Link className="w-4 h-4 text-blue-400" />;
    }
  };

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'ally': return 'border-green-400/30 bg-green-950/20';
      case 'enemy': return 'border-red-400/30 bg-red-950/20';
      case 'family': return 'border-pink-400/30 bg-pink-950/20';
      default: return 'border-blue-400/30 bg-blue-950/20';
    }
  };

  return (
    <div className="space-y-3">
      {relationships.map((rel, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative p-3 rounded-lg border transition-all duration-300 hover:scale-105 ${getRelationshipColor(rel.type)}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-lg" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex-1 text-center">
              <p className="font-bold text-white text-sm">{rel.source}</p>
            </div>

            <div className="flex flex-col items-center mx-4 min-w-[80px]">
              <div className="flex items-center gap-1 mb-1">
                {getRelationshipIcon(rel.type)}
                <span className="text-xs text-white/80 capitalize font-['Cinzel']">{rel.type}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5 bg-gradient-to-r from-slate-400 to-transparent" />
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <div className="w-4 h-0.5 bg-gradient-to-l from-slate-400 to-transparent" />
              </div>
            </div>

            <div className="flex-1 text-center">
              <p className="font-bold text-white text-sm">{rel.target}</p>
            </div>
          </div>

          {rel.description && (
            <p className="text-xs text-slate-300 mt-2 text-center">
              {rel.description}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
};



const AnalysisItem = ({
  itemKey,
  value,
  isOpen,
  onToggle,
}: {
  itemKey: string;
  value: unknown;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const Icon = analysisIconMap[itemKey] || Feather;
  const playClickSound = useSound('/audio/click.mp3');

  const renderValue = (val: unknown, depth = 0): React.ReactNode => {
    if (Array.isArray(val)) {
      return (
        <div className="space-y-2">
          {val.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              {renderValue(item, depth + 1)}
            </motion.div>
          ))}
        </div>
      );
    }

    if (typeof val === 'object' && val !== null) {
      return (
        <div className={`space-y-3 ${depth > 0 ? 'border-l-2 border-amber-400/30 pl-4' : ''}`}>
          {Object.entries(val).map(([key, objValue], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="space-y-1"
            >
              <h6 className="text-xs font-medium text-slate-400 font-['Cinzel'] uppercase tracking-wider">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h6>
              <div className="text-xs text-slate-200 legendary-text leading-relaxed">
                {renderValue(objValue, depth + 1)}
              </div>
            </motion.div>
          ))}
        </div>
      );
    }

    if (typeof val === 'string') {
      return (
        <span className="legendary-text leading-relaxed">
          {val}
        </span>
      );
    }

    return (
      <span className="text-slate-400 legendary-text">
        {String(val)}
      </span>
    );
  };

  if (itemKey === 'timeline' && Array.isArray(value)) {
  return (
      <div className="border-b border-white/20 last:border-b-0">
        <button
          onClick={() => {
            onToggle();
            playClickSound();
          }}
          className="w-full p-3 flex items-center justify-between hover:bg-black/10 transition-colors group"
      >
        <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-slate-200 font-['Cinzel'] capitalize">
              Timeline
            </span>
            <span className="text-xs text-slate-400 bg-black/30 px-2 py-0.5 rounded-full">
              {value.length}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
                             <div className="p-4 pt-0">
                 <TimelineAnalysis timeline={value} />
        </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (itemKey === 'symbols' && Array.isArray(value)) {
    return (
      <div className="border-b border-white/20 last:border-b-0">
        <button
          onClick={() => {
            onToggle();
            playClickSound();
          }}
          className="w-full p-3 flex items-center justify-between hover:bg-black/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-slate-200 font-['Cinzel'] capitalize">
              Symbols
            </span>
            <span className="text-xs text-slate-400 bg-black/30 px-2 py-0.5 rounded-full">
              {value.length}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
        <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0">
                                 <SymbolsAnalysis symbols={value} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (itemKey === 'relationships' && Array.isArray(value)) {
    return (
      <div className="border-b border-white/20 last:border-b-0">
        <button
          onClick={() => {
            onToggle();
            playClickSound();
          }}
          className="w-full p-3 flex items-center justify-between hover:bg-black/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Link className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-slate-200 font-['Cinzel'] capitalize">
              Relationships
            </span>
            <span className="text-xs text-slate-400 bg-black/30 px-2 py-0.5 rounded-full">
              {value.length}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0">
                <RelationshipsAnalysis relationships={value} />
               </div>
        </motion.div>
           )}
         </AnimatePresence>
      </div>
     );
   }


 
   if (itemKey === 'archetypeConflicts' && Array.isArray(value)) {
     return (
       <div className="border-b border-white/20 last:border-b-0">
         <button
           onClick={() => {
             onToggle();
             playClickSound();
           }}
           className="w-full p-3 flex items-center justify-between hover:bg-black/10 transition-colors group"
         >
           <div className="flex items-center gap-3">
             <Swords className="w-4 h-4 text-amber-400" />
             <span className="text-sm font-medium text-slate-200 font-['Cinzel'] capitalize">
               Archetype Conflicts
             </span>
             <span className="text-xs text-slate-400 bg-black/30 px-2 py-0.5 rounded-full">
               {value.length}
             </span>
           </div>
           <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
         </button>
 
         <AnimatePresence>
        {isOpen && (
          <motion.div
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               transition={{ duration: 0.3, ease: 'easeInOut' }}
               className="overflow-hidden"
             >
               <div className="p-4 pt-0">
                 <ArchetypeConflictAnalysis conflicts={value} />
               </div>
             </motion.div>
           )}
         </AnimatePresence>
       </div>
     );
   }
 
   if (itemKey === 'thematicDensity' && Array.isArray(value)) {
     return (
       <div className="border-b border-white/20 last:border-b-0">
         <button
           onClick={() => {
             onToggle();
             playClickSound();
           }}
           className="w-full p-3 flex items-center justify-between hover:bg-black/10 transition-colors group"
         >
           <div className="flex items-center gap-3">
             <Palette className="w-4 h-4 text-amber-400" />
             <span className="text-sm font-medium text-slate-200 font-['Cinzel'] capitalize">
               Thematic Density
             </span>
             <span className="text-xs text-slate-400 bg-black/30 px-2 py-0.5 rounded-full">
               {value.length}
             </span>
           </div>
           <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
         </button>
 
         <AnimatePresence>
           {isOpen && (
             <motion.div
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
               <div className="p-4 pt-0">
                 <ThematicDensityAnalysis themes={value} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
       </div>
     );
   }
 
   if (itemKey === 'locations' && Array.isArray(value)) {
     return (
       <div className="border-b border-white/20 last:border-b-0">
         <button
           onClick={() => {
             onToggle();
             playClickSound();
           }}
           className="w-full p-3 flex items-center justify-between hover:bg-black/10 transition-colors group"
         >
           <div className="flex items-center gap-3">
             <MapPin className="w-4 h-4 text-amber-400" />
             <span className="text-sm font-medium text-slate-200 font-['Cinzel'] capitalize">
               Locations
             </span>
             <span className="text-xs text-slate-400 bg-black/30 px-2 py-0.5 rounded-full">
               {value.length}
             </span>
           </div>
           <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
         </button>
 
         <AnimatePresence>
           {isOpen && (
             <motion.div
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               transition={{ duration: 0.3, ease: 'easeInOut' }}
               className="overflow-hidden"
             >
               <div className="p-4 pt-0">
                 <LocationAnalysis locations={value} />
              </div>
    </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (itemKey === 'socialCode' && value && typeof value === 'object') {
    return (
      <div className="border-b border-white/20 last:border-b-0">
        <button
          onClick={() => {
            onToggle();
            playClickSound();
          }}
          className="w-full p-3 flex items-center justify-between hover:bg-black/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Scale className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-slate-200 font-['Cinzel'] capitalize">
              Social Code
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0">
                {value && typeof value === 'object' && 'sacred' in value && 'forbidden' in value && 'forgivable' in value ? (
                  <SocialCodeAnalysis code={value as { sacred: string; forbidden: string; forgivable: string }} />
                ) : (
                  <AnalysisPlaceholder text="No social code defined." icon={Scale} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (itemKey === 'rituals' && Array.isArray(value)) {
    return (
      <div className="border-b border-white/20 last:border-b-0">
        <button
          onClick={() => {
            onToggle();
            playClickSound();
          }}
          className="w-full p-3 flex items-center justify-between hover:bg-black/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-slate-200 font-['Cinzel'] capitalize">
              Rituals
            </span>
            <span className="text-xs text-slate-400 bg-black/30 px-2 py-0.5 rounded-full">
              {value.length}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0">
                <RitualsAnalysis rituals={value} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (itemKey === 'temples' && Array.isArray(value)) {
    return (
      <div className="border-b border-white/20 last:border-b-0">
        <button
          onClick={() => {
            onToggle();
            playClickSound();
          }}
          className="w-full p-3 flex items-center justify-between hover:bg-black/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-slate-200 font-['Cinzel'] capitalize">
              Temples
            </span>
            <span className="text-xs text-slate-400 bg-black/30 px-2 py-0.5 rounded-full">
              {value.length}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0">
                <TemplesAnalysis temples={value} />
              </div>
    </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="border-b border-white/20 last:border-b-0">
      <button
        onClick={() => {
          onToggle();
          playClickSound();
        }}
        className="w-full p-3 flex items-center justify-between hover:bg-black/10 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-slate-200 font-['Cinzel'] capitalize">
            {itemKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </span>
          {Array.isArray(value) && (
            <span className="text-xs text-slate-400 bg-black/30 px-2 py-0.5 rounded-full">
              {value.length}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 text-xs text-slate-200">
              {renderValue(value)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AnalysisSkeleton = () => (
    <div className="space-y-6 animate-pulse p-4">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-slate-700 rounded-full"></div>
                    <div className="w-2/5 h-5 bg-slate-700 rounded"></div>
                </div>
                 <div className="space-y-4 pl-5">
                    <div className="w-full h-12 bg-slate-700/80 rounded-lg"></div>
                    <div className="w-3/4 h-12 bg-slate-700/80 rounded-lg"></div>
                 </div>
            </div>
        ))}
    </div>
)



export const AnalysisPanel = ({ analysis }: { analysis: MythAnalysis | null }) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(['timeline']));
  
  const toggleItem = (key: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key); else newSet.add(key);
      return newSet;
    });
  };

  const exportAnalysis = () => {
    if (!analysis) return;
    
    const exportData = {
      timestamp: new Date().toISOString(),
      analysisType: 'Mythology Analysis',
      data: analysis
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `myth-analysis-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const expandAllItems = () => {
    if (!analysis) return;
    const allKeys = Object.keys(analysis);
    setOpenItems(new Set(allKeys));
  };

  const collapseAllItems = () => {
    setOpenItems(new Set());
  };
  
  const getAnalysisEntries = () => {
    if (!analysis) return [];
    
    let entries = Object.entries(analysis);
    
    entries = entries.filter(([key]) => 
      key !== 'entities' && key !== 'ancientLanguage' && key !== 'characters'
    );
    
    return entries.filter(([, value]) => 
      value && (Array.isArray(value) ? value.length > 0 : true)
    );
  };

  return (
    !analysis ? (
      <AnalysisSkeleton />
    ) : (
      <div className="h-full flex flex-col space-y-4">
        {/* Analysis controls */}
        <div className="flex items-center justify-end gap-2 p-3 bg-black/20 rounded-lg border border-white/10 flex-shrink-0">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAllItems}
              className="h-8 px-2 text-xs text-slate-300 hover:text-amber-300 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/30 transition-all"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAllItems}
              className="h-8 px-2 text-xs text-slate-300 hover:text-amber-300 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/30 transition-all"
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={exportAnalysis}
            className="h-8 px-3 text-xs font-['Cinzel'] uppercase tracking-wider text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 transition-all"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
        </div>
        
        {/* Analysis items - scrollable container */}
        <div className="flex-1 min-h-0 overflow-y-auto epic-scroll">
          <div className="bg-black/20 rounded-xl border border-white/20 overflow-hidden">
            {getAnalysisEntries().length === 0 ? (
              <div className="p-8 text-center">
                <Feather className="w-8 h-8 text-slate-400 mx-auto mb-3 opacity-50" />
                <p className="text-sm text-slate-400 font-['Cinzel']">
                  No analysis data available
                </p>
              </div>
            ) : (
              getAnalysisEntries().map(([key, value]) => (
              <AnalysisItem
                key={key}
                itemKey={key}
                value={value}
                isOpen={openItems.has(key)}
                onToggle={() => toggleItem(key)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    )
  );
}; 