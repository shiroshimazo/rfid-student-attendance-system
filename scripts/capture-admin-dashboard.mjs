// Local screenshot helper for the Admin dashboard. Dev-only: it drives the
// running `next dev` server with Playwright and writes PNGs to .screenshots/.
//
// Credentials come from the environment so they are not committed:
//   SHOT_EMAIL=... SHOT_PASSWORD=... node scripts/capture-admin-dashboard.mjs
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.SHOT_BASE_URL ?? "http://localhost:3000";
const email = process.env.SHOT_EMAIL;
const password = process.env.SHOT_PASSWORD;
const outDir = ".screenshots";

if (!email || !password) {
  console.error("Set SHOT_EMAIL and SHOT_PASSWORD.");
  process.exit(1);
}

const viewports = [
  { name: "desktop", width: 1600, height: 1000 },
  { name: "laptop", width: 1280, height: 860 },
  { name: "tablet", width: 834, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();

try {
  const context = await browser.newContext({
    viewport: viewports[0],
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // The challenge only renders once the action has flagged captchaRequired, so
  // a first attempt has no widget at all. When it is present, dev runs
  // Cloudflare's always-pass test keys: wait for the token the form submits
  // rather than for a fixed delay.
  if (await page.locator('input[name="captchaToken"]').count()) {
    await page.waitForFunction(
      () =>
        (document.querySelector('input[name="captchaToken"]')?.value ?? "")
          .length > 0,
      { timeout: 30_000 },
    );
  }

  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 60_000,
    }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
  // Recharts sizes off the container, so let the charts settle before capture.
  await page.waitForSelector(".recharts-surface");
  await page.waitForTimeout(1200);

  for (const viewport of viewports) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.waitForTimeout(900);

    const path = `${outDir}/admin-dashboard-${viewport.name}.png`;
    await page.screenshot({ path, fullPage: true });
    console.log(`wrote ${path}`);
  }
} finally {
  await browser.close();
}
