// Screenshot script — drives system Chrome via puppeteer-core.
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3000";
const OUT = "shots";
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickExact(page, text) {
  await page.evaluate((t) => {
    const els = Array.from(document.querySelectorAll("span"));
    const el = els.find((e) => e.textContent.trim() === t);
    if (el) {
      const btn = el.closest("button") || el;
      btn.click();
    }
  }, text);
  await sleep(180);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--hide-scrollbars"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  // 1) Builder — populate a bowl
  await page.goto(`${BASE}/?table=5`, { waitUntil: "networkidle2" });
  await sleep(800);
  await clickExact(page, "Cơm gạo lứt");
  await clickExact(page, "Cá hồi");
  await clickExact(page, "Cá hồi"); // 2 scoops
  await clickExact(page, "Sốt cay béo");
  await clickExact(page, "Đậu Nhật");
  await clickExact(page, "Rong biển");
  await clickExact(page, "Vừng đen/trắng");
  await sleep(400);
  await page.screenshot({ path: `${OUT}/01-builder.png`, fullPage: true });
  console.log("✓ 01-builder");

  // 2) AI chat — open, send a real question, wait for reply
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find(
      (x) => x.getAttribute("aria-label") === "Tư vấn dinh dưỡng",
    );
    b && b.click();
  });
  await sleep(500);
  await page.type(
    'input[placeholder="Nhập câu hỏi…"]',
    "Mình muốn ăn khoảng 1000 calo, nhiều đạm ít béo. Gợi ý giúp mình nhé!",
  );
  await page.evaluate(() => {
    const f = document.querySelector("form");
    f && f.requestSubmit();
  });
  // wait for streamed assistant reply to grow
  await page.waitForFunction(
    () => {
      const spans = Array.from(document.querySelectorAll("span.bg-sand"));
      return spans.some((s) => s.textContent.trim().length > 40);
    },
    { timeout: 30000 },
  ).catch(() => {});
  await sleep(1200);
  await page.screenshot({ path: `${OUT}/02-ai-chat.png` }); // viewport (fixed overlay)
  console.log("✓ 02-ai-chat");

  // close chat
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find(
      (x) => x.getAttribute("aria-label") === "Đóng",
    );
    b && b.click();
  });
  await sleep(300);

  // 3) Checkout — shows summary + AI ReviewCard
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) =>
      x.textContent.includes("Xem đơn"),
    );
    b && b.click();
  });
  await sleep(2500); // let AI review load
  await page.screenshot({ path: `${OUT}/03-checkout.png`, fullPage: true });
  console.log("✓ 03-checkout");

  // 4) Admin login
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle2" });
  await sleep(600);
  await page.screenshot({ path: `${OUT}/04-admin-login.png` });
  console.log("✓ 04-admin-login");

  // 5) QR per-table
  await page.goto(`${BASE}/admin/qr`, { waitUntil: "networkidle2" });
  await sleep(1500);
  await page.screenshot({ path: `${OUT}/05-qr.png`, fullPage: true });
  console.log("✓ 05-qr");

  await browser.close();
  console.log("DONE");
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
