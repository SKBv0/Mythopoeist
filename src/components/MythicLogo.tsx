import { motion } from 'framer-motion';
import { ConstellationLines } from './ConstellationLines';
import { MythologySelections } from '@/types/mythology';

interface MythicLogoProps {
  stars: Array<{
    id: string;
    x: number;
    y: number;
    categoryKey: string;
    category?: {
      color: string;
      glow: string;
    };
  }>;
  selections: MythologySelections;
  selectionOrder?: string[];
}

export const MythicLogo = ({ stars, selections, selectionOrder }: MythicLogoProps) => {
  return (
    <div className="w-full h-full relative aspect-square">
      <svg
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        style={{ background: 'transparent', border: 'none', outline: 'none' }}
      >
        <defs>
          <radialGradient id="celestialStarLogo">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="20%" stopColor="#e9d5ff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.8" />
            <stop offset="80%" stopColor="#8b5cf6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
          </radialGradient>
        </defs>
        
        <ConstellationLines 
          stars={stars}
          selections={selections}
          selectionOrder={selectionOrder}
          isLoading={false}
        />
        
        {stars.map((star, starIndex) => {
          const starColor = star.category?.color || "rgb(139, 92, 246)";
          const isSelected = selections[star.categoryKey as keyof MythologySelections];

          return (
            <g key={star.id}>
              {/* Halos for selected stars */}
              {isSelected && (
                <>
                  <motion.circle
                    cx={`${star.x}%`}
                    cy={`${star.y}%`}
                    fill="none"
                    stroke="rgba(196, 181, 253, 0.2)"
                    initial={{ r: 0, opacity: 0 }}
                    animate={{ r: 1.5, opacity: [0, 0.4, 0] }}
                    transition={{ 
                      duration: 3,
                      delay: starIndex * 0.1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.circle
                    cx={`${star.x}%`}
                    cy={`${star.y}%`}
                    fill="none"
                    stroke="rgba(168, 85, 247, 0.3)"
                    initial={{ r: 0, opacity: 0 }}
                    animate={{ r: 0.8, opacity: [0, 0.5, 0] }}
                    transition={{ 
                      duration: 2.5,
                      delay: starIndex * 0.1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </>
              )}
              
              {/* Core star */}
              <motion.circle
                cx={`${star.x}%`}
                cy={`${star.y}%`}
                r="0.35"
                initial={{ fill: starColor, opacity: 0.5, scale: 0.8 }}
                animate={{
                  opacity: isSelected ? 1 : 0.6,
                  scale: isSelected ? 1.2 : 1,
                  fill: isSelected ? star.category?.glow || starColor : starColor
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut"
                }}
              >
                {isSelected && (
                  <animate
                    attributeName="r"
                    values="0.45;0.52;0.45"
                    dur="5s"
                    repeatCount="indefinite"
                  />
                )}
              </motion.circle>
              
              {/* Glimmer for selected stars */}
              {isSelected && (
                <motion.circle
                  cx={`${star.x}%`}
                  cy={`${star.y}%`}
                  r="0.1"
                  fill="#ffffff"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ 
                    duration: 2,
                    delay: starIndex * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}; 