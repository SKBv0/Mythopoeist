import { useMemo } from 'react';
import { DEFAULTS } from '@/constants/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import './FloatingParticles.css';

interface FloatingParticlesProps {
  count?: number;
}

export const FloatingParticles = ({ count = DEFAULTS.PARTICLE_COUNT }: FloatingParticlesProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  const particleCount = useMemo(() => {
    if (!prefersReducedMotion) {
      return count;
    }

    const reducedCount = Math.max(3, Math.round(count / 3));
    return Math.min(6, reducedCount);
  }, [count, prefersReducedMotion]);

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      const size = Math.random() * 3 + 1;
      const left = `${Math.random() * 100}%`;
      const animationDelay = `${Math.random() * 20}s`;
      const animationDuration = `${20 + Math.random() * 15}s`;

      return (
        <div
          key={i}
          className="particle"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left,
            animationDelay,
            animationDuration,
            animationPlayState: prefersReducedMotion ? 'paused' : 'running',
            opacity: prefersReducedMotion ? 0.35 : undefined,
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        />
      );
    });
  }, [particleCount, prefersReducedMotion]);

  if (particleCount === 0) {
    return null;
  }

  return <div className="particle-container">{particles}</div>;
};