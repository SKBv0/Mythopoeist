import { useState, useCallback, useEffect } from 'react';
import { logger } from '@/utils/logger';

export const useSound = (soundPath: string, volume: number = 1) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const audioElement = new Audio();
    
    const handleCanPlayThrough = () => {
      setIsAvailable(true);
      setAudio(audioElement);
    };
    
    const handleError = () => {
      setIsAvailable(false);
      setAudio(null);
      if (import.meta.env.DEV) {
        logger.warn('Audio file not found', { soundPath });
      }
    };
    
    audioElement.addEventListener('canplaythrough', handleCanPlayThrough);
    audioElement.addEventListener('error', handleError);
    audioElement.src = soundPath;
    audioElement.load();
    
    return () => {
      if (audioElement) {
        audioElement.removeEventListener('canplaythrough', handleCanPlayThrough);
        audioElement.removeEventListener('error', handleError);
      }
    };
  }, [soundPath]);

  const play = useCallback(() => {
    if (audio && isAvailable) {
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch((error) => {
        if (import.meta.env.DEV) {
          logger.warn('Audio play failed', { error: error.message });
        }
      });
    }
  }, [audio, volume, isAvailable]);

  return play;
};