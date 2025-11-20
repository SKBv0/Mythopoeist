import { useState, useEffect, useMemo, useCallback } from 'react';
import { AIProvider, AIProviderConfig, AI_PROVIDERS } from '@/types/aiProviderTypes';
import { logger } from '@/utils/logger';

type AISettingsState = {
  activeProvider: AIProvider;
  configs: Record<AIProvider, AIProviderConfig>;
};

const AI_PROVIDER_IDS: AIProvider[] = ['openrouter', 'ollama'];

const getDefaultConfig = (provider: AIProvider): AIProviderConfig => {
  const info = AI_PROVIDERS[provider];
  const config: AIProviderConfig = {
    provider,
    model: info.defaultModel,
    baseUrl: info.baseUrl,
  };

  if (info.requiresApiKey) {
    config.apiKey = '';
  }

  return config;
};

const buildDefaultConfigs = (): Record<AIProvider, AIProviderConfig> => ({
  openrouter: getDefaultConfig('openrouter'),
  ollama: getDefaultConfig('ollama'),
});

export const useAISettings = () => {
  const [aiSettings, setAiSettings] = useState<AISettingsState>(() => {
    const defaults = buildDefaultConfigs();

    if (typeof window === 'undefined') {
      return {
        activeProvider: 'openrouter',
        configs: defaults,
      };
    }

    const saved = localStorage.getItem('ai-provider-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (parsed && typeof parsed === 'object') {
          if ('activeProvider' in parsed && 'configs' in parsed) {
            const storedConfigs = parsed.configs ?? {};
            const mergedConfigs: Record<AIProvider, AIProviderConfig> = { ...defaults };

            for (const provider of AI_PROVIDER_IDS) {
              if (storedConfigs && storedConfigs[provider]) {
                mergedConfigs[provider] = {
                  ...defaults[provider],
                  ...storedConfigs[provider],
                  provider,
                };
              }
            }

            const storedActive = parsed.activeProvider as AIProvider;
            const activeProvider = AI_PROVIDER_IDS.includes(storedActive) ? storedActive : 'openrouter';

            return {
              activeProvider,
              configs: mergedConfigs,
            };
          }

          if ('provider' in parsed) {
            const provider = parsed.provider as AIProvider;
            if (AI_PROVIDER_IDS.includes(provider)) {
              return {
                activeProvider: provider,
                configs: {
                  ...defaults,
                  [provider]: {
                    ...defaults[provider],
                    ...parsed,
                    provider,
                  },
                },
              };
            }
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          logger.warn('Failed to parse saved AI settings from localStorage', { error });
        }
      }
    }

    return {
      activeProvider: 'openrouter',
      configs: defaults,
    };
  });

  const aiConfig = useMemo(
    () => aiSettings.configs[aiSettings.activeProvider] || getDefaultConfig(aiSettings.activeProvider),
    [aiSettings]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem('ai-provider-config', JSON.stringify(aiSettings));
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.warn('Failed to save AI settings to localStorage', { error });
      }
    }
  }, [aiSettings]);

  const handleActiveProviderChange = useCallback((provider: AIProvider) => {
    setAiSettings((prev) => {
      const mergedConfig = {
        ...getDefaultConfig(provider),
        ...prev.configs[provider],
        provider,
      };

      return {
        activeProvider: provider,
        configs: {
          ...prev.configs,
          [provider]: mergedConfig,
        },
      };
    });
  }, []);

  const handleProviderConfigChange = useCallback((config: AIProviderConfig) => {
    setAiSettings((prev) => ({
      activeProvider: config.provider,
      configs: {
        ...prev.configs,
        [config.provider]: {
          ...(prev.configs[config.provider] || getDefaultConfig(config.provider)),
          ...config,
          provider: config.provider,
        },
      },
    }));
  }, []);

  return {
    aiConfig,
    handleActiveProviderChange,
    handleProviderConfigChange,
  };
};
