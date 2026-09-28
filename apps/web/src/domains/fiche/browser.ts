import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export type RenderedPage = { html: string; logistics: unknown };

export async function readRenderedPage(url: string): Promise<RenderedPage | null> {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    ignoreDefaultArgs: ["--enable-automation"],
    args: ["--disable-blink-features=AutomationControlled", "--no-first-run"],
  });
  try {
    await browser.defaultBrowserContext().setCookie({
      name: "sc_g_cfg_f",
      value: "sc_b_currency=EUR&sc_b_locale=en_US&sc_b_site=FR",
      domain: ".alibaba.com",
      path: "/",
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    );
    await page.setViewport({ width: 1360, height: 900 });
    const logistics = /(^|\.)alibaba\.com$/i.test(new URL(url).hostname)
      ? page
          .waitForResponse((response) => response.url().includes("/productDetail/logistics.do"), { timeout: 15000 })
          .then(async (response) => ({ body: response.request().postData() ?? null, payload: (await response.json()) as unknown }))
          .catch(() => null)
      : Promise.resolve(null);
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    if (!response || response.status() >= 400) return null;
    await page
      .waitForFunction(() => /\d\s*(pieces?|sets?)\b|Piece\+|Min\.?\s*Order:\s*\d/i.test(document.body?.innerText ?? ""), {
        timeout: 12000,
      })
      .catch(() => undefined);
    const first = await logistics;
    const valid = (first?.payload as { data?: { hasValidLogistics?: boolean } } | null)?.data?.hasValidLogistics === true;
    const shipping =
      first && !valid && first.body
        ? await page
            .evaluate(async (body) => {
              const response = await fetch("/event/app/productDetail/logistics.do", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body,
                credentials: "include",
              });
              return (await response.json()) as unknown;
            }, first.body)
            .catch(() => first.payload)
        : (first?.payload ?? null);
    return { html: await page.content(), logistics: shipping };
  } catch {
    return null;
  } finally {
    await browser.close();
  }
}
