import { useMemo } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  flickerSpeed: number;
  flickerDelay: number;
  brightness: number;
}

interface CosmicBackgroundProps {
  starCount?: number;
  baseColor?: string;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({
  starCount = 400,
  baseColor = '#0a0e27'
}) => {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: starCount }, () => {
      const brightness = Math.random();
      const isBright = brightness > 0.7;
      
      const flickerType = Math.random();
      let flickerSpeed: number;
      
      if (flickerType > 0.7) {
        flickerSpeed = Math.random() * 1.5 + 1.2;
      } else if (flickerType > 0.3) {
        flickerSpeed = Math.random() * 2 + 2.5;
      } else {
        flickerSpeed = Math.random() * 2.5 + 4;
      }
      
      return {
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: isBright 
          ? Math.random() * 1.2 + 1.2
          : Math.random() * 0.8 + 0.6,
        baseOpacity: isBright
          ? Math.random() * 0.3 + 0.7
          : Math.random() * 0.4 + 0.3,
        flickerSpeed,
        flickerDelay: Math.random() * 4,
        brightness
      };
    });
  }, [starCount]);

  return (
    <div 
      className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden"
      style={{ 
        backgroundColor: baseColor,
        willChange: 'transform',
        transform: 'translateZ(0)',
        contain: 'layout style paint'
      }}
    >
      <svg 
        className="absolute inset-0 w-full h-full"
        style={{ 
          width: '100%', 
          height: '100%',
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          pointerEvents: 'none'
        }}
      >
        {stars.map((star, index) => (
          <g key={index}>
            <circle
              cx={`${star.x}%`}
              cy={`${star.y}%`}
              r={star.size}
              fill="white"
              style={{
                opacity: star.baseOpacity
              }}
            >
              <animate
                attributeName="opacity"
                values={`${star.baseOpacity};${star.baseOpacity * 0.65};${Math.min(star.baseOpacity * 1.2, 1)};${star.baseOpacity * 0.75};${Math.min(star.baseOpacity * 1.1, 1)};${star.baseOpacity}`}
                dur={`${star.flickerSpeed}s`}
                repeatCount="indefinite"
                begin={`${star.flickerDelay}s`}
                calcMode="spline"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1"
                keyTimes="0;0.2;0.4;0.6;0.8;1"
              />
            </circle>
            
            {star.brightness > 0.7 && (
              <circle
                cx={`${star.x}%`}
                cy={`${star.y}%`}
                r={star.size * 1.6}
                fill="white"
                opacity={star.baseOpacity * 0.15}
                style={{
                  filter: 'blur(0.6px)'
                }}
              >
                <animate
                  attributeName="opacity"
                  values={`${star.baseOpacity * 0.15};${star.baseOpacity * 0.08};${star.baseOpacity * 0.22};${star.baseOpacity * 0.1};${star.baseOpacity * 0.18};${star.baseOpacity * 0.15}`}
                  dur={`${star.flickerSpeed * 1.15}s`}
                  repeatCount="indefinite"
                  begin={`${star.flickerDelay}s`}
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1"
                  keyTimes="0;0.2;0.4;0.6;0.8;1"
                />
              </circle>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};
