import { setWorldConstructor } from "@deepracticex/vitest-cucumber";
import type { Config } from "../../../src/types/Config.js";
import { ConfigManager } from "../../../src/core/ConfigManager.js";
import type { Loader } from "../../../src/core/loaders/Loader.js";
import type { Persister } from "../../../src/core/persisters/Persister.js";

// Test Loaders
class TestEnvLoader implements Loader {
  priority = 10;
  constructor(private data: Record<string, unknown>) {}

  async isAvailable(): Promise<boolean> {
    return Object.keys(this.data).length > 0;
  }

  async load(): Promise<Record<string, unknown> | null> {
    return this.data;
  }

  setData(data: Record<string, unknown>) {
    this.data = data;
  }
}

class TestDBLoader implements Loader {
  priority = 20;
  constructor(private data: Record<string, unknown>) {}

  async isAvailable(): Promise<boolean> {
    return Object.keys(this.data).length > 0;
  }

  async load(): Promise<Record<string, unknown> | null> {
    return this.data;
  }

  setData(data: Record<string, unknown>) {
    this.data = data;
  }
}

class TestUILoader implements Loader {
  priority = 30;
  constructor(private data: Record<string, unknown>) {}

  async isAvailable(): Promise<boolean> {
    return Object.keys(this.data).length > 0;
  }

  async load(): Promise<Record<string, unknown> | null> {
    return this.data;
  }

  setData(data: Record<string, unknown>) {
    this.data = data;
  }
}

// Test Persister
class TestPersister implements Persister {
  public persistedData: Record<string, unknown> | null = null;
  public persistCalled = false;

  isAvailable(): boolean {
    return true;
  }

  async persist(config: Record<string, unknown>): Promise<void> {
    this.persistedData = config;
    this.persistCalled = true;
  }

  reset() {
    this.persistedData = null;
    this.persistCalled = false;
  }
}

// Export test classes for use in steps
export { TestEnvLoader, TestDBLoader, TestUILoader, TestPersister };

class TestWorld {
  manager?: ConfigManager;
  config?: Config;
  validationResult?: {
    valid: boolean;
    errors?: string[];
    data?: any;
  };
  error?: Error;
  result?: any;
  envLoader?: TestEnvLoader;
  dbLoader?: TestDBLoader;
  uiLoader?: TestUILoader;
  testPersister?: TestPersister;
  persistCalled?: boolean;
  loaderCallCount = 0;

  constructor() {
    this.loaderCallCount = 0;
  }

  initializeManager(mode: "development" | "runtime" = "development") {
    this.manager = new ConfigManager({ mode });
    this.manager["loaders"] = [];

    this.envLoader = new TestEnvLoader({});
    this.dbLoader = new TestDBLoader({});
    this.uiLoader = new TestUILoader({});

    this.manager.addLoader(this.envLoader);
    this.manager.addLoader(this.dbLoader);
    this.manager.addLoader(this.uiLoader);
  }

  mockEnvFile(data: Record<string, string>) {
    if (!this.envLoader) this.initializeManager();

    const converted: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      const normalizedKey = key
        .toLowerCase()
        .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

      if (!isNaN(Number(value)) && value !== "") {
        converted[normalizedKey] = Number(value);
      } else {
        converted[normalizedKey] = value;
      }
    });

    this.envLoader!.setData(converted);
  }

  mockDatabase(data: Record<string, unknown>) {
    if (!this.dbLoader) this.initializeManager();
    this.dbLoader!.setData(data);
  }

  mockUIConfig(data: Record<string, unknown>) {
    if (!this.uiLoader) this.initializeManager();
    this.uiLoader!.setData(data);
  }

  addPersister() {
    if (!this.manager) this.initializeManager();
    this.testPersister = new TestPersister();
    this.manager!.addPersister(this.testPersister);
  }

  cleanupMocks() {
    this.manager = undefined;
    this.config = undefined;
    this.error = undefined;
    this.result = undefined;
    this.envLoader = undefined;
    this.dbLoader = undefined;
    this.uiLoader = undefined;
    this.testPersister = undefined;
    this.persistCalled = undefined;
    this.loaderCallCount = 0;
  }
}

setWorldConstructor(TestWorld);
