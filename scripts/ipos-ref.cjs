// Capture the REAL iPOS o2o order page to reference its start screen.
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL =
  "https://o2o.ipos.vn/order?pos_parent=BRAND-TMOA&pos_id=131267&table_name=BANA4&source=ipos";
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
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 45000 }).catch((e) =>
    console.log("nav warn:", e.message),
  );
  await sleep(3500); // let SPA hydrate

  await page.screenshot({ path: `${OUT}/ref-ipos-top.png` });
  console.log("✓ ref-ipos-top");

  await page.screenshot({ path: `${OUT}/ref-ipos-full.png`, fullPage: true });
  console.log("✓ ref-ipos-full");

  // Dump visible text to understand structure
  const txt = await page.evaluate(() => document.body.innerText.slice(0, 1500));
  fs.writeFileSync(`${OUT}/ref-ipos-text.txt`, txt);
  console.log("---TEXT---\n" + txt);

  await browser.close();
  console.log("DONE");
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
