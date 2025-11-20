export const DESKTOP_CATEGORY_ZONES = {
  cosmology: { x: [10, 30], y: [15, 35] },
  gods: { x: [35, 65], y: [15, 35] },
  beings: { x: [70, 90], y: [15, 35] },
  archetype: { x: [35, 65], y: [40, 60] },
  themes: { x: [10, 30], y: [65, 85] },
  symbols: { x: [35, 65], y: [65, 85] },
  socialcodes: { x: [70, 90], y: [65, 85] },
} as const;

export const MOBILE_CATEGORY_ZONES = {
  cosmology: { x: [10, 90], y: [5, 18] },
  gods: { x: [10, 90], y: [19, 32] },
  beings: { x: [10, 90], y: [33, 46] },
  archetype: { x: [10, 90], y: [47, 60] },
  themes: { x: [10, 90], y: [61, 74] },
  symbols: { x: [10, 90], y: [75, 88] },
  socialcodes: { x: [10, 90], y: [89, 99] },
} as const;

export const CATEGORY_COLORS = {
  cosmology: "rgb(239, 68, 68)",
  gods: "rgb(251, 191, 36)",
  beings: "rgb(163, 230, 53)",
  archetype: "rgb(52, 211, 153)",
  themes: "rgb(34, 211, 238)",
  symbols: "rgb(129, 140, 248)",
  socialcodes: "rgb(232, 121, 249)"
} as const;

export const CATEGORY_GLOWS = {
  cosmology: "0 0 20px rgba(239, 68, 68, 0.6)",
  gods: "0 0 20px rgba(251, 191, 36, 0.6)",
  beings: "0 0 20px rgba(163, 230, 53, 0.6)",
  archetype: "0 0 20px rgba(52, 211, 153, 0.6)",
  themes: "0 0 20px rgba(34, 211, 238, 0.6)",
  symbols: "0 0 20px rgba(129, 140, 248, 0.6)",
  socialcodes: "0 0 20px rgba(232, 121, 249, 0.6)"
} as const;

export const DEFAULTS = {
  PARTICLE_COUNT: 15,
  DEFAULT_COLOR: "rgb(139, 92, 246)",
  DEFAULT_GLOW: "0 0 20px rgba(139, 92, 246, 0.6)"
} as const;

// Ancient characters for mystical animations
export const ANCIENT_CHARACTERS = 'αβγδεζηθικλμνξοπρστυφχψω✧✦☆' as const;

// Ancient Language category colors
export const ANCIENT_LANGUAGE_CATEGORY_COLORS = {
  gods: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  nature: 'bg-green-500/20 text-green-300 border-green-500/50',
  magic: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  warfare: 'bg-red-500/20 text-red-300 border-red-500/50',
  love: 'bg-pink-500/20 text-pink-300 border-pink-500/50',
  death: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
  creation: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  prophecy: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
} as const;

// Ancient Language rarity colors
export const ANCIENT_LANGUAGE_RARITY_COLORS = {
  common: 'bg-gray-500/20 text-gray-300',
  rare: 'bg-blue-500/20 text-blue-300',
  sacred: 'bg-yellow-500/20 text-yellow-300',
  forbidden: 'bg-red-500/20 text-red-300'
} as const;

// Entity type colors for MythicalEntityCard
export const ENTITY_TYPE_COLORS = {
  god: {
    primary: '#F59E0B',
    gradient: 'from-amber-600/30 via-yellow-500/20 to-amber-400/30',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/30'
  },
  hero: {
    primary: '#3B82F6', 
    gradient: 'from-blue-600/30 via-cyan-500/20 to-blue-400/30',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/30'
  },
  monster: {
    primary: '#DC2626',
    gradient: 'from-red-600/30 via-rose-500/20 to-red-400/30', 
    border: 'border-red-500/40',
    text: 'text-red-400',
    glow: 'shadow-red-500/30'
  },
  spirit: {
    primary: '#8B5CF6',
    gradient: 'from-purple-600/30 via-violet-500/20 to-purple-400/30',
    border: 'border-purple-500/40', 
    text: 'text-purple-400',
    glow: 'shadow-purple-500/30'
  },
  sage: {
    primary: '#F97316',
    gradient: 'from-orange-600/30 via-amber-500/20 to-orange-400/30',
    border: 'border-orange-500/40',
    text: 'text-orange-400', 
    glow: 'shadow-orange-500/30'
  },
  trickster: {
    primary: '#10B981',
    gradient: 'from-emerald-600/30 via-green-500/20 to-emerald-400/30',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/30'
  },
  mortal: {
    primary: '#6B7280',
    gradient: 'from-gray-600/30 via-slate-500/20 to-gray-400/30',
    border: 'border-gray-500/40',
    text: 'text-gray-400',
    glow: 'shadow-gray-500/30'
  }
} as const;

// Location type color mapping function
export const getLocationTypeColor = (type: string): string => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('city') || lowerType.includes('capital')) return '#3b82f6'; // blue
  if (lowerType.includes('forest') || lowerType.includes('grove')) return '#22c55e'; // green
  if (lowerType.includes('mountain') || lowerType.includes('peak')) return '#a8a29e'; // stone
  if (lowerType.includes('river') || lowerType.includes('sea')) return '#06b6d4'; // cyan
  if (lowerType.includes('temple') || lowerType.includes('shrine')) return '#f59e0b'; // amber
  if (lowerType.includes('ruin') || lowerType.includes('ancient')) return '#8b5cf6'; // violet
  return '#ec4899'; // pink
}; 