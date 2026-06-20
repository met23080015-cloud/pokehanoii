const puppeteer = require("puppeteer-core");
const fs = require("fs");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// đọc mật khẩu admin từ .env.local (không in ra)
const env = fs.readFileSync(".env.local", "utf8");
const pw = (env.match(/^\s*ADMIN_PASSWORD\s*=\s*(.*)$/m) || [])[1]?.trim() || "";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--hide-scrollbars"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900, deviceScaleFactor: 2 });

  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle2" });
  await sleep(500);
  await page.type('input[type="password"]', pw);
  await page.evaluate(() => document.querySelector("form")?.requestSubmit());
  await sleep(3000); // chờ login + realtime load đơn

  await page.screenshot({ path: "shots/06-admin-dashboard.png", fullPage: true });
  console.log("✓ 06-admin-dashboard");

  await browser.close();
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
