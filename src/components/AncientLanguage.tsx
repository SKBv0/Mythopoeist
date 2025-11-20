import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Volume2, Copy, Star, Search, X, Filter, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AncientWord } from '@/types/mythology';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { ANCIENT_LANGUAGE_CATEGORY_COLORS, ANCIENT_LANGUAGE_RARITY_COLORS } from '@/constants/ui';
import { toRunic } from '@/utils/runicConverter';

interface AncientLanguageProps {
  vocabulary: AncientWord[];
  className?: string;
}

let stylesInjected = false;
const injectEpicStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const existingStyle = document.getElementById('ancient-language-epic-styles');
  if (existingStyle) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = 'ancient-language-epic-styles';
  styleElement.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;1,400&display=swap');
    
    .ancient-word-card {
      background: linear-gradient(to bottom right, rgba(22, 27, 34, 0.85), rgba(15, 20, 25, 0.9));
      backdrop-filter: blur(16px) saturate(140%);
      border: 1px solid rgba(191, 161, 90, 0.15);
      position: relative;
      overflow: hidden;
      transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .ancient-word-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 20% 30%, rgba(212, 175, 55, 0.08), transparent 60%);
      opacity: 0;
      transition: opacity 0.5s ease;
    }
    
    .ancient-word-card:hover::before {
      opacity: 1;
    }
    
    .ancient-word-card:hover {
      border-color: rgba(212, 175, 55, 0.4);
      transform: translateY(-2px);
      box-shadow: 
        0 12px 32px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(212, 175, 55, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
    
    .runic-script {
      font-family: 'Noto Sans Runic', 'Junicode', 'Cinzel', serif;
      font-weight: 400;
      letter-spacing: 0.2em;
      background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 40%, #FFE87C 60%, #F4D03F 80%, #D4AF37 100%);
      background-size: 300% 300%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.4));
      animation: runic-shimmer 5s ease-in-out infinite;
    }
    
    @keyframes runic-shimmer {
      0%, 100% { background-position: 0% 50%; filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.4)); }
      50% { background-position: 100% 50%; filter: drop-shadow(0 0 12px rgba(212, 175, 55, 0.6)); }
    }
    
    .epic-scroll {
      scrollbar-width: thin;
      scrollbar-color: rgba(191, 161, 90, 0.5) transparent;
    }
    
    .epic-scroll::-webkit-scrollbar {
      width: 6px;
    }
    
    .epic-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .epic-scroll::-webkit-scrollbar-thumb {
      background: rgba(191, 161, 90, 0.5);
      border-radius: 3px;
    }
    
    .epic-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(212, 175, 55, 0.7);
    }
  `;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

export const AncientLanguage: React.FC<AncientLanguageProps> = ({
  vocabulary = [],
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [selectedWord, setSelectedWord] = useState<AncientWord | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { copy } = useCopyToClipboard();

  useEffect(() => {
    injectEpicStyles();
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const categories = vocabulary.length > 0 
    ? Array.from(new Set(vocabulary.map(word => word.category).filter(Boolean)))
    : [];

  const handleCopyWord = (word: AncientWord) => {
    const runicText = word.runicScript || (word.word ? toRunic(word.word) : '');
    const text = `${runicText} (${word.pronunciation}) - ${word.word}: ${word.meaning}`;
    copy(text);
  };

  const handlePlayPronunciation = (word: AncientWord) => {
    const wordToSpeak = word.word || '';
    const pronunciation = word.pronunciation || wordToSpeak;
    
    if (!wordToSpeak) return;
    
    setPlayingAudio(word.word);
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(pronunciation);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        setPlayingAudio(null);
      };
      
      utterance.onerror = () => {
        setPlayingAudio(null);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingAudio(null), 1500);
    }
  };

  const filteredVocabulary = vocabulary.filter(word => {
    const wordText = word.word || '';
    const runicText = word.runicScript || (word.word ? toRunic(word.word) : '');
    const meaningText = word.meaning || '';
    const categoryText = word.category || '';
    const rarityText = word.rarity || '';
    
    const matchesSearch = wordText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         runicText.includes(searchTerm) ||
                         meaningText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || categoryText === selectedCategory;
    const matchesRarity = selectedRarity === 'all' || rarityText === selectedRarity;
    
    return matchesSearch && matchesCategory && matchesRarity;
  });

  const activeFiltersCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedRarity !== 'all' ? 1 : 0);

  if (vocabulary.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <BookOpen className="w-20 h-20 text-[#D4AF37]/20 mx-auto mb-6" />
          <p className="text-[#D4B76A] font-['Cinzel'] text-xl tracking-wider">
            Forging Ancient Vocabulary...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Minimalist Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#BFA15A]/40" />
            <input
              type="text"
              placeholder="Search lexicon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-[rgba(15,20,25,0.6)] backdrop-blur-sm border border-[rgba(191,161,90,0.15)] rounded 
                       text-[#E6D8B4] placeholder-[#A69B7E]/40 text-sm
                       focus:outline-none focus:border-[rgba(212,175,55,0.3)] focus:bg-[rgba(15,20,25,0.8)]
                       transition-all duration-200
                       font-['Playfair_Display']"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#A69B7E]/50 hover:text-[#D4AF37] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-3 py-2 rounded border text-xs font-['Cinzel'] tracking-wide transition-all",
              "bg-[rgba(15,20,25,0.6)] border-[rgba(191,161,90,0.15)] text-[#E6D8B4]",
              "hover:border-[rgba(212,175,55,0.3)] hover:bg-[rgba(15,20,25,0.8)]",
              showFilters && "border-[rgba(212,175,55,0.4)] bg-[rgba(15,20,25,0.8)]"
            )}
          >
            <Filter className="w-3.5 h-3.5 inline mr-1.5" />
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-[rgba(212,175,55,0.2)] text-[#D4AF37] rounded text-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-[rgba(15,20,25,0.6)] border border-[rgba(191,161,90,0.15)] rounded text-[#E6D8B4] text-xs font-['Playfair_Display'] focus:outline-none focus:border-[rgba(212,175,55,0.3)]"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Unknown'}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-[rgba(15,20,25,0.6)] border border-[rgba(191,161,90,0.15)] rounded text-[#E6D8B4] text-xs font-['Playfair_Display'] focus:outline-none focus:border-[rgba(212,175,55,0.3)]"
                >
                  <option value="all">All Rarities</option>
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="sacred">Sacred</option>
                  <option value="forbidden">Forbidden</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-xs text-[#A69B7E]/60 font-['Playfair_Display'] text-right">
          {filteredVocabulary.length} / {vocabulary.length}
        </div>
      </div>

      {/* Word Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto space-y-2 epic-scroll pr-1">
          <AnimatePresence mode="popLayout">
            {filteredVocabulary.map((word, index) => {
              const isSelected = selectedWord?.word === word.word;
              const isPlaying = playingAudio === word.word;
              
              return (
                <motion.div
                  key={`${word.word}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    onClick={() => setSelectedWord(isSelected ? null : word)}
                    className={cn(
                      "ancient-word-card rounded-lg cursor-pointer relative",
                      isSelected && "border-[rgba(212,175,55,0.5)]"
                    )}
                  >
                    {/* Corner decorations */}
                    <div className="absolute top-2 left-2 w-2 h-2 border-l border-t border-[rgba(212,175,55,0.2)] rounded-tl" />
                    <div className="absolute top-2 right-2 w-2 h-2 border-r border-t border-[rgba(212,175,55,0.2)] rounded-tr" />
                    <div className="absolute bottom-2 left-2 w-2 h-2 border-l border-b border-[rgba(212,175,55,0.2)] rounded-bl" />
                    <div className="absolute bottom-2 right-2 w-2 h-2 border-r border-b border-[rgba(212,175,55,0.2)] rounded-br" />

                    <div className="p-4 relative z-10">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Runic Script and Word Name - Same Line */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="runic-script text-3xl leading-none">
                              {word.word ? (word.runicScript || toRunic(word.word)) : '—'}
                            </div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-[#D4B76A] font-['Cinzel'] tracking-wide">
                                {word.word || 'Unknown'}
                              </h3>
                              {word.rarity === 'sacred' && (
                                <Star className="w-3.5 h-3.5 text-[#D4AF37]" fill="currentColor" />
                              )}
                            </div>
                          </div>

                          {/* Pronunciation */}
                          <p className="text-xs text-[#A69B7E]/80 font-['Playfair_Display'] italic mb-3">
                            [{word.pronunciation || 'no pronunciation'}]
                          </p>

                          {/* Meaning - Always visible */}
                          {word.meaning && (
                            <div className="mt-3 pt-3 border-t border-[rgba(191,161,90,0.1)]">
                              <p className="text-sm text-[#E6D8B4]/85 leading-relaxed font-['Playfair_Display']">
                                {word.meaning}
                              </p>
                            </div>
                          )}

                          {/* Quick badges - always visible */}
                          <div className="flex items-center gap-1.5 mt-3">
                            {word.category && (
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium font-['Cinzel'] border",
                                ANCIENT_LANGUAGE_CATEGORY_COLORS[word.category as keyof typeof ANCIENT_LANGUAGE_CATEGORY_COLORS] || 
                                'bg-[rgba(15,20,25,0.6)] text-[#E6D8B4] border-[rgba(191,161,90,0.2)]'
                              )}>
                                {word.category}
                              </span>
                            )}
                            {word.rarity && word.rarity !== 'common' && (
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium font-['Cinzel'] border",
                                ANCIENT_LANGUAGE_RARITY_COLORS[word.rarity as keyof typeof ANCIENT_LANGUAGE_RARITY_COLORS] || 
                                'bg-[rgba(15,20,25,0.6)] text-[#E6D8B4] border-[rgba(191,161,90,0.2)]'
                              )}>
                                {word.rarity === 'rare' ? 'Rare' :
                                 word.rarity === 'sacred' ? 'Sacred' : 
                                 word.rarity === 'forbidden' ? 'Forbidden' : word.rarity}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPronunciation(word);
                            }}
                            className={cn(
                              "p-2 rounded border transition-all",
                              "border-[rgba(191,161,90,0.2)] text-[#A69B7E]/60",
                              "hover:border-[rgba(212,175,55,0.4)] hover:text-[#D4AF37] hover:bg-[rgba(212,175,55,0.05)]",
                              isPlaying && "border-[rgba(212,175,55,0.5)] text-[#D4AF37] bg-[rgba(212,175,55,0.1)]"
                            )}
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyWord(word);
                            }}
                            className="p-2 rounded border border-[rgba(191,161,90,0.2)] text-[#A69B7E]/60 hover:border-[rgba(212,175,55,0.4)] hover:text-[#D4AF37] hover:bg-[rgba(212,175,55,0.05)] transition-all"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details - Etymology and Usage */}
                      <AnimatePresence>
                        {isSelected && (word.etymology || word.usage) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pt-4 border-t border-[rgba(191,161,90,0.15)]"
                          >
                            <div className="space-y-4">
                              {word.etymology && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]/60" />
                                    <h4 className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider font-['Cinzel']">
                                      Etymology
                                    </h4>
                                  </div>
                                  <p className="text-sm text-[#A69B7E]/80 leading-relaxed font-['Playfair_Display'] italic pl-6">
                                    {word.etymology}
                                  </p>
                                </div>
                              )}
                              
                              {word.usage && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]/60" />
                                    <h4 className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider font-['Cinzel']">
                                      Usage
                                    </h4>
                                  </div>
                                  <p className="text-sm text-[#E6D8B4]/80 leading-relaxed font-['Playfair_Display'] italic pl-6">
                                    "{word.usage}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
