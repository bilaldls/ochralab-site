// Captures de contrôle : scroll progressif pour déclencher les ScrollTrigger,
// puis capture pleine page ou d'une section.
// usage: node qa-shot.mjs <url> <out.png> <width> [--section=<selector>] [--reduced]
import puppeteer from "puppeteer-core";

const [url, out, widthArg, ...rest] = process.argv.slice(2);
const width = Number(widthArg) || 1440;
const section = rest.find((a) => a.startsWith("--section="))?.split("=")[1];
const reduced = rest.includes("--reduced");

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--hide-scrollbars", "--disable-gpu", "--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width, height: width < 600 ? 844 : 900, deviceScaleFactor: 1 });
if (reduced) {
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
}
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

// Passer le preloader
await new Promise((r) => setTimeout(r, 2600));

// Scroll progressif : déclenche chaque ScrollTrigger et charge les images lazy
// La hauteur grandit pendant que les images se chargent : on la relit à chaque pas.
await page.evaluate(async () => {
  const step = window.innerHeight * 0.6;
  let y = 0;
  for (let guard = 0; guard < 400; guard++) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 150));
    if (y >= document.documentElement.scrollHeight - window.innerHeight) break;
    y += step;
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 500));
});
// Attente bornée : une image lazy hors viewport peut ne jamais se résoudre.
await page.evaluate(() =>
  Promise.race([
    Promise.all(
      Array.from(document.images)
        .filter((i) => !i.complete)
        .map((i) => new Promise((r) => { i.onload = i.onerror = r; }))
    ),
    new Promise((r) => setTimeout(r, 8000)),
  ])
);
await new Promise((r) => setTimeout(r, 900));

if (section) {
  await page.evaluate((sel) => {
    document.querySelector(sel).scrollIntoView({ block: "start" });
  }, section);
  await new Promise((r) => setTimeout(r, 1600));
  const el = await page.$(section);
  await el.screenshot({ path: out });
} else {
  await page.screenshot({ path: out, fullPage: true });
}

console.log(out);
await browser.close();
