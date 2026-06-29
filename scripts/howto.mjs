import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:5173";
const out = "screenshots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 860 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.error("PAGE ERROR:", e.message));
await page.goto(BASE, { waitUntil: "networkidle" });
await sleep(900); // intro auto-opens
await page.screenshot({ path: `${out}/htp-1.png` });
await page.getByRole("button", { name: /Next/ }).click(); await sleep(350);
await page.screenshot({ path: `${out}/htp-2.png` });
await page.getByRole("button", { name: /Next/ }).click(); await sleep(350);
await page.screenshot({ path: `${out}/htp-3.png` });
console.log("done");
await browser.close();
