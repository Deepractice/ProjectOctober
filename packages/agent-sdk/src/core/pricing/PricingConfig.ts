import type { PricingConfig } from "~/types";

/**
 * Default pricing configuration for Claude models (2025 pricing)
 * Prices are per million tokens in USD
 */
export const DEFAULT_PRICING: Record<string, PricingConfig> = {
  // Haiku 3 - Fast and lightweight
  "claude-3-5-haiku-20250110": {
    model: "claude-3-5-haiku-20250110",
    prices: {
      inputPerMillion: 0.25,
      outputPerMillion: 1.25,
      cacheReadPerMillion: 0.025, // 10% of input
      cacheCreationPerMillion: 0.3125, // 125% of input
    },
  },

  // Sonnet 4.5 - Balanced performance
  "claude-3-5-sonnet-20250219": {
    model: "claude-3-5-sonnet-20250219",
    prices: {
      inputPerMillion: 3,
      outputPerMillion: 15,
      cacheReadPerMillion: 0.3,
      cacheCreationPerMillion: 3.75,
    },
  },

  // Sonnet 4 (older)
  "claude-sonnet-4-20250514": {
    model: "claude-sonnet-4-20250514",
    prices: {
      inputPerMillion: 3,
      outputPerMillion: 15,
      cacheReadPerMillion: 0.3,
      cacheCreationPerMillion: 3.75,
    },
  },

  // Opus 4 - Most capable
  "claude-opus-4-20250514": {
    model: "claude-opus-4-20250514",
    prices: {
      inputPerMillion: 15,
      outputPerMillion: 75,
      cacheReadPerMillion: 1.5,
      cacheCreationPerMillion: 18.75,
    },
  },

  // Fallback for unknown models (use Sonnet pricing)
  default: {
    model: "default",
    prices: {
      inputPerMillion: 3,
      outputPerMillion: 15,
      cacheReadPerMillion: 0.3,
      cacheCreationPerMillion: 3.75,
    },
  },
};

/**
 * Get pricing configuration for a model
 * Falls back to default pricing if model not found
 */
export function getPricingForModel(model: string): PricingConfig {
  return DEFAULT_PRICING[model] || DEFAULT_PRICING.default;
}
