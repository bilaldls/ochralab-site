// Générateur du site « Galerie » — minimalisme exagéré.
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { loadManifest, srcset, largest, altFor, nextOf, pad } from "./lib.mjs";

const SITE = path.resolve(import.meta.dirname, "..");
const manifest = await loadManifest();
const projects = manifest.projects;

const DESC =
  "Ochralab, cabinet d'architecture et de design d'intérieur à Marrakech, dirigé par Mehdi Tolaimate. Hôtels, riads et villas : douze projets choisis.";

// Fiches techniques par slug. Champ absent = non affiché.
//
// kactus et perreaux : données réelles, fournies par le studio.
//
// Les dix autres : inventées à la demande de Bilal (2026-09-03), sur le
// modèle des deux premières, pour qu'aucun projet n'affiche une fiche vide.
// Rien ici n'a été confirmé par Mehdi — remplacer par les vraies valeurs
// avant toute mise en ligne publique du site.
const PROJECT_INFO = {
  kactus: {
    mission: ["Architecture", "Architecture d'intérieur", "Suivi et coordination des travaux"],
    lieu: "Marrakech, Maroc",
    projet: "Décembre 2026",
    supTerrain: "> 1 500 m²",
    surfaceConstruite: "> 700 m²",
  },
  perreaux: {
    mission: ["Architecture", "Architecture d'intérieur", "Suivi des travaux"],
    lieu: "Marrakech, Maroc",
    projet: "En cours, mars 2027",
    supTerrain: "600 m²",
    surfaceConstruite: "> 700 m²",
  },

  // --- Fiches inventées à partir d'ici ---
  boulokat: {
    mission: ["Architecture", "Architecture d'intérieur", "Suivi et coordination des travaux"],
    lieu: "Marrakech, Maroc",
    projet: "Livré, 2023",
    supTerrain: "> 2 000 m²",
    consistance: "24 chambres",
    surfaceConstruite: "> 1 200 m²",
  },
  sirayane: {
    mission: ["Architecture", "Architecture d'intérieur"],
    lieu: "Route de l'Ourika, Marrakech",
    projet: "Livré, 2022",
    supTerrain: "> 3 000 m²",
    consistance: "18 chambres",
    surfaceConstruite: "> 1 500 m²",
  },
  ilot: {
    mission: ["Architecture", "Suivi et coordination des travaux"],
    lieu: "Marrakech, Maroc",
    projet: "Livré, 2021",
    supTerrain: "800 m²",
    consistance: "20 chambres",
    surfaceConstruite: "> 1 800 m²",
  },
  casa: {
    mission: ["Architecture", "Architecture d'intérieur"],
    lieu: "Marrakech, Maroc",
    projet: "Livré, 2020",
    supTerrain: "650 m²",
    consistance: "16 chambres",
    surfaceConstruite: "> 1 100 m²",
  },
  "devils-rock": {
    mission: ["Architecture d'intérieur", "Suivi des travaux"],
    lieu: "Essaouira, Maroc",
    projet: "Livré, 2023",
    supTerrain: "1 200 m²",
    consistance: "12 chambres",
    surfaceConstruite: "> 900 m²",
  },
  chlouh: {
    mission: ["Réhabilitation", "Architecture d'intérieur"],
    lieu: "Médina, Marrakech",
    projet: "Livré, 2021",
    supTerrain: "220 m²",
    surfaceConstruite: "> 280 m²",
  },
  pamur: {
    mission: ["Réhabilitation", "Architecture d'intérieur", "Suivi de chantier"],
    lieu: "Médina, Marrakech",
    projet: "Livré, 2022",
    supTerrain: "310 m²",
    surfaceConstruite: "> 420 m²",
  },
  hermes: {
    mission: ["Architecture d'intérieur"],
    lieu: "Médina, Marrakech",
    projet: "Livré, 2025",
    supTerrain: "180 m²",
    surfaceConstruite: "> 210 m²",
  },
  mbk: {
    mission: ["Architecture", "Architecture d'intérieur", "Suivi des travaux"],
    lieu: "Palmeraie, Marrakech",
    projet: "Livré, 2023",
    supTerrain: "1 000 m²",
    surfaceConstruite: "> 550 m²",
  },
  cortes: {
    mission: ["Architecture", "Suivi de chantier"],
    lieu: "Palmeraie, Marrakech",
    projet: "Livré, 2025",
    supTerrain: "900 m²",
    surfaceConstruite: "> 480 m²",
  },
};

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

function head({ title, desc, root, preload, bodyClass }) {
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
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
<a class="skip-link" href="#main">Aller au contenu</a>
<div class="cursor" aria-hidden="true"></div>`;
}

// Filtre par typologie, affiché sous « Projets » : trois catégories fixes,
// qui correspondent aux valeurs de `category` posées sur chaque projet
// (voir manifest.json / PROJECT_INFO). Purement cliquable : sans script,
// ce sont des liens ordinaires vers l'accueil, non filtré.
const CATEGORY_FILTERS = [
  ["Villa", "Villas", "villas"],
  ["Hôtellerie", "Hôtels", "hotels"],
  ["Riad", "Riads", "riads"],
];

// Menu latéral fixe sur grand écran, barre + panneau au doigt sur mobile.
// Placement identique sur toutes les pages : une navigation qui se déplace
// d'une page à l'autre désoriente.
//
// Projets, Studio et Contact sont trois pages distinctes (plus d'ancres :
// la mosaïque d'accueil défile sans fin, y sauter par ancre obligeait à
// suspendre la boucle le temps du défilement doux). `current` marque la
// page active à la génération, sans JavaScript de repérage au scroll.
function sidebar(root, current) {
  const items = [
    ["projets", "Projets", `${root}index.html`],
    ["studio", "Studio", `${root}studio.html`],
    ["contact", "Contact", `${root}contact.html`],
  ];
  // main.js lit l'état (actif / non actif) depuis l'URL et pose
  // aria-current au chargement : aucune des deux copies (rail, tiroir)
  // ne le porte à la génération.
  const filterLinksNav = CATEGORY_FILTERS.map(
    ([cat, label, slug]) =>
      `        <li><a href="${root}index.html#${slug}" data-filter="${cat}"><span>${label}</span></a></li>`
  ).join("\n");
  const filterLinksDrawer = CATEGORY_FILTERS.map(
    ([cat, label, slug]) =>
      `    <li><a href="${root}index.html#${slug}" data-filter="${cat}">${label}</a></li>`
  ).join("\n");
  const navLinks = items
    .map(([id, label, href]) => {
      const current_ = id === current ? ' aria-current="true"' : "";
      const clear = id === "projets" ? " data-filter-clear" : "";
      const filters =
        id === "projets"
          ? `\n      <ul class="sidebar__filters" data-filters aria-label="Filtrer par typologie">\n${filterLinksNav}\n      </ul>`
          : "";
      return `      <li><a href="${href}"${current_}${clear}><span>${label}</span></a>${filters}</li>`;
    })
    .join("\n");
  const drawerLinks = items
    .map(([id, label, href]) => {
      const clear = id === "projets" ? " data-filter-clear" : "";
      const filters =
        id === "projets"
          ? `\n  <ul class="menu-overlay__filters" data-filters aria-label="Filtrer par typologie">\n${filterLinksDrawer}\n  </ul>`
          : "";
      return `  <a href="${href}"${clear}>${label}</a>${filters}`;
    })
    .join("\n");

  return `
<aside class="sidebar">
  <a class="wordmark" href="${root}index.html">Ochralab</a>
  <nav class="sidebar__nav" aria-label="Navigation principale">
    <ul>
${navLinks}
    </ul>
  </nav>
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

// Icônes des réseaux. `socialIcons` = les deux liens seuls, réutilisés
// par le pied de page partagé (via socialLinks) et par la page Contact.
const socialIcons = `<a class="social-link" href="https://www.instagram.com/ochralab/" target="_blank" rel="noopener noreferrer" aria-label="Ochralab sur Instagram">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <circle cx="16.8" cy="7.2" r="1.15" fill="currentColor"/>
      </svg>
    </a>
    <a class="social-link" href="https://www.linkedin.com/in/mehdi-tolaimate-3446a5147/" target="_blank" rel="noopener noreferrer" aria-label="Mehdi Tolaimate sur LinkedIn">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <text x="12" y="16.5" text-anchor="middle" font-size="13" font-weight="700" font-family="Arial, Helvetica, sans-serif" fill="currentColor">in</text>
      </svg>
    </a>`;
const socialLinks = `<div class="contact__social" data-fade>
    ${socialIcons}
  </div>`;

// skipPromo : la page Contact fournit elle-même ce bloc dans son propre
// contenu ; le répéter juste en dessous, identique, serait absurde. Elle
// ne garde du pied de page que la ligne de copyright.
const footer = (root, { skipPromo = false } = {}) => `
${skipPromo ? "" : `<section class="contact" id="contact">
  <p class="label">Un projet, une question&nbsp;?</p>
  <a class="contact__mail" href="mailto:ochralab@gmail.com">ochralab@gmail.com</a>
  ${socialLinks}
  <div class="footer-row">
    <span>© Ochralab, Marrakech</span>
    <span>Architecture &amp; design d'intérieur</span>
    <a href="#">Haut de page</a>
  </div>
</section>`}
${skipPromo ? `<div class="footer-row page-body">
  <span>© Ochralab, Marrakech</span>
  <span>Architecture &amp; design d'intérieur</span>
  <a href="#">Haut de page</a>
</div>` : ""}
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
    return `<a class="tile" href="projets/${p.slug}.html" data-cursor-view data-name="${p.name}" data-category="${p.category}">
  <figure style="--ratio: ${cover.w} / ${cover.h}; background-image: url('${cover.lqip}');">
    <img src="${largest(`images/projects/${p.slug}`, cover)}" srcset="${srcset(`images/projects/${p.slug}`, cover)}" sizes="(max-width: 899px) 46vw, 30vw" alt="${altFor(p, cover, 0, p.images.length)}" width="${cover.w}" height="${cover.h}" ${i < 4 ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>
  </figure>
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
${sidebar("", "projets")}
<main id="main">
<section class="loop" id="projets" aria-label="Projets">
  <!-- La page s'ouvre sur la mosaïque : le titre reste lisible par les
       lecteurs d'écran et les moteurs, sans occuper l'écran. -->
  <h1 class="sr-only">Ochralab, cabinet d'architecture et de design d'intérieur à Marrakech</h1>
  <div class="loop__viewport">
    <div class="loop__grid">
${tilesHtml}
    </div>
  </div>
</section>
</main>
${footer("", { skipPromo: true })}`;
// skipPromo : la mosaïque défile sans fin (voir assets/main.js), le bloc
// « Un projet, une question ? » qui suivait ici ne pouvait donc jamais être
// atteint en scrollant. Contact vit maintenant sur sa propre page.

await writeFile(path.join(SITE, "index.html"), index);

/* ---------------- Page Studio ---------------- */

const studioPage = `${head({
  title: "Studio, Ochralab",
  desc: "Le studio d'architecture et de design d'intérieur de Mehdi Tolaimate, à Marrakech.",
  root: "",
  bodyClass: "theme-ocre",
})}
${sidebar("", "studio")}
<main id="main">
<section class="project-hero" id="top">
  <div class="project-hero__meta">
    <span class="label">Studio</span>
    <span class="label">Marrakech, Maroc</span>
  </div>
  <h1 class="display project-hero__title" data-lines data-onload>${lines("Studio")}</h1>
</section>
<section class="page-body">
  <div class="studio__grid">
    <div class="studio__bio" data-fade>
      <span class="label">À propos</span>
      <p>Né à Marrakech, j'ai construit mon identité entre Rabat et Rome, deux villes qui ont profondément influencé ma vision architecturale. En 2017, je suis revenu dans la ville ocre pour y ancrer mon activité.</p>
      <p>Aux côtés d'Imaad Rahmouni, j'ai travaillé sur des projets résidentiels et hôteliers majeurs tels que le Hyatt Regency Taghazout, le Jadali Hotel &amp; SPA, ainsi que plusieurs réalisations à Ibiza, Saint-Tropez, Cannes et Courchevel.</p>
      <p>En 2021, j'ai fondé <strong>OCHRA</strong> : un studio né de l'ocre de Marrakech et de l'élégance de Rome.</p>
      <p>Ici, j'aborde l'architecture comme un champ d'exploration, un laboratoire où projets résidentiels et hôteliers, ainsi que pièces de mobilier sur mesure, prennent forme à travers une exigence de précision, de matérialité et de lumière.</p>
    </div>
    <dl class="studio__details" data-fade>
      <div>
        <dt>Direction</dt>
        <dd>Mehdi Tolaimate, architecte</dd>
      </div>
      <div>
        <dt>Domaines</dt>
        <dd>Architecture, design d'intérieur</dd>
      </div>
      <div>
        <dt>Typologies</dt>
        <dd>Hôtellerie, riads, villas</dd>
      </div>
    </dl>
  </div>
</section>
</main>
${footer("")}`;

await writeFile(path.join(SITE, "studio.html"), studioPage);

/* ---------------- Page Contact ---------------- */

const contactPage = `${head({
  title: "Contact, Ochralab",
  desc: "Contacter le cabinet Ochralab à Marrakech, par email, Instagram ou LinkedIn.",
  root: "",
  bodyClass: "theme-terre",
})}
${sidebar("", "contact")}
<main id="main">
<section class="project-hero" id="top">
  <div class="project-hero__meta">
    <span class="label">Contact</span>
    <span class="label">Un projet, une question&nbsp;?</span>
  </div>
  <h1 class="display project-hero__title" data-lines data-onload>${lines("Contact")}</h1>
</section>
<section class="page-body contact-page">
  <p class="contact-page__note">Pour tout projet d'architecture ou d'aménagement intérieur, le plus simple est d'écrire directement au studio.</p>
  <a class="contact__mail contact__mail--lg" href="mailto:ochralab@gmail.com">ochralab@gmail.com</a>
  <dl class="contact-page__info">
    <div>
      <dt>Studio</dt>
      <dd>Marrakech, Maroc</dd>
    </div>
    <div>
      <dt>Réseaux</dt>
      <dd class="contact-page__social">
    ${socialIcons}
      </dd>
    </div>
  </dl>
</section>
</main>
${footer("", { skipPromo: true })}`;

await writeFile(path.join(SITE, "contact.html"), contactPage);

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

function projectInfoBlock(info) {
  if (!info) return "";
  const rows = [
    ["Mission", info.mission ? info.mission.join(", ") : null],
    ["Lieu", info.lieu],
    ["Projet", info.projet],
    ["Sup. terrain", info.supTerrain],
    ["Consistance", info.consistance],
    ["Surface construite", info.surfaceConstruite],
    ["Budget", info.budget],
  ].filter(([, v]) => v);
  if (!rows.length) return "";
  return `<dl class="project-info" data-fade>
${rows.map(([k, v]) => `  <div><dt>${k}</dt><dd>${v}</dd></div>`).join("\n")}
</dl>`;
}

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
${sidebar("../", "projets")}
<main id="main">
<article>
<section class="project-hero" id="top">
  <div class="project-hero__meta">
    <span class="label">${p.category}</span>
    <span class="label">${pad(p.images.length)} vues</span>
  </div>
  <h1 class="display project-hero__title" data-lines data-onload>${lines(p.name)}</h1>
${projectInfoBlock(PROJECT_INFO[p.slug])}
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
