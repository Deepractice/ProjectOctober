import { writeFile } from "fs/promises";
import { resolve } from "path";
import { Persister } from "./Persister.js";

/**
 * Persists configuration to a file
 * Used for saving runtime configuration changes
 */
export class FilePersister implements Persister {
  private filePath: string;

  constructor(filePath?: string) {
    // Default to .env.local (for runtime overrides)
    this.filePath = filePath || resolve(process.cwd(), ".env.local");
  }

  async isAvailable(): Promise<boolean> {
    // File persister is always available (will create file if needed)
    return true;
  }

  async persist(config: Record<string, unknown>): Promise<void> {
    // Convert config object to .env format
    const envContent = Object.entries(config)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        // Convert camelCase to SCREAMING_SNAKE_CASE
        const envKey = key.replace(/([A-Z])/g, "_$1").toUpperCase();
        return `${envKey}=${value}`;
      })
      .join("\n");

    await writeFile(this.filePath, envContent + "\n", "utf-8");
    console.log(`Configuration persisted to ${this.filePath}`);
  }
}
