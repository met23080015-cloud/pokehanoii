// Screenshot the new welcome/start screen — drives system Chrome via puppeteer-core.
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3000";
const OUT = "shots";
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--hide-scrollbars"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  // 1) With table (scanned QR)
  await page.goto(`${BASE}/?table=4`, { waitUntil: "networkidle2" });
  await sleep(900);
  await page.screenshot({ path: `${OUT}/00-welcome-table.png`, fullPage: true });
  console.log("✓ 00-welcome-table");

  // 2) No table (opened without QR)
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await sleep(700);
  await page.screenshot({ path: `${OUT}/00-welcome-notable.png`, fullPage: true });
  console.log("✓ 00-welcome-notable");

  await browser.close();
  console.log("DONE");
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
