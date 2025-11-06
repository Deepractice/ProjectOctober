import { defineConfig } from 'tsup';
import { cpSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  entry: ['src/bin/agent-cli.ts', 'src/commands/http.ts', 'src/cli.ts'],
  format: ['esm'],
  outDir: 'dist',
  dts: true,
  clean: true,
  sourcemap: true,

  // Copy runtime resources after build
  async onSuccess() {
    const distDir = './dist';
    const runtimeDir = join(distDir, 'runtime');

    console.log('📦 Copying runtime resources...');

    // Create runtime directory
    if (!existsSync(runtimeDir)) {
      mkdirSync(runtimeDir, { recursive: true });
    }

    // Copy agent-service bundled file
    const serviceSrc = '../../services/agent-service/dist/index.js';
    const serviceDest = join(runtimeDir, 'service.js');

    if (existsSync(serviceSrc)) {
      cpSync(serviceSrc, serviceDest);
      console.log('✅ Copied agent-service bundle');
    } else {
      console.error('❌ agent-service/dist/index.js not found. Run `pnpm build` in agent-service first.');
      process.exit(1);
    }

    // Copy agent-web dist directory
    const webSrc = '../agent-web/dist';
    const webDest = join(runtimeDir, 'web');

    if (existsSync(webSrc)) {
      cpSync(webSrc, webDest, { recursive: true });
      console.log('✅ Copied agent-web dist');
    } else {
      console.error('❌ agent-web/dist not found. Run `pnpm build` in agent-web first.');
      process.exit(1);
    }

    console.log('🎉 Runtime resources copied successfully!');
    console.log(`📂 Structure:\n   dist/runtime/service.js\n   dist/runtime/web/`);
  },
});
