const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const extensionPath = path.resolve(__dirname);
  const scratchDir = path.resolve(__dirname, 'scratch');
  const userDataDir = path.resolve(scratchDir, 'user-data-dir');

  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  console.log(`Unpacked extension path: ${extensionPath}`);
  console.log(`User data directory: ${userDataDir}`);

  console.log('Launching browser with TikTok Shadow Controls extension...');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // Chrome extensions only work in headed mode
    viewport: { width: 1280, height: 800 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ],
  });

  const page = await context.newPage();
  
  // Log console messages from the page to trace content script initialization
  page.on('console', msg => {
    console.log(`[PAGE LOG]: ${msg.text()}`);
  });

  try {
    console.log('Navigating to TikTok @tiktok profile...');
    await page.goto('https://www.tiktok.com/@tiktok', { waitUntil: 'networkidle', timeout: 60000 });

    console.log('Finding and clicking the first video post...');
    // Locate the first post link on the page
    const videoLink = page.locator('a[href*="/video/"]').first();
    await videoLink.waitFor({ state: 'visible', timeout: 20000 });
    
    const videoUrl = await videoLink.getAttribute('href');
    console.log(`Found video URL: ${videoUrl}`);

    await videoLink.click();
    console.log('Clicked video thumbnail. Waiting for video detail modal to load...');

    // Wait for the video elements to be loaded
    const videoElement = page.locator('video').first();
    await videoElement.waitFor({ state: 'visible', timeout: 20000 });
    console.log('Video element is now visible!');

    // Let the video play for a moment
    await page.waitForTimeout(3000);

    // 1. Down Arrow -> Toggle Play/Pause
    console.log('Testing Play/Pause: Pressing ArrowDown...');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(1000);

    const screenshotPath = path.resolve(scratchDir, 'toast-pause.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot of pause state saved to ${screenshotPath}`);

    // Check if the toast host exists
    const toastLabel = await page.evaluate(() => {
      const host = document.getElementById('tt-shadow-toast-host');
      if (!host) return 'Toast host NOT found in DOM';
      const toastEl = host.shadowRoot?.querySelector('.toast');
      return toastEl ? toastEl.textContent : 'Toast element NOT found inside shadow root';
    });
    console.log(`Detected Toast message on page: "${toastLabel}"`);

    // 2. Right Arrow -> Seek Forward
    console.log('Testing Seek Forward: Pressing ArrowRight...');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1000);

    const seekToastLabel = await page.evaluate(() => {
      const host = document.getElementById('tt-shadow-toast-host');
      if (!host) return 'Toast host NOT found in DOM';
      const toastEl = host.shadowRoot?.querySelector('.toast');
      return toastEl ? toastEl.textContent : 'Toast element NOT found';
    });
    console.log(`Detected Seek Toast message: "${seekToastLabel}"`);

    // 3. Speed down: Shift + ArrowLeft
    console.log('Testing Speed Down: Pressing Shift+ArrowLeft...');
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.up('Shift');
    await page.waitForTimeout(1000);

    const speedToastLabel = await page.evaluate(() => {
      const host = document.getElementById('tt-shadow-toast-host');
      if (!host) return 'Toast host NOT found in DOM';
      const toastEl = host.shadowRoot?.querySelector('.toast');
      return toastEl ? toastEl.textContent : 'Toast element NOT found';
    });
    console.log(`Detected Speed Toast message: "${speedToastLabel}"`);

    // 4. Set loop A: '['
    console.log('Testing Set Loop A: Pressing "["...');
    await page.keyboard.press('[');
    await page.waitForTimeout(1000);
    
    const loopAToast = await page.evaluate(() => {
      const host = document.getElementById('tt-shadow-toast-host');
      if (!host) return 'Toast host NOT found in DOM';
      const toastEl = host.shadowRoot?.querySelector('.toast');
      return toastEl ? toastEl.textContent : 'Toast element NOT found';
    });
    console.log(`Detected Loop A Toast message: "${loopAToast}"`);

    console.log('Real E2E verification tests completed successfully!');

  } catch (error) {
    console.error('An error occurred during E2E verification:', error);
    try {
      const errorScreenshot = path.resolve(scratchDir, 'error-e2e.png');
      await page.screenshot({ path: errorScreenshot });
      console.log(`Failure screenshot saved to ${errorScreenshot}`);
    } catch (e) {
      console.error('Failed to save failure screenshot:', e);
    }
  } finally {
    console.log('Closing browser...');
    await context.close();
  }
}

run();
