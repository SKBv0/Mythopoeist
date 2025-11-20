export const toRunic = (word: string): string => {
  if (!word) return '';
  
  return word
    .replace(/a/gi, 'ᚨ')
    .replace(/e/gi, 'ᛖ')
    .replace(/i/gi, 'ᛁ')
    .replace(/o/gi, 'ᛟ')
    .replace(/u/gi, 'ᚢ')
    .replace(/y/gi, 'ᛦ')
    .replace(/b/gi, 'ᛒ')
    .replace(/c/gi, 'ᚲ')
    .replace(/d/gi, 'ᛞ')
    .replace(/f/gi, 'ᚠ')
    .replace(/g/gi, 'ᚷ')
    .replace(/h/gi, 'ᚺ')
    .replace(/j/gi, 'ᛃ')
    .replace(/k/gi, 'ᚲ')
    .replace(/l/gi, 'ᛚ')
    .replace(/m/gi, 'ᛗ')
    .replace(/n/gi, 'ᚾ')
    .replace(/p/gi, 'ᛈ')
    .replace(/q/gi, 'ᛩ')
    .replace(/r/gi, 'ᚱ')
    .replace(/s/gi, 'ᛊ')
    .replace(/t/gi, 'ᛏ')
    .replace(/v/gi, 'ᚹ')
    .replace(/w/gi, 'ᚹ')
    .replace(/x/gi, 'ᛪ')
    .replace(/z/gi, 'ᛉ');
};

