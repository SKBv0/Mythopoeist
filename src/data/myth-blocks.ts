import { MythBlock } from '@/types/mythology';

export const mythBlocks: Record<string, MythBlock[]> = {
  cosmology: [
    { id: 'cos-chaos', name: 'Universe Born from Chaos', description: 'The beginning where everything emerges from a formless void or primordial waters.' },
    { id: 'cos-body', name: 'Giant\'s Body', description: 'The world created from the body of a slain primordial giant.' },
    { id: 'cos-egg', name: 'Cosmic Egg', description: 'The entire universe or life emerging by cracking from an egg.' },
    { id: 'cos-breath', name: 'Divine Breath', description: 'The world spoken or breathed into existence by a divine voice or wind.' },
    { id: 'cos-music', name: 'Cosmic Symphony', description: 'Reality created through divine music, harmony, or vibration.' },
    { id: 'cos-dream', name: 'The Great Dream', description: 'The universe as the dream of a sleeping cosmic entity.' },
    { id: 'cos-dance', name: 'Dance of Creation', description: 'The world formed through the eternal dance of cosmic forces.' },
    { id: 'cos-custom', name: 'Custom Origin', description: 'Create your own unique cosmological origin story.', isCustom: true },
  ],
  gods: [
    { id: 'god-pantheon', name: 'Pantheon', description: 'A polytheistic system with interconnected gods having divided responsibilities.' },
    { id: 'god-creator', name: 'Single Creator', description: 'An absolute and singular divine power that creates everything.' },
    { id: 'god-spirits', name: 'Nature Spirits', description: 'The belief that mountains, rivers, and forests have their own conscious spirits.' },
    { id: 'god-dual', name: 'Dual Forces', description: 'Two opposing divine powers - light/dark, order/chaos, creation/destruction.' },
    { id: 'god-ancestral', name: 'Ancestral Gods', description: 'Deified ancestors who guide and protect their descendants.' },
    { id: 'god-elemental', name: 'Elemental Lords', description: 'Divine beings who embody and control the fundamental elements.' },
    { id: 'god-forgotten', name: 'Forgotten Deity', description: 'An ancient god whose name and worship have been lost to time.' },
    { id: 'god-custom', name: 'Custom Divine', description: 'Design your own divine hierarchy or pantheon.', isCustom: true },
  ],
  beings: [
    {
      id: 'being-giants',
      name: 'Humans and Giants',
      description: 'Humanity\'s complex relationship with giants who preceded them. Include: giant civilization (architecture, culture, technology, beliefs), human emergence (how humans arose, their early struggles), power dynamics (trade, conflict, coexistence, or extinction), cultural exchange (what humans learned or inherited), physical differences (scale, lifespan, abilities). Show specific scenes: a human visiting a giant city, giants teaching humans, a conflict over resources, a mixed community, or ancient giant ruins.',
      expectedElements: [
        'Giant civilization details (architecture, beliefs, customs)',
        'Human cultural development (daily life, rituals, social structure)',
        'Concrete interactions between humans and giants',
        'Physical scale differences shown in scenes',
        'Cultural exchange or conflict specifics',
        'At least one scene in a giant structure or settlement'
      ]
    },
    {
      id: 'being-angels',
      name: 'Angels and Djinn',
      description: 'Beings beyond the visible world who intervene in human destiny. Show their otherworldly culture, how they perceive time differently, their strange powers, and specific instances of intervention.',
      expectedElements: [
        'How these beings manifest in the physical world',
        'Their culture and social structure',
        'Specific intervention scenes',
        'Human reactions and rituals to summon/appease them'
      ]
    },
    {
      id: 'being-monsters',
      name: 'Creatures and Monsters',
      description: 'Manifestations of nature or chaos that must be defeated by heroes. Include ecological roles, behaviors, and concrete confrontation scenes.',
      expectedElements: [
        'Monster ecology and habitat',
        'Specific physical descriptions',
        'Confrontation scenes with sensory details',
        'Cultural beliefs about these creatures'
      ]
    },
    {
      id: 'being-dragons',
      name: 'Ancient Dragons',
      description: 'Wise, powerful serpentine beings who hoard knowledge and treasure. Describe their lairs, what they collect, how they communicate, and their role in history.',
      expectedElements: [
        'Dragon lair descriptions',
        'What they hoard and why',
        'Dragon-human communication scenes',
        'Ancient dragon influence on civilization'
      ]
    },
    {
      id: 'being-fae',
      name: 'Fae Folk',
      description: 'Mysterious otherworldly beings with their own alien morality and magic. Show the fae realm, their rules, bargains, and the consequences of dealing with them.',
      expectedElements: [
        'Fae realm description (terrain, atmosphere)',
        'Fae bargaining scenes',
        'Strange fae rules and customs',
        'Consequences of fae interaction'
      ]
    },
    {
      id: 'being-titans',
      name: 'Primordial Titans',
      description: 'Ancient beings of immense power who shaped the early world. Show what they created, why they fell, and their lasting influence.',
      expectedElements: [
        'Titan-created landscapes or structures',
        'The fall or imprisonment of titans',
        'Lingering titan influence',
        'Scale comparison scenes'
      ]
    },
    {
      id: 'being-shapeshifters',
      name: 'Shapeshifters',
      description: 'Beings who can take multiple forms - human, animal, or elemental. Show transformation scenes, identity struggles, and cultural roles.',
      expectedElements: [
        'Detailed transformation scene',
        'Identity confusion or deception',
        'Cultural role of shapeshifters',
        'Limitations or costs of transformation'
      ]
    },
    { id: 'being-custom', name: 'Custom Beings', description: 'Create your own unique mythological creatures.', isCustom: true },
  ],
  archetype: [
    { id: 'arc-journey', name: 'Hero\'s Journey', description: 'A character who answers a call, faces challenges, and returns transformed.' },
    { id: 'arc-shadow', name: 'Confronting the Shadow', description: 'The protagonist\'s struggle with their own dark aspects or an enemy.' },
    { id: 'arc-trickster', name: 'Trickster', description: 'A figure who breaks rules, disrupts order, and causes unexpected changes.' },
    { id: 'arc-mentor', name: 'The Wise Mentor', description: 'An experienced guide who teaches and prepares the hero for their destiny.' },
    { id: 'arc-guardian', name: 'The Guardian', description: 'A protector who stands between their people and ancient threats.' },
    { id: 'arc-redeemer', name: 'The Redeemer', description: 'One who seeks to atone for past sins or restore what was lost.' },
    { id: 'arc-prophet', name: 'The Prophet', description: 'A visionary who sees the future and warns of coming change.' },
    { id: 'arc-custom', name: 'Custom Archetype', description: 'Design your own character archetype or role.', isCustom: true },
  ],
  themes: [
    { id: 'theme-fate', name: 'Fate and Free Will', description: 'The tension between characters resisting or accepting their destiny.' },
    { id: 'theme-love', name: 'Love and Betrayal', description: 'Love as a creative or destructive force and the disloyalty it brings.' },
    { id: 'theme-sacrifice', name: 'Sacrifice', description: 'Giving up something for a greater purpose, community, or divine grace.' },
    { id: 'theme-cycle', name: 'Eternal Cycles', description: 'The endless repetition of death and rebirth, seasons, or ages.' },
    { id: 'theme-knowledge', name: 'Forbidden Knowledge', description: 'The price of seeking truths that were meant to remain hidden.' },
    { id: 'theme-exile', name: 'Exile and Return', description: 'Banishment from home and the quest to earn the right to return.' },
    { id: 'theme-transformation', name: 'Transformation', description: 'Profound change through trial, magic, or divine intervention.' },
    { id: 'theme-custom', name: 'Custom Theme', description: 'Explore your own thematic element or concept.', isCustom: true },
  ],
  symbols: [
    { id: 'sym-tree', name: 'Sacred Tree', description: 'An axis connecting worlds, representing life and wisdom.' },
    { id: 'sym-fire', name: 'Fire', description: 'An element stolen from gods, symbolizing enlightenment, destruction, and purification.' },
    { id: 'sym-water', name: 'Water', description: 'The source of chaos, unconscious, purification, and rebirth.' },
    { id: 'sym-mirror', name: 'The Mirror', description: 'Reflection of truth, self-knowledge, or passage between worlds.' },
    { id: 'sym-sword', name: 'The Divine Sword', description: 'A weapon of justice, divine authority, or the power to cut through illusion.' },
    { id: 'sym-crown', name: 'The Crown', description: 'Divine authority, burden of leadership, or the price of power.' },
    { id: 'sym-labyrinth', name: 'The Labyrinth', description: 'A complex path representing the journey to understanding or enlightenment.' },
    { id: 'sym-custom', name: 'Custom Symbol', description: 'Create your own meaningful symbol or motif.', isCustom: true },
  ],
  socialcodes: [
    { id: 'soc-tyranny', name: 'Tyrannical Rule', description: 'The hero\'s rebellion against an unjust king or oppressive system.' },
    { id: 'soc-tradition', name: 'Pressure of Traditions', description: 'Society\'s rigid rules hindering individual desire or destiny.' },
    { id: 'soc-taboo', name: 'Breaking Taboos', description: 'A character breaking divine or social taboos and their consequences.' },
    { id: 'soc-honor', name: 'Code of Honor', description: 'A strict moral code that defines acceptable behavior and demands satisfaction.' },
    { id: 'soc-caste', name: 'Caste System', description: 'Rigid social hierarchy where birth determines one\'s place and possibilities.' },
    { id: 'soc-exile', name: 'Social Exile', description: 'Banishment or ostracism as punishment for violating community norms.' },
    { id: 'soc-ritual', name: 'Sacred Rituals', description: 'Ceremonial practices that maintain cosmic order and social bonds.' },
    { id: 'soc-custom', name: 'Custom Social Code', description: 'Design your own social rules or cultural norms.', isCustom: true },
  ]
};

export const blockCategories = [
    { key: 'cosmology', name: 'Cosmology', title: 'Cosmology', icon: 'Globe' },
    { key: 'gods', name: 'Gods', title: 'Gods', icon: 'Sparkles' },
    { key: 'beings', name: 'Beings', title: 'Beings', icon: 'Users' },
    { key: 'archetype', name: 'Archetype', title: 'Archetype', icon: 'BrainCircuit' },
    { key: 'themes', name: 'Themes', title: 'Themes', icon: 'BookOpen' },
    { key: 'symbols', name: 'Symbols', title: 'Symbols', icon: 'TreePine' },
    { key: 'socialcodes', name: 'Social Codes', title: 'Social Codes', icon: 'Shield' }
];
