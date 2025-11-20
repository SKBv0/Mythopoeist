export const getCulturalSignificance = (type: string, description: string): 'sacred' | 'forbidden' | 'neutral' | 'ritual' | 'ancestral' => {
  const lowerType = (type || '').toLowerCase();
  const lowerDesc = (description || '').toLowerCase();
  
  if (lowerType.includes('temple') || lowerType.includes('shrine') || lowerType.includes('sacred') || 
      lowerDesc.includes('sacred') || lowerDesc.includes('holy') || lowerDesc.includes('divine')) {
    return 'sacred';
  }
  if (lowerType.includes('cursed') || lowerType.includes('forbidden') || lowerType.includes('dark') ||
      lowerDesc.includes('forbidden') || lowerDesc.includes('cursed') || lowerDesc.includes('dangerous')) {
    return 'forbidden';
  }
  if (lowerType.includes('ritual') || lowerType.includes('ceremony') || lowerType.includes('grove') ||
      lowerDesc.includes('ritual') || lowerDesc.includes('ceremony') || lowerDesc.includes('magic')) {
    return 'ritual';
  }
  if (lowerType.includes('ancient') || lowerType.includes('ancestral') || lowerType.includes('tomb') ||
      lowerDesc.includes('ancient') || lowerDesc.includes('ancestral') || lowerDesc.includes('old')) {
    return 'ancestral';
  }
  return 'neutral';
}; 