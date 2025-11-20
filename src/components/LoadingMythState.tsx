import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { MythologySelections } from '@/types/mythology';
import { ConstellationLines } from './ConstellationLines';
import { logger } from '@/utils/logger';

interface LoadingMythStateProps {
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
  streamingText?: string;
  progress?: { phase: string; percent: number; detail?: string; section?: 'entities' | 'worldMap' | 'ancientLanguage' | 'story' | 'analysis' | 'extras' };
}

export const LoadingMythState = memo(({ stars, selections, selectionOrder, streamingText, progress }: LoadingMythStateProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recentSentences, setRecentSentences] = useState<string[]>([]);
  const lastSentenceRef = useRef<string>('');

  const lastLogTimeRef = useRef<number>(0);
  const logCountRef = useRef<number>(0);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const now = performance.now();
    logCountRef.current++;

    if (import.meta.env.DEV && (logCountRef.current % 10 === 0 || now - lastLogTimeRef.current > 500)) {
      const preview = streamingText ? streamingText.substring(0, 80) + '...' : '';
      logger.debug('Streaming update', { updateNumber: logCountRef.current, previewLength: preview.length });
      lastLogTimeRef.current = now;
    }
  }, [streamingText]);

  useEffect(() => {
    const s = (streamingText || '').trim();
    if (!s || s === lastSentenceRef.current) return;
    lastSentenceRef.current = s;
    setRecentSentences(prev => {
      const next = [s, ...prev.filter(p => p && p !== s)];
      return next.slice(0, 3);
    });
  }, [streamingText]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getProgressMessage = () => {
    if (elapsedTime < 5) return "Connecting to AI and preparing request...";
    if (elapsedTime < 15) return "Creating your unique mythology...";
    if (elapsedTime < 30) return "Building entities and locations...";
    if (elapsedTime < 45) return "Crafting ancient language and symbols...";
    if (elapsedTime < 60) return "Finalizing your legend...";
    return "Almost done! Complex stories take time to perfect...";
  };


  const phaseDisplay = (() => {
    if (!progress) return null;
    const labels: Record<string, string> = {
      idle: 'Idle',
      preparing: 'Request Prep',
      requesting: 'Requesting',
      parsing: 'Parsing',
      validating: 'Validating',
      'auto-completing': 'Completing',
      'fidelity-check': 'Fidelity Check',
      finalizing: 'Finalizing',
      complete: 'Complete',
    };
    return (labels[progress.phase] || progress.phase).toUpperCase();
  })();

  const currentSentence = (recentSentences[0] && recentSentences[0].length > 0)
    ? recentSentences[0]
    : 'A new legend stirs in the void';
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/20 via-purple-950/30 to-black"
    >
      {/* Advanced atmospheric layers */}
      <div className="absolute inset-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1.3 }}
          transition={{ duration: 4, ease: "easeOut" }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(139,92,246,0.1),transparent_60%)]"
        />
        <motion.div 
          initial={{ opacity: 0, rotate: 0, scale: 0.8 }}
          animate={{ 
            opacity: [0.15, 0.25, 0.18, 0.25, 0.15],
            rotate: 360,
            scale: [0.8, 1.1, 0.9, 1.05, 0.8]
          }}
          transition={{ 
            duration: 35, 
            ease: "easeInOut", 
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="absolute inset-0"
          style={{ 
            background: `conic-gradient(from 0deg at 50% 50%, rgba(139,92,246,0.02), rgba(168,85,247,0.05), rgba(147,51,234,0.08), rgba(168,85,247,0.05), rgba(139,92,246,0.02))`,
            transform: 'scale(1.5)',
            filter: 'blur(3px)',
            clipPath: 'circle(40% at center)',
            opacity: 0.8
          }}
        />
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 2, opacity: 0.2 }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(168,85,247,0.08),transparent_50%)]"
        />
      </div>

      {/* SVG Container - EXACTLY same layout as MythicPlayground */}
      <div className="relative z-10" style={{ paddingTop: '100px', height: '100vh' }}>
        <main className="relative w-full h-full">
          {/* Logo scale effects */}
          <motion.div
            initial={{ 
              scale: 1,
              x: 0,
              y: 0,
              filter: "brightness(1) contrast(1) hue-rotate(0deg)"
            }}
            animate={{ 
              scale: 0.4,
              x: 0,
              y: 0,
              filter: [
                "brightness(1) contrast(1) hue-rotate(0deg)",
                "brightness(1.5) contrast(1.3) hue-rotate(180deg)",
                "brightness(1.2) contrast(1.1) hue-rotate(360deg)"
              ]
            }}
            transition={{ 
              scale: { duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 },
              filter: { duration: 2, ease: "easeInOut", delay: 0.3 }
            }}
            className="absolute inset-0 w-full h-full"
            style={{ 
              transformOrigin: 'center center'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 2, 4],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 1.5,
                delay: 0.5,
                ease: "easeOut"
              }}
              className="absolute inset-0 w-full h-full rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(147,51,234,0.3) 0%, rgba(79,70,229,0.2) 30%, transparent 70%)',
                transformOrigin: 'center center'
              }}
            />
            <svg
              className="absolute inset-0 w-full h-full"
              aria-hidden="true"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ background: 'transparent', border: 'none', outline: 'none' }}
            >
              <defs>
                <radialGradient id="celestialStar">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="20%" stopColor="#e9d5ff" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.8" />
                  <stop offset="80%" stopColor="#8b5cf6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
                </radialGradient>

                {/* Cyberpunk star effects */}
                <radialGradient id="cyberStar">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 1)" />
                  <stop offset="30%" stopColor="rgba(0, 245, 255, 0.9)" />
                  <stop offset="70%" stopColor="rgba(147, 51, 234, 0.7)" />
                  <stop offset="100%" stopColor="rgba(147, 51, 234, 0)" />
                </radialGradient>

                <radialGradient id="magicGradient">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 1)" />
                  <stop offset="25%" stopColor="rgba(139, 92, 246, 0.9)" />
                  <stop offset="50%" stopColor="rgba(251, 191, 36, 0.8)" />
                  <stop offset="75%" stopColor="rgba(147, 51, 234, 0.6)" />
                  <stop offset="100%" stopColor="rgba(79, 70, 229, 0.3)" />
                </radialGradient>
              </defs>
              
              {/* Constellation Lines - Loading Mode */}
              <ConstellationLines 
                stars={stars}
                selections={selections}
                selectionOrder={selectionOrder}
                isLoading={true}
              />
              
              {/* Advanced star animations */}
              {stars.map((star, starIndex) => {
                const starColor = star.category?.color || "rgb(139, 92, 246)";

                return (
                  <g key={star.id}>
                    {starIndex < 2 && (
                      <motion.circle
                        cx={`${star.x}%`}
                        cy={`${star.y}%`}
                        fill="none"
                        stroke="rgba(168, 85, 247, 0.15)"
                        initial={{ r: "0.8", opacity: 0.3 }}
                        animate={{ 
                          opacity: [0.3, 0.6, 0.3],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ 
                          duration: 4,
                          delay: starIndex * 0.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}

                    {/* Simplified main star */}
                    <motion.circle
                      cx={`${star.x}%`}
                      cy={`${star.y}%`}
                      r="0.3"
                      fill={starColor}
                      initial={{ opacity: 1 }}
                      animate={{
                        opacity: [1, 0.8, 1]
                      }}
                      transition={{ 
                        duration: 3,
                        delay: starIndex * 0.2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {starIndex < 2 && (
                      <motion.circle
                        cx={`${star.x}%`}
                        cy={`${star.y}%`}
                        r="0.15"
                        fill="rgba(255, 255, 255, 0.7)"
                        initial={{ opacity: 0.7 }}
                        animate={{ 
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ 
                          duration: 2,
                          delay: starIndex * 0.3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                    
                    {/* Inner glow */}
                    <motion.circle
                      cx={`${star.x}%`}
                      cy={`${star.y}%`}
                      r="0.08"
                      fill="#ffffff"
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ 
                        scale: [1, 1.8, 1],
                        opacity: [1, 0.3, 1]
                      }}
                      transition={{ 
                        duration: 3,
                        delay: starIndex * 0.3 + 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />

                    {starIndex < 3 && (
                      <>
                        <motion.circle
                          cx={`${star.x}%`}
                          cy={`${star.y}%`}
                          r="0.08"
                          fill="rgba(139, 92, 246, 0.7)"
                          initial={{ 
                            opacity: 0,
                            scale: 0.5,
                            y: 0
                          }}
                          animate={{ 
                            opacity: [0, 1, 0],
                            scale: [0.5, 1.2, 0.8],
                            y: [0, -4, -8]
                          }}
                          transition={{ 
                            duration: 3,
                            delay: starIndex * 0.5 + 1,
                            repeat: Infinity,
                            repeatDelay: 2,
                            ease: "easeOut"
                          }}
                          style={{
                            filter: 'blur(0.3px)'
                          }}
                        />
                      </>
                    )}
                  </g>
                );
              })}
          </svg>
          </motion.div>

          {/* Transcendent typography - below the logo */}
          <div className="absolute inset-0 flex flex-col items-center justify-end text-center pointer-events-none pb-28">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.5, duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-6"
            >
              <div className="relative text-center">
                <motion.div
                  className="absolute inset-0 flex items-center justify-center text-4xl font-extralight tracking-[0.3em]"
                  animate={{
                    x: [0, -2, 2, 0],
                    opacity: [0, 0.4, 0, 0.6, 0],
                    filter: "hue-rotate(30deg)"
                  }}
                  transition={{
                    duration: 0.15,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                  style={{ color: '#d4af37' }}
                >
                  Myth Born
                </motion.div>
                
                <motion.h1 
                  className="text-4xl font-extralight relative z-10 text-center"
                  style={{
                    background: 'linear-gradient(45deg, #d4af37, #8b5a3c, #4a5568, #ffffff)',
                    backgroundSize: '400% 400%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 30px rgba(212, 175, 55, 0.5)',
                    letterSpacing: '0.3em'
                  }}
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ 
                      duration: 0.1,
                      delay: 1.8,
                      staggerChildren: 0.1
                    }}
                  >
                    {"Myth Born".split("").map((char, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ 
                          opacity: 1,
                          scale: [0.5, 1.2, 1],
                          textShadow: [
                            '0 0 10px rgba(212, 175, 55, 0.4)',
                            '0 0 25px rgba(212, 175, 55, 0.8)',
                            '0 0 15px rgba(212, 175, 55, 0.5)'
                          ]
                        }}
                        transition={{ 
                          delay: i * 0.08,
                          duration: 0.5,
                          ease: "easeOut"
                        }}
                      >
                        {char === " " ? "\u00A0" : char}
                      </motion.span>
                    ))}
                  </motion.span>
                </motion.h1>
                {/* Generic progress message placed below the title */}
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                  className="mt-3 text-xs text-amber-200/70 tracking-wider"
                  style={{ fontFamily: "'Cinzel', serif", textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}
                >
                  {getProgressMessage()}
                </motion.div>
                
                <motion.div className="relative mt-4">
                  
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.5, duration: 2 }}
                className="flex items-center justify-center"
              >
                <motion.div 
                  className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400/80 to-amber-400/20"
                  animate={{ 
                    opacity: [0.6, 1, 0.6],
                    scaleX: [0.8, 1.1, 0.8]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                />

                {/* Merkez - Ana kristal */}
                <motion.div 
                  className="mx-4 relative"
                  animate={{ 
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    rotate: { duration: 12, repeat: Infinity, ease: "linear" }
                  }}
                >
                  <div className="w-4 h-4 bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 rotate-45 rounded-sm shadow-lg">
                    <motion.div
                      animate={{ 
                        opacity: [0.3, 0.8, 0.3],
                        scale: [0.9, 1.1, 0.9]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-sm"
                    />
                  </div>
                </motion.div>

                <motion.div 
                  className="w-16 h-px bg-gradient-to-l from-transparent via-red-500/80 to-red-500/20"
                  animate={{ 
                    opacity: [0.6, 1, 0.6],
                    scaleX: [0.8, 1.1, 0.8]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                  }}
                />
              </motion.div>
              
              {/* Enhanced progress indicator with time tracking */}
              <div className="flex flex-col items-center gap-3 mb-4">
                {/* Elapsed time */}
                <motion.div
                  className="text-sm text-amber-300/90 tracking-wider font-medium"
                  style={{ fontFamily: "'Cinzel', serif" }}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⏱️ {formatTime(elapsedTime)}
                </motion.div>

                {/* Progress message moved near the title above */}

                {/* Forge action removed */}


                {/* Technical progress bar */}
                {progress && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs text-amber-200/60 tracking-widest uppercase">
                      {phaseDisplay}{progress.detail ? ` • ${progress.detail}` : ''}
                    </div>
                    <div className="w-64 h-1.5 bg-amber-200/20 rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"
                        style={{ width: `${Math.min(Math.max(progress.percent ?? 0, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3, duration: 2 }}
                className="relative flex flex-col items-center gap-2"
              >
                {/* Three-line vertical flow (fixed height, downwards motion) with craft label */}
                <div className="flex flex-col items-center gap-1 w-full mx-auto" style={{ height: '60px', width: 'min(56vw, 70ch)' }}>
                  {/* Crafting label */}
                  <div className="text-[11px] uppercase tracking-[0.28em] text-amber-200/85 mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
                    Crafting
                  </div>
                  {/* Three stacked lines */}
                  <motion.div
                    key={currentSentence}
                    initial={{ y: -6, opacity: 1 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.35 }}
                    className="w-full flex flex-col items-center"
                  >
                    {/* Top line: newest (subtle) */}
                    <motion.p
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-[11px] text-amber-100/65 tracking-wide font-extralight leading-snug text-center break-words max-w-full overflow-hidden"
                      style={{ fontFamily: "'Cinzel', serif", textShadow: "0 0 6px rgba(251, 191, 36, 0.15)" }}
                    >
                      {currentSentence}
                    </motion.p>
                    {/* Middle line: previous (more subtle) */}
                    <p
                      className="text-[10px] text-amber-100/40 tracking-wide font-extralight leading-snug text-center break-words max-w-full overflow-hidden"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {recentSentences[1] || ''}
                    </p>
                    {/* Bottom line: older (very faint) */}
                    <p
                      className="text-[10px] text-amber-100/25 tracking-wide font-extralight leading-snug text-center break-words max-w-full overflow-hidden"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {recentSentences[2] || ''}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </div>
    </motion.div>
  );
}); // Removed memo optimization to ensure re-rendering 