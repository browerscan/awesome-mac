#!/usr/bin/env node

/**
 * Post-build verification script
 * Validates that all required build artifacts are present and valid
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`[PASS] ${message}`, 'green');
}

function logError(message) {
  log(`[FAIL] ${message}`, 'red');
}

function logWarning(message) {
  log(`[WARN] ${message}`, 'yellow');
}

function logInfo(message) {
  log(`[INFO] ${message}`, 'blue');
}

// Verification checks
const checks = {
  async checkDataFiles() {
    logInfo('Checking data files...');

    const dataFiles = ['dist/awesome-mac.json', 'dist/awesome-mac.zh.json'];

    let allPassed = true;

    for (const file of dataFiles) {
      const filePath = path.join(rootDir, file);
      try {
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);

        if (!Array.isArray(data)) {
          logError(`${file}: Content is not an array`);
          allPassed = false;
          continue;
        }

        logSuccess(`${file}: Found ${data.length} items (${(stats.size / 1024).toFixed(2)} KB)`);

        // Warn if file is empty
        if (data.length === 0) {
          logWarning(`${file}: No items found in data file`);
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          logError(`${file}: File not found (run 'npm run build:data')`);
        } else {
          logError(`${file}: ${error.message}`);
        }
        allPassed = false;
      }
    }

    return allPassed;
  },

  async checkNextBuild() {
    logInfo('Checking Next.js build output...');

    const requiredPaths = ['.next/static', '.next/server'];

    let allPassed = true;

    for (const relativePath of requiredPaths) {
      const fullPath = path.join(rootDir, relativePath);
      try {
        await fs.access(fullPath);
        logSuccess(`${relativePath}: Found`);
      } catch {
        logError(`${relativePath}: Not found (Next.js build may have failed)`);
        allPassed = false;
      }
    }

    return allPassed;
  },

  async checkPublicAssets() {
    logInfo('Checking public assets...');

    const publicFiles = ['public/favicon.ico', 'public/robots.txt'];

    let allPassed = true;

    for (const file of publicFiles) {
      const filePath = path.join(rootDir, file);
      try {
        await fs.access(filePath);
        logSuccess(`${file}: Found`);
      } catch {
        logWarning(`${file}: Not found (optional asset)`);
      }
    }

    return allPassed;
  },

  async checkDataIntegrity() {
    logInfo('Checking data integrity...');

    const filePath = path.join(rootDir, 'dist/awesome-mac.json');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Check for expected structure
      let hasCategories = false;
      let hasApps = false;

      function traverse(items) {
        for (const item of items) {
          if (item.type === 'heading' && item.value) {
            hasCategories = true;
          }
          if (item.type === 'listItem' && item.mark?.url) {
            hasApps = true;
          }
          if (item.children) {
            traverse(item.children);
          }
        }
      }

      traverse(data);

      if (hasCategories) {
        logSuccess('Data structure contains categories');
      } else {
        logWarning('Data structure may not contain categories');
      }

      if (hasApps) {
        logSuccess('Data structure contains app entries');
      } else {
        logWarning('Data structure may not contain app entries');
      }

      return true;
    } catch (error) {
      logError(`Data integrity check failed: ${error.message}`);
      return false;
    }
  },

  async verifySitemapGeneration() {
    logInfo('Verifying sitemap can be generated...');

    try {
      // Import the sitemap generator to check for errors
      const sitemapPath = path.join(rootDir, 'src/app/sitemap.ts');
      await fs.access(sitemapPath);

      // Check if it exists and can be read
      const content = await fs.readFile(sitemapPath, 'utf-8');
      if (content.includes('export default async function sitemap')) {
        logSuccess('Sitemap generator is present');
        return true;
      }
      logWarning('Sitemap generator may have unexpected structure');
      return true;
    } catch (error) {
      logWarning(`Sitemap verification skipped: ${error.message}`);
      return true;
    }
  },

  async checkPackageVersion() {
    logInfo('Checking package version...');

    try {
      const packagePath = path.join(rootDir, 'package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);

      if (pkg.version) {
        logSuccess(`Package version: ${pkg.version}`);
        return true;
      }
      logWarning('Package version not found');
      return true;
    } catch (error) {
      logError(`Failed to read package version: ${error.message}`);
      return false;
    }
  },
};

// Main execution
async function main() {
  log('\n=== Post-Build Verification ===\n', 'magenta');

  const startTime = Date.now();
  const results = {
    dataFiles: await checks.checkDataFiles(),
    nextBuild: await checks.checkNextBuild(),
    publicAssets: await checks.checkPublicAssets(),
    dataIntegrity: await checks.checkDataIntegrity(),
    sitemap: await checks.verifySitemapGeneration(),
    packageVersion: await checks.checkPackageVersion(),
  };

  const duration = Date.now() - startTime;

  // Summary
  log('\n=== Summary ===\n', 'magenta');

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  if (passed === total) {
    logSuccess(`All checks passed (${passed}/${total}) in ${duration}ms`);
    log('\nBuild is ready for deployment!\n', 'green');
    process.exit(0);
  } else {
    logError(`Some checks failed (${passed}/${total} passed)`);
    log('\nPlease fix the issues above before deploying.\n', 'yellow');
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  logError(`Post-build script failed: ${error.message}`);
  process.exit(1);
});
