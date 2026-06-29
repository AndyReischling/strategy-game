import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:5173";
const out = "screenshots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.error("PAGE ERROR:", e.message));
page.on("console", (m) => { if (m.type() === "error") console.error("CONSOLE:", m.text()); });

const advance = () => page.getByRole("button", { name: /Go to|Begin next|See final/ }).click();

await page.goto(BASE, { waitUntil: "networkidle" });
await sleep(700);
await page.screenshot({ path: `${out}/01-landing.png` });
console.log("✓ landing");

await page.getByRole("button", { name: "Start practice game" }).click();
await sleep(400);
await page.getByRole("button", { name: /France/ }).first().click();
await sleep(250);
await page.getByRole("button", { name: "+3 bot" }).click();
await sleep(300);
await page.screenshot({ path: `${out}/02-lobby.png` });
console.log("✓ lobby");

await page.getByRole("button", { name: /Start game/ }).click();
await sleep(700);
await page.screenshot({ path: `${out}/03-dashboard.png` });
console.log("✓ dashboard (market)");

// advance to event
await advance();
await sleep(600);
await page.screenshot({ path: `${out}/04-event.png` });
console.log("✓ world event");

// advance to build, buy a few layers
await advance();
await sleep(400);
// buy first buildable option in current layer
for (const layer of ["compute", "weights", "model", "hosting"]) {
  try {
    await page.getByRole("button", { name: new RegExp(`^\\d · `) }); // noop
  } catch {}
}
// click some Build buttons that are enabled
const buildBtns = page.getByRole("button", { name: /^Build/ });
const n = await buildBtns.count();
for (let i = 0; i < Math.min(n, 2); i++) {
  try { await buildBtns.nth(i).click({ timeout: 1000 }); await sleep(150); } catch {}
}
await sleep(300);
await page.screenshot({ path: `${out}/05-build.png` });
console.log("✓ build (stack + chooser)");

// select a different stack layer to show chooser switching
try { await page.getByRole("button", { name: /Weights/ }).first().click({ timeout: 1000 }); } catch {}
await sleep(300);
await page.screenshot({ path: `${out}/06-build-weights.png` });

// advance to trade
await advance();
await sleep(500);
await page.screenshot({ path: `${out}/07-trade.png` });
console.log("✓ trade");

// advance to off-switch
await advance();
await sleep(900);
await page.screenshot({ path: `${out}/08-offswitch.png` });
console.log("✓ off-switch");

// advance to score
await advance();
await sleep(500);
await page.screenshot({ path: `${out}/09-score.png` });
console.log("✓ score");

// open world map
await page.getByRole("button", { name: /World/ }).click();
await sleep(800);
await page.screenshot({ path: `${out}/10-map.png` });
console.log("✓ world map overlay");

await browser.close();
console.log("done");
