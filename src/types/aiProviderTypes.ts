export type AIProvider = 'openrouter' | 'ollama';

export interface GenerationThresholds {
  minEntities?: number;
  minLocations?: number;
  minVocabulary?: number;
  minTimelineEvents?: number;
  minStoryLength?: number;
  minStoryWordCount?: number;
}

export interface SystemMessages {
  phase1Story?: string;
  phase2Remaining?: string;
  enhancedRetry?: string;
}

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  generationThresholds?: GenerationThresholds;
  systemMessages?: SystemMessages;
}

export interface AIGenerationRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  onStream?: (chunk: string) => void;
}

export interface AIResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: AIProvider;
  model?: string;
}

export class AIProviderError extends Error {
  public responseText?: string;
  
  constructor(
    message: string,
    public provider: AIProvider,
    public statusCode?: number,
    public details?: Record<string, unknown>,
    responseText?: string
  ) {
    super(message);
    this.name = 'AIProviderError';
    this.responseText = responseText;
  }
}

export interface AIProviderInfo {
  id: AIProvider;
  name: string;
  description: string;
  icon: string;
  requiresApiKey: boolean;
  isLocal: boolean;
  baseUrl: string;
  defaultModel: string;
  supportedModels: string[];
}

export const AI_PROVIDERS: Record<AIProvider, AIProviderInfo> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access to multiple AI models through one API',
    icon: '🔀',
    requiresApiKey: true,
    isLocal: false,
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openrouter/auto',
    supportedModels: ['openrouter/auto']
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Run AI models locally on your machine',
    icon: '🏠',
    requiresApiKey: false,
    isLocal: true,
    baseUrl: 'http://localhost:11434',
    defaultModel: 'llama3.2:latest',
    supportedModels: [] // Will be populated dynamically from local installation
  }
};

