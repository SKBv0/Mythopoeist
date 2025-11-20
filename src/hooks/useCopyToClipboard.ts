import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/utils/logger';

type CopyFn = (text: string) => Promise<boolean>;

export function useCopyToClipboard(): { copy: CopyFn; isCopied: boolean } {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const { toast } = useToast();

  const copy: CopyFn = useCallback(async (text) => {
    if (!navigator?.clipboard) {
      toast({
        title: 'Error',
        description: 'Clipboard API not available.',
        variant: 'destructive',
      });
      logger.warn('Clipboard API not available');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast({
        title: 'Copied!',
        description: 'Text copied to clipboard.',
      });
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
      return true;
    } catch (error) {
      logger.warn('Copy to clipboard failed', { error });
      toast({
        title: 'Error',
        description: 'Failed to copy text.',
        variant: 'destructive',
      });
      setIsCopied(false);
      return false;
    }
  }, [toast]);

  return { isCopied, copy };
} 