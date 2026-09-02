// Générateur du site « Galerie » — minimalisme exagéré.
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { loadManifest, srcset, largest, altFor, nextOf, pad } from "./lib.mjs";

const SITE = path.resolve(import.meta.dirname, "..");
const manifest = await loadManifest();
const projects = manifest.projects;

const DESC =
  "Ochralab — cabinet d'architecture et de design d'intérieur à Marrakech, dirigé par Mehdi Tolaïmate. Hôtels, riads et villas : douze projets choisis.";

// Image du héros de la page d'accueil : façade MBK (composition minimale).
const heroProject = projects.find((p) => p.slug === "mbk");
const heroImg = heroProject.images.find((i) => i.base === "vmbk-facade-principale");

const lines = (text) =>
  text
    .split("\n")
    .map(
      (l) =>
        `<span class="line"><span class="line-inner">${l}</span></span>`
    )
    .join("");

function figure({ img, imgPrefix, sizes, alt, parallax = true, eager = false, cssRatio = true }) {
  const style = [
    cssRatio ? `--ratio: ${img.w} / ${img.h};` : "",
    `background-image: url('${img.lqip}');`,
  ]
    .filter(Boolean)
    .join(" ");
  return `<figure data-reveal ${parallax ? "data-parallax" : ""} style="${style}">
  <img src="${largest(imgPrefix, img)}" srcset="${srcset(imgPrefix, img)}" sizes="${sizes}" alt="${alt}" width="${img.w}" height="${img.h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>
</figure>`;
}

function head({ title, desc, root, preload }) {
  return `<!DOCTYPE html>
<html lang="fr" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<link rel="icon" type="image/svg+xml" href="${root}favicon.svg">
<link rel="preload" href="${root}assets/fonts/archivo-var.woff2" as="font" type="font/woff2" crossorigin>
${preload ?? ""}
<link rel="stylesheet" href="${root}assets/styles.css">
<script>document.documentElement.classList.remove('no-js');document.documentElement.classList.add('js');</script>
</head>
<body>
<a class="skip-link" href="#main">Aller au contenu</a>
<div class="cursor" aria-hidden="true"></div>`;
}

function header(root, current) {
  const link = (href, label, key) =>
    `<a href="${href}" ${current === key ? 'aria-current="page"' : ""}>${label}</a>`;
  return `
<header class="site-header">
  <a class="wordmark" href="${root}index.html">Ochralab</a>
  <nav class="site-nav" aria-label="Navigation principale">
    ${link(root + "index.html#projets", "Projets", "projets")}
    ${link(root + "index.html#studio", "Studio", "studio")}
    ${link(root + "index.html#contact", "Contact", "contact")}
  </nav>
  <button class="menu-btn" aria-expanded="false" aria-label="Ouvrir le menu">
    <svg width="26" height="16" viewBox="0 0 26 16" fill="none" aria-hidden="true"><path d="M0 1h26M0 8h26M0 15h26" stroke="currentColor" stroke-width="1.6"/></svg>
  </button>
</header>
<div class="menu-overlay">
  <button class="menu-close" aria-label="Fermer le menu">
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M1 1l20 20M21 1L1 21" stroke="currentColor" stroke-width="1.6"/></svg>
  </button>
  <p class="label">Ochralab — Marrakech</p>
  <a href="${root}index.html#projets">Projets</a>
  <a href="${root}index.html#studio">Studio</a>
  <a href="${root}index.html#contact">Contact</a>
</div>`;
}

const footer = (root) => `
<section class="contact" id="contact">
  <p class="label">Un projet, une question&nbsp;?</p>
  <a class="contact__mail" href="mailto:ochralab@gmail.com">ochralab@gmail.com</a>
  <div class="footer-row">
    <span>© Ochralab — Marrakech</span>
    <span>Architecture &amp; design d'intérieur</span>
    <a href="#top">Haut de page</a>
  </div>
</section>
<script src="${root}assets/vendor/gsap.min.js" defer></script>
<script src="${root}assets/vendor/ScrollTrigger.min.js" defer></script>
<script src="${root}assets/main.js" defer></script>
</body>
</html>`;

/* ---------------- Page d'accueil ---------------- */

const worksHtml = projects
  .map((p, i) => {
    const cover = p.images.find((im) => im.base === p.cover);
    const sizes =
      i % 6 === 0
        ? "100vw"
        : "(max-width: 899px) 100vw, 62vw";
    return `<a class="work" href="projets/${p.slug}.html" data-cursor-view>
${figure({
      img: cover,
      imgPrefix: `images/projects/${p.slug}`,
      sizes,
      alt: altFor(p, cover, 0, p.images.length),
    })}
  <span class="work__caption">
    <span class="work__num">${pad(i + 1)}</span>
    <span class="work__name">${p.name}</span>
    <span class="label work__cat">${p.category}</span>
  </span>
</a>`;
  })
  .join("\n");

const index = `${head({
  title: "Ochralab — Architecture & design d'intérieur, Marrakech",
  desc: DESC,
  root: "",
  preload: `<link rel="preload" as="image" imagesrcset="${srcset(
    `images/projects/${heroProject.slug}`,
    heroImg
  )}" imagesizes="100vw" fetchpriority="high">`,
})}
<div class="preloader" aria-hidden="true">
  <div class="preloader__word">${"OCHRALAB".split("")
    .map((c) => `<span>${c}</span>`)
    .join("")}</div>
</div>
${header("", "")}
<main id="main">
<section class="hero" id="top">
  <div class="hero__meta">
    <span class="label">Cabinet d'architecture</span>
    <span class="label">Marrakech, Maroc</span>
  </div>
  <h1 class="display hero__title" data-lines data-onload>
    <span class="line"><span class="line-inner">Architecture</span></span>
    <span class="line"><span class="line-inner">&amp; <em class="swash">intérieurs</em></span></span>
  </h1>
  <div class="hero__figure">
${figure({
  img: heroImg,
  imgPrefix: `images/projects/${heroProject.slug}`,
  sizes: "100vw",
  alt: altFor(heroProject, heroImg, 0, heroProject.images.length),
  eager: true,
  cssRatio: true,
})}
  </div>
</section>

<section class="section" id="projets">
  <div class="section__head">
    <h2 class="display section__title">Projets</h2>
    <span class="label">${pad(projects.length)} — Hôtellerie, riads, villas</span>
  </div>
  <div class="works">
${worksHtml}
  </div>
</section>

<section class="section" id="studio">
  <div class="section__head">
    <h2 class="display section__title">Studio</h2>
    <span class="label">Marrakech, Maroc</span>
  </div>
  <div class="studio__grid">
    <p class="studio__statement" data-fade>
      Ochralab est le cabinet d'architecture de Mehdi Tolaïmate.
      L'atelier conçoit des lieux à vivre — hôtels, riads et villas —
      depuis Marrakech.
    </p>
    <dl class="studio__details" data-fade>
      <div>
        <dt>Direction</dt>
        <dd>Mehdi Tolaïmate, architecte</dd>
      </div>
      <div>
        <dt>Domaines</dt>
        <dd>Architecture, design d'intérieur</dd>
      </div>
      <div>
        <dt>Typologies</dt>
        <dd>Hôtellerie, riads, villas</dd>
      </div>
      <div>
        <dt>Contact</dt>
        <dd><a href="mailto:ochralab@gmail.com">ochralab@gmail.com</a></dd>
      </div>
    </dl>
  </div>
</section>
</main>
${footer("")}`;

await writeFile(path.join(SITE, "index.html"), index);

/* ---------------- Pages projet ---------------- */

await mkdir(path.join(SITE, "projets"), { recursive: true });

function galleryLayout(images) {
  // Répartition éditoriale : pleine page, large, moitié, portrait centré.
  const items = [];
  let i = 0;
  let landscapeCount = 0;
  while (i < images.length) {
    const img = images[i];
    const portrait = img.ratio < 0.95;
    if (portrait && i + 1 < images.length && images[i + 1].ratio < 0.95) {
      items.push({ img, cls: "g-item--half" });
      items.push({ img: images[i + 1], cls: "g-item--half" });
      i += 2;
      continue;
    }
    if (portrait) {
      items.push({ img, cls: "g-item--tall" });
      i += 1;
      continue;
    }
    landscapeCount += 1;
    items.push({
      img,
      cls: landscapeCount % 3 === 0 ? "g-item--full" : "g-item--wide",
    });
    i += 1;
  }
  return items;
}

const SIZES = {
  "g-item--full": "100vw",
  "g-item--wide": "(max-width: 899px) 100vw, 82vw",
  "g-item--half": "(max-width: 899px) 100vw, 48vw",
  "g-item--tall": "(max-width: 899px) 100vw, 44vw",
};

projects.forEach((p, pi) => {
  const cover = p.images.find((im) => im.base === p.cover);
  const rest = p.images.filter((im) => im !== cover);
  const next = nextOf(projects, pi);
  const imgPrefix = `../images/projects/${p.slug}`;

  const galleryHtml = galleryLayout(rest)
    .map(({ img, cls }, gi) => {
      return `<div class="g-item ${cls}">
${figure({
        img,
        imgPrefix,
        sizes: SIZES[cls],
        alt: altFor(p, img, gi + 1, p.images.length),
      })}
  <span class="idx">${pad(gi + 2)} / ${pad(p.images.length)}</span>
</div>`;
    })
    .join("\n");

  const page = `${head({
    title: `${p.name} — Ochralab`,
    desc: `${p.name}, projet ${p.category.toLowerCase()} du cabinet Ochralab — ${p.images.length} vues.`,
    root: "../",
    preload: `<link rel="preload" as="image" imagesrcset="${srcset(imgPrefix, cover)}" imagesizes="100vw" fetchpriority="high">`,
  })}
${header("../", "projets")}
<main id="main">
<article>
<section class="project-hero" id="top">
  <div class="project-hero__meta">
    <span class="label">${pad(pi + 1)} — ${p.category}</span>
    <span class="label">${pad(p.images.length)} vues</span>
  </div>
  <h1 class="display project-hero__title" data-lines data-onload>${lines(p.name)}</h1>
  <div class="project-hero__figure">
    <figure data-reveal data-parallax style="background-image: url('${cover.lqip}');">
      <img src="${largest(imgPrefix, cover)}" srcset="${srcset(imgPrefix, cover)}" sizes="100vw" alt="${altFor(p, cover, 0, p.images.length)}" width="${cover.w}" height="${cover.h}" fetchpriority="high">
    </figure>
  </div>
</section>
<section class="gallery" aria-label="Galerie du projet">
${galleryHtml}
</section>
</article>
<nav class="next-project" aria-label="Projet suivant">
  <p class="label">Projet suivant</p>
  <a class="next-project__link" href="${next.slug}.html">
    <span class="display next-project__name">${next.name}</span>
  </a>
  <a class="backlink" href="../index.html#projets">← Tous les projets</a>
</nav>
</main>
${footer("../")}`;

  writeFile(path.join(SITE, "projets", `${p.slug}.html`), page);
});

console.log(`galerie : index + ${projects.length} pages projet générées.`);
