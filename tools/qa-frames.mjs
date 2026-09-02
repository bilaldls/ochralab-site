// Captures d'écran à des positions de scroll données (sections épinglées).
// usage: node qa-frames.mjs <url> <dossier> <prefixe> <largeur> <y1,y2,y3...>
import puppeteer from "puppeteer-core";

const [url, outDir, prefix, widthArg, ysArg] = process.argv.slice(2);
const width = Number(widthArg) || 1440;
const ys = ysArg.split(",").map(Number);

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--hide-scrollbars", "--disable-gpu", "--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width, height: width < 600 ? 844 : 900 });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise((r) => setTimeout(r, 4000));

for (const y of ys) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await new Promise((r) => setTimeout(r, 1300));
  const file = `${outDir}/${prefix}-${y}.png`;
  await page.screenshot({ path: file });
  console.log(file);
}
await browser.close();
