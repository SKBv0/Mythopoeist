import { motion, Variants } from 'framer-motion';
import { sanitizeText } from '@/utils/sanitize';

interface AnimatedStoryTextProps {
  text: string;
  onComplete: () => void;
  className?: string;
}

export const AnimatedStoryText = ({ text, onComplete, className }: AnimatedStoryTextProps) => {
  const sanitizedText = sanitizeText(text);
  const placeholderBlockPattern = /^\s*new\s+myth\s*(?:\r?\n|\s)+/i;
  let cleanedText = sanitizedText.replace(placeholderBlockPattern, '').trimStart();
  cleanedText = cleanedText.replace(/\n\s*new\s+myth\s*\n/gi, '\n');
  cleanedText = cleanedText.replace(/\n\s*new\s+myth\s*$/i, '');
  cleanedText = cleanedText.replace(/^\s*new\s+myth\s*\n/i, '');
  
  const sourceText = cleanedText.trim();
  const placeholderLinePattern = /^\s*new\s+myth\s*$/i;
  const paragraphs = sourceText
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0 && !placeholderLinePattern.test(p));

  const paragraphVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.6,
        duration: 0.8,
        ease: "easeOut",
      }
    })
  };

  return (
    <div className={className}>
      {paragraphs.map((paragraph, i) => (
        <motion.p
          key={i}
          custom={i}
          variants={paragraphVariants}
          initial="hidden"
          animate="visible"
          onAnimationComplete={i === paragraphs.length - 1 ? onComplete : undefined}
          className="leading-relaxed text-justify"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {paragraph}
        </motion.p>
      ))}
    </div>
  );
}; 