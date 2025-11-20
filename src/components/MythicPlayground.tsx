import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Globe, Sparkles, Users, BrainCircuit, BookOpen, TreePine, Shield, Star, Edit3, Save, X, Settings, Check } from 'lucide-react';
import { MythologySelections, MythBlock } from '@/types/mythology';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mythBlocks, blockCategories } from '@/data/myth-blocks';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ConstellationLines } from './ConstellationLines';
import { CosmicBackground } from './CosmicBackground';
import { DESKTOP_CATEGORY_ZONES, MOBILE_CATEGORY_ZONES } from '@/constants/ui';
import { DEFAULT_GENERATION_THRESHOLDS } from '@/constants/defaults';
import { AIProvider, AIProviderConfig, AI_PROVIDERS, SystemMessages } from '@/types/aiProviderTypes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIServiceFactory } from '@/services/aiProviderService';
import { logger } from '@/utils/logger';

type CategoryColor = {
  color: string;
  glow: string;
};

const iconMap: { [key: string]: React.ElementType } = {
    Globe, Sparkles, Users, BrainCircuit, BookOpen, TreePine, Shield, Star
};

const CATEGORY_DISPLAY_COLORS: CategoryColor[] = [
  { color: 'text-red-400', glow: 'rgba(248, 113, 113, 0.6)'},
  { color: 'text-amber-400', glow: 'rgba(251, 191, 36, 0.6)'},
  { color: 'text-lime-400', glow: 'rgba(163, 230, 53, 0.6)'},
  { color: 'text-emerald-400', glow: 'rgba(52, 211, 153, 0.6)'},
  { color: 'text-cyan-400', glow: 'rgba(34, 211, 238, 0.6)'},
  { color: 'text-indigo-400', glow: 'rgba(129, 140, 248, 0.6)'},
  { color: 'text-fuchsia-400', glow: 'rgba(232, 121, 249, 0.6)'},
];

const categoryData = blockCategories.map((cat, index) => ({
  key: cat.key as keyof MythologySelections,
  title: cat.title,
  icon: iconMap[cat.icon],
  ...CATEGORY_DISPLAY_COLORS[index % CATEGORY_DISPLAY_COLORS.length],
  options: mythBlocks[cat.key]
}));


const getOptionDescriptions = () => {
    const descriptions: Record<string, string> = {};
    categoryData.forEach(cat => {
        cat.options.forEach(opt => {
            descriptions[opt.id] = opt.description;
        })
    });
    return descriptions;
}
const optionDescriptions = getOptionDescriptions();

interface Star extends MythBlock {
  categoryKey: keyof MythologySelections;
  category: typeof categoryData[0];
  x: number;
  y: number;
  vx: number;
  vy: number;
  duration: number;
  delay: number;
}

interface MythicPlaygroundProps {
  selections: MythologySelections;
  onSelectionMade: (category: string, value: string) => void;
  isGenerationReady: boolean;
  onGenerate: (rect: DOMRect | undefined) => void;
  onCaptureStarPositions?: (positions: Star[], order: string[]) => void;
  isGenerating?: boolean;
  aiConfig?: AIProviderConfig;
  onActiveProviderChange?: (provider: AIProvider) => void;
  onProviderConfigChange?: (config: AIProviderConfig) => void;
}

const getRandomElement = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const loadOllamaModels = async ({
  model,
  baseUrl,
}: {
  model?: string;
  baseUrl?: string;
}) => {
  try {
    return await AIServiceFactory.getAvailableModels({
      provider: 'ollama',
      model,
      baseUrl,
    });
  } catch (error) {
    logger.error(
      'Failed to fetch Ollama models',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
};

const AnimatedLine = ({ 
  x1, 
  y1, 
  x2, 
  y2, 
  isActive, 
  isHovered,
  lineRef,
  isDashed = false
}: { 
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isActive: boolean;
  isHovered: boolean;
  lineRef: (el: SVGLineElement | null) => void;
  isDashed?: boolean;
}) => {
  return (
    <line
      ref={lineRef}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={isActive ? "url(#line-gradient)" : "url(#inactive-line-gradient)"}
      strokeWidth={isHovered ? "0.3" : isActive ? "0.04" : "0.4"}
      opacity={isHovered ? 1 : isActive ? 0.9 : 0.3}
      filter={isActive ? "url(#glow)" : "none"}
      strokeDasharray={isDashed ? "0.3 0.2" : "none"}
      style={{
        transition: "all 0.3s ease"
      }}
    />
  );
};

export const MythicPlayground = ({ selections, onSelectionMade, isGenerationReady, onGenerate, onCaptureStarPositions, isGenerating = false, aiConfig, onActiveProviderChange, onProviderConfigChange }: MythicPlaygroundProps) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [hoveredStarInfo, setHoveredStarInfo] = useState<{ category: keyof MythologySelections; value: string } | null>(null);
  
  const [hoveredCategory, setHoveredCategory] = useState<keyof MythologySelections | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [hasDraggedDistance, setHasDraggedDistance] = useState(false);
  
  const [customTestPreview, setCustomTestPreview] = useState<{
    isOpen: boolean;
    testData: Record<string, { name: string; description: string }>;
  }>({ isOpen: false, testData: {} });
  
  const [settingsModal, setSettingsModal] = useState<{
    isOpen: boolean;
    activeTab: 'provider' | 'thresholds' | 'system-messages';
    selectedProvider: AIProvider;
    apiKey: string;
    selectedModel: string;
    baseUrl: string;
    availableModels: string[];
    isTestingConnection: boolean;
    connectionStatus: 'idle' | 'testing' | 'success' | 'error';
    generationThresholds: {
      minEntities: number;
      minLocations: number;
      minVocabulary: number;
      minTimelineEvents: number;
      minStoryLength: number;
      minStoryWordCount: number;
    };
    systemMessages: SystemMessages;
  }>({
    isOpen: false,
    activeTab: 'provider',
    selectedProvider: 'openrouter',
    apiKey: '',
    selectedModel: '',
    baseUrl: '',
    availableModels: [],
    isTestingConnection: false,
    connectionStatus: 'idle',
    generationThresholds: {
      minEntities: DEFAULT_GENERATION_THRESHOLDS.minEntities,
      minLocations: DEFAULT_GENERATION_THRESHOLDS.minLocations,
      minVocabulary: DEFAULT_GENERATION_THRESHOLDS.minVocabulary,
      minTimelineEvents: DEFAULT_GENERATION_THRESHOLDS.minTimelineEvents,
      minStoryLength: DEFAULT_GENERATION_THRESHOLDS.minStoryLength,
      minStoryWordCount: DEFAULT_GENERATION_THRESHOLDS.minStoryWordCount
    },
    systemMessages: {}
  });
  
  const [customStarModal, setCustomStarModal] = useState<{
    isOpen: boolean;
    starId: string;
    categoryKey: keyof MythologySelections;
    currentName: string;
    currentDescription: string;
  } | null>(null);
  const [customStarName, setCustomStarName] = useState('');
  const [customStarDescription, setCustomStarDescription] = useState('');
  
  const [longPressTimeoutRef, setLongPressTimeoutRef] = useState<NodeJS.Timeout | null>(null);
  const [selectionOrder, setSelectionOrder] = useState<string[]>([]);

  useEffect(() => {
    const selectedIds = new Set<string>(Object.values(selections).filter(Boolean));
    setSelectionOrder(prev => prev.filter(id => selectedIds.has(id)));
  }, [selections]);

  const [stars, setStars] = useState<Star[]>(() => {
    return categoryData.flatMap(cat =>
      cat.options.map(opt => {
        const zone = DESKTOP_CATEGORY_ZONES[cat.key];
        const x = Math.random() * (zone.x[1] - zone.x[0]) + zone.x[0];
        const y = Math.random() * (zone.y[1] - zone.y[0]) + zone.y[0];
        return {
          ...opt,
          categoryKey: cat.key,
          category: cat,
          x,
          y,
          vx: 0,
          vy: 0,
          duration: Math.random() * 10 + 15,
          delay: Math.random() * -20,
        };
      })
    );
  });
  
  const starRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const starIconRefs = useRef<(SVGSVGElement | null)[]>([]);
  const categoryLineRefs = useRef<(SVGLineElement | null)[]>([]);
  const [realStarPositions, setRealStarPositions] = useState<{id: string, x: number, y: number}[]>([]);
  
  const animationStateRef = useRef(stars.map(s => ({ x: s.x, y: s.y, vx: s.vx, vy: s.vy })));
  const animationFrameIdRef = useRef<number>();
  const starsRef = useRef(stars);
  const frameCounter = useRef(0);

  const playgroundRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  const cachedRectsRef = useRef<{
    playground?: DOMRect;
    svg?: DOMRect;
    lastUpdate: number;
  }>({ lastUpdate: 0 });

  const updateCachedRects = useCallback(() => {
    const now = performance.now();
    if (now - cachedRectsRef.current.lastUpdate < 100) return;

    const playgroundEl = playgroundRef.current;
    const svgContainer = document.querySelector('.constellation-svg') as SVGSVGElement;

    if (playgroundEl && svgContainer) {
      cachedRectsRef.current = {
        playground: playgroundEl.getBoundingClientRect(),
        svg: svgContainer.getBoundingClientRect(),
        lastUpdate: now
      };
    }
  }, []);

  const calculateRealStarPositions = useCallback(() => {
    updateCachedRects();

    const cachedSvgRect = cachedRectsRef.current.svg;
    const cachedPlaygroundRect = cachedRectsRef.current.playground;
    if (!cachedSvgRect || !cachedPlaygroundRect) return;

    requestAnimationFrame(() => {
      const newPositions = stars.map((star, index) => {
        const buttonElement = starRefs.current[index];
        if (!buttonElement) return { id: star.id, x: star.x, y: star.y };

        const topStr = buttonElement.style.top;
        const leftStr = buttonElement.style.left;
        
        let x = star.x;
        let y = star.y;
        
        if (topStr && topStr.includes('%')) {
          y = parseFloat(topStr);
        }
        
        if (leftStr && leftStr.includes('%')) {
          x = parseFloat(leftStr);
        }

        return { id: star.id, x, y };
      });

      setRealStarPositions(newPositions);
    });
  }, [stars, updateCachedRects]);

  useEffect(() => {
    updateCachedRects();

    const handleResize = () => {
      cachedRectsRef.current.lastUpdate = 0;
      updateCachedRects();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCachedRects]);

  const physicsConstants = {
    damping: 0.985,
    groupCohesionFactor: 0.0005,
    intraCategoryRepulsionFactor: 0.08,
    minIntraCategoryDist: isMobile ? 10 : 8,
    baseDriftStrength: 0.0003,
    thermalEnergyStrength: 0.0002,
    maxSpeed: 0.04,
    stillnessThreshold: 0.001
  };
  
  useEffect(() => {
    if (animationStateRef.current.length !== stars.length) {
      animationStateRef.current = stars.map(s => ({ x: s.x, y: s.y, vx: s.vx, vy: s.vy }));
    }
    
    starRefs.current = starRefs.current.slice(0, stars.length);
    categoryLineRefs.current = [];
    starsRef.current = stars;
  }, [stars]);

  useEffect(() => {
    const playgroundEl = playgroundRef.current;
    if (!playgroundEl) return;

    let mouseThrottleTimeout: NodeJS.Timeout | null = null;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStartPos) {
        const dragDistance = Math.sqrt(
          Math.pow(e.clientX - dragStartPos.x, 2) + 
          Math.pow(e.clientY - dragStartPos.y, 2)
        );
        
        if (dragDistance > 5) {
          setHasDraggedDistance(true);

          let cachedRect = cachedRectsRef.current.playground;
          const cacheAge = performance.now() - (cachedRectsRef.current.lastUpdate || 0);
          
          if (!cachedRect || cacheAge > 1000) {
            requestAnimationFrame(() => {
              if (playgroundEl) {
                const freshRect = playgroundEl.getBoundingClientRect();
                cachedRectsRef.current.playground = freshRect;
                cachedRectsRef.current.lastUpdate = performance.now();
              }
            });
            if (!cachedRect) {
              cachedRect = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
            }
          }

          const mouseX = ((e.clientX - cachedRect.left) / cachedRect.width) * 100;
          const mouseY = ((e.clientY - cachedRect.top) / cachedRect.height) * 100;

          let newX = mouseX;
          let newY = mouseY;

          if (dragOffset) {
            newX = mouseX - dragOffset.x;
            newY = mouseY - dragOffset.y;
          }

          const draggedStarIndex = starsRef.current.findIndex(s => s.id === isDragging);
          if (draggedStarIndex !== -1) {
            const starEl = starRefs.current[draggedStarIndex];
            if (starEl) {
              starEl.style.left = `${newX}%`;
              starEl.style.top = `${newY}%`;
            }
          }
        }
        return;
      }
      
      if (mouseThrottleTimeout) return;

      mouseThrottleTimeout = setTimeout(() => {
        const cachedRect = cachedRectsRef.current.playground;
        if (!cachedRect) {
          updateCachedRects();
          mouseThrottleTimeout = null;
          return;
        }

        const x = ((e.clientX - cachedRect.left) / cachedRect.width) * 100;
        const y = ((e.clientY - cachedRect.top) / cachedRect.height) * 100;
        mousePosRef.current = { x, y };
        mouseThrottleTimeout = null;
      }, 25);

    };

    const handleMouseUp = () => {
      if (isDragging) {
        const draggedStarIndex = starsRef.current.findIndex(s => s.id === isDragging);
        if (draggedStarIndex !== -1) {
          const starEl = starRefs.current[draggedStarIndex];
          if (starEl) {
            const finalLeft = parseFloat(starEl.style.left) || 0;
            const finalTop = parseFloat(starEl.style.top) || 0;
            
            setStars(prev => prev.map((star, index) => 
              index === draggedStarIndex 
                ? { ...star, x: finalLeft, y: finalTop }
                : star
            ));
            
            animationStateRef.current[draggedStarIndex] = {
              ...animationStateRef.current[draggedStarIndex],
              x: finalLeft,
              y: finalTop,
              vx: 0,
              vy: 0
            };
          }
        }
        
        setIsDragging(null);
        setDragStartPos(null);
        setDragOffset(null);
        setHasDraggedDistance(false);
      }
    };

    const handleMouseLeave = () => {
      mousePosRef.current = null;
      handleMouseUp();
    };

    playgroundEl.addEventListener('mousemove', handleMouseMove);
    playgroundEl.addEventListener('mouseleave', handleMouseLeave);
    playgroundEl.addEventListener('mouseup', handleMouseUp);

    return () => {
      playgroundEl.removeEventListener('mousemove', handleMouseMove);
      playgroundEl.removeEventListener('mouseleave', handleMouseLeave);
      playgroundEl.removeEventListener('mouseup', handleMouseUp);
      if (mouseThrottleTimeout) {
        clearTimeout(mouseThrottleTimeout);
        mouseThrottleTimeout = null;
      }
    };
  }, [isDragging, dragStartPos, dragOffset, hasDraggedDistance, updateCachedRects]);

  const categoryConnections = useMemo(() => {
    const connections: { key: string; fromIndex: number; toIndex: number }[] = [];
    const starIndexMap = new Map(stars.map((star, index) => [star.id, index]));

    categoryData.forEach(category => {
      for (let i = 0; i < category.options.length - 1; i++) {
        const option1 = category.options[i];
        const option2 = category.options[i + 1];
        const index1 = starIndexMap.get(option1.id);
        const index2 = starIndexMap.get(option2.id);

        if (index1 !== undefined && index2 !== undefined) {
          connections.push({
            key: `${option1.id}-${option2.id}`,
            fromIndex: index1,
            toIndex: index2,
          });
        }
      }
    });
    return connections;
  }, [stars]);

  useEffect(() => {
    let isPageVisible = !document.hidden;
    let visibilityChangeHandler: (() => void) | null = null;
    
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      if (!isPageVisible && animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = undefined;
      } else if (isPageVisible && !animationFrameIdRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      }
    };
    
    visibilityChangeHandler = handleVisibilityChange;
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    const animate = () => {
      if (!isPageVisible) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        return;
      }
      
      frameCounter.current++;

      const mousePos = mousePosRef.current;
      const activeCategoryZones = isMobile ? MOBILE_CATEGORY_ZONES : DESKTOP_CATEGORY_ZONES;
      
      const groupPullFactor = 0.005;
      const displacedCenters: { [key: string]: { x: number; y: number } } = {};
      const categoryKeys = Object.keys(activeCategoryZones) as Array<keyof typeof activeCategoryZones>;

      for (const catKey of categoryKeys) {
        const zone = activeCategoryZones[catKey as keyof typeof activeCategoryZones];
        let zoneCenterX = (zone.x[0] + zone.x[1]) / 2;
        let zoneCenterY = (zone.y[0] + zone.y[1]) / 2;

        if (mousePos) {
          zoneCenterX += (mousePos.x - zoneCenterX) * groupPullFactor;
          zoneCenterY += (mousePos.y - zoneCenterY) * groupPullFactor;
        }
        
        displacedCenters[catKey as string] = { x: zoneCenterX, y: zoneCenterY };
      }
      
      const currentAnimState = animationStateRef.current;
      const currentStars = starsRef.current;
      const newAnimState = currentAnimState.map((starState, index) => {
        const starData = currentStars[index];
        const categoryHasSelection = !!selections[starData.categoryKey];
        const isBeingDragged = isDragging === starData.id;
        
        if (categoryHasSelection || isBeingDragged) {
            return { 
              ...starState, 
              vx: 0, 
              vy: 0 
            };
        }

        let forceX = 0;
        let forceY = 0;
        
        const { damping, groupCohesionFactor, intraCategoryRepulsionFactor, 
                minIntraCategoryDist, baseDriftStrength, thermalEnergyStrength, maxSpeed, stillnessThreshold } = physicsConstants;

        const seed = index * 23.47;
        const time = Date.now() / 12000;
        const timeX1 = time * 0.4 + seed;
        const timeY1 = time * 0.5 + seed;
        const timeX2 = time * 0.3 + (seed * 1.2);
        const timeY2 = time * 0.35 + (seed * 1.2);
        
        const thermalX = (Math.sin(timeX1) * 0.6 + Math.cos(timeX2) * 0.4);
        const thermalY = (Math.cos(timeY1) * 0.6 + Math.sin(timeY2) * 0.4);

        forceX += thermalX * thermalEnergyStrength;
        forceY += thermalY * thermalEnergyStrength;
        
        const driftX = Math.sin(time * 0.2 + seed) * 0.3;
        const driftY = Math.cos(time * 0.25 + seed) * 0.3;
        
        forceX += driftX * baseDriftStrength;
        forceY += driftY * baseDriftStrength;
        
        const displacedCenter = displacedCenters[starData.categoryKey as string];
        if (displacedCenter) {
            const dx = displacedCenter.x - starState.x;
            const dy = displacedCenter.y - starState.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0.1) {
                const cohesionStrength = groupCohesionFactor / (1 + distance * 0.1);
                forceX += dx * cohesionStrength;
                forceY += dy * cohesionStrength;
            }
        }

        // 4. Gentle Anti-Collision - Reduced frequency but still functional
        if (!categoryHasSelection && (frameCounter.current + index) % 20 === 0) {
          for (let otherIndex = index + 1; otherIndex < currentAnimState.length; otherIndex++) {
              const otherStarState = currentAnimState[otherIndex];
              const otherStarData = currentStars[otherIndex];

              if (starData.categoryKey !== otherStarData.categoryKey) continue;
              if (selections[otherStarData.categoryKey]) continue;

              const dx = otherStarState.x - starState.x;
              const dy = otherStarState.y - starState.y;
              const distSq = dx * dx + dy * dy;

              if (distSq < minIntraCategoryDist * minIntraCategoryDist && distSq > 0.1) {
                  const invDist = 1 / Math.sqrt(distSq);
                  const strength = intraCategoryRepulsionFactor * invDist;
                  forceX -= dx * strength * 0.5;
                  forceY -= dy * strength * 0.5;
              }
          }
        }

        let newVx = (starState.vx + forceX) * damping;
        let newVy = (starState.vy + forceY) * damping;
        
        const speedSq = newVx * newVx + newVy * newVy;
        if (speedSq > maxSpeed * maxSpeed) {
            const speedInv = maxSpeed / Math.sqrt(speedSq);
            newVx *= speedInv;
            newVy *= speedInv;
        }
        
        if (Math.abs(newVx) < stillnessThreshold) newVx = 0;
        if (Math.abs(newVy) < stillnessThreshold) newVy = 0;
        
        const totalMovement = Math.abs(newVx) + Math.abs(newVy);
        if (totalMovement < stillnessThreshold * 1.5) {
          newVx = 0;
          newVy = 0;
        }

        const newX = starState.x + newVx;
        const newY = starState.y + newVy;

        return { ...starState, x: newX, y: newY, vx: newVx, vy: newVy };
      });
      
      animationStateRef.current = newAnimState;

      if (!isDragging && frameCounter.current % 3 === 0) {
        newAnimState.forEach((state, index) => {
          const starEl = starRefs.current[index];
          if (starEl) {
            const starData = currentStars[index];
            const categoryHasSelection = !!selections[starData.categoryKey];
            const isSelected = selections[starData.categoryKey] === starData.id;
            
            if (isSelected) {
              return;
            }
            
            if (!categoryHasSelection) {
              starEl.style.left = `${state.x}%`;
              starEl.style.top = `${state.y}%`;
            }
          }
        });
      }
      
      if (frameCounter.current % 3 === 0) {
        categoryConnections.forEach((conn, i) => {
        const lineEl = categoryLineRefs.current[i];
        if (lineEl) {
            const star1Data = currentStars[conn.fromIndex];
            const star2Data = currentStars[conn.toIndex];
            const star1State = newAnimState[conn.fromIndex];
            const star2State = newAnimState[conn.toIndex];
            
            if(star1State && star2State && star1Data && star2Data) {
                let x1, y1, x2, y2;
                
                if (isDragging === star1Data.id) {
                  const draggedEl = starRefs.current[conn.fromIndex];
                  if (draggedEl) {
                    x1 = parseFloat(draggedEl.style.left) || star1Data.x;
                    y1 = parseFloat(draggedEl.style.top) || star1Data.y;
                  } else {
                    x1 = star1Data.x;
                    y1 = star1Data.y;
                  }
                } else if (selections[star1Data.categoryKey] === star1Data.id) {
                  const realPos1 = realStarPositions.find(rsp => rsp.id === star1Data.id);
                  x1 = realPos1?.x ?? star1State?.x ?? star1Data.x;
                  y1 = realPos1?.y ?? star1State?.y ?? star1Data.y;
                } else {
                  x1 = star1State.x;
                  y1 = star1State.y;
                }
                
                if (isDragging === star2Data.id) {
                  const draggedEl = starRefs.current[conn.toIndex];
                  if (draggedEl) {
                    x2 = parseFloat(draggedEl.style.left) || star2Data.x;
                    y2 = parseFloat(draggedEl.style.top) || star2Data.y;
                  } else {
                    x2 = star2Data.x;
                    y2 = star2Data.y;
                  }
                } else if (selections[star2Data.categoryKey] === star2Data.id) {
                  const realPos2 = realStarPositions.find(rsp => rsp.id === star2Data.id);
                  x2 = realPos2?.x ?? star2State?.x ?? star2Data.x;
                  y2 = realPos2?.y ?? star2State?.y ?? star2Data.y;
                } else {
                  x2 = star2State.x;
                  y2 = star2State.y;
                }
                
                lineEl.setAttribute('x1', String(x1));
                lineEl.setAttribute('y1', String(y1));
                lineEl.setAttribute('x2', String(x2));
                lineEl.setAttribute('y2', String(y2));
            }
        }
      });
      }

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    if (!animationFrameIdRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = undefined;
      }
      if (visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', visibilityChangeHandler);
      }
    };
  }, [selections, categoryConnections, isDragging, realStarPositions, isMobile]);

  useEffect(() => {
    const hasSelections = Object.values(selections).some(Boolean);
    if (!hasSelections) {
      setRealStarPositions([]);
      return;
    }
    
    calculateRealStarPositions();
    
    let rafId: number;
    let lastUpdate = 0;
    const updatePositions = () => {
      const now = performance.now();
      if (now - lastUpdate >= 50) { // Update every 50ms for smoothness
        calculateRealStarPositions();
        lastUpdate = now;
      }
      rafId = requestAnimationFrame(updatePositions);
    };
    
    rafId = requestAnimationFrame(updatePositions);
    
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [calculateRealStarPositions, selections]);

  const handleGenerate = async () => {
    updateCachedRects();
    
    const selectedStarsWithPositions = stars
      .filter(star => selections[star.categoryKey] === star.id)
      .map((star) => {
        const starIndex = stars.findIndex(s => s.id === star.id);
        const buttonElement = starRefs.current[starIndex];
        
        let finalX = star.x;
        let finalY = star.y;
        
        if (buttonElement) {
          const topStr = buttonElement.style.top;
          const leftStr = buttonElement.style.left;
          
          if (topStr && topStr.includes('%')) {
            finalY = parseFloat(topStr);
          }
          
          if (leftStr && leftStr.includes('%')) {
            finalX = parseFloat(leftStr);
          }
        }
        
        return {
          ...star,
          x: finalX,
          y: finalY
        };
      });
    
    if (onCaptureStarPositions) {
      onCaptureStarPositions(selectedStarsWithPositions, selectionOrder);
    }
    
    requestAnimationFrame(() => {
      const svgElement = playgroundRef.current?.querySelector('svg');
      const rect = svgElement?.getBoundingClientRect();
      if (rect) {
        onGenerate(rect);
      }
    });
  };


  const handleRandomSelection = () => {
    
    const unselectedCategories = blockCategories
      .map(cat => cat.key as keyof MythologySelections)
      .filter(key => !selections[key]);

    if (unselectedCategories.length > 0) {
      const currentSelectedIds = new Set<string>(Object.values(selections).filter(Boolean));
      const newSelectionOrder: string[] = [...selectionOrder.filter(id => currentSelectedIds.has(id))];
      
      unselectedCategories.forEach(randomCategory => {
        const categoryBlocks = mythBlocks[randomCategory];
        if (categoryBlocks && categoryBlocks.length > 0) {
          const randomBlock = getRandomElement(categoryBlocks);
          onSelectionMade(String(randomCategory), randomBlock.id);
          newSelectionOrder.push(randomBlock.id);
        }
      });
      
      setSelectionOrder(newSelectionOrder);
    }
  };

  const handleCustomSelection = async () => {
    const customTestData = {
      cosmology: {
        name: "",
        description: ""
      },
      gods: {
        name: "",
        description: ""
      },
      beings: {
        name: "",
        description: ""
      },
      archetype: {
        name: "",
        description: ""
      },
      themes: {
        name: "",
        description: ""
      },
      symbols: {
        name: "",
        description: ""
      },
      socialcodes: {
        name: "",
        description: ""
      }
    };

    setCustomTestPreview({
      isOpen: true,
      testData: customTestData
    });
  };

  const handleApplyCustomTest = async () => {
    const customTestData = customTestPreview.testData;

    blockCategories.forEach(category => {
      const categoryKey = category.key as keyof MythologySelections;
      const idMap: Record<string, string> = {
        'cosmology': 'cos-custom',
        'gods': 'god-custom', 
        'beings': 'being-custom',
        'archetype': 'arc-custom',
        'themes': 'theme-custom',
        'symbols': 'sym-custom',
        'socialcodes': 'soc-custom'
      };
      const customBlockId = idMap[categoryKey];
      onSelectionMade(String(categoryKey), customBlockId);
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    setStars(prev => {
      const updatedStars = prev.map(star => {
        const idToCategoryMap: Record<string, keyof typeof customTestData> = {
          'cos-custom': 'cosmology',
          'god-custom': 'gods',
          'being-custom': 'beings', 
          'arc-custom': 'archetype',
          'theme-custom': 'themes',
          'sym-custom': 'symbols',
          'soc-custom': 'socialcodes'
        };
        
        const categoryKey = idToCategoryMap[star.id];
        if (categoryKey) {
          const testData = customTestData[categoryKey];
          return {
            ...star,
            name: testData.name,
            description: testData.description
          };
        }
        return star;
      });
      
      if (onCaptureStarPositions) {
        const selectedStars = updatedStars.filter(star => {
          const selectedValue = selections[star.categoryKey];
          return selectedValue && selectedValue === star.id;
        });
        
        onCaptureStarPositions(selectedStars, selectionOrder);
      }
      
      return updatedStars;
    });
    
    setCustomTestPreview({ isOpen: false, testData: {} });
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOpenSettings = async () => {
    const currentProvider = aiConfig?.provider || 'openrouter';
    const providerInfo = AI_PROVIDERS[currentProvider];
    
    setSettingsModal(prev => ({
      ...prev,
      isOpen: true,
      selectedProvider: currentProvider,
      apiKey: aiConfig?.apiKey || '',
      selectedModel: aiConfig?.model || providerInfo.defaultModel,
      baseUrl: aiConfig?.baseUrl || providerInfo.baseUrl,
      availableModels: [],
      connectionStatus: 'idle',
      generationThresholds: {
        minEntities: aiConfig?.generationThresholds?.minEntities ?? DEFAULT_GENERATION_THRESHOLDS.minEntities,
        minLocations: aiConfig?.generationThresholds?.minLocations ?? DEFAULT_GENERATION_THRESHOLDS.minLocations,
        minVocabulary: aiConfig?.generationThresholds?.minVocabulary ?? DEFAULT_GENERATION_THRESHOLDS.minVocabulary,
        minTimelineEvents: aiConfig?.generationThresholds?.minTimelineEvents ?? DEFAULT_GENERATION_THRESHOLDS.minTimelineEvents,
        minStoryLength: aiConfig?.generationThresholds?.minStoryLength ?? DEFAULT_GENERATION_THRESHOLDS.minStoryLength,
        minStoryWordCount: aiConfig?.generationThresholds?.minStoryWordCount ?? DEFAULT_GENERATION_THRESHOLDS.minStoryWordCount
      },
      systemMessages: aiConfig?.systemMessages || {}
    }));

    if (currentProvider === 'ollama') {
      const models = await loadOllamaModels({
        model: aiConfig?.model || providerInfo.defaultModel,
        baseUrl: aiConfig?.baseUrl || providerInfo.baseUrl
      });
      setSettingsModal(prev => ({
        ...prev,
        availableModels: models,
        selectedModel: models.length > 0 ? (aiConfig?.model || models[0]) : ''
      }));
    }
    };

  const handleProviderChange = async (provider: AIProvider) => {
    const providerInfo = AI_PROVIDERS[provider];
    setSettingsModal(prev => ({
      ...prev,
      selectedProvider: provider,
      selectedModel: providerInfo.defaultModel,
      baseUrl: providerInfo.baseUrl,
      apiKey: provider === 'ollama' ? '' : prev.apiKey,
      availableModels: [], // Start with empty array
      connectionStatus: 'idle'
    }));

    if (provider === 'ollama') {
      const models = await loadOllamaModels({
        model: providerInfo.defaultModel,
        baseUrl: providerInfo.baseUrl
      });
      setSettingsModal(prev => ({
        ...prev,
        availableModels: models,
        selectedModel: models.length > 0 ? models[0] : ''
      }));
    }
    };

  const handleTestConnection = async () => {
    setSettingsModal(prev => ({ ...prev, isTestingConnection: true, connectionStatus: 'testing' }));
    
    try {
      const config: AIProviderConfig = {
        provider: settingsModal.selectedProvider,
        apiKey: settingsModal.apiKey || undefined,
        model: settingsModal.selectedModel,
        baseUrl: settingsModal.baseUrl
      };

      const isConnected = await AIServiceFactory.testConnection(config);
      
      setSettingsModal(prev => ({
        ...prev,
        isTestingConnection: false,
        connectionStatus: isConnected ? 'success' : 'error'
      }));
    } catch (error) {
      setSettingsModal(prev => ({
        ...prev,
        isTestingConnection: false,
        connectionStatus: 'error'
      }));
    }
  };

  const handleSaveSettings = () => {
    const providerInfo = AI_PROVIDERS[settingsModal.selectedProvider];
    const model = settingsModal.selectedModel?.trim() || providerInfo.defaultModel;
    
    const config: AIProviderConfig = {
      provider: settingsModal.selectedProvider,
      apiKey: settingsModal.apiKey || undefined,
      model: model,
      baseUrl: settingsModal.baseUrl,
      generationThresholds: settingsModal.generationThresholds,
      systemMessages: Object.keys(settingsModal.systemMessages).length > 0 ? settingsModal.systemMessages : undefined
    };
    
    if (onProviderConfigChange) {
      onProviderConfigChange(config);
    }
    // Always update active provider, even if it's the same
    if (onActiveProviderChange) {
      onActiveProviderChange(config.provider);
    }
    
    setSettingsModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleClearSelection = (category: keyof MythologySelections) => {
    const currentId = selections[category];
    if (currentId) {
      setSelectionOrder(prev => prev.filter(id => id !== currentId));
    }
    onSelectionMade(String(category), '');
  };

  const handleCustomStarClick = useCallback((star: Star) => {
    if (isGenerating) return;
    setCustomStarModal({
      isOpen: true,
      starId: star.id,
      categoryKey: star.categoryKey,
      currentName: star.name,
      currentDescription: star.description
    });
    setCustomStarName(star.name);
    setCustomStarDescription(star.description);
  }, [isGenerating]);

  const handleSaveCustomStar = async () => {
    if (!customStarModal) return;
    
    setStars(prev => {
      const updatedStars = prev.map(star => 
        star.id === customStarModal.starId
          ? { ...star, name: customStarName, description: customStarDescription }
          : star
      );
      
      if (onCaptureStarPositions) {
        const selectedStars = updatedStars.filter(star => {
          const selectedValue = selections[star.categoryKey];
          return selectedValue && selectedValue === star.id;
        });
        onCaptureStarPositions(selectedStars, selectionOrder);
      }
      
      return updatedStars;
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setCustomStarModal(null);
  };

  const handleLongPressStart = useCallback((star: Star) => {
    if (isGenerating) return;
    const timeoutId = setTimeout(() => {
      handleCustomStarClick(star);
    }, 800);
    setLongPressTimeoutRef(timeoutId);
  }, [isGenerating, handleCustomStarClick]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimeoutRef) {
      clearTimeout(longPressTimeoutRef);
      setLongPressTimeoutRef(null);
    }
  }, [longPressTimeoutRef]);

  const onCategorySelect = (categoryKey: keyof MythologySelections) => {
    setHoveredCategory(categoryKey);
  };

  return (
    <motion.div 
      ref={playgroundRef}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        scale: 0.98
      }}
      transition={{ 
        duration: 1.2,
        ease: [0.4, 0, 0.2, 1]
      }}
      className="relative min-h-screen text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <CosmicBackground />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(107,33,168,0.08),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-transparent to-slate-900/20"></div>
      </div>
      
      {/* UI Header - completely isolated from SVG */}
      <div className="fixed top-0 left-0 right-0 z-50 p-8 pointer-events-none">
        <AnimatePresence>
          {!isGenerating && (
            <motion.header
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="relative flex flex-col w-full"
            >
              <div className="flex items-start justify-between w-full">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative"
                >
                  <h1 className="text-7xl md:text-8xl font-black text-slate-50 mb-1 tracking-[-0.02em] leading-[0.9]">
                    MYTH
                  </h1>
                </motion.div>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs text-slate-500 text-right font-light mt-8 whitespace-nowrap"
                >
                  Gather the seven building blocks floating in the cosmos to create your own myth.
                </motion.p>
              </div>
              
              <div className="flex items-center gap-3 mt-2 relative w-full">
                <div className="h-[2px] w-20 bg-slate-600/50"></div>
                <span className="text-xs text-slate-500 font-light tracking-[0.3em] uppercase relative z-10 bg-slate-900 px-2">BLOCKS</span>
                <div className="h-[2px] flex-1 bg-slate-600/50"></div>
                <div className="flex items-center gap-4 ml-4 pointer-events-auto">
                  <motion.button
                    onClick={handleRandomSelection}
                    whileHover={{ y: -2 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="group relative px-5 py-2.5 text-slate-300 hover:text-white text-xs font-medium uppercase tracking-wider
                             transition-all duration-300 flex items-center gap-2.5
                             border border-slate-700/40 hover:border-slate-600/60
                             bg-slate-900/30 hover:bg-slate-900/50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Random</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={handleCustomSelection}
                    whileHover={{ y: -2 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="group relative px-5 py-2.5 text-slate-300 hover:text-white text-xs font-medium uppercase tracking-wider
                             transition-all duration-300 flex items-center gap-2.5
                             border border-slate-700/40 hover:border-slate-600/60
                             bg-slate-900/30 hover:bg-slate-900/50"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Custom</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={handleOpenSettings}
                    whileHover={{ y: -2, rotate: 90 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="px-3 py-2.5 text-slate-400 hover:text-slate-200 
                             transition-all duration-300
                             border border-slate-700/40 hover:border-slate-600/60
                             bg-slate-900/30 hover:bg-slate-900/50"
                  >
                    <Settings className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.header>
          )}
        </AnimatePresence>
      </div>

      {/* SVG Container */}
      <div className="relative z-10" style={{ paddingTop: '120px', height: '100vh' }}>
        <main className="relative w-full h-full">
          {/* Constellation Container - isGenerating'de scale animasyonu */}
          <motion.div
            animate={{ 
              scale: isGenerating ? 0.4 : 1,
              x: 0,
              y: isGenerating ? 0 : 0  // Tam ortada kal
            }}
            transition={{ 
              duration: isGenerating ? 1.5 : 0.5,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: isGenerating ? 0.3 : 0
            }}
            className="absolute inset-0 w-full h-full"
            style={{ transformOrigin: 'center center' }}
          >
            <svg
              className={`absolute inset-0 w-full h-full pointer-events-none`}
              aria-hidden="true"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(251, 191, 36, 0.8)" />
                <stop offset="33%" stopColor="rgba(244, 114, 182, 0.8)" />
                <stop offset="66%" stopColor="rgba(96, 165, 250, 0.8)" />
                <stop offset="100%" stopColor="rgba(52, 211, 153, 0.8)" />
              </linearGradient>
              
              {/* Inactive line gradient */}
              <linearGradient id="inactive-line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(168, 85, 247, 0.18)" />
                <stop offset="12%" stopColor="rgba(139, 92, 246, 0.15)" />
                <stop offset="25%" stopColor="rgba(96, 165, 250, 0.13)" />
                <stop offset="37%" stopColor="rgba(34, 211, 238, 0.12)" />
                <stop offset="50%" stopColor="rgba(251, 191, 36, 0.1)" />
                <stop offset="62%" stopColor="rgba(34, 211, 238, 0.12)" />
                <stop offset="75%" stopColor="rgba(96, 165, 250, 0.13)" />
                <stop offset="87%" stopColor="rgba(244, 114, 182, 0.14)" />
                <stop offset="100%" stopColor="rgba(168, 85, 247, 0.18)" />
              </linearGradient>
              
            </defs>
            {/* Category Constellation Lines */}
            <g>
              {categoryConnections.map((conn, i) => {
                const star1 = stars[conn.fromIndex];
                const star2 = stars[conn.toIndex];
                if (!star1 || !star2) return null;
                
                let x1, y1, x2, y2;
                
                if (isDragging === star1.id) {
                  const draggedEl = starRefs.current[conn.fromIndex];
                  if (draggedEl) {
                    x1 = parseFloat(draggedEl.style.left) || star1.x;
                    y1 = parseFloat(draggedEl.style.top) || star1.y;
                  } else {
                    x1 = star1.x;
                    y1 = star1.y;
                  }
                } else {
                  const fallbackState = animationStateRef.current[conn.fromIndex];
                  const realPos1 = realStarPositions.find(rsp => rsp.id === star1.id);
                  x1 = realPos1?.x ?? fallbackState?.x ?? star1.x;
                  y1 = realPos1?.y ?? fallbackState?.y ?? star1.y;
                }
                
                if (isDragging === star2.id) {
                  const draggedEl = starRefs.current[conn.toIndex];
                  if (draggedEl) {
                    x2 = parseFloat(draggedEl.style.left) || star2.x;
                    y2 = parseFloat(draggedEl.style.top) || star2.y;
                  } else {
                    x2 = star2.x;
                    y2 = star2.y;
                  }
                } else {
                  const fallbackState = animationStateRef.current[conn.toIndex];
                  const realPos2 = realStarPositions.find(rsp => rsp.id === star2.id);
                  x2 = realPos2?.x ?? fallbackState?.x ?? star2.x;
                  y2 = realPos2?.y ?? fallbackState?.y ?? star2.y;
                }
                
                const isActive = !!selections[star1.categoryKey] && !!selections[star2.categoryKey];
                const isHovered = hoveredCategory === star1.categoryKey || hoveredCategory === star2.categoryKey;
                
                return (
                  <AnimatedLine
                    key={conn.key}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    isActive={isActive}
                    isHovered={isHovered}
                    lineRef={el => categoryLineRefs.current[i] = el}
                    isDashed={true}
                  />
                );
              })}
            </g>

            {/* Selected Stars Constellation Lines */}
            <ConstellationLines 
              stars={stars.map((star, index) => {
                const isSelected = selections[star.categoryKey] === star.id;
                if (isSelected && animationStateRef.current[index]) {
                  const animState = animationStateRef.current[index];
                  return { 
                    id: star.id,
                    x: animState.x, 
                    y: animState.y,
                    categoryKey: String(star.categoryKey),
                    name: star.name,
                    description: star.description,
                    vx: star.vx,
                    vy: star.vy,
                    category: {
                      color: star.category.color,
                      glow: star.category.glow
                    }
                  };
                }
                
                return { 
                  id: star.id,
                  x: star.x, 
                  y: star.y,
                  categoryKey: String(star.categoryKey),
                  name: star.name,
                  description: star.description,
                  vx: star.vx,
                  vy: star.vy,
                  category: {
                    color: star.category.color,
                    glow: star.category.glow
                  }
                };
              })}
              selections={selections}
              selectionOrder={selectionOrder}
              isLoading={isGenerating}
            />
          </svg>
          
          <AnimatePresence>
            {!isGenerating && stars.map((star, index) => {
            const isSelected = selections[star.categoryKey] === star.id;
            const categoryHasSelection = !!selections[star.categoryKey];
            const isHovered = hoveredStarInfo?.value === star.id;
            const isInHoveredCategory = !isSelected && !isHovered && hoveredStarInfo?.category === star.categoryKey;

            return (
              <motion.div
                key={star.id}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger
                      asChild
                      onMouseEnter={() => {
                        setHoveredCategory(star.categoryKey);
                        if (!categoryHasSelection) {
                          setHoveredStarInfo({ category: star.categoryKey, value: star.id });
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredCategory(null);
                        setHoveredStarInfo(null);
                      }}
                    >
                      <button
                      ref={el => starRefs.current[index] = el}
                      data-star-id={star.id}
                      onClick={() => {
                        if (!hasDraggedDistance) {
                          if (star.isCustom) {
                            if (isSelected) {
                              handleCustomStarClick(star);
                            } else {
                              onSelectionMade(String(star.categoryKey), star.id);
                              setSelectionOrder(prev => {
                                const without = prev.filter(id => id !== star.id);
                                return [...without, star.id];
                              });
                              setTimeout(() => handleCustomStarClick(star), 100);
                            }
                          } else {
                            if (isSelected) {
                              handleClearSelection(star.categoryKey);
                            } else {
                              onSelectionMade(String(star.categoryKey), star.id);
                              setSelectionOrder(prev => {
                                const without = prev.filter(id => id !== star.id);
                                return [...without, star.id];
                              });
                            }
                          }
                        }
                      }}
                      onContextMenu={(e) => {
                        if (star.isCustom && isSelected) {
                          e.preventDefault();
                          handleClearSelection(star.categoryKey);
                        }
                      }}
                      onMouseDown={(e) => {
                        if (star.isCustom && isSelected) {
                          handleLongPressStart(star);
                        }

                        const categoryHasSelection = !!selections[star.categoryKey];
                        if (categoryHasSelection) {
                          updateCachedRects();

                          const starEl = e.currentTarget;

                          let playgroundRect = cachedRectsRef.current.playground;
                          if (!playgroundRect) {
                            requestAnimationFrame(() => {
                              const freshRect = playgroundRef.current?.getBoundingClientRect();
                              if (freshRect) {
                                cachedRectsRef.current.playground = freshRect;
                                cachedRectsRef.current.lastUpdate = performance.now();
                              }
                            });
                            playgroundRect = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
                          }

                          if (playgroundRect && starEl) {
                            const currentLeft = parseFloat(starEl.style.left) || 0;
                            const currentTop = parseFloat(starEl.style.top) || 0;

                            const mouseX = ((e.clientX - playgroundRect.left) / playgroundRect.width) * 100;
                            const mouseY = ((e.clientY - playgroundRect.top) / playgroundRect.height) * 100;

                            const offset = {
                              x: mouseX - currentLeft,
                              y: mouseY - currentTop
                            };
                            setDragOffset(offset);

                            setStars(prev => prev.map(s =>
                              s.id === star.id
                                ? { ...s, x: currentLeft, y: currentTop }
                                : s
                            ));
                          }

                          setIsDragging(star.id);
                          setDragStartPos({ x: e.clientX, y: e.clientY });
                          setHasDraggedDistance(false);
                          e.preventDefault(); // Prevent default behavior
                        }
                      }}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      onTouchStart={() => {
                        if (star.isCustom && isSelected) {
                          handleLongPressStart(star);
                        }
                      }}
                      onTouchEnd={handleLongPressEnd}
                      className={`
                        absolute flex items-center justify-center gap-1 transition-all duration-300
                        group transform will-change-transform
                        ${isSelected
                            ? `px-2 py-1 rounded-lg ${star.category.color} scale-110 hover:cursor-move shadow-lg`
                                                          : `px-2 py-1 rounded-lg ${categoryHasSelection
                               ? 'opacity-40 scale-85 hover:cursor-move hover:opacity-60'
                                : 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white hover:scale-105'
                              }`
                        }
                        ${isDragging === star.id ? 'cursor-move z-50' : ''}
                        ${hoveredCategory === star.categoryKey && !categoryHasSelection ? 'ring-2 ring-purple-400/50 ring-offset-2 ring-offset-transparent' : ''}
                      `}
                      style={{
                        top: `${star.y}%`, 
                        left: `${star.x}%`,
                        transform: 'translate(-50%, -50%)',
                        '--duration': `${star.duration}s`, '--delay': `${star.delay}s`,
                        filter: isSelected 
                          ? `drop-shadow(0 0 15px ${star.category.glow}) drop-shadow(0 0 8px ${star.category.glow}) brightness(1.2)`
                          : (isHovered || isInHoveredCategory)
                            ? `drop-shadow(0 0 8px rgba(156,163,175,0.3))`
                            : 'none',
                        transition: 'opacity .2s ease, transform .2s ease, background-color .2s ease, border-color .2s ease, box-shadow .2s ease',
                        backfaceVisibility: 'hidden',
                        transformStyle: 'preserve-3d',
                      } as React.CSSProperties}
                    >
                      <div className="flex items-center gap-1">
                        <Star 
                          ref={el => starIconRefs.current[index] = el}
                          className={`w-4 h-4 transition-all duration-300 ${isSelected ? `${star.category.color} drop-shadow-sm` : 'text-slate-400 group-hover:text-amber-300'}`}
                          fill={isSelected ? 'currentColor' : 'none'}
                          strokeWidth={isSelected ? 0 : 1.5}
                        />
                        <span className={`font-medium text-xs pr-1 ${isSelected ? 'text-white font-bold' : ''}`}>{star.name}</span>
                        {star.isCustom && (
                          <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-purple-400 transition-colors" />
                        )}
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-slate-900/80 border-slate-700 text-slate-200 backdrop-blur-sm">
                    <p>{String(optionDescriptions[star.id]) || 'Description not found.'}</p>
                    {star.isCustom && (
                      <div className="mt-2 pt-2 border-t border-slate-600 text-xs text-slate-400">
                        💡 Right-click or long-press to deselect • Click to edit
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
            );
          })}
          </AnimatePresence>
          </motion.div>
        </main>
      </div>

      {/* Footer - fixed position, SVG'den tamamen izole */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-6 pointer-events-none">
        <AnimatePresence>
          {!isGenerating && (
            <motion.footer
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="pointer-events-auto"
            >
              <div className="max-w-6xl mx-auto">
                {/* Mythology Elements - Editorial Style */}
                <div className="flex items-baseline justify-center gap-6 mb-8 flex-wrap">
                  {categoryData.map((cat, index) => {
                    const selectionId = selections[cat.key];
                    const selectedBlock = selectionId ? cat.options.find(o => o.id === selectionId) : null;
                    const Icon = cat.icon;
                    
                    return (
                      <div key={cat.key} className="flex items-center gap-6">
                        <div
                          onClick={() => onCategorySelect(cat.key)}
                          className="flex items-baseline gap-2 cursor-pointer group"
                        >
                          <Icon className={`w-3.5 h-3.5 mt-0.5 ${selectedBlock ? 'text-purple-400' : 'text-slate-600'} transition-colors`} />
                          <div className="flex flex-col">
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-light">
                              {cat.title}
                            </span>
                            {selectedBlock ? (
                              <span className="text-sm text-white font-light leading-tight">
                                {selectedBlock.name}
                              </span>
                            ) : (
                              <span className="text-sm text-slate-600 font-light italic">
                                —
                              </span>
                            )}
                          </div>
                        </div>
                        {index < categoryData.length - 1 && (
                          <div className="w-1.5 h-1.5 bg-pink-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Generate */}
                {isGenerationReady && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleGenerate}
                      className="text-sm text-slate-400 hover:text-white uppercase tracking-[0.3em] font-light transition-colors flex items-center gap-3"
                    >
                      <div className="w-px h-4 bg-slate-700" />
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate</span>
                      <div className="w-px h-4 bg-slate-700" />
                    </button>
                  </div>
                )}
              </div>
            </motion.footer>
          )}
        </AnimatePresence>
      </div>

      {/* Custom Star Edit Modal */}
      <Dialog open={customStarModal?.isOpen || false} onOpenChange={(open) => {
        if (!open) {
          setCustomStarModal(null);
          setCustomStarName('');
          setCustomStarDescription('');
        }
      }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-3xl max-h-[75vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Edit3 className="w-5 h-5 text-purple-400" />
              Custom Mythology Builder
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Create your own mythological elements
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Star Name <span className="text-xs text-slate-500">({customStarName.length}/50)</span>
              </label>
              <Input
                value={customStarName}
                onChange={(e) => setCustomStarName(e.target.value)}
                placeholder="Enter custom star name..."
                className="bg-slate-800 border-slate-600 text-slate-100 focus:border-purple-500"
                maxLength={50}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Description <span className="text-xs text-slate-500">({customStarDescription.length}/200)</span>
              </label>
              <Textarea
                value={customStarDescription}
                onChange={(e) => setCustomStarDescription(e.target.value)}
                placeholder="Describe your custom mythological element..."
                className="bg-slate-800 border-slate-600 text-slate-100 focus:border-purple-500 min-h-[100px]"
                maxLength={200}
              />
            </div>
            <div className="flex gap-2 pt-4 border-t border-slate-700/50">
              <Button
                onClick={handleSaveCustomStar}
                disabled={!customStarName.trim() || !customStarDescription.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                onClick={() => {
                  setCustomStarModal(null);
                  setCustomStarName('');
                  setCustomStarDescription('');
                }}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Test Preview Dialog */}
      <Dialog open={customTestPreview.isOpen} onOpenChange={(open) => {
        if (!open) {
          setCustomTestPreview({ isOpen: false, testData: {} });
        }
      }}>
        <DialogContent className="bg-slate-900 border-slate-700/50 text-slate-100 max-w-4xl max-h-[85vh] overflow-hidden p-0">
          <div className="px-5 py-3 border-b border-slate-800/50">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-100">
                Customize Your Mythology Elements
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-1">
                Define each element to create your unique mythology
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto px-5 py-4 max-h-[calc(85vh-120px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(customTestPreview.testData).map(([categoryKey, data], index) => {
                const category = categoryData.find(cat => cat.key === categoryKey);
                const Icon = category?.icon || Star;
                const categoryTitle = blockCategories.find(cat => cat.key === categoryKey)?.title || categoryKey;
                
                return (
                  <motion.div
                    key={categoryKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-3 bg-slate-800/30 rounded border border-slate-700/50 hover:border-slate-600/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${category?.color || 'text-slate-400'}`} />
                      <h3 className="font-medium text-slate-200 text-xs">
                        {categoryTitle}
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <Input
                          value={data.name}
                          onChange={(e) => {
                            setCustomTestPreview(prev => ({
                              ...prev,
                              testData: {
                                ...prev.testData,
                                [categoryKey]: {
                                  ...prev.testData[categoryKey],
                                  name: e.target.value
                                }
                              }
                            }));
                          }}
                          className="w-full bg-slate-900/60 border-slate-700/70 text-slate-100 placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 text-xs h-7 px-2 rounded"
                          placeholder="Name..."
                          maxLength={50}
                        />
                      </div>
                      
                      <div>
                        <Textarea
                          value={data.description}
                          onChange={(e) => {
                            setCustomTestPreview(prev => ({
                              ...prev,
                              testData: {
                                ...prev.testData,
                                [categoryKey]: {
                                  ...prev.testData[categoryKey],
                                  description: e.target.value
                                }
                              }
                            }));
                          }}
                          className="w-full bg-slate-900/60 border-slate-700/70 text-slate-100 placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 text-xs min-h-[60px] resize-none px-2 py-1.5 rounded leading-relaxed"
                          maxLength={500}
                          placeholder="Description..."
                        />
                        <div className="flex justify-end mt-0.5">
                          <span className="text-[10px] text-slate-500">{data.description.length}/500</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          
          <div className="px-5 py-3 border-t border-slate-800/50 flex items-center justify-end gap-2">
            <Button
              onClick={() => setCustomTestPreview({ isOpen: false, testData: {} })}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800/50 h-8 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyCustomTest}
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium h-8 px-5 text-xs"
            >
              Create & Generate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={settingsModal.isOpen} onOpenChange={(open) => {
        if (!open) {
          setSettingsModal(prev => ({ ...prev, isOpen: false }));
        }
      }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Settings className="w-6 h-6 text-purple-400" />
              AI Provider Settings
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm mt-2">
              Configure your AI provider and model preferences for myth generation.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={settingsModal.activeTab} onValueChange={(value) => setSettingsModal(prev => ({ ...prev, activeTab: value as 'provider' | 'thresholds' | 'system-messages' }))} className="mt-6">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700 rounded-lg p-1">
              <TabsTrigger value="provider" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-200 text-slate-400">
                Provider
              </TabsTrigger>
              <TabsTrigger value="thresholds" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-200 text-slate-400">
                Thresholds
              </TabsTrigger>
              <TabsTrigger value="system-messages" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-200 text-slate-400">
                System Messages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="provider" className="space-y-6 mt-6">
              {/* Provider Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">AI Provider</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                  <button
                    key={key}
                    onClick={() => handleProviderChange(key as AIProvider)}
                    className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                      settingsModal.selectedProvider === key
                        ? 'border-purple-500 bg-purple-500/10 text-purple-200'
                        : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{provider.icon}</span>
                      <span className="font-medium text-sm">{provider.name}</span>
                      {provider.isLocal && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Local</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{provider.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection - Only for Ollama */}
            {settingsModal.selectedProvider === 'ollama' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Model</label>
                <div className="space-y-2">
                  <select
                    value={settingsModal.selectedModel}
                    onChange={(e) => setSettingsModal(prev => ({ ...prev, selectedModel: e.target.value }))}
                    className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:border-purple-500 focus:outline-none"
                    disabled={settingsModal.availableModels.length === 0}
                  >
                    {settingsModal.availableModels.length === 0 ? (
                      <option value="" className="bg-slate-800">
                        Ollama modelleri yükleniyor...
                      </option>
                    ) : (
                      settingsModal.availableModels.map(model => (
                        <option key={model} value={model} className="bg-slate-800">
                          {model}
                        </option>
                      ))
                    )}
                  </select>
                  {settingsModal.availableModels.length === 0 && (
                    <p className="text-xs text-slate-500">
                      Ollama sunucusuna bağlanılamadı veya hiç model yüklü değil.
                    </p>
                  )}
                  {settingsModal.availableModels.length > 0 && (
                    <p className="text-xs text-slate-500">
                      {settingsModal.availableModels.length} model yüklü
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Model input for non-Ollama providers */}
            {settingsModal.selectedProvider !== 'ollama' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Model</label>
                <Input
                  value={settingsModal.selectedModel || AI_PROVIDERS[settingsModal.selectedProvider].defaultModel}
                  onChange={(e) => setSettingsModal(prev => ({ ...prev, selectedModel: e.target.value }))}
                  placeholder={AI_PROVIDERS[settingsModal.selectedProvider].defaultModel}
                  className="bg-slate-800 border-slate-600 text-slate-100 focus:border-purple-500"
                />
                {settingsModal.selectedProvider === 'openrouter' && (
                  <p className="text-xs text-slate-500">
                    Enter a model ID (e.g., anthropic/claude-3.5-sonnet, openai/gpt-4). Leave empty or use "openrouter/auto" for automatic selection.
                  </p>
                )}
              </div>
            )}

            {/* API Key */}
            {AI_PROVIDERS[settingsModal.selectedProvider].requiresApiKey && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">API Key</label>
                <Input
                  type="password"
                  value={settingsModal.apiKey}
                  onChange={(e) => setSettingsModal(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder={`Enter your ${AI_PROVIDERS[settingsModal.selectedProvider].name} API key`}
                  className="bg-slate-800 border-slate-600 text-slate-100 focus:border-purple-500"
                />
                <p className="text-xs text-slate-500">
                  Your API key is stored locally and never shared.
                </p>
              </div>
            )}

            {/* Base URL (for Ollama) */}
            {settingsModal.selectedProvider === 'ollama' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Base URL</label>
                <Input
                  value={settingsModal.baseUrl}
                  onChange={(e) => setSettingsModal(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="http://localhost:11434"
                  className="bg-slate-800 border-slate-600 text-slate-100 focus:border-purple-500"
                />
                <p className="text-xs text-slate-500">
                  URL where your Ollama server is running (default: http://localhost:11434)
                </p>
              </div>
            )}

            </TabsContent>

            <TabsContent value="thresholds" className="space-y-6 mt-6">
              {/* Generation Thresholds */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Generation Quality Thresholds</label>
                  <p className="text-xs text-slate-500 mb-4">
                    Set minimum requirements for generated mythology content. Higher values mean stricter quality control.
                  </p>
                </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Min Entities</label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={settingsModal.generationThresholds.minEntities}
                    onChange={(e) => setSettingsModal(prev => ({
                      ...prev,
                      generationThresholds: {
                        ...prev.generationThresholds,
                        minEntities: parseInt(e.target.value) || DEFAULT_GENERATION_THRESHOLDS.minEntities
                      }
                    }))}
                    className="bg-slate-800 border-slate-600 text-slate-100 focus:border-purple-500 text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Min Locations</label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={settingsModal.generationThresholds.minLocations}
                    onChange={(e) => setSettingsModal(prev => ({
                      ...prev,
                      generationThresholds: {
                        ...prev.generationThresholds,
                        minLocations: parseInt(e.target.value) || DEFAULT_GENERATION_THRESHOLDS.minLocations
                      }
                    }))}
                    className="bg-slate-800 border-slate-600 text-slate-100 focus:border-purple-500 text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Min Vocabulary</label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={settingsModal.generationThresholds.minVocabulary}
                    onChange={(e) => setSettingsModal(prev => ({
                      ...prev,
                      generationThresholds: {
                        ...prev.generationThresholds,
                        minVocabulary: parseInt(e.target.value) || DEFAULT_GENERATION_THRESHOLDS.minVocabulary
                      }
                    }))}
                    className="bg-slate-800 border-slate-600 text-slate-100 focus:border-purple-500 text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Min Timeline Events</label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={settingsModal.generationThresholds.minTimelineEvents}
                    onChange={(e) => setSettingsModal(prev => ({
                      ...prev,
                      generationThresholds: {
                        ...prev.generationThresholds,
                        minTimelineEvents: parseInt(e.target.value) || DEFAULT_GENERATION_THRESHOLDS.minTimelineEvents
                      }
                    }))}
                    className="bg-slate-800 border-slate-600 text-slate-100 focus:border-purple-500 text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Min Story Length (chars)</label>
                  <Input
                    type="number"
                    min="10"
                    max="1000"
                    value={settingsModal.generationThresholds.minStoryLength}
                    onChange={(e) => setSettingsModal(prev => ({
                      ...prev,
                      generationThresholds: {
                        ...prev.generationThresholds,
                        minStoryLength: parseInt(e.target.value) || DEFAULT_GENERATION_THRESHOLDS.minStoryLength
                      }
                    }))}
                    className="bg-slate-800 border-slate-600 text-slate-100 focus:border-purple-500 text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Min Story Word Count</label>
                  <Input
                    type="number"
                    min="100"
                    max="2000"
                    value={settingsModal.generationThresholds.minStoryWordCount}
                    onChange={(e) => setSettingsModal(prev => ({
                      ...prev,
                      generationThresholds: {
                        ...prev.generationThresholds,
                        minStoryWordCount: parseInt(e.target.value) || DEFAULT_GENERATION_THRESHOLDS.minStoryWordCount
                      }
                    }))}
                    className="bg-slate-800 border-slate-600 text-slate-100 focus:border-purple-500 text-sm"
                  />
                </div>
              </div>
              </div>
            </TabsContent>

            <TabsContent value="system-messages" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-4">
                    Customize the AI system prompts used for myth generation. Leave empty to use defaults.
                  </p>
                </div>

                {/* Phase 1 Story Prompt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Phase 1: Story + Entities Prompt</label>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultPrompt = `You are a creative myth creator. Create a COMPLETELY ORIGINAL mythological story and entities.

SELECTIONS:
{SELECTIONS}

STYLE: {MOOD}

🚫 FORBIDDEN: Zeus, Thor, Odin, Ra, Atlas, Helios, Selene, Anubis, Shiva, Buddha, Jesus, Muhammad and ALL known mythological names!

✅ PHASE 1 REQUIREMENTS:
1. Create a complete mythological STORY (minimum 600 words) with title and text
2. Create at least 5 ENTITIES with full details (name, type, description, powers, relationships)

Return ONLY this JSON format:
\`\`\`json
{
  "story": {
    "title": "Legend title",
    "text": "Full legend text (minimum 600 words)",
    "mood": "{MOOD}"
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
                        setSettingsModal(prev => ({
                          ...prev,
                          systemMessages: {
                            ...prev.systemMessages,
                            phase1Story: defaultPrompt
                          }
                        }));
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 underline"
                    >
                      Load Default
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    Used for generating the main story and entities. Use placeholders: {"{"}SELECTIONS{"}"}, {"{"}MOOD{"}"}
                  </p>
                  <Textarea
                    value={settingsModal.systemMessages.phase1Story || ''}
                    onChange={(e) => setSettingsModal(prev => ({
                      ...prev,
                      systemMessages: {
                        ...prev.systemMessages,
                        phase1Story: e.target.value
                      }
                    }))}
                    placeholder="Leave empty to use default prompt..."
                    className="bg-slate-800 border-slate-600 text-slate-100 focus:border-purple-500 min-h-[200px] font-mono text-xs"
                  />
                </div>

                {/* Phase 2 Remaining Components Prompt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Phase 2: WorldMap + Analysis + AncientLanguage Prompt</label>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultPrompt = `You are completing a mythological universe. Use the existing STORY and ENTITIES as reference.

ORIGINAL SELECTIONS:
{SELECTIONS}

EXISTING STORY:
{STORY}

EXISTING ENTITIES:
{ENTITIES}

✅ PHASE 2 REQUIREMENTS - Generate these components based on the story:
1. worldMap: At least 5 locations mentioned or implied in the story
2. analysis: Timeline events, symbols, conflicts, themes, social code based on the story
3. ancientLanguage: At least 10 vocabulary words that fit the story's language and culture

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
        "importance": "major/minor"
      }
    ],
    "mapDescription": "Overall description",
    "totalArea": "Area description"
  },
  "analysis": {
    "timeline": [
      {"id": "id-1", "step": 1, "title": "Event", "description": "Description"}
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
        "category": "gods/nature/time/emotion",
        "rarity": "common/rare/sacred"
      }
    ]
  }
}
\`\`\`

CRITICAL: All locations, events, and vocabulary must be consistent with the existing story and entities!`;
                        setSettingsModal(prev => ({
                          ...prev,
                          systemMessages: {
                            ...prev.systemMessages,
                            phase2Remaining: defaultPrompt
                          }
                        }));
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 underline"
                    >
                      Load Default
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    Used for generating remaining components based on the story. Use placeholders: {"{"}STORY{"}"}, {"{"}ENTITIES{"}"}, {"{"}SELECTIONS{"}"}
                  </p>
                  <Textarea
                    value={settingsModal.systemMessages.phase2Remaining || ''}
                    onChange={(e) => setSettingsModal(prev => ({
                      ...prev,
                      systemMessages: {
                        ...prev.systemMessages,
                        phase2Remaining: e.target.value
                      }
                    }))}
                    placeholder="Leave empty to use default prompt..."
                    className="bg-slate-800 border-slate-600 text-slate-100 focus:border-purple-500 min-h-[200px] font-mono text-xs"
                  />
                </div>

                {/* Enhanced Retry Prompt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Enhanced Retry Prompt</label>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultPrompt = `You are a myth fidelity enforcer. Generate a revised myth that strictly satisfies ALL missing features.

SELECTIONS:
{SELECTIONS}

MOOD: {MOOD}

🚨 CRITICAL RETRY INSTRUCTIONS:
The previous attempt failed to include these mandatory elements:
{MISSING_FEATURES}

⚠️ ABSOLUTE REQUIREMENTS:
1. Mention every missing feature explicitly in the story.
2. Use the exact terminology provided by the user—no paraphrasing.
3. Mirror custom descriptions precisely when referenced.
4. Ensure entities embody the missing features in their descriptions and powers.
5. Cross-check each requirement before responding.

✅ OUTPUT:
Return the same JSON schema as Phase 1 (story + entities only).`;
                        setSettingsModal(prev => ({
                          ...prev,
                          systemMessages: {
                            ...prev.systemMessages,
                            enhancedRetry: defaultPrompt
                          }
                        }));
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 underline"
                    >
                      Load Default
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    Used when fidelity validation fails. Use placeholders: {"{"}SELECTIONS{"}"}, {"{"}MOOD{"}"}, {"{"}MISSING_FEATURES{"}"}
                  </p>
                  <Textarea
                    value={settingsModal.systemMessages.enhancedRetry || ''}
                    onChange={(e) => setSettingsModal(prev => ({
                      ...prev,
                      systemMessages: {
                        ...prev.systemMessages,
                        enhancedRetry: e.target.value
                      }
                    }))}
                    placeholder="Leave empty to use default prompt..."
                    className="bg-slate-800 border-slate-600 text-slate-100 focus:border-purple-500 min-h-[200px] font-mono text-xs"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-3 mt-6 pt-6 border-t border-slate-700/50">
            <button
              onClick={handleTestConnection}
              disabled={settingsModal.isTestingConnection || (AI_PROVIDERS[settingsModal.selectedProvider].requiresApiKey && !settingsModal.apiKey)}
              className="w-full p-3 bg-blue-600/20 border border-blue-500/50 rounded-lg text-blue-200 hover:bg-blue-600/30 hover:border-blue-400/70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {settingsModal.isTestingConnection ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Test Connection
                </>
              )}
            </button>
            
            {settingsModal.connectionStatus === 'success' && (
              <div className="p-2 bg-green-500/20 border border-green-500/50 rounded text-green-200 text-sm text-center">
                ✓ Connection successful!
              </div>
            )}
            
            {settingsModal.connectionStatus === 'error' && (
              <div className="p-2 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm text-center">
                ✗ Connection failed. Please check your settings.
              </div>
            )}
          </div>
          
          <div className="flex gap-2 pt-4 border-t border-slate-700/50">
            <Button
              onClick={handleSaveSettings}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-medium py-2"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
            <Button
              onClick={() => setSettingsModal(prev => ({ ...prev, isOpen: false }))}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 px-4"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
