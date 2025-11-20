import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecoveryStatusProps {
  recoveredSections: string[];
  missingSections: string[];
  incompleteSections: string[];
  onRegenerateRequest: (sections: string[]) => void;
  onAcceptAsIs: () => void;
}

const getSectionDisplayName = (sectionKey: string): string => {
  const displayNames = {
    story: 'Main Story',
    entities: 'Characters & Entities', 
    worldMap: 'World Map',
    analysis: 'Analysis & Timeline',
    socialCode: 'Social Code',
    ancientLanguage: 'Ancient Language',
    temples: 'Temples',
    rituals: 'Rituals',
    extras: 'Extras'
  };
  
  return displayNames[sectionKey as keyof typeof displayNames] || sectionKey;
};

export const RecoveryStatusAlert = ({ 
  recoveredSections, 
  missingSections, 
  incompleteSections, 
  onRegenerateRequest, 
  onAcceptAsIs 
}: RecoveryStatusProps) => {
  const problemSections = [...missingSections, ...incompleteSections];
  
  if (problemSections.length === 0) {
    return null;
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed left-4 top-20 z-50 max-w-sm"
    >
      <div className="bg-amber-900/95 backdrop-blur-md border border-amber-600/50 rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-amber-100 font-semibold mb-3 text-sm">
              🔄 Partial Success
            </h3>
            
            <div className="space-y-3 text-xs">
              {recoveredSections.length > 0 && (
                <div>
                  <span className="text-green-400 font-medium">✅ Recovered:</span>
                  <div className="text-amber-200 ml-4 mt-1 space-y-0.5">
                    {recoveredSections.map(section => (
                      <div key={section} className="truncate">
                        • {getSectionDisplayName(section)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <span className="text-red-400 font-medium">❌ Missing/Incomplete:</span>
                <div className="text-amber-200 ml-4 mt-1 space-y-0.5">
                  {problemSections.map(section => (
                    <div key={section} className="truncate">
                      • {getSectionDisplayName(section)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button 
                size="sm" 
                onClick={() => onRegenerateRequest(problemSections)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1 h-auto font-medium transition-colors"
              >
                Complete Missing
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onAcceptAsIs}
                className="text-amber-200 hover:bg-amber-800/50 text-xs px-3 py-1 h-auto transition-colors"
              >
                Continue As Is
              </Button>
            </div>
          </div>
          
          <button 
            onClick={onAcceptAsIs}
            className="flex-shrink-0 text-amber-400 hover:text-amber-200 hover:bg-amber-800/50 rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}; 