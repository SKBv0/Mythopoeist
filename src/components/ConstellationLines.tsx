import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MythologySelections } from '@/types/mythology';

interface ConstellationLinesProps {
  stars: Array<{
    id: string;
    x: number;
    y: number;
    categoryKey: string;
    name?: string;
    description?: string;
    vx?: number;
    vy?: number;
    category?: {
      color: string;
      glow: string;
    };
  }>;
  selections: MythologySelections;
  selectionOrder?: string[];
  isLoading?: boolean;
}

export const ConstellationLines: React.FC<ConstellationLinesProps> = ({ 
  stars, 
  selections, 
  selectionOrder,
  isLoading = false 
}) => {
  const polylinePoints = useMemo(() => {
    const selectedIds = new Set<string>(Object.values(selections).filter(Boolean));

    const orderedIds: string[] = selectionOrder && selectionOrder.length > 0
      ? selectionOrder.filter(id => selectedIds.has(id))
      : (['cosmology', 'gods', 'beings', 'archetype', 'themes', 'symbols', 'socialcodes']
          .map(cat => selections[cat as keyof typeof selections])
          .filter(Boolean) as string[]);

    const points: { x: number; y: number }[] = orderedIds
      .map(id => stars.find(s => s.id === id))
      .filter((s): s is (typeof stars)[number] => Boolean(s))
      .map(s => ({ x: s.x, y: s.y }));

    return points.length > 1 ? points.map(p => `${p.x},${p.y}`).join(' ') : '';
  }, [stars, selections, selectionOrder]);

  if (!polylinePoints) return null;

  return (
    <g>
      <defs>
        <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(251, 191, 36, 0.8)" />
          <stop offset="33%" stopColor="rgba(244, 114, 182, 0.8)" />
          <stop offset="66%" stopColor="rgba(96, 165, 250, 0.8)" />
          <stop offset="100%" stopColor="rgba(52, 211, 153, 0.8)" />
        </linearGradient>

        <linearGradient id="mythic-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(212, 175, 55, 0.9)" />
          <stop offset="50%" stopColor="rgba(220, 38, 127, 0.7)" />
          <stop offset="100%" stopColor="rgba(147, 51, 234, 0.8)" />
        </linearGradient>

        <linearGradient id="divine-pulse" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 215, 0, 0.8)" />
          <stop offset="50%" stopColor="rgba(255, 140, 0, 0.6)" />
          <stop offset="100%" stopColor="rgba(220, 20, 60, 0.4)" />
        </linearGradient>
        
        <linearGradient id="inactive-glow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
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

      {isLoading ? (
        <>
          <motion.polyline
            points={polylinePoints}
            fill="none"
            stroke="url(#inactive-glow-gradient)"
            initial={{ 
              opacity: 0.7,
              strokeWidth: "2.5"
            }}
            animate={{
              opacity: [0.7, 1, 0.7],
              strokeWidth: ["2.5", "3.5", "2.5"]
            }}
            style={{
              strokeLinecap: "round",
              strokeLinejoin: "round"
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.polyline
            points={polylinePoints}
            fill="none"
            stroke="url(#line-gradient)"
            initial={{ 
              opacity: 1,
              strokeWidth: "0.3"
            }}
            style={{
              strokeLinecap: "round",
              strokeLinejoin: "round"
            }}
            vectorEffect="non-scaling-stroke"
          />
          
          <motion.polyline
            points={polylinePoints}
            fill="none"
            stroke="url(#divine-pulse)"
            initial={{ pathLength: 0, opacity: 0, strokeWidth: "0.3" }}
            animate={{ 
              pathLength: [0, 1, 0],
              opacity: [0, 0.8, 0]
            }}
            style={{
              strokeLinecap: "round",
              strokeLinejoin: "round"
            }}
            transition={{ 
              duration: 3,
              delay: 0.5,
              repeat: Infinity,
              repeatDelay: 1.5,
              ease: "easeInOut"
            }}
            vectorEffect="non-scaling-stroke"
          />

          {polylinePoints.split(' ').slice(0, 7).map((point, i) => {
            const [x, y] = point.split(',').map(Number);
            return (
              <motion.circle
                key={`particle-${i}`}
                cx={`${x}%`}
                cy={`${y}%`}
                r="0.08"
                fill="rgba(251, 191, 36, 0.9)"
                initial={{ 
                  opacity: 0,
                  scale: 0.5,
                  y: 0
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.8],
                  y: [-2, -8, -12]
                }}
                transition={{ 
                  duration: 5,
                  delay: i * 0.4,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeOut"
                }}
                style={{
                  filter: 'blur(0.5px)',
                  boxShadow: '0 0 6px rgba(251, 191, 36, 0.8)',
                  willChange: 'transform, opacity',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden'
                }}
              />
            );
          })}
        </>
      ) : (
        <motion.polyline
          points={polylinePoints}
          fill="none"
          stroke="url(#line-gradient)"
          initial={{
            opacity: 1,
            strokeWidth: "0.5"
          }}
          style={{
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }}
          className="constellation-line"
          exit={{
            opacity: 1,
            stroke: "url(#line-gradient)",
            strokeWidth: "0.5"
          }}
          transition={{
            duration: 0.016,
            ease: "linear"
          }}
          layout={false}
        />
      )}
    </g>
  );
}; 