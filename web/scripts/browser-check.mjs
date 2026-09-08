import assert from "node:assert/strict";
import { chromium } from "playwright";

// Run against the local API and web server after a real discovery batch.
const base = process.env.BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base);
  const cards = page.locator(".card");
  await cards.first().waitFor();
  assert.ok(await cards.count() > 0, "Run a real discovery batch first");
  await page.getByRole("button", { name: "Light theme" }).click();
  assert.equal(await page.locator("[data-theme]").getAttribute("data-theme"), "light");
  const liveSpaces = await (await page.request.get(`${base}/api/spaces`)).json();
  if (liveSpaces.length) {
    const loaded = page.waitForResponse(r => r.url().includes(`space_id=${liveSpaces[0].id}`));
    await page.getByLabel("Browse a problem space").selectOption(String(liveSpaces[0].id));
    assert.equal((await loaded).status(), 200);
    if (liveSpaces[0].child_ids?.length) {
      const childId = liveSpaces[0].child_ids[0];
      const child = liveSpaces.find(s => s.id === childId);
      const childLoaded = page.waitForResponse(r => r.url().includes(`space_id=${childId}`));
      await page.getByRole("navigation", { name: "Narrower spaces" }).getByRole("button", { name: child.name, exact: true }).click();
      await childLoaded;
      const parentLoaded = page.waitForResponse(r => r.url().includes(`space_id=${liveSpaces[0].id}`));
      await page.getByRole("navigation", { name: "Broader spaces" }).getByRole("button", { name: liveSpaces[0].name, exact: true }).click();
      await parentLoaded;
    }
    await cards.first().click();
    await page.locator("dialog blockquote").first().waitFor();
    assert.ok((await page.locator("dialog blockquote").first().innerText()).length > 0);
    await page.getByRole("button", { name: "Close" }).click();
    const reset = page.waitForResponse(r => r.url().includes("/api/projects?offset=0") && !r.url().includes("space_id"));
    await page.getByRole("button", { name: "Reset to all spaces" }).click();
    await reset;
    await cards.first().waitFor();
  }
  const card = cards.last();
  await card.scrollIntoViewIfNeeded();
  await card.focus();
  const scroll = await page.evaluate(() => window.scrollY);
  await card.press("Enter");
  await page.getByRole("link", { name: "View on GitHub" }).waitFor();
  assert.match(await page.locator("dialog").innerText(), /repository-created fallback/);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog").evaluate(el => el.open), false);
  assert.equal(await card.evaluate(el => el === document.activeElement), true);
  assert.ok(Math.abs(await page.evaluate(() => window.scrollY) - scroll) < 2);
  const more = page.getByRole("button", { name: "Load more projects" });
  if (await more.count()) {
    const before = await cards.count();
    await more.click();
    await page.waitForFunction(n => document.querySelectorAll(".card").length > n, before);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await cards.first().click();
  await page.getByRole("link", { name: "View on GitHub" }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.getByRole("button", { name: "Close" }).click();
  // Provider-independent classification UI fixture; no test records enter the catalog.
  const fixture = { id: 900001, name: "Field Journal", description: "Record field observations", publication_date: null };
  const term = { id: 900002, name: "Recording observations", definition: "Help people capture and retain observations.", total_count: 1, explanation: "The project records observations.", evidence: "Record field observations" };
  await page.route("**/api/spaces", route => route.fulfill({ json: [term] }));
  await page.route("**/api/projects?*", route => route.fulfill({ json: { items: [fixture], next_offset: null, source_status: null } }));
  await page.route("**/api/projects/900001", route => route.fulfill({ json: { ...fixture, sources: [], spaces: [term], domains: [], technologies: [] } }));
  await page.reload();
  await page.getByLabel("Browse a problem space").selectOption("900002");
  await page.getByText(term.definition, { exact: true }).waitFor();
  await page.getByRole("button", { name: "View Field Journal" }).click();
  await page.locator("dialog blockquote").waitFor();
  assert.equal(await page.locator("dialog blockquote").innerText(), term.evidence);
  await page.getByRole("button", { name: "Browse Recording observations" }).click();
  assert.equal(await page.locator("dialog").evaluate(el => el.open), false);
  await page.getByRole("button", { name: "Reset to all spaces" }).click();
  assert.equal(await page.getByLabel("Browse a problem space").inputValue(), "");
  await page.route("**/api/projects?*", route => route.fulfill({ status: 503, body: "unavailable" }));
  await page.reload();
  await page.locator("main [role=alert]").waitFor();
  await page.route("**/api/projects?*", route => route.fulfill({ json: { items: [], next_offset: null, source_status: null } }));
  await page.getByRole("button", { name: "Retry" }).click();
  await page.getByText("No recent projects yet.", { exact: false }).waitFor();
  assert.deepEqual(errors, []);
  console.log("Browser checks passed: real feed/detail, keyboard/scroll restoration, pagination, theme, mobile, classified-space fixture, error retry and empty state.");
} finally {
  await browser.close();
}
