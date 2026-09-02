// Générateur du site « Galerie » — minimalisme exagéré.
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { loadManifest, srcset, largest, altFor, nextOf, pad } from "./lib.mjs";

const SITE = path.resolve(import.meta.dirname, "..");
const manifest = await loadManifest();
const projects = manifest.projects;

const DESC =
  "Ochralab, cabinet d'architecture et de design d'intérieur à Marrakech, dirigé par Mehdi Tolaïmate. Hôtels, riads et villas : douze projets choisis.";

// Première vignette de la mosaïque : c'est elle qui porte le LCP.
const firstProject = projects[0];
const firstImg = firstProject.images.find((i) => i.base === firstProject.cover);

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

// Menu latéral fixe sur grand écran, barre + panneau au doigt sur mobile.
// Placement identique sur toutes les pages : une navigation qui se déplace
// d'une page à l'autre désoriente.
function sidebar(root) {
  const items = [
    ["projets", "Projets"],
    ["studio", "Studio"],
    ["contact", "Contact"],
  ];
  const navLinks = items
    .map(
      ([id, label]) =>
        `      <li><a href="${root}index.html#${id}" data-nav="${id}"><span>${label}</span></a></li>`
    )
    .join("\n");
  const drawerLinks = items
    .map(([id, label]) => `  <a href="${root}index.html#${id}">${label}</a>`)
    .join("\n");

  return `
<aside class="sidebar">
  <a class="wordmark" href="${root}index.html">Ochralab</a>
  <nav class="sidebar__nav" aria-label="Navigation principale">
    <ul>
${navLinks}
    </ul>
  </nav>
  <p class="sidebar__foot label">Marrakech<br>Maroc</p>
</aside>

<header class="topbar">
  <a class="wordmark" href="${root}index.html">Ochralab</a>
  <button class="menu-btn" aria-expanded="false" aria-label="Ouvrir le menu">
    <svg width="26" height="16" viewBox="0 0 26 16" fill="none" aria-hidden="true"><path d="M0 1h26M0 8h26M0 15h26" stroke="currentColor" stroke-width="1.6"/></svg>
  </button>
</header>
<div class="menu-overlay">
  <button class="menu-close" aria-label="Fermer le menu">
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M1 1l20 20M21 1L1 21" stroke="currentColor" stroke-width="1.6"/></svg>
  </button>
  <p class="label">Ochralab, Marrakech</p>
${drawerLinks}
</div>`;
}

const footer = (root) => `
<section class="contact" id="contact">
  <p class="label">Un projet, une question&nbsp;?</p>
  <a class="contact__mail" href="mailto:ochralab@gmail.com">ochralab@gmail.com</a>
  <div class="footer-row">
    <span>© Ochralab, Marrakech</span>
    <span>Architecture &amp; design d'intérieur</span>
    <a href="#projets">Haut de page</a>
  </div>
</section>
<script src="${root}assets/vendor/gsap.min.js" defer></script>
<script src="${root}assets/vendor/ScrollTrigger.min.js" defer></script>
<script src="${root}assets/main.js" defer></script>
</body>
</html>`;

/* ---------------- Page d'accueil ---------------- */

// Liste plate : le CSS multi-colonnes suffit à produire la mosaïque, même
// sans JavaScript. Le script ne fait que redistribuer ces mêmes vignettes
// en colonnes qu'il peut ensuite faire boucler.
const tilesHtml = projects
  .map((p, i) => {
    const cover = p.images.find((im) => im.base === p.cover);
    return `<a class="tile" href="projets/${p.slug}.html" data-cursor-view>
  <figure style="--ratio: ${cover.w} / ${cover.h}; background-image: url('${cover.lqip}');">
    <img src="${largest(`images/projects/${p.slug}`, cover)}" srcset="${srcset(`images/projects/${p.slug}`, cover)}" sizes="(max-width: 899px) 46vw, 30vw" alt="${altFor(p, cover, 0, p.images.length)}" width="${cover.w}" height="${cover.h}" ${i < 4 ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>
  </figure>
  <span class="tile__caption">
    <span class="tile__name">${p.name}</span>
    <span class="label tile__cat">${p.category}</span>
  </span>
</a>`;
  })
  .join("\n");

const index = `${head({
  title: "Ochralab, architecture & design d'intérieur à Marrakech",
  desc: DESC,
  root: "",
  preload: `<link rel="preload" as="image" imagesrcset="${srcset(
    `images/projects/${firstProject.slug}`,
    firstImg
  )}" imagesizes="(max-width: 899px) 46vw, 30vw" fetchpriority="high">`,
})}
<div class="preloader" aria-hidden="true">
  <div class="preloader__word">${"OCHRALAB".split("")
    .map((c) => `<span>${c}</span>`)
    .join("")}</div>
</div>
${sidebar("")}
<main id="main">
<section class="loop" id="projets" aria-label="Projets">
  <!-- La page s'ouvre sur la mosaïque : le titre reste lisible par les
       lecteurs d'écran et les moteurs, sans occuper l'écran. -->
  <h1 class="sr-only">Ochralab, cabinet d'architecture et de design d'intérieur à Marrakech</h1>
  <div class="loop__head">
    <span class="label">Cabinet d'architecture, Marrakech</span>
    <span class="label">${pad(projects.length)} projets · hôtellerie, riads, villas</span>
  </div>
  <div class="loop__viewport">
    <div class="loop__grid">
${tilesHtml}
    </div>
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
      L'atelier conçoit depuis Marrakech des lieux à vivre :
      hôtels, riads et villas.
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
    title: `${p.name}, projet Ochralab`,
    desc: `${p.name}, projet ${p.category.toLowerCase()} du cabinet Ochralab, ${p.images.length} vues.`,
    root: "../",
    preload: `<link rel="preload" as="image" imagesrcset="${srcset(imgPrefix, cover)}" imagesizes="100vw" fetchpriority="high">`,
  })}
${sidebar("../")}
<main id="main">
<article>
<section class="project-hero" id="top">
  <div class="project-hero__meta">
    <span class="label">${p.category}</span>
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
