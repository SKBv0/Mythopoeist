import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { RefreshCw, Compass, MapPin, Sparkles, Mountain, Waves, TreePine, Castle, Crown, Shield, Zap, Flame, Eye, Scroll, CircleDot, Hexagon, X, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { logger } from '@/utils/logger';
import { ComprehensiveAIResponse } from '@/types/mythology';

interface Location {
  id: string;
  name: string;
  type: string;
  description: string;
  region: string;
  offset: { x: number; y: number };
  culturalSignificance?: 'sacred' | 'forbidden' | 'neutral' | 'ritual' | 'ancestral';
  socialCode?: {
    sacred?: string;
    forbidden?: string;
    forgivable?: string;
  };
  rituals?: string[];
  culturalSymbols?: string[];
  mythologicalConnection?: string;
}

interface CulturalLayer {
  id: string;
  name: string;
  type: 'trade_route' | 'pilgrimage_path' | 'cultural_boundary' | 'ritual_connection' | 'ancestral_line';
  points: { x: number; y: number }[];
  significance: string;
  color: string;
}

interface FantasyMapProps {
  locations: Location[];
  culturalLayers?: CulturalLayer[];
}

class PerlinNoise {
  private permutation: number[];
  
  constructor(seed: number = 0) {
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }
    
    const rng = this.mulberry32(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }
    
    for (let i = 0; i < 256; i++) {
      this.permutation[256 + i] = this.permutation[i];
    }
  }
  
  mulberry32(a: number) {
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }
  
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  
  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = this.fade(x);
    const v = this.fade(y);
    
    const A = this.permutation[X] + Y;
    const AA = this.permutation[A];
    const AB = this.permutation[A + 1];
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B];
    const BB = this.permutation[B + 1];
    
    return this.lerp(
      this.lerp(
        this.grad(this.permutation[AA], x, y),
        this.grad(this.permutation[BA], x - 1, y),
        u
      ),
      this.lerp(
        this.grad(this.permutation[AB], x, y - 1),
        this.grad(this.permutation[BB], x - 1, y - 1),
        u
      ),
      v
    );
  }
}


const generateRealisticMap = (seed: number, width: number = 250, height: number = 250) => {
  const noise = new PerlinNoise(seed);
  
  const heightMap: number[][] = [];
  for (let y = 0; y < height; y++) {
    heightMap[y] = [];
    for (let x = 0; x < width; x++) {
      let elevation = 0;
      let amplitude = 1;
      let frequency = 0.01;
      
      for (let i = 0; i < 6; i++) {
        elevation += noise.noise(x * frequency, y * frequency) * amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }
      
      const continentNoise = noise.noise(x * 0.003, y * 0.003);
      const islandNoise = noise.noise(x * 0.006, y * 0.006);
      const detailNoise = noise.noise(x * 0.012, y * 0.012);
      
      let landInfluence = 0;
      const centers = [
        { 
          x: width * (0.2 + noise.noise(seed * 0.01, 0) * 0.6), 
          y: height * (0.2 + noise.noise(seed * 0.01, 1) * 0.6),
          strength: 0.5,
          radius: 100
        },
        { 
          x: width * (0.4 + noise.noise(seed * 0.02, 0) * 0.4), 
          y: height * (0.4 + noise.noise(seed * 0.02, 1) * 0.4),
          strength: 0.4,
          radius: 80
        },
        { 
          x: width * (0.6 + noise.noise(seed * 0.03, 0) * 0.3), 
          y: height * (0.3 + noise.noise(seed * 0.03, 1) * 0.5),
          strength: 0.45,
          radius: 90
        },
        { 
          x: width * (0.3 + noise.noise(seed * 0.04, 0) * 0.5), 
          y: height * (0.7 + noise.noise(seed * 0.04, 1) * 0.2),
          strength: 0.35,
          radius: 70
        }
      ];
      
      for (const center of centers) {
        const distance = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
        const influence = Math.max(0, center.strength * (1 - distance / center.radius));
        landInfluence = Math.max(landInfluence, influence);
      }
      
      const combinedNoise = continentNoise * 0.4 + islandNoise * 0.3 + detailNoise * 0.3;
      
      const centerX = width / 2;
      const centerY = height / 2;
      const maxDistance = Math.min(width, height) / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const falloffPower = 2.5;
      const falloffRadius = 0.95;
      const globalFalloff = Math.max(0, 1 - Math.pow(distance / (maxDistance * falloffRadius), falloffPower));
      
      elevation = (elevation + combinedNoise * 0.5 + landInfluence) * globalFalloff - 0.1;
      
      heightMap[y][x] = elevation;
    }
  }
  
  const biomeMap: string[][] = [];
  const moistureMap: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    biomeMap[y] = [];
    moistureMap[y] = [];
    for (let x = 0; x < width; x++) {
      let moisture = 0;
      let amplitude = 1;
      let frequency = 0.008;
      
      for (let i = 0; i < 4; i++) {
        moisture += noise.noise((x + 1000) * frequency, (y + 1000) * frequency) * amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }
      
      moistureMap[y][x] = moisture;
      
      const elevation = heightMap[y][x];
      
      if (elevation < -0.02) {
        biomeMap[y][x] = 'deep_ocean';
      } else if (elevation < 0.05) {
        biomeMap[y][x] = 'ocean';
      } else if (elevation < 0.1) {
        biomeMap[y][x] = 'beach';
      } else if (elevation < 0.4) {
        if (moisture > 0.3) {
          biomeMap[y][x] = 'forest';
        } else if (moisture > -0.2) {
          biomeMap[y][x] = 'plains';
        } else {
          biomeMap[y][x] = 'desert';
        }
      } else if (elevation < 0.7) {
        if (moisture > 0.0) {
          biomeMap[y][x] = 'forest';
        } else {
          biomeMap[y][x] = 'hills';
        }
      } else {
        biomeMap[y][x] = 'mountains';
      }
    }
  }
  
  const cleanedBiomeMap = [...biomeMap.map(row => [...row])];
  const visited: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!visited[y][x] && biomeMap[y][x] !== 'deep_ocean' && biomeMap[y][x] !== 'ocean') {
        const landMass = floodFill(biomeMap, x, y, visited);
        
        if (landMass.length < 50) {
          landMass.forEach(([px, py]) => {
            cleanedBiomeMap[py][px] = 'ocean';
          });
        }
      }
    }
  }
  
  return { biomeMap: cleanedBiomeMap, heightMap, moistureMap, width, height };
};

const floodFill = (biomeMap: string[][], startX: number, startY: number, visited: boolean[][]): [number, number][] => {
  const result: [number, number][] = [];
  const stack: [number, number][] = [[startX, startY]];
  const height = biomeMap.length;
  const width = biomeMap[0].length;
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    
    if (x < 0 || x >= width || y < 0 || y >= height || visited[y][x]) continue;
    if (biomeMap[y][x] === 'deep_ocean' || biomeMap[y][x] === 'ocean') continue;
    
    visited[y][x] = true;
    result.push([x, y]);
    
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  
  return result;
};

const BIOME_COLORS = {
  deep_ocean: '#1e3a8a',
  ocean: '#3b82f6',
  beach: '#fbbf24',
  plains: '#65a30d',
  forest: '#166534',
  hills: '#a16207',
    mountains: '#57534e',
  desert: '#ea580c'
};

const BIOME_VARIATIONS = {
  deep_ocean: ['#1e3a8a', '#1d4ed8', '#2563eb'],
  ocean: ['#3b82f6', '#60a5fa', '#93c5fd'],
  beach: ['#fbbf24', '#fcd34d', '#fde68a'],
  plains: ['#65a30d', '#84cc16', '#a3e635'],
  forest: ['#166534', '#16a34a', '#22c55e'],
  hills: ['#a16207', '#ca8a04', '#eab308'],
  mountains: ['#57534e', '#78716c', '#a8a29e'],
  desert: ['#ea580c', '#f97316', '#fb923c']
};

const CULTURAL_SIGNIFICANCE_COLORS = {
  sacred: { bg: 'bg-yellow-50', color: 'text-yellow-800', ring: 'ring-yellow-400', glow: 'shadow-yellow-400/50' },
  forbidden: { bg: 'bg-red-50', color: 'text-red-800', ring: 'ring-red-400', glow: 'shadow-red-400/50' },
  ritual: { bg: 'bg-purple-50', color: 'text-purple-800', ring: 'ring-purple-400', glow: 'shadow-purple-400/50' },
  ancestral: { bg: 'bg-blue-50', color: 'text-blue-800', ring: 'ring-blue-400', glow: 'shadow-blue-400/50' },
  neutral: { bg: 'bg-gray-50', color: 'text-gray-800', ring: 'ring-gray-400', glow: 'shadow-gray-400/50' }
};

const CULTURAL_LAYER_STYLES = {
  trade_route: { color: '#fbbf24', pattern: 'solid', width: 2 },
  pilgrimage_path: { color: '#a78bfa', pattern: 'dashed', width: 3 },
  cultural_boundary: { color: '#ef4444', pattern: 'dotted', width: 2 },
  ritual_connection: { color: '#10b981', pattern: 'solid', width: 2 },
  ancestral_line: { color: '#3b82f6', pattern: 'dashed', width: 2 }
};

const getLocationIcon = (type: string, culturalSignificance?: string) => {
  const baseIconMap: { [key: string]: { icon: React.ElementType; color: string; bg: string; ring: string; glow?: string } } = {
    'city': { icon: Castle, color: 'text-blue-800', bg: 'bg-blue-50', ring: 'ring-blue-400' },
    'capital': { icon: Crown, color: 'text-yellow-800', bg: 'bg-yellow-50', ring: 'ring-yellow-400' },
    'mountain': { icon: Mountain, color: 'text-gray-800', bg: 'bg-gray-50', ring: 'ring-gray-400' },
    'forest': { icon: TreePine, color: 'text-green-800', bg: 'bg-green-50', ring: 'ring-green-400' },
    'coast': { icon: Waves, color: 'text-cyan-800', bg: 'bg-cyan-50', ring: 'ring-cyan-400' },
    'volcano': { icon: Flame, color: 'text-red-800', bg: 'bg-red-50', ring: 'ring-red-400' },
    'fortress': { icon: Shield, color: 'text-stone-800', bg: 'bg-stone-50', ring: 'ring-stone-400' },
    'temple': { icon: Zap, color: 'text-purple-800', bg: 'bg-purple-50', ring: 'ring-purple-400' },
    'oracle': { icon: Eye, color: 'text-indigo-800', bg: 'bg-indigo-50', ring: 'ring-indigo-400' },
    'ritual_site': { icon: CircleDot, color: 'text-purple-800', bg: 'bg-purple-50', ring: 'ring-purple-400' },
    'ancestral_ground': { icon: Scroll, color: 'text-blue-800', bg: 'bg-blue-50', ring: 'ring-blue-400' },
    'sacred_grove': { icon: Hexagon, color: 'text-green-800', bg: 'bg-green-50', ring: 'ring-green-400' },
    'default': { icon: MapPin, color: 'text-amber-800', bg: 'bg-amber-50', ring: 'ring-amber-400' }
  };
  
  const typeKey = Object.keys(baseIconMap).find(key => 
    type.toLowerCase().includes(key)
  ) || 'default';
  
  const baseIcon = baseIconMap[typeKey];
  
  if (culturalSignificance && CULTURAL_SIGNIFICANCE_COLORS[culturalSignificance]) {
    const culturalStyle = CULTURAL_SIGNIFICANCE_COLORS[culturalSignificance];
    return {
      ...baseIcon,
      bg: culturalStyle.bg,
      color: culturalStyle.color,
      ring: culturalStyle.ring,
      glow: culturalStyle.glow
    };
  }
  
  return baseIcon;
};

const renderCulturalSymbol = (symbol: string, x: number, y: number, index: number) => {
  const symbolMap: { [key: string]: string } = {
    'tree': '🌳',
    'fire': '🔥',
    'water': '🌊',
    'mountain': '⛰️',
    'star': '⭐',
    'moon': '🌙',
    'sun': '☀️',
    'spiral': '🌀',
    'eye': '👁️',
    'crown': '👑'
  };
  
  return (
    <div
      key={`symbol-${index}`}
      className="absolute pointer-events-none text-xs opacity-50 select-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
        fontSize: '10px'
      }}
    >
      {symbolMap[symbol.toLowerCase()] || '⚡'}
    </div>
  );
};


export const FantasyMap: React.FC<FantasyMapProps> = memo(({ 
  locations, 
  culturalLayers = []
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const regenerationSeedRef = useRef<number>((() => {
    try {
      const saved = localStorage.getItem('fantasyMapSeed');
      return saved ? parseInt(saved) : Math.floor(Math.random() * 10000);
    } catch {
      return Math.floor(Math.random() * 10000);
    }
  })());
  const [mapData, setMapData] = useState<ComprehensiveAIResponse['worldMap'] | null>(() => {
    try {
      const savedMapData = localStorage.getItem('fantasyMapData');
      return savedMapData ? JSON.parse(savedMapData) : null;
    } catch {
      return null;
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCulturalInfo, setShowCulturalInfo] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapRect, setMapRect] = useState<DOMRect | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const measureMap = () => {
      if (mapContainerRef.current) {
        requestAnimationFrame(() => {
          if (mapContainerRef.current) {
            setMapRect(mapContainerRef.current.getBoundingClientRect());
          }
        });
      }
    };

    measureMap();
    window.addEventListener('resize', measureMap);
    return () => {
      window.removeEventListener('resize', measureMap);
    };
  }, []);

  useEffect(() => {
    const generateMap = async () => {
      if (isInitialMount.current && mapData) {
        isInitialMount.current = false;
        renderMapToCanvas(mapData);
        return;
      }

      setIsGenerating(true);
      
      const newMapData = generateRealisticMap(regenerationSeedRef.current);
      setMapData(newMapData);
      try {
        localStorage.setItem('fantasyMapData', JSON.stringify(newMapData));
      } catch (error) {
        if (import.meta.env.DEV) {
          logger.warn('Failed to save map data to localStorage', { error });
        }
      }
      
      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
      
      renderMapToCanvas(newMapData);
      
      setIsGenerating(false);
    };
    
    generateMap();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (mapData) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (mapData) {
              renderMapToCanvas(mapData);
            }
          });
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mapData]);

  const regenerateMap = useCallback(async () => {
    try {
      setIsGenerating(true);
      setSelectedLocation(null);
      
      const newSeed = Math.floor(Math.random() * 10000);
      regenerationSeedRef.current = newSeed;
      try {
        localStorage.setItem('fantasyMapSeed', newSeed.toString());
      } catch (error) {
        if (import.meta.env.DEV) {
          logger.warn('Failed to save map seed to localStorage', { error });
        }
      }
      
      const newMapData = generateRealisticMap(newSeed);
      
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const { width, height } = canvasRef.current;
          ctx.clearRect(0, 0, width, height);
        }
      }
      
      setMapData(newMapData);
      try {
        localStorage.setItem('fantasyMapData', JSON.stringify(newMapData));
      } catch (error) {
        if (import.meta.env.DEV) {
          logger.warn('Failed to save map data to localStorage', { error });
        }
      }
      
    } catch (error) {
      logger.error('Map regeneration error', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (mapData && !isGenerating) {
      renderMapToCanvas(mapData);
    }
  }, [mapData, isGenerating]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel(prev => Math.max(0.5, Math.min(5, prev * delta)));
  };

  const renderMapToCanvas = (mapData: ComprehensiveAIResponse['worldMap']) => {
    if (!canvasRef.current || !mapContainerRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { biomeMap, heightMap, width, height } = mapData;
    
    const containerRect = mapRect || (mapContainerRef.current ? mapContainerRef.current.getBoundingClientRect() : { width: 800, height: 600 });
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    const mapAspectRatio = width / height;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let displayWidth: number;
    let displayHeight: number;
    
    if (containerAspectRatio > mapAspectRatio) {
      displayHeight = containerHeight;
      displayWidth = displayHeight * mapAspectRatio;
    } else {
      displayWidth = containerWidth;
      displayHeight = displayWidth / mapAspectRatio;
    }
    
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingEnabled = false;
    
    ctx.clearRect(0, 0, width, height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const biome = biomeMap[y][x];
        const elevation = heightMap[y][x];
        
        const variations = BIOME_VARIATIONS[biome as keyof typeof BIOME_VARIATIONS];
        let color = BIOME_COLORS[biome as keyof typeof BIOME_COLORS] || '#000000';
        
        if (variations && elevation !== undefined) {
          const heightFactor = Math.max(0, Math.min(1, (elevation + 0.5) / 1.0));
          const colorIndex = Math.floor(heightFactor * (variations.length - 1));
          color = variations[colorIndex] || color;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.3;
    ctx.globalAlpha = 0.4;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const currentBiome = biomeMap[y][x];
        const isLand = currentBiome !== 'deep_ocean' && currentBiome !== 'ocean';
        
        if (isLand) {
          const neighbors = [
            biomeMap[y-1][x], biomeMap[y+1][x],
            biomeMap[y][x-1], biomeMap[y][x+1]
          ];
          
          const hasWaterNeighbor = neighbors.some(n => n === 'deep_ocean' || n === 'ocean');
          if (hasWaterNeighbor) {
            ctx.strokeRect(x, y, 1, 1);
          }
        }
      }
    }
    
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#ffffff';
    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        if (biomeMap[y][x] === 'mountains') {
          const elevation = heightMap[y][x];
          if (elevation > 0.7) {
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }
    
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#1a4d0a';
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        if (biomeMap[y][x] === 'forest' && Math.random() > 0.7) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    
    ctx.globalAlpha = 1.0;
  };

  const mapLocations = useMemo(() => {
    if (!mapData) return [];
    
    const { biomeMap, width, height } = mapData;
    const landPixels: { x: number; y: number }[] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const biome = biomeMap[y][x];
        if (biome !== 'deep_ocean' && biome !== 'ocean') {
          landPixels.push({ x, y });
        }
      }
    }
    
    if (landPixels.length === 0) {
      return locations.map((loc, index) => ({
        ...loc,
        position: { x: 50, y: 50 },
        iconData: getLocationIcon(loc.type, loc.culturalSignificance)
      }));
    }
    
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    const result = locations.map((loc, index) => {
      const locSeed = regenerationSeedRef.current + index * 1000;
      
      const randomIndex = Math.floor(seededRandom(locSeed) * landPixels.length);
      const landPixel = landPixels[randomIndex];
      
      const x = (landPixel.x / width) * 100;
      const y = (landPixel.y / height) * 100;
            
      return {
        ...loc,
        position: { x, y },
        iconData: getLocationIcon(loc.type, loc.culturalSignificance)
      };
    });
    
    if (import.meta.env.DEV && regenerationSeedRef.current % 1000 === 0) {
      logger.debug('MapLocations created', { count: result.length, seed: regenerationSeedRef.current });
    }
    return result;
  }, [locations, mapData]);

  const generatedLayers = useMemo(() => {
    if (mapLocations.length < 2) return [];
    
    const layers: CulturalLayer[] = [];

    const tradeLocations = mapLocations
      .filter(loc => {
        const type = loc.type.toLowerCase();
        return type.includes('port') ||
               type.includes('market') ||
               type.includes('capital') ||
               type.includes('city') ||
               type.includes('town') ||
               type.includes('settlement') ||
               type.includes('village') ||
               type.includes('trading') ||
               type.includes('harbor') ||
               type.includes('hub') ||
               type.includes('center') ||
               type.includes('outpost') ||
               type.includes('fort') ||
               type.includes('stronghold') ||
               type.includes('keep');
      })
      .slice(0, 3);

    const sacredLocations = mapLocations
      .filter(loc =>
        loc.culturalSignificance === 'sacred' ||
        loc.culturalSignificance === 'ritual' ||
        loc.type.toLowerCase().includes('temple') ||
        loc.type.toLowerCase().includes('shrine') ||
        loc.type.toLowerCase().includes('sacred')
      )
      .slice(0, 2);

    const ritualLocations = mapLocations
      .filter(loc => 
        loc.culturalSignificance === 'ritual' ||
        loc.culturalSignificance === 'ancestral' ||
        loc.culturalSignificance === 'forbidden'
      )
      .slice(0, 3);

    if (tradeLocations.length >= 2) {
      layers.push({
        id: 'trade-route',
        name: 'Trade Network',
        type: 'trade_route',
        points: tradeLocations.map(loc => loc.position),
        significance: 'Trade route',
        color: '#fbbf24'
      });
    }

    if (sacredLocations.length >= 2) {
      layers.push({
        id: 'sacred-path',
        name: 'Sacred Path',
        type: 'pilgrimage_path',
        points: sacredLocations.map(loc => loc.position),
        significance: 'Sacred path',
        color: '#a78bfa'
      });
    }

    if (mapLocations.length >= 4) {
      layers.push({
        id: 'main-road',
        name: 'Main Road',
        type: 'ritual_connection',
        points: mapLocations.slice(0, 4).map(loc => loc.position),
        significance: 'Main connecting road',
        color: '#10b981'
      });
    }

    if (ritualLocations.length >= 2) {
      layers.push({
        id: 'ritual-connection',
        name: 'Ritual Connection',
        type: 'ritual_connection',
        points: ritualLocations.map(loc => loc.position),
        significance: 'Ritual connection',
        color: '#ef4444'
      });
    }

    if (tradeLocations.length < 2 && mapLocations.length >= 3) {
      layers.push({
        id: 'basic-connection',
        name: 'Basic Route',
        type: 'trade_route',
        points: mapLocations.slice(0, 3).map(loc => loc.position),
        significance: 'Basic connection',
        color: '#fbbf24'
      });
    }

    if (mapLocations.length >= 5) {
      layers.push({
        id: 'secondary-route',
        name: 'Secondary Route',
        type: 'ancestral_line',
        points: mapLocations.slice(2, 5).map(loc => loc.position),
        significance: 'Secondary route',
        color: '#3b82f6'
      });
    }

    return layers;
  }, [mapLocations]);

  const finalLayers = [...culturalLayers, ...generatedLayers];

  const typeFilters: Record<CulturalLayer['type'], boolean> = {} as Record<CulturalLayer['type'], boolean>;
  (Object.keys(CULTURAL_LAYER_STYLES) as CulturalLayer['type'][]).forEach(type => {
    typeFilters[type] = true;
  });

  if (isGenerating || !mapData) {
        return (
      <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 flex items-center justify-center rounded-xl border border-slate-600">
        <motion.div
          className="flex items-center space-x-3"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Sparkles className="w-6 h-6 text-blue-400" />
          <div className="text-slate-300 font-semibold text-lg">Generating Organic Cultural Map...</div>
          <Sparkles className="w-6 h-6 text-blue-400" />
        </motion.div>
            </div>
        );
    }

    return (
    <div className="relative w-full h-full">
      {/* Main container with overflow hidden for the map itself */}
      <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-slate-700/50 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        
        {/* Viewport for pan and zoom events. This div fills the container and listens for events. */}
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          style={{ backgroundColor: BIOME_COLORS.deep_ocean, overscrollBehavior: 'contain' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* This is the container that actually gets scaled and moved. */}
          <div 
            className="relative w-full h-full cursor-grab active:cursor-grabbing"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            {/* MAP-RELATED ELEMENTS START HERE */}
            <canvas
              ref={canvasRef}
              className="absolute rounded-xl z-0"
              style={{ 
                imageRendering: 'pixelated',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />

            {showCulturalInfo && finalLayers.length > 0 && (
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-15"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                    </filter>
                </defs>
                {finalLayers.filter(layer => typeFilters[layer.type]).map((layer) => {
                  const style = CULTURAL_LAYER_STYLES[layer.type] || { color: layer.color || '#fbbf24', pattern: 'solid', width: 2 };
                  
                  if (layer.points.length < 2) return null;

                  return (
                    <g key={layer.id}>
                      {layer.points.slice(0, -1).map((point, index) => {
                        const nextPoint = layer.points[index + 1];
                        return (
                          <g key={`${layer.id}-segment-${index}`}>
                            {/* Glow effect */}
                            <line
                              x1={point.x}
                              y1={point.y}
                              x2={nextPoint.x}
                              y2={nextPoint.y}
                              stroke={style.color}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              opacity={0.3}
                              filter="url(#glow)"
                            />
                            
                            <line
                              x1={point.x}
                              y1={point.y}
                              x2={nextPoint.x}
                              y2={nextPoint.y}
                              stroke={style.color}
                              strokeWidth="0.8"
                              strokeLinecap="round"
                              strokeDasharray={
                                style.pattern === 'dashed' ? '2,1' : 
                                style.pattern === 'dotted' ? '0.5,0.5' : 'none'
                              }
                              opacity={0.9}
                            />
                          </g>
                        );
                      })}
                      
                      {layer.points.map((point, index) => (
                        <circle
                          key={`${layer.id}-point-${index}`}
                          cx={point.x}
                          cy={point.y}
                          r={index === 0 || index === layer.points.length - 1 ? "0.8" : "0.4"}
                          fill={style.color}
                          opacity={index === 0 || index === layer.points.length - 1 ? 0.9 : 0.7}
                        />
                      ))}
                    </g>
                  );
                })}
              </svg>
            )}

            {showCulturalInfo && (
              <div className="absolute inset-0 z-16 pointer-events-none">
                {mapLocations.map((location, index) => 
                  location.culturalSymbols?.slice(0, 1).map((symbol, symbolIndex) => 
                    renderCulturalSymbol(symbol, location.position.x, location.position.y - 3, symbolIndex)
                  )
                )}
              </div>
            )}

            <div className="absolute inset-0 overflow-visible z-20">
              {mapLocations.map((location, index) => {
                const isSelected = selectedLocation === location.id;
                const isHovered = hoveredLocation === location.id;
                const IconComponent = location.iconData.icon;
                return (
                    <div
                        key={location.id}
                    className="absolute cursor-pointer group z-30 pointer-events-auto transition-transform duration-200 hover:scale-110"
                        style={{ 
                            left: `${location.position.x}%`, 
                            top: `${location.position.y}%`, 
                      transform: `translate(-50%, -50%) scale(${1 / zoomLevel})`,
                      transformOrigin: 'center center'
                        }}
                        onClick={() => setSelectedLocation(isSelected ? null : location.id)}
                    onMouseEnter={() => setHoveredLocation(location.id)}
                    onMouseLeave={() => setHoveredLocation(null)}
                    >
                        <div className={cn(
                      "relative flex items-center justify-center transition-all duration-200",
                      "w-10 h-10 rounded-full border-2 shadow-lg backdrop-blur-sm",
                      location.iconData.bg, "border-white/90",
                      isSelected && `ring-2 ${location.iconData.ring} ring-offset-1 ring-offset-slate-900`,
                      isHovered && "shadow-xl scale-110",
                      location.culturalSignificance && location.iconData.glow && `shadow-lg ${location.iconData.glow}`
                    )}>
                      <IconComponent className={cn("w-5 h-5", location.iconData.color)} />
                      {location.culturalSignificance && location.culturalSignificance !== 'neutral' && (
                        <div className={cn("absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white/70", location.culturalSignificance === 'sacred' && "bg-yellow-400", location.culturalSignificance === 'forbidden' && "bg-red-400", location.culturalSignificance === 'ritual' && "bg-purple-400", location.culturalSignificance === 'ancestral' && "bg-blue-400")} />
                      )}
                      {(location.type.toLowerCase().includes('capital') || 
                        location.type.toLowerCase().includes('temple') ||
                        location.culturalSignificance === 'sacred') && (
                          <div className={cn("absolute inset-0 rounded-full border-2 opacity-40", location.iconData.ring.replace('ring-', 'border-'))} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* MAP-RELATED ELEMENTS END HERE */}
          </div>
        </div>

        {/* Subtle overlay for better contrast - INSIDE overflow container, but OUTSIDE transformed one */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 rounded-xl z-10 pointer-events-none" />
        
        {/* --- STATIC UI CONTROLS START HERE --- */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-30">
          <motion.button onClick={regenerateMap} disabled={isGenerating} className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-800 text-white flex items-center justify-center shadow-lg transition-all" whileHover={{ scale: isGenerating ? 1 : 1.1 }} whileTap={{ scale: isGenerating ? 1 : 0.95 }} title="Generate New Map">
            <RefreshCw className={cn("w-5 h-5", isGenerating && "animate-spin")} />
          </motion.button>
          <motion.button onClick={() => setShowCulturalInfo(!showCulturalInfo)} className={cn("w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg transition-all", showCulturalInfo ? "bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700" : "bg-gradient-to-br from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} title="Show/Hide Cultural Information">
            <Eye className="w-5 h-5" />
          </motion.button>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300 flex items-center justify-center shadow-lg">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        <div className="absolute top-4 left-4 flex flex-col space-y-2 z-30">
          <motion.button onClick={handleZoomIn} className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white flex items-center justify-center shadow-lg transition-all" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </motion.button>
          <motion.button onClick={handleZoomOut} className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white flex items-center justify-center shadow-lg transition-all" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </motion.button>
          <motion.button onClick={resetView} className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700 text-white flex items-center justify-center shadow-lg transition-all" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} title="Reset View">
            <Move className="w-4 h-4" />
          </motion.button>
          <div className="w-10 h-8 rounded-lg bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 flex items-center justify-center">
            <span className="text-xs text-slate-300 font-medium">{Math.round(zoomLevel * 100)}%</span>
          </div>
                        </div>
                        
        <div className="absolute bottom-4 left-4 z-30">
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-600/50 shadow-lg">
            <div className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-blue-400" /><span className="text-sm text-slate-200 font-medium">{locations.length} Locations</span></div>
            {finalLayers.length > 0 && (
              <div className="flex items-center space-x-2 mt-1"><Scroll className="w-4 h-4 text-purple-400" /><span className="text-xs text-slate-300">{finalLayers.length} Cultural Layers</span></div>
            )}
          </div>
                        </div>
                        
        {selectedLocation && (
          <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-40 max-w-sm">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-slate-900/95 backdrop-blur-xl rounded-xl p-4 border-2 border-purple-500/30 shadow-2xl" style={{ maxHeight: 'calc(100vh - 8rem)', overflowY: 'auto' }}>
              {(() => {
                const location = mapLocations.find(loc => loc.id === selectedLocation);
                if (!location) return null;
                const culturalData = { sacred: location.socialCode?.sacred ? 1 : 0, forbidden: location.socialCode?.forbidden ? 1 : 0, ritual: location.rituals?.length || 0, symbols: location.culturalSymbols?.length || 0 };
                const totalCulturalValue = Object.values(culturalData).reduce((a, b) => a + b, 0);
                return (
                  <>
                    <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Scroll className="w-5 h-5 text-purple-400" />Cultural Analysis</h4>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2"><span className="text-sm text-slate-300">Cultural Density</span><span className="text-sm font-semibold text-purple-400">{Math.min(100, totalCulturalValue * 25)}%</span></div>
                      <div className="w-full bg-slate-700 rounded-full h-2"><div className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, totalCulturalValue * 25)}%` }}/></div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center"><span className="text-xs text-yellow-300 flex items-center gap-1"><div className="w-2 h-2 bg-yellow-400 rounded-full" />Sacred Values</span><span className="text-xs text-slate-300">{culturalData.sacred}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs text-red-300 flex items-center gap-1"><div className="w-2 h-2 bg-red-400 rounded-full" />Forbidden Rules</span><span className="text-xs text-slate-300">{culturalData.forbidden}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs text-purple-300 flex items-center gap-1"><div className="w-2 h-2 bg-purple-400 rounded-full" />Ritual Count</span><span className="text-xs text-slate-300">{culturalData.ritual}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs text-blue-300 flex items-center gap-1"><div className="w-2 h-2 bg-blue-400 rounded-full" />Symbol Count</span><span className="text-xs text-slate-300">{culturalData.symbols}</span></div>
                    </div>
                    {location.mythologicalConnection && (
                      <div className="p-3 bg-indigo-900/30 rounded-lg border border-indigo-500/20">
                        <h5 className="text-xs font-semibold text-indigo-300 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" />Mythological Connection</h5>
                        <p className="text-xs text-slate-300 leading-relaxed">{location.mythologicalConnection}</p>
                      </div>
                    )}
                    <button onClick={() => setSelectedLocation(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"><X className="w-3 h-3 text-slate-300" /></button>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </div>

      {/* Tooltips - RENDERED OUTSIDE of overflow container */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {mapLocations.map((location) => {
          const isSelected = selectedLocation === location.id;
          const isHovered = hoveredLocation === location.id;
          if (!isHovered || isSelected) return null;

          const mapCenterX = (mapRect?.width ?? 0) / 2;
          const mapCenterY = (mapRect?.height ?? 0) / 2;
          
          const locX = (location.position.x / 100) * (mapRect?.width ?? 0);
          const locY = (location.position.y / 100) * (mapRect?.height ?? 0);
          
          const relX = locX - mapCenterX;
          const relY = locY - mapCenterY;
          
          const scaledRelX = relX * zoomLevel;
          const scaledRelY = relY * zoomLevel;
          
          const screenX = scaledRelX + mapCenterX + panOffset.x;
          const screenY = scaledRelY + mapCenterY + panOffset.y;

          if (screenX < -100 || screenX > (mapRect?.width ?? 0) + 100 || 
              screenY < -100 || screenY > (mapRect?.height ?? 0) + 100) {
            return null;
          }

          const positionAbove = screenY > ((mapRect?.height ?? 0) * 0.5);
          const exceedsRight = (mapRect?.width ?? 0) - screenX < 150;
          const exceedsLeft = screenX < 150;

          let transform = 'translate(-50%, 20px)';
          if (positionAbove) {
            transform = 'translate(-50%, calc(-100% - 20px))';
          }
          if (exceedsLeft) {
            transform = positionAbove ? 'translate(0, calc(-100% - 20px))' : 'translate(0, 20px)';
          } else if (exceedsRight) {
            transform = positionAbove ? 'translate(-100%, calc(-100% - 20px))' : 'translate(-100%, 20px)';
          }
          
          return (
            <div key={`tooltip-${location.id}`} className="absolute transition-opacity duration-200" style={{ left: `${screenX}px`, top: `${screenY}px`, transform }}>
              <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl p-4 border-2 border-white/30 shadow-2xl max-w-sm relative">
                {/* Arrow logic needs to adapt to exceedsLeft/Right as well */}
                <div className="absolute w-0 h-0 border-l-8 border-r-8 border-transparent" style={
                  positionAbove 
                  ? { bottom: '-8px', left: exceedsLeft ? '16px' : exceedsRight ? 'auto' : '50%', right: exceedsRight ? '16px' : 'auto', transform: exceedsLeft || exceedsRight ? 'none' : 'translateX(-50%)', borderTop: '8px solid #3d3d52' }
                  : { top: '-8px', left: exceedsLeft ? '16px' : exceedsRight ? 'auto' : '50%', right: exceedsRight ? '16px' : 'auto', transform: exceedsLeft || exceedsRight ? 'none' : 'translateX(-50%)', borderBottom: '8px solid #3d3d52' }
                }/>
                <h3 className="font-bold text-white mb-2 text-lg leading-tight drop-shadow-lg tracking-wide">{location.name}</h3>
                <p className="text-gray-100 text-sm mb-3 leading-relaxed">{location.description}</p>
                {showCulturalInfo && location.culturalSignificance && location.culturalSignificance !== 'neutral' && (
                  <div className="mb-3 flex items-center gap-2 bg-white/5 p-2 rounded-lg"><div className={cn("w-3 h-3 rounded-full shadow-lg", location.culturalSignificance === 'sacred' && "bg-yellow-400 shadow-yellow-400/50", location.culturalSignificance === 'forbidden' && "bg-red-400 shadow-red-400/50", location.culturalSignificance === 'ritual' && "bg-purple-400 shadow-purple-400/50", location.culturalSignificance === 'ancestral' && "bg-blue-400 shadow-blue-400/50")} /><span className="text-sm text-white capitalize font-medium tracking-wide">{location.culturalSignificance}</span></div>
                )}
                {location.socialCode?.sacred && (
                  <div className="mb-3 bg-yellow-950/30 p-2 rounded-lg border border-yellow-500/20"><div className="text-sm text-yellow-200 font-medium flex items-center gap-2"><span className="text-lg">⚡</span>{location.socialCode.sacred}</div></div>
                )}
                {location.rituals && location.rituals.length > 0 && (
                  <div className="mb-3 bg-purple-950/30 p-2 rounded-lg border border-purple-500/20"><div className="text-sm text-purple-200 font-medium flex items-center gap-2"><span className="text-lg">🔮</span>{location.rituals[0]}</div></div>
                )}
                <div className="flex items-center justify-between mt-2 bg-white/5 p-2 rounded-lg"><span className={cn("text-sm px-4 py-1.5 rounded-full font-medium border-2 shadow-lg", location.iconData.bg, location.iconData.color, "border-white/30")}>{location.type}</span><span className="text-sm text-white font-medium bg-white/10 px-3 py-1 rounded-full">{location.region}</span></div>
              </div>
            </div>
          );
        })}
            </div>
        </div>
    );
}); 