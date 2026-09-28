import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export async function readSearchPages(urls: string[]): Promise<(string | null)[]> {
  if (urls.length === 0) return [];
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    ignoreDefaultArgs: ["--enable-automation"],
    args: ["--disable-blink-features=AutomationControlled", "--no-first-run"],
  });
  try {
    const pages = await Promise.all(urls.map((url) => readOne(browser, url)));
    return pages;
  } finally {
    await browser.close();
  }
}

async function readOne(browser: Awaited<ReturnType<typeof puppeteer.launch>>, url: string): Promise<string | null> {
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    );
    await page.setViewport({ width: 1360, height: 900 });
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    if (!response || response.status() >= 400) return null;
    await page.waitForSelector("li[itemcode]", { timeout: 15000 });
    return await page.content();
  } catch {
    return null;
  } finally {
    await page.close();
  }
}
