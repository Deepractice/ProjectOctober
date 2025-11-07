import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConfigManager } from "./ConfigManager.js";
import type { Loader } from "./loaders/Loader.js";

// Mock Loader for testing
class MockLoader implements Loader {
  priority: number;

  constructor(
    priority: number,
    private mockConfig: Record<string, unknown> = {},
    private available = true
  ) {
    this.priority = priority;
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  async load(): Promise<Record<string, unknown> | null> {
    return this.mockConfig;
  }
}

describe("ConfigManager", () => {
  describe("priority-based merging", () => {
    it("should merge configs with higher priority winning", async () => {
      const manager = new ConfigManager({ mode: "development" });

      // Clear default loaders
      manager["loaders"] = [];

      // Add loaders with different priorities
      manager.addLoader(
        new MockLoader(10, {
          port: 5201,
          anthropicApiKey: "sk-low-priority",
          logLevel: "info",
        })
      );

      manager.addLoader(
        new MockLoader(30, {
          port: 5203,
          contextWindow: 200000,
        })
      );

      manager.addLoader(
        new MockLoader(20, {
          port: 5202,
          anthropicApiKey: "sk-mid-priority",
        })
      );

      const config = await manager.load();

      // Priority 30 should win for port
      expect(config.port).toBe(5203);
      // Priority 20 should win for anthropicApiKey
      expect(config.anthropicApiKey).toBe("sk-mid-priority");
      // Priority 30 is the only one with contextWindow
      expect(config.contextWindow).toBe(200000);
      // Priority 10 is the only one with logLevel
      expect(config.logLevel).toBe("info");
    });

    it("should sort loaders by priority after adding", () => {
      const manager = new ConfigManager({ mode: "development" });
      manager["loaders"] = [];

      const loader1 = new MockLoader(10);
      const loader2 = new MockLoader(30);
      const loader3 = new MockLoader(20);

      manager.addLoader(loader1);
      manager.addLoader(loader2);
      manager.addLoader(loader3);

      const priorities = manager["loaders"].map((l) => l.priority);
      expect(priorities).toEqual([30, 20, 10]);
    });

    it("should skip unavailable loaders", async () => {
      const manager = new ConfigManager({ mode: "development" });
      manager["loaders"] = [];

      manager.addLoader(
        new MockLoader(
          10,
          {
            port: 5201,
            anthropicApiKey: "sk-available",
          },
          true
        )
      );

      manager.addLoader(
        new MockLoader(
          20,
          {
            port: 5202,
            anthropicApiKey: "sk-unavailable",
          },
          false // Not available
        )
      );

      const config = await manager.load();

      // Should only use the available loader
      expect(config.port).toBe(5201);
      expect(config.anthropicApiKey).toBe("sk-available");
    });
  });

  describe("validation", () => {
    it("should validate against development schema", () => {
      const manager = new ConfigManager({ mode: "development" });

      const validConfig = {
        port: 5201,
        anthropicApiKey: "", // Empty is OK in development
        nodeEnv: "development",
      };

      expect(() => manager["validate"](validConfig)).not.toThrow();
    });

    it("should validate against runtime schema", () => {
      const manager = new ConfigManager({ mode: "runtime" });

      const invalidConfig = {
        port: 5201,
        anthropicApiKey: "", // Empty is NOT OK in runtime
        nodeEnv: "production",
      };

      expect(() => manager["validate"](invalidConfig)).toThrow("Invalid configuration");
    });

    it("should throw on invalid port type", () => {
      const manager = new ConfigManager({ mode: "development" });

      const invalidConfig = {
        port: "not-a-number",
        anthropicApiKey: "sk-test",
      };

      expect(() => manager["validate"](invalidConfig)).toThrow();
    });

    it("should throw on invalid nodeEnv value", () => {
      const manager = new ConfigManager({ mode: "development" });

      const invalidConfig = {
        port: 5201,
        anthropicApiKey: "sk-test",
        nodeEnv: "invalid-env",
      };

      expect(() => manager["validate"](invalidConfig)).toThrow();
    });

    it("should apply default values during validation", () => {
      const manager = new ConfigManager({ mode: "development" });

      const minimalConfig = {
        anthropicApiKey: "sk-test",
      };

      const validated = manager["validate"](minimalConfig);

      // Should have default values
      expect(validated.port).toBe(5201);
      expect(validated.vitePort).toBe(5200);
      expect(validated.contextWindow).toBe(160000);
    });
  });

  describe("caching", () => {
    it("should cache config after first load", async () => {
      const manager = new ConfigManager({ mode: "development" });
      manager["loaders"] = [];

      const mockLoader = new MockLoader(10, {
        port: 5201,
        anthropicApiKey: "sk-test",
      });

      const loadSpy = vi.spyOn(mockLoader, "load");
      manager.addLoader(mockLoader);

      // First load
      await manager.getConfig();
      expect(loadSpy).toHaveBeenCalledTimes(1);

      // Second load without reload
      await manager.getConfig(false);
      expect(loadSpy).toHaveBeenCalledTimes(1); // Still 1, used cache
    });

    it("should reload when requested", async () => {
      const manager = new ConfigManager({ mode: "development" });
      manager["loaders"] = [];

      const mockLoader = new MockLoader(10, {
        port: 5201,
        anthropicApiKey: "sk-test",
      });

      const loadSpy = vi.spyOn(mockLoader, "load");
      manager.addLoader(mockLoader);

      // First load
      await manager.getConfig();
      expect(loadSpy).toHaveBeenCalledTimes(1);

      // Reload
      await manager.getConfig(true);
      expect(loadSpy).toHaveBeenCalledTimes(2);
    });

    it("should clear cache manually", async () => {
      const manager = new ConfigManager({ mode: "development" });
      manager["loaders"] = [];

      manager.addLoader(
        new MockLoader(10, {
          port: 5201,
          anthropicApiKey: "sk-test",
        })
      );

      // Load and cache
      await manager.getConfig();
      expect(manager["cachedConfig"]).not.toBeNull();

      // Clear cache
      manager.clearCache();
      expect(manager["cachedConfig"]).toBeNull();
    });
  });

  describe("updateConfig", () => {
    it("should merge updates with current config", async () => {
      const manager = new ConfigManager({ mode: "development" });
      manager["loaders"] = [];

      manager.addLoader(
        new MockLoader(10, {
          port: 5201,
          anthropicApiKey: "sk-original",
          logLevel: "info",
        })
      );

      // Load initial config
      await manager.getConfig();

      // Update
      const updated = await manager.updateConfig({
        port: 5999,
        contextWindow: 200000,
      });

      expect(updated.port).toBe(5999);
      expect(updated.contextWindow).toBe(200000);
      // Should keep existing values
      expect(updated.anthropicApiKey).toBe("sk-original");
      expect(updated.logLevel).toBe("info");
    });

    it("should validate updates", async () => {
      const manager = new ConfigManager({ mode: "development" });
      manager["loaders"] = [];

      manager.addLoader(
        new MockLoader(10, {
          port: 5201,
          anthropicApiKey: "sk-test",
        })
      );

      await manager.getConfig();

      // Invalid update
      await expect(
        manager.updateConfig({
          port: "invalid",
        })
      ).rejects.toThrow();
    });

    it("should update cache after successful update", async () => {
      const manager = new ConfigManager({ mode: "development" });
      manager["loaders"] = [];

      manager.addLoader(
        new MockLoader(10, {
          port: 5201,
          anthropicApiKey: "sk-test",
        })
      );

      await manager.getConfig();

      await manager.updateConfig({ port: 5999 });

      // Cache should be updated
      const cached = await manager.getConfig(false);
      expect(cached.port).toBe(5999);
    });
  });

  describe("edge cases", () => {
    it("should handle empty config from loader", async () => {
      const manager = new ConfigManager({ mode: "development" });
      manager["loaders"] = [];

      manager.addLoader(new MockLoader(10, {}));

      // Should still validate and apply defaults
      const config = await manager.load();
      expect(config.port).toBe(5201); // Default
    });

    it("should handle null config from loader", async () => {
      const manager = new ConfigManager({ mode: "development" });
      manager["loaders"] = [];

      const nullLoader = new MockLoader(10);
      vi.spyOn(nullLoader, "load").mockResolvedValue(null as any);
      manager.addLoader(nullLoader);

      const config = await manager.load();
      expect(config.port).toBe(5201); // Default
    });

    it("should handle multiple loaders returning same keys", async () => {
      const manager = new ConfigManager({ mode: "development" });
      manager["loaders"] = [];

      // All return port, highest priority wins
      manager.addLoader(new MockLoader(10, { port: 5201, anthropicApiKey: "sk-1" }));
      manager.addLoader(new MockLoader(20, { port: 5202, anthropicApiKey: "sk-2" }));
      manager.addLoader(new MockLoader(30, { port: 5203, anthropicApiKey: "sk-3" }));

      const config = await manager.load();
      expect(config.port).toBe(5203);
      expect(config.anthropicApiKey).toBe("sk-3");
    });
  });
});
