import { useState } from 'react';
import { MythicalEntity } from '@/types/mythology';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Crown, Sword, Skull, Sparkles, User, Wand2, BookOpen, 
  Star, Eye, Scroll
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ENTITY_TYPE_COLORS } from '@/constants/ui';
import { sanitizeText } from '@/utils/sanitize';

const typeIcons = {
  god: Crown,
  hero: Sword,
  monster: Skull,
  spirit: Sparkles,
  mortal: User,
  trickster: Wand2,
  sage: BookOpen,
};

const rarityStyles = {
  common: { 
    border: 'border-gray-600/60',
    glow: '',
    shine: ''
  },
  rare: { 
    border: 'border-emerald-500/70',
    glow: 'shadow-lg shadow-emerald-500/20',
    shine: 'after:bg-gradient-to-r after:from-transparent after:via-emerald-400/10 after:to-transparent'
  },
  epic: { 
    border: 'border-blue-500/70',
    glow: 'shadow-xl shadow-blue-500/25',
    shine: 'after:bg-gradient-to-r after:from-transparent after:via-blue-400/15 after:to-transparent'
  },
  legendary: { 
    border: 'border-amber-500/80',
    glow: 'shadow-xl shadow-amber-500/30',
    shine: 'after:bg-gradient-to-r after:from-transparent after:via-amber-400/20 after:to-transparent'
  },
  mythic: { 
    border: 'border-purple-500/90',
    glow: 'shadow-2xl shadow-purple-500/40',
    shine: 'after:bg-gradient-to-r after:from-transparent after:via-purple-400/25 after:to-transparent'
  }
};

interface MythicalEntityCardProps {
  entity: MythicalEntity;
  className?: string;
}

export const MythicalEntityCard: React.FC<MythicalEntityCardProps> = ({
  entity,
  className = ""
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const Icon = typeIcons[entity.type] || User;
  const colors = ENTITY_TYPE_COLORS[entity.type] || ENTITY_TYPE_COLORS.mortal;
  const rarityKey = entity.rarity || 'common';
  const rarity = rarityStyles[rarityKey] || rarityStyles.common;

  return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      transition={{ duration: 0.5 }}
      className={cn("w-full", className)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className={cn(
        "relative overflow-hidden backdrop-blur-sm",
        "bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95",
        "border-2 transition-all duration-500",
        rarity.border,
        rarity.glow,
        isHovered && "scale-[1.02]",
        rarity.shine && "after:absolute after:inset-0 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500",
        rarity.shine
      )}>
        
                 {/* Mystical background pattern */}
         <div className="absolute inset-0 opacity-5">
           <div 
             className="w-full h-full"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3Ccircle cx='10' cy='10' r='0.5'/%3E%3Ccircle cx='30' cy='30' r='0.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
               backgroundSize: '20px 20px'
             }}
           />
                  </div>
                  
         {/* Subtle corner decoration */}
         <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-white/20 rounded-tl-lg"></div>
         <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-white/20 rounded-br-lg"></div>

                 {/* Type header with gradient */}
         <div className={cn(
           "relative h-16 bg-gradient-to-br overflow-hidden",
           colors.gradient
         )}>
           <div className="absolute inset-0 bg-black/30" />
           
           <div className="relative z-10 flex items-center justify-between p-3 h-full">
            {/* Icon and type */}
            <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-black/40 backdrop-blur-sm rounded-lg border border-white/30 flex items-center justify-center">
                 <Icon className="w-4 h-4 text-white drop-shadow-lg" />
                          </div>
               <Badge 
                 variant="secondary" 
                 className="bg-black/40 text-white border-white/30 text-xs font-medium tracking-wide backdrop-blur-sm"
               >
                 {entity.type?.toUpperCase() || 'UNKNOWN'}
               </Badge>
            </div>

                         {/* Rarity star */}
             <div 
                                className={cn(
                 "w-6 h-6 rounded-full border border-white/40 backdrop-blur-sm",
                 "flex items-center justify-center transition-all duration-300",
                 isHovered && "scale-110 border-white/60"
               )}
               style={{ backgroundColor: `${colors.primary}50` }}
             >
               <Star className="w-3 h-3 text-white" fill="currentColor" />
                            </div>
                          </div>

          {/* Subtle animated overlay */}
                                <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={isHovered ? { x: ['-100%', '100%'] } : {}}
            transition={{ duration: 1.5, ease: "easeInOut" }}
                                />
                              </div>

                 <CardContent className="p-4 space-y-3 relative z-10">
          
                     {/* Entity name and archetype */}
           <div className="space-y-1">
             <h3 className={cn(
               "text-lg font-bold font-['Cinzel'] tracking-wide",
               colors.text,
               "drop-shadow-md"
             )}>
               {sanitizeText(entity.name)}
             </h3>
             {entity.archetype && (
               <p className="text-xs text-white/70 italic font-['Playfair_Display']">
                 "{sanitizeText(entity.archetype)}"
               </p>
             )}
                      </div>

          {/* Character essence traits */}
                  {entity.domains && entity.domains.length > 0 && (
            <div className="space-y-2">
                      <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white/60" />
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider font-['Cinzel']">
                          Domains
                        </h4>
                      </div>
              <div className="flex flex-wrap gap-1">
                {entity.domains.slice(0, 4).map((domain, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                    className={cn(
                      "text-xs px-2 py-1 bg-black/30 backdrop-blur-sm border-amber-500/30",
                      "text-amber-300 font-medium"
                    )}
                          >
                            {sanitizeText(domain)}
                          </Badge>
                        ))}
                      </div>
            </div>
          )}

                     {/* Character Origin & Lore */}
           <div className="bg-black/20 border border-white/10 rounded-lg p-3 backdrop-blur-sm relative">
             <div className="absolute top-2 right-2">
               <Eye className="w-3 h-3 text-white/30" />
             </div>
             <p className="text-xs text-white/80 leading-relaxed font-['Playfair_Display'] italic line-clamp-3 pr-5">
               {sanitizeText(entity.description || '')}
             </p>
           </div>

          {/* Legendary Aspects */}
          {entity.powers && entity.powers.length > 0 && (
            <div className="space-y-2">
                      <div className="flex items-center gap-2">
                <Scroll className="w-4 h-4 text-white/60" />
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider font-['Cinzel']">
                  Legendary Aspects
                        </h4>
                      </div>
              <div className="flex flex-wrap gap-1">
                {entity.powers.slice(0, 3).map((power, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                    className={cn(
                      "text-xs px-2 py-1 bg-black/30 backdrop-blur-sm border-purple-500/30",
                      "text-purple-300 font-medium"
                    )}
                          >
                    {sanitizeText(power)}
                          </Badge>
                        ))}
                      </div>
                      </div>
          )}

                     {/* Footer with rarity and avatar */}
           <div className="flex justify-between items-center pt-2 border-t border-white/10">
             <Badge 
               variant="outline"
               className={cn(
                 "text-xs font-medium tracking-wide px-2 py-1",
                 "bg-black/30 backdrop-blur-sm",
                 colors.border.replace('border-', 'border-'),
                 colors.text,
                 "font-['Cinzel']"
               )}
             >
               {rarityKey.toUpperCase()}
             </Badge>
             
             {entity.avatar && (
               <div className="w-6 h-6 bg-black/30 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center">
                 <span className="text-sm">{entity.avatar}</span>
                      </div>
             )}
                      </div>

                </CardContent>

        {/* Mystical glow effect on hover */}
        <motion.div
          className={cn(
            "absolute inset-0 opacity-0 pointer-events-none rounded-lg",
            "bg-gradient-to-br from-white/5 via-transparent to-white/5"
          )}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        </Card>
      </motion.div>
  );
};
