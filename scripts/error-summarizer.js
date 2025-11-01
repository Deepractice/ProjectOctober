#!/usr/bin/env node

/**
 * Error Summarizer - Intelligent error log aggregation
 * Captures error patterns and provides concise summaries
 */

import { spawn } from 'child_process';
import { Transform } from 'stream';

class ErrorSummarizer {
  constructor() {
    this.errors = new Map();
    this.warnings = new Map();
    this.lastOutputTime = Date.now();
    this.quietPeriod = 3000; // 3 seconds quiet period before showing summary
    this.lineCount = 0;
  }

  categorizeLog(line) {
    // Skip noise
    if (this.isNoise(line)) return null;

    // Critical errors
    if (/error|exception|fatal|failed|cannot|unable/i.test(line)) {
      return 'error';
    }

    // Warnings
    if (/warn|deprecated|deprecation/i.test(line)) {
      return 'warning';
    }

    // Important info
    if (/listening|started|ready|compiled|built/i.test(line)) {
      return 'info';
    }

    return null;
  }

  isNoise(line) {
    const noisePatterns = [
      /^\s*$/,
      /watching for file changes/i,
      /webpack compiled/i,
      /vite.*hmr/i,
      /waiting for changes/i,
      /─{3,}/,
      /building for production/i,
      /\[vite\]/i,
      /turbo/i,
    ];

    return noisePatterns.some(pattern => pattern.test(line));
  }

  extractErrorKey(line) {
    // Try to extract meaningful error key
    const patterns = [
      /Error: (.+?)(?:\n|$)/,
      /(\w+Error):/,
      /(ENOENT|EADDRINUSE|ECONNREFUSED).*?:.*?(['"])(.*?)\2/,
      /Cannot find module ['"](.+?)['"]/,
      /Module not found: (.+?)(?:\n|$)/,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    // Fallback: use first 100 chars
    return line.substring(0, 100).trim();
  }

  addError(line) {
    const key = this.extractErrorKey(line);
    const existing = this.errors.get(key);

    if (existing) {
      existing.count++;
      existing.lastSeen = Date.now();
    } else {
      this.errors.set(key, {
        message: line.substring(0, 200),
        count: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      });
    }
  }

  addWarning(line) {
    const key = line.substring(0, 100).trim();
    const existing = this.warnings.get(key);

    if (existing) {
      existing.count++;
    } else {
      this.warnings.set(key, {
        message: line.substring(0, 200),
        count: 1,
      });
    }
  }

  printSummary() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ERROR SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (this.errors.size === 0 && this.warnings.size === 0) {
      console.log('✅ No errors or warnings detected\n');
      return;
    }

    // Print errors
    if (this.errors.size > 0) {
      console.log('🔴 ERRORS:\n');
      let errorNum = 1;
      for (const [key, data] of this.errors) {
        const count = data.count > 1 ? ` (×${data.count})` : '';
        console.log(`  ${errorNum}. ${data.message.trim()}${count}`);
        errorNum++;
      }
      console.log('');
    }

    // Print warnings (only top 3)
    if (this.warnings.size > 0) {
      console.log('⚠️  WARNINGS (top 3):\n');
      const topWarnings = Array.from(this.warnings.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      topWarnings.forEach((data, i) => {
        const count = data.count > 1 ? ` (×${data.count})` : '';
        console.log(`  ${i + 1}. ${data.message.trim()}${count}`);
      });
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  processLine(line) {
    this.lineCount++;
    const category = this.categorizeLog(line);

    switch (category) {
      case 'error':
        // Show errors immediately
        console.log('🔴', line);
        this.addError(line);
        this.scheduleOutput();
        break;
      case 'warning':
        // Show first occurrence of warnings
        const key = line.substring(0, 100).trim();
        if (!this.warnings.has(key)) {
          console.log('⚠️ ', line);
        }
        this.addWarning(line);
        break;
      case 'info':
        console.log('✅', line);
        break;
      default:
        // Skip noise, but show every 100th line to prove we're alive
        if (this.lineCount % 100 === 0) {
          process.stdout.write('.');
        }
        break;
    }
  }

  scheduleOutput() {
    if (this.outputTimer) {
      clearTimeout(this.outputTimer);
    }

    this.outputTimer = setTimeout(() => {
      this.printSummary();
      this.errors.clear();
      this.warnings.clear();
    }, this.quietPeriod);
  }
}

// Main
const summarizer = new ErrorSummarizer();

console.log('🚀 Starting development with smart error filtering...');
console.log('📝 Showing: errors (🔴), warnings (⚠️), and important info (✅)');
console.log('🔇 Hiding: HMR updates, build noise, watching messages');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const child = spawn('pnpm', ['turbo', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

// Create transform stream for line processing
const processStream = (stream) => {
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer

    lines.forEach(line => {
      if (line.trim()) {
        summarizer.processLine(line);
      }
    });
  });
};

processStream(child.stdout);
processStream(child.stderr);

child.on('exit', (code) => {
  console.log('\n');
  if (summarizer.errors.size > 0 || summarizer.warnings.size > 0) {
    summarizer.printSummary();
  }
  process.exit(code);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});
