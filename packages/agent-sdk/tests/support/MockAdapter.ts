import type { AgentAdapter, DomainMessage } from "~/types/adapter";
import type { ContentBlock } from "~/types/message";
import type { SessionOptions } from "~/types/config";

/**
 * Mock Adapter Configuration
 */
export interface MockAdapterConfig {
  // Simulate errors
  shouldThrowAuthError?: boolean;
  shouldThrowNetworkError?: boolean;
  shouldThrowTimeoutError?: boolean;

  // Custom responses
  customResponse?: string;
  customContentBlocks?: ContentBlock[];

  // Timing
  responseDelay?: number; // ms
}

/**
 * Mock Adapter for Testing
 *
 * Simulates Claude API behavior without making real network calls
 */
export class MockAdapter implements AgentAdapter {
  private config: MockAdapterConfig;
  private callCount = 0;

  constructor(config: MockAdapterConfig = {}) {
    this.config = config;
  }

  /**
   * Get adapter name
   */
  getName(): string {
    return "MockAdapter";
  }

  /**
   * Reset adapter state
   */
  reset(): void {
    this.callCount = 0;
  }

  /**
   * Get number of calls made
   */
  getCallCount(): number {
    return this.callCount;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MockAdapterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Stream domain messages (implements AgentAdapter interface)
   */
  async *stream(
    prompt: string | ContentBlock[],
    _options: SessionOptions
  ): AsyncGenerator<DomainMessage> {
    this.callCount++;

    // Simulate delay
    if (this.config.responseDelay) {
      await new Promise((resolve) => setTimeout(resolve, this.config.responseDelay));
    }

    // Simulate authentication error
    if (this.config.shouldThrowAuthError) {
      const error = new Error("Authentication failed: invalid API key");
      (error as any).status = 401;
      throw error;
    }

    // Simulate network error
    if (this.config.shouldThrowNetworkError) {
      const error = new Error("Network error: ECONNREFUSED");
      (error as any).code = "ECONNREFUSED";
      throw error;
    }

    // Simulate timeout error
    if (this.config.shouldThrowTimeoutError) {
      const error = new Error("Request timeout");
      (error as any).code = "ETIMEDOUT";
      throw error;
    }

    // Get content string
    const contentStr =
      typeof prompt === "string"
        ? prompt
        : prompt.map((b) => (b.type === "text" ? b.text : "[image]")).join(" ");

    // Yield mock stream events
    const content = this.config.customResponse || `Mock response to: ${contentStr}`;
    const words = content.split(" ");

    // Yield domain messages (chunks)
    for (let i = 0; i < words.length; i++) {
      yield {
        id: `mock-msg-${this.callCount}`,
        type: "agent",
        content: words.slice(0, i + 1).join(" "), // Accumulated content
        timestamp: new Date(),
        model: "mock-model",
        usage: {
          input_tokens: 10,
          output_tokens: i + 1,
        },
      };

      // Small delay between words
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}

/**
 * Helper: Create mock adapter with authentication error
 */
export function createMockAdapterWithAuthError(): MockAdapter {
  return new MockAdapter({
    shouldThrowAuthError: true,
  });
}

/**
 * Helper: Create mock adapter with network error
 */
export function createMockAdapterWithNetworkError(): MockAdapter {
  return new MockAdapter({
    shouldThrowNetworkError: true,
  });
}

/**
 * Helper: Create mock adapter with timeout error
 */
export function createMockAdapterWithTimeoutError(): MockAdapter {
  return new MockAdapter({
    shouldThrowTimeoutError: true,
  });
}

/**
 * Helper: Create mock adapter with custom response
 */
export function createMockAdapterWithResponse(response: string): MockAdapter {
  return new MockAdapter({
    customResponse: response,
  });
}
