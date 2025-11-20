/**
 * AI Provider Services
 * Unified interface for different AI providers
 */

import {
  AIProvider,
  AIProviderConfig,
  AIResponse,
  AIGenerationRequest,
  AIProviderError,
  AI_PROVIDERS
} from '@/types/aiProviderTypes';
import { logger } from '@/utils/logger';

// Base AI Service Interface
export interface AIService {
  generateContent(request: AIGenerationRequest): Promise<AIResponse>;
  testConnection(): Promise<boolean>;
}

// OpenRouter Service
class OpenRouterService implements AIService {
  constructor(private config: AIProviderConfig) {}

  async generateContent(request: AIGenerationRequest): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new AIProviderError('API key is required for OpenRouter', 'openrouter', 401);
    }

    const url = `${this.config.baseUrl}/chat/completions`;
    
    if (import.meta.env.DEV) {
      logger.debug('OpenRouter API Request', {
        url,
        model: this.config.model,
        hasApiKey: !!this.config.apiKey,
        apiKeyPrefix: this.config.apiKey?.substring(0, 10) + '...'
      });
    }

    const payload: Record<string, unknown> = {
      model: this.config.model,
      messages: [
        ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
        { role: 'user', content: request.prompt }
      ],
      temperature: request.temperature || 0.9,
      max_tokens: request.maxTokens || 8192,
    };

    if (this.config.model && !this.config.model.includes('auto')) {
      payload.response_format = { type: 'json_object' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Mythopoeist'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorData: Record<string, unknown> = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
          if (import.meta.env.DEV) {
            logger.debug('Failed to parse error response JSON', { error: errorMsg, status: response.status });
          }
          errorData = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
        }
        
        logger.error('OpenRouter API Error', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          payload: JSON.stringify(payload, null, 2)
        });
        
        throw new AIProviderError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          'openrouter',
          response.status,
          errorData
        );
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new AIProviderError('No content in response', 'openrouter');
      }

      return {
        text,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0
        } : undefined,
        provider: 'openrouter',
        model: this.config.model || 'anthropic/claude-3.5-sonnet'
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'openrouter',
        undefined,
        error
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.generateContent({
        prompt: 'Say "Connection test successful" if you can read this.',
        maxTokens: 20
      });
      return true;
    } catch {
      return false;
    }
  }
}

// Ollama Service
class OllamaService implements AIService {
  constructor(private config: AIProviderConfig) {}

  async generateContent(request: AIGenerationRequest): Promise<AIResponse> {
    const url = `${this.config.baseUrl || 'http://localhost:11434'}/api/generate`;

    const payload = {
      model: this.config.model,
      prompt: request.systemPrompt
        ? `${request.systemPrompt}\n\nUser: ${request.prompt}`
        : request.prompt,
      stream: !!request.onStream, // Only stream if callback provided
      format: 'json',
      options: {
        temperature: request.temperature || 0.9,
        num_predict: request.maxTokens || 16384,
      }
    };

    let fullResponseAccumulator = '';
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AIProviderError(
          errorData.error || `HTTP ${response.status}`,
          'ollama',
          response.status,
          errorData
        );
      }

      if (payload.stream && request.onStream && response.body) {
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let rawResponse = ''; // Two-phase accumulation: preserve raw content for recovery
        let parseError: Error | null = null;
        fullResponseAccumulator = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              rawResponse += line + '\n';

              try {
                const data = JSON.parse(line);
                if (data.response) {
                  fullResponse += data.response;
                  fullResponseAccumulator += data.response;
                  request.onStream(data.response);
                }
                if (data.done) {
                  return {
                    text: fullResponse,
                    provider: 'ollama',
                    model: this.config.model || 'llama3.2:latest'
                  };
                }
              } catch (e) {
                const errorMsg = e instanceof Error ? e.message : String(e);
                if (e instanceof SyntaxError) {
                  if (!parseError) {
                    parseError = e instanceof Error ? e : new Error(String(e));
                  }
                  if (import.meta.env.DEV) {
                    logger.debug('Ollama service: JSON parse error on line', {
                      error: errorMsg,
                      accumulatedLength: fullResponse.length,
                      rawAccumulatedLength: rawResponse.length,
                      linePreview: line.substring(0, 100),
                      hasResponse: fullResponse.length > 0
                    });
                  }
                }
              }
            }
          }
        } catch (streamError) {
          const errorMsg = streamError instanceof Error ? streamError.message : String(streamError);
          if (fullResponse.length > 0) {
            parseError = streamError instanceof Error ? streamError : new Error(String(streamError));
            // Continue to return the accumulated response
            if (import.meta.env.DEV) {
              logger.debug('Ollama service: Streaming error but preserving accumulated response', {
                responseLength: fullResponse.length,
                rawResponseLength: rawResponse.length,
                error: errorMsg
              });
            }
          } else {
            // No response accumulated, re-throw the error with fullResponse or raw fallback
            if (import.meta.env.DEV) {
              logger.debug('Ollama service: Streaming error with no accumulated response', {
                error: errorMsg,
                hasRawResponse: rawResponse.length > 0
              });
            }
            if (fullResponse.length > 0 || rawResponse.length > 0 || parseError) {
              if (fullResponse.length > 0) {
                fullResponseAccumulator = fullResponse;
              }
              const responseTextForError = fullResponse.length > 0 ? fullResponse : (rawResponse.length > 0 ? rawResponse : undefined);
              const wrappedError = new AIProviderError(
                `Network error: ${errorMsg}`,
                'ollama',
                undefined,
                streamError instanceof Error ? { message: streamError.message, stack: streamError.stack } : { error: String(streamError) },
                responseTextForError
              );
              throw wrappedError;
            }
            throw streamError;
          }
        } finally {
          reader.releaseLock();
        }

        if (fullResponse.length > 0) {
          if (parseError && import.meta.env.DEV) {
            logger.debug('Ollama service: Returning partial response despite parse error', {
              responseLength: fullResponse.length,
              error: parseError.message
            });
          }
          return {
            text: fullResponse,
            provider: 'ollama',
            model: this.config.model || 'llama3.2:latest'
          };
        }

        if (parseError) {
          const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
          if (import.meta.env.DEV) {
            logger.debug('Ollama service: Parse error, preserving response text', {
              error: errorMsg,
              responseLength: fullResponse.length,
              rawResponseLength: rawResponse.length,
              hasResponse: fullResponse.length > 0,
              hasRawResponse: rawResponse.length > 0
            });
          }
          // Update accumulator before throwing
          if (fullResponse.length > 0) {
            fullResponseAccumulator = fullResponse;
          }
          const responseTextForError = fullResponse.length > 0 ? fullResponse : (rawResponse.length > 0 ? rawResponse : undefined);
          throw new AIProviderError(
            `Network error: ${errorMsg}`,
            'ollama',
            undefined,
            parseError instanceof Error ? { message: parseError.message, stack: parseError.stack } : { error: String(parseError) },
            responseTextForError
          );
        }

        // No response at all
        throw new AIProviderError('No content in streaming response', 'ollama');
      } else {
        // Non-streaming response
        const data = await response.json();

        if (!data.response) {
          throw new AIProviderError('No content in response', 'ollama');
        }

        return {
          text: data.response,
          provider: 'ollama',
          model: this.config.model || 'llama3.2:latest'
        };
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      let responseText: string | undefined = undefined;
      
      if (errorMsg.includes('JSON') || errorMsg.includes('position')) {
        if (error instanceof Error && 'responseText' in error) {
          responseText = (error as { responseText?: string }).responseText;
        }
        if (!responseText && fullResponseAccumulator.length > 0) {
          responseText = fullResponseAccumulator;
        }
      }
      
      throw new AIProviderError(
        `Network error: ${errorMsg}`,
        'ollama',
        undefined,
        error instanceof Error ? { message: error.message, stack: error.stack } : { error: String(error) },
        responseText
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl || 'http://localhost:11434'}/api/tags`;
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const url = `${this.config.baseUrl || 'http://localhost:11434'}/api/tags`;
      const response = await fetch(url);

      if (!response.ok) {
        return ['llama3.2:latest']; // Fallback default
      }

      const data = await response.json();
      return data.models?.map((model: { name: string }) => model.name) || ['llama3.2:latest'];
    } catch {
      return ['llama3.2:latest']; // Fallback default
    }
  }
}

// Service Factory
export class AIServiceFactory {
  static createService(config: AIProviderConfig): AIService {
    switch (config.provider) {
      case 'openrouter':
        return new OpenRouterService(config);
      case 'ollama':
        return new OllamaService(config);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  static async testConnection(config: AIProviderConfig): Promise<boolean> {
    try {
      const service = this.createService(config);
      return await service.testConnection();
    } catch (error) {
      logger.error('AI provider connection test failed', error as Error);
      return false;
    }
  }

  static async getAvailableModels(config: AIProviderConfig): Promise<string[]> {
    try {
      if (config.provider === 'ollama') {
        const service = this.createService(config) as OllamaService;
        return await service.getAvailableModels();
      }

      // For other providers, return static models
      return AI_PROVIDERS[config.provider].supportedModels;
    } catch (error) {
      logger.error('Failed to get available models', error as Error);
      return AI_PROVIDERS[config.provider].supportedModels;
    }
  }
}

