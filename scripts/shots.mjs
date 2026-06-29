import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:5173";
const out = "screenshots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.error("PAGE ERROR:", e.message));
page.on("console", (m) => { if (m.type() === "error") console.error("CONSOLE:", m.text()); });

await page.goto(BASE, { waitUntil: "networkidle" });
await sleep(800);
await page.screenshot({ path: `${out}/01-landing.png` });
console.log("✓ landing");

// Practice flow
await page.getByRole("button", { name: "Start practice game" }).click();
await sleep(500);
// pick a region (France) first, then fill the table with bots
await page.getByRole("button", { name: /France/ }).first().click();
await sleep(300);
await page.getByRole("button", { name: "+3 bot" }).click();
await sleep(400);
await page.screenshot({ path: `${out}/02-lobby.png` });
console.log("✓ lobby");

// start game
await page.getByRole("button", { name: /Start game/ }).click();
await sleep(900);
await page.screenshot({ path: `${out}/03-game-market.png` });
console.log("✓ game market-open");

// advance to world-event
await page.getByRole("button", { name: /Next phase/ }).click();
await sleep(700);
await page.screenshot({ path: `${out}/04-event.png` });
console.log("✓ world event");

// advance to build, open build panel
await page.getByRole("button", { name: /Next phase/ }).click();
await sleep(500);
await page.getByRole("button", { name: /Build/ }).first().click();
await sleep(500);
await page.screenshot({ path: `${out}/05-build.png` });
console.log("✓ build panel");

// buy a couple layers
try { await page.getByRole("button", { name: /^Build/ }).nth(1).click({ timeout: 1500 }); } catch {}
await sleep(300);
// switch to compute tab
try { await page.getByRole("button", { name: /Compute/ }).first().click({ timeout: 1500 }); } catch {}
await sleep(300);
await page.screenshot({ path: `${out}/06-build2.png` });

// close, advance to trade
await page.getByRole("button", { name: /Close/ }).first().click();
await sleep(200);
await page.getByRole("button", { name: /Next phase/ }).click();
await sleep(500);
await page.getByRole("button", { name: /Deals/ }).first().click();
await sleep(400);
await page.screenshot({ path: `${out}/07-trade.png` });
console.log("✓ trade panel");

await page.getByRole("button", { name: /Close/ }).first().click();
await sleep(200);
// off-switch
await page.getByRole("button", { name: /Next phase/ }).click();
await sleep(900);
await page.screenshot({ path: `${out}/08-offswitch.png` });
console.log("✓ off-switch");

// score
await page.getByRole("button", { name: /Next phase/ }).click();
await sleep(400);
await page.getByRole("button", { name: /Score/ }).first().click();
await sleep(400);
await page.screenshot({ path: `${out}/09-score.png` });
console.log("✓ score panel");

await browser.close();
console.log("done");
