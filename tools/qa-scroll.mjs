// Simule un vrai scroll à la molette et vérifie que chaque figure se révèle,
// puis mesure le temps entre l'entrée dans le viewport et la révélation.
// usage: node qa-scroll.mjs <url> <largeur> [--fast]
import puppeteer from "puppeteer-core";

const [url, widthArg, ...rest] = process.argv.slice(2);
const width = Number(widthArg) || 1440;
const fast = rest.includes("--fast");

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--hide-scrollbars", "--disable-gpu", "--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width, height: width < 600 ? 844 : 900 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2600));

// Molette réelle : déclenche les mêmes chemins que l'utilisateur.
const deltaY = fast ? 900 : 320;
const pause = fast ? 40 : 110;
for (let i = 0; i < 260; i++) {
  await page.mouse.wheel({ deltaY });
  await new Promise((r) => setTimeout(r, pause));
  const atEnd = await page.evaluate(
    () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4
  );
  if (atEnd) break;
}
await new Promise((r) => setTimeout(r, 1400));

const res = await page.evaluate(() => {
  const figs = [...document.querySelectorAll("figure[data-reveal]")];
  const hidden = figs
    .map((f, i) => ({ i, clip: getComputedStyle(f).clipPath, alt: f.querySelector("img")?.alt }))
    .filter((o) => o.clip.includes("100%") || o.clip.includes("18%"));
  const lines = [...document.querySelectorAll("[data-lines] .line-inner")];
  const linesHidden = lines.filter((e) => {
    const t = getComputedStyle(e).transform;
    return t !== "none" && Math.abs(new DOMMatrix(t).m42) > 2;
  }).length;
  const fades = [...document.querySelectorAll("[data-fade]")];
  const fadesHidden = fades.filter((e) => +getComputedStyle(e).opacity < 0.9).length;
  return {
    figures: figs.length,
    figuresStillHidden: hidden.length,
    hiddenDetail: hidden.slice(0, 4),
    lines: lines.length,
    linesStillHidden: linesHidden,
    fades: fades.length,
    fadesStillHidden: fadesHidden,
    reachedBottom: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4,
  };
});

console.log(JSON.stringify({ url, width, mode: fast ? "scroll rapide" : "scroll normal", ...res, errors }, null, 2));
await browser.close();
