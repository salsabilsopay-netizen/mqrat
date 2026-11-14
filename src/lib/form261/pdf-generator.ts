import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import { Form261Data } from './mapper';
import { renderForm261Html } from './template';

function findLocalBrowserExecutable(): string | null {
  const envPath = process.env.CHROME_EXECUTABLE_PATH?.trim();
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  const candidatesByPlatform: Record<string, string[]> = {
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ],
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/microsoft-edge',
    ],
  };

  const candidates = candidatesByPlatform[process.platform] || candidatesByPlatform.linux;
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function resolveBrowserLaunchConfig(): Promise<{
  executablePath: string;
  args: string[];
}> {
  const localExec = findLocalBrowserExecutable();
  if (localExec) {
    return {
      executablePath: localExec,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    };
  }

  if (process.platform === 'linux') {
    const chromiumModule = await import('@sparticuz/chromium');
    const chromium = chromiumModule.default;
    chromium.setGraphicsMode = false;
    const executablePath = await chromium.executablePath();
    return {
      executablePath,
      args: [...chromium.args, '--disable-dev-shm-usage'],
    };
  }

  throw new Error('لم يتم العثور على محرك Chromium لتوليد ملف PDF');
}

/**
 * Generates an A4 PDF buffer for Ministry Form (261) from mapped staff application data.
 * All fonts and logos are self-contained data URIs; external network requests are strictly blocked.
 */
export async function generateForm261PdfBuffer(data: Form261Data): Promise<Buffer> {
  const html = renderForm261Html(data);
  const { executablePath, args } = await resolveBrowserLaunchConfig();

  const browser = await puppeteer.launch({
    executablePath,
    args,
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // Strict defense-in-depth: block all non-data network requests
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (url === 'about:blank' || url.startsWith('data:')) {
        req.continue();
      } else {
        req.abort();
      }
    });

    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.emulateMediaType('print');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const pdfUint8 = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    return Buffer.from(pdfUint8);
  } finally {
    await browser.close();
  }
}
