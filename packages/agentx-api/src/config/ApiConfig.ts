/**
 * API Configuration
 *
 * API credentials and connection settings for LLM services.
 */

export interface ApiConfig {
  /**
   * API key for authentication
   */
  apiKey: string;

  /**
   * API base URL
   * @default "https://api.anthropic.com"
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   * @default 60000
   */
  timeout?: number;

  /**
   * Maximum number of retries for failed requests
   * @default 3
   */
  maxRetries?: number;

  /**
   * Custom HTTP headers
   */
  headers?: Record<string, string>;
}
