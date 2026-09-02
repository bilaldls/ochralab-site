// Contrôle fonctionnel : animations, images, accessibilité, débordement.
// usage: node qa-check.mjs <url> <width>
import puppeteer from "puppeteer-core";

const [url, widthArg] = process.argv.slice(2);
const width = Number(widthArg) || 1440;

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--hide-scrollbars", "--disable-gpu", "--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width, height: width < 600 ? 844 : 900 });

const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push("PAGEERROR " + e.message));
const failed = [];
page.on("requestfailed", (r) => failed.push(r.url()));

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2800));

const beforeScroll = await page.evaluate(() => ({
  preloaderGone: !document.querySelector(".preloader"),
  bodyOverflow: document.body.style.overflow,
  heroLinesRevealed: [...document.querySelectorAll("[data-onload] .line-inner")].every(
    (e) => {
      const t = getComputedStyle(e).transform;
      return t === "none" || Math.abs(new DOMMatrix(t).m42) < 2;
    }
  ),
}));

// Parcours complet
await page.evaluate(async () => {
  const step = window.innerHeight * 0.55;
  let y = 0;
  for (let g = 0; g < 400; g++) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 140));
    if (y >= document.documentElement.scrollHeight - window.innerHeight) break;
    y += step;
  }
});
await new Promise((r) => setTimeout(r, 1200));

const result = await page.evaluate(() => {
  const figs = [...document.querySelectorAll("figure[data-reveal]")];
  const stillHidden = figs.filter((f) => {
    const c = getComputedStyle(f).clipPath;
    return c.includes("100%");
  }).length;
  const imgs = [...document.images];
  const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).length;
  const notLoaded = imgs.filter((i) => !i.complete).length;
  const noAlt = imgs.filter((i) => !i.alt || !i.alt.trim()).length;

  // Cibles tactiles
  const small = [...document.querySelectorAll("a, button")].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24);
  }).length;

  return {
    figures: figs.length,
    figuresStillHidden: stillHidden,
    images: imgs.length,
    imagesBroken: broken,
    imagesNotLoaded: notLoaded,
    imagesWithoutAlt: noAlt,
    horizontalOverflow:
      document.documentElement.scrollWidth > window.innerWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    pinSpacers: document.querySelectorAll(".pin-spacer").length,
    tinyTargets: small,
    docHeight: document.documentElement.scrollHeight,
    h1Count: document.querySelectorAll("h1").length,
    langAttr: document.documentElement.lang,
  };
});

console.log(JSON.stringify({ url, width, ...beforeScroll, ...result, consoleErrors, failedRequests: failed.slice(0, 5) }, null, 2));
await browser.close();
