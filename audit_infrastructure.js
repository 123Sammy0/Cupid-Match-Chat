const { chromium } = require('playwright');
const { execSync } = require('child_process');
const http = require('http');

class AuditRunner {
  constructor() {
    this.browser = null;
    this.contexts = {};
  }

  async cleanupOrphans() {
    console.log('[+] Cleaning up orphaned Chromium/Node processes...');
    try {
      // Windows specific cleanup
      execSync('taskkill /F /IM chrome.exe /T 2>nul');
      execSync('taskkill /F /IM chromium.exe /T 2>nul');
    } catch (e) {
      // Ignore errors if no processes found
    }
  }

  async verifyDevServer() {
    return new Promise((resolve, reject) => {
      console.log('[+] Verifying localhost:2012...');
      const req = http.get('http://localhost:2012', (res) => {
        if (res.statusCode === 200 || res.statusCode === 307 || res.statusCode === 308) {
          console.log('[+] Dev server is running.');
          resolve();
        } else {
          reject(new Error(`Dev server returned status ${res.statusCode}`));
        }
      });
      req.on('error', (e) => reject(new Error('Dev server not reachable: ' + e.message)));
    });
  }

  async init() {
    await this.cleanupOrphans();
    await this.verifyDevServer();

    console.log('[+] Launching unified headed Chromium process...');
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 50,
      args: ['--window-size=1440,900']
    });
  }

  async createContext(name) {
    if (this.contexts[name]) return this.contexts[name];
    console.log(`[+] Creating isolated browser context: ${name}`);
    const context = await this.browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    this.contexts[name] = context;
    return context;
  }

  async closeContext(name) {
    if (this.contexts[name]) {
      console.log(`[+] Closing context: ${name}`);
      await this.contexts[name].close();
      delete this.contexts[name];
    }
  }

  async teardown() {
    console.log('[+] Tearing down Playwright...');
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = AuditRunner;
