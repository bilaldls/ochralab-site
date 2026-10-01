// Générateur du site « Galerie » — minimalisme exagéré.
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { loadManifest, srcset, largest, altFor, nextOf, pad } from "./lib.mjs";

const SITE = path.resolve(import.meta.dirname, "..");
const manifest = await loadManifest();
const projects = manifest.projects;

// Empreinte courte du contenu, ajoutée en ?v=… aux CSS/JS : le navigateur
// (et le cache de GitHub Pages) recharge le fichier dès qu'il change, sans
// jamais garder une version périmée. Ne change que si le fichier change.
async function assetHash(rel) {
  const buf = await readFile(path.join(SITE, rel));
  return createHash("sha1").update(buf).digest("hex").slice(0, 8);
}
const CSS_V = await assetHash("assets/styles.css");
const JS_V = await assetHash("assets/main.js");

// Nom officiel choisi par Mehdi (2026-10-01) : « OCHRA ». Le domaine,
// l'adresse email et le compte Instagram gardent « ochralab ».
const BRAND = "OCHRA";
const EMAIL = "contact@ochralab.com";
const PHONE = { display: "05 25 19 07 22", href: "tel:+212525190722" };
const ADDRESS = "48 rue de Yougoslavie, bureau 405, Marrakech";

const DESC =
  `${BRAND}, cabinet d'architecture et de design d'intérieur à Marrakech, dirigé par Mehdi Tolaimate. Hôtels, riads et villas : ${projects.length} projets choisis.`;

// Les noms de projets contiennent des « & » : échappés une fois pour
// toutes, ils ne sont utilisés que dans du HTML.
const escapeHtml = (t) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
for (const p of projects) p.name = escapeHtml(p.name);

// Fiches techniques par slug. Champ absent = non affiché.
//
// Source : document « Ochralab-informations-a-renseigner.docx » rempli par
// Mehdi (2026-10-01). Les cases laissées vides ou marquées « NA », « — »
// ne sont pas affichées. Rien n'est inventé.
const PROJECT_INFO = {
  "jamaa-el-fna": {
    mission: ["Architecture", "Architecture d'intérieur", "Suivi et coordination des travaux"],
    lieu: "Marrakech, Maroc",
    projet: "Livré, 2023",
    consistance: "13 chambres",
  },
  sirayane: {
    mission: ["Concept", "Master plan", "Architecture", "Suivi de chantier"],
    lieu: "Route d'Amezmiz, Marrakech",
    projet: "En cours",
    supTerrain: "12 000 m²",
    consistance: "63 chambres",
    surfaceConstruite: "> 5 000 m²",
    maitreOuvrage: "Sirayane Hospitality",
  },
  kactus: {
    mission: ["Architecture", "Architecture d'intérieur", "Suivi et coordination des travaux"],
    lieu: "Marrakech, Maroc",
    projet: "En cours",
    supTerrain: "1 500 m²",
    consistance: "6 chambres",
    surfaceConstruite: "770 m²",
    maitreOuvrage: "Klucsar Invest",
  },
  perreaux: {
    mission: ["Architecture", "Architecture d'intérieur", "Suivi des travaux"],
    lieu: "Marrakech, Maroc",
    projet: "En cours",
    supTerrain: "600 m²",
    surfaceConstruite: "> 700 m²",
  },
  ilot: {
    mission: ["Architecture", "Architecture d'intérieur", "Suivi des travaux"],
    lieu: "Marrakech, Maroc",
    projet: "En cours",
    supTerrain: "800 m²",
    consistance: "100 chambres",
    surfaceConstruite: "> 1 800 m²",
  },
  "devils-rock": {
    mission: ["Architecture d'intérieur", "Suivi des travaux"],
    lieu: "Taghazout, Maroc",
    projet: "En cours",
    consistance: "50 chambres",
  },
  "villa-mb": {
    mission: ["Architecture", "Architecture d'intérieur", "Suivi des travaux"],
    lieu: "Palmeraie, Marrakech",
    projet: "Livré, 2023",
    supTerrain: "600 m²",
    consistance: "4 chambres",
    surfaceConstruite: "> 550 m²",
    maitreOuvrage: "Client privé",
  },
  "bab-hmer": {
    mission: ["Réhabilitation", "Architecture d'intérieur"],
    lieu: "Médina, Marrakech",
    projet: "En cours",
    supTerrain: "125 m²",
    consistance: "6 chambres",
    surfaceConstruite: "> 250 m²",
    maitreOuvrage: "Client privé",
  },
  clucia: {
    mission: ["Architecture", "Architecture d'intérieur", "Suivi des travaux"],
    lieu: "Casablanca, Maroc",
    projet: "En cours",
    consistance: "110 chambres",
    maitreOuvrage: "Centralucia SARL",
  },
  cortes: {
    mission: ["Architecture", "Suivi de chantier"],
    lieu: "Route de l'Ourika, Marrakech",
    projet: "En cours",
    supTerrain: "> 10 000 m²",
    consistance: "7 villas",
    surfaceConstruite: "> 5 000 m²",
    maitreOuvrage: "Client privé",
  },
  hermes: {
    mission: ["Réhabilitation", "Architecture d'intérieur", "Suivi des travaux"],
    lieu: "Médina, Marrakech",
    projet: "En cours",
    consistance: "17 chambres",
    surfaceConstruite: "> 700 m²",
    maitreOuvrage: "Client privé",
  },
  hirondelles: {
    mission: ["Réhabilitation", "Architecture d'intérieur", "Suivi des travaux"],
    lieu: "Médina, Marrakech",
    projet: "2026",
    consistance: "6 chambres",
    surfaceConstruite: "> 300 m²",
    maitreOuvrage: "Client privé",
  },
  trianon: {
    mission: ["Architecture", "Architecture d'intérieur", "Suivi des travaux"],
    lieu: "Palmeraie, Marrakech",
    projet: "2026",
    supTerrain: "> 10 000 m²",
    consistance: "60 chambres",
    surfaceConstruite: "> 4 500 m²",
    maitreOuvrage: "Client privé",
  },
  "villa-medicis": {
    mission: ["Architecture"],
    lieu: "Bouskoura, Casablanca",
    consistance: "6 chambres",
    surfaceConstruite: "> 700 m²",
    maitreOuvrage: "Client privé",
  },
  "cliff-house": {
    mission: ["Architecture", "Architecture d'intérieur", "Suivi des travaux"],
    lieu: "Cabo Negro, Maroc",
    projet: "En cours",
    supTerrain: "> 2 500 m²",
    consistance: "6 chambres",
    surfaceConstruite: "> 700 m²",
    maitreOuvrage: "Client privé",
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

function head({ title, desc, root, preload, bodyClass, home = false }) {
  // Script en ligne, avant le premier rendu : pose `is-entering` sur <html>
  // quand on arrive via un clic de navigation (drapeau posé par main.js) —
  // ou, sur l'accueil uniquement, à la première visite de la session. Le
  // rideau de transition (.preloader) est alors peint plein écran dès la
  // première frame, sans clignotement du contenu de la page derrière.
  const enterCond = home
    ? "f==='1'||s!=='1'"
    : "f==='1'";
  const boot =
    `document.documentElement.classList.remove('no-js');document.documentElement.classList.add('js');` +
    `try{var f=sessionStorage.getItem('ochralab-transition'),s=sessionStorage.getItem('ochralab-seen');` +
    `if((${enterCond})&&!matchMedia('(prefers-reduced-motion:reduce)').matches)document.documentElement.classList.add('is-entering')}catch(e){}`;
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
<link rel="stylesheet" href="${root}assets/styles.css?v=${CSS_V}">
<script>${boot}</script>
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
<a class="skip-link" href="#main">Aller au contenu</a>
<div class="cursor" aria-hidden="true"></div>
<div class="preloader" aria-hidden="true">
  <div class="preloader__word">${BRAND.split("").map((c) => `<span>${c}</span>`).join("")}</div>
</div>`;
}

// Typologies, affichées sous « Projets » : trois catégories fixes, qui
// correspondent aux valeurs de `category` posées sur chaque projet (voir
// manifest.json). Chacune a sa propre page, une liste numérotée de ses
// projets (voir « Pages typologie » plus bas) : [catégorie, libellé, slug
// = nom du fichier HTML].
const CATEGORY_PAGES = [
  ["Villa", "Villas", "villas"],
  ["Hôtellerie", "Hôtels", "hotels"],
  ["Riad", "Riads", "riads"],
];

// Menu latéral fixe sur grand écran, barre + panneau au doigt sur mobile.
// Placement identique sur toutes les pages : une navigation qui se déplace
// d'une page à l'autre désoriente.
//
// Projets, Studio, Contact et les trois typologies sont des pages
// distinctes. `current` (« projets », « studio », « contact » ou le slug
// d'une typologie) marque la page active à la génération, sans JavaScript.
function sidebar(root, current) {
  const items = [
    ["projets", "Projets", `${root}index.html`],
    ["studio", "Studio", `${root}studio.html`],
    ["contact", "Contact", `${root}contact.html`],
  ];
  // data-transition-label : mot affiché par le rideau de transition
  // (main.js). « OCHRA » n'est gardé que pour le lancement du site.
  const isCurrent = (id) => (id === current ? ' aria-current="true"' : "");
  const categoryLinksNav = CATEGORY_PAGES.map(
    ([, label, slug]) =>
      `        <li><a href="${root}${slug}.html"${isCurrent(slug)} data-transition data-transition-label="${label}"><span>${label}</span></a></li>`
  ).join("\n");
  const categoryLinksDrawer = CATEGORY_PAGES.map(
    ([, label, slug]) =>
      `    <li><a href="${root}${slug}.html"${isCurrent(slug)} data-transition data-transition-label="${label}">${label}</a></li>`
  ).join("\n");
  const navLinks = items
    .map(([id, label, href]) => {
      const sub =
        id === "projets"
          ? `\n      <ul class="sidebar__filters" aria-label="Typologies">\n${categoryLinksNav}\n      </ul>`
          : "";
      return `      <li><a href="${href}"${isCurrent(id)} data-transition data-transition-label="${label}"><span>${label}</span></a>${sub}</li>`;
    })
    .join("\n");
  const drawerLinks = items
    .map(([id, label, href]) => {
      const sub =
        id === "projets"
          ? `\n  <ul class="menu-overlay__filters" aria-label="Typologies">\n${categoryLinksDrawer}\n  </ul>`
          : "";
      return `  <a href="${href}"${isCurrent(id)} data-transition data-transition-label="${label}">${label}</a>${sub}`;
    })
    .join("\n");

  return `
<aside class="sidebar">
  <a class="wordmark" href="${root}index.html" data-transition data-transition-label="Projets">${BRAND}</a>
  <nav class="sidebar__nav" aria-label="Navigation principale">
    <ul>
${navLinks}
    </ul>
  </nav>
</aside>

<header class="topbar">
  <a class="wordmark" href="${root}index.html" data-transition data-transition-label="Projets">${BRAND}</a>
  <button class="menu-btn" aria-expanded="false" aria-label="Ouvrir le menu">
    <svg width="26" height="16" viewBox="0 0 26 16" fill="none" aria-hidden="true"><path d="M0 1h26M0 8h26M0 15h26" stroke="currentColor" stroke-width="1.6"/></svg>
  </button>
</header>
<div class="menu-overlay">
  <button class="menu-close" aria-label="Fermer le menu">
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M1 1l20 20M21 1L1 21" stroke="currentColor" stroke-width="1.6"/></svg>
  </button>
  <p class="label">${BRAND}, Marrakech</p>
${drawerLinks}
</div>`;
}

// Icônes des réseaux. `socialIcons` = les deux liens seuls, réutilisés
// par le pied de page partagé (via socialLinks) et par la page Contact.
const socialIcons = `<a class="social-link" href="https://www.instagram.com/ochralab/" target="_blank" rel="noopener noreferrer" aria-label="${BRAND} sur Instagram">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <circle cx="16.8" cy="7.2" r="1.15" fill="currentColor"/>
      </svg>
    </a>
    <a class="social-link" href="https://www.linkedin.com/in/mehdi-tolaimate-3446a5147/" target="_blank" rel="noopener noreferrer" aria-label="Mehdi Tolaimate sur LinkedIn">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <g fill="currentColor" transform="translate(12 12) scale(1.25) translate(-12 -12)">
          <circle cx="7" cy="7.5" r="1.45"/>
          <rect x="5.8" y="9.8" width="2.4" height="8"/>
          <path d="M10.6 9.8h2.3v1.1c.45-.75 1.35-1.3 2.65-1.3 2.3 0 3.05 1.45 3.05 3.65v4.55h-2.4v-4.1c0-1.05-.25-1.9-1.35-1.9s-1.85.85-1.85 1.9v4.1h-2.4z"/>
        </g>
      </svg>
    </a>`;
const socialLinks = `<div class="contact__social" data-fade>
    ${socialIcons}
  </div>`;

// skipPromo : la page Contact fournit elle-même ce bloc dans son propre
// contenu ; le répéter juste en dessous, identique, serait absurde. Elle
// ne garde du pied de page que la ligne de copyright.
// minimal : uniquement la mention de copyright (page Studio).
// skipPromo : pied de page sobre, sans le bloc « Un projet, une question ? »
// (accueil, contact). Défaut : bloc contact complet (pages projet).
const footer = (root, { skipPromo = false, minimal = false } = {}) => `
${minimal ? `<div class="footer-row footer-row--slim">
  <span>© ${BRAND}, Marrakech</span>
</div>` : (skipPromo ? "" : `<section class="contact" id="contact">
  <p class="label">Un projet, une question&nbsp;?</p>
  <a class="contact__mail" href="mailto:${EMAIL}">${EMAIL}</a>
  ${socialLinks}
  <div class="footer-row">
    <span>© ${BRAND}, Marrakech</span>
    <span>Architecture &amp; design d'intérieur</span>
    <a href="#">Haut de page</a>
  </div>
</section>`)}
${!minimal && skipPromo ? `<div class="footer-row page-body">
  <span>© ${BRAND}, Marrakech</span>
  <span>Architecture &amp; design d'intérieur</span>
  <a href="#">Haut de page</a>
</div>` : ""}
<script src="${root}assets/vendor/gsap.min.js" defer></script>
<script src="${root}assets/vendor/ScrollTrigger.min.js" defer></script>
<script src="${root}assets/main.js?v=${JS_V}" defer></script>
</body>
</html>`;

/* ---------------- Page d'accueil ---------------- */

// Ordre des vues d'un projet, tel que la page projet les numérote : la
// couverture en tête (01, dans le héros), puis le reste de la galerie
// (02, 03…). Partagé par la mosaïque et les pages projet.
function orderedViews(p) {
  const cover = p.images.find((im) => im.base === p.cover);
  return [cover, ...p.images.filter((im) => im !== cover)];
}

// Liste plate : le CSS multi-colonnes suffit à produire la mosaïque, même
// sans JavaScript. Le script ne fait que redistribuer ces mêmes vignettes
// en colonnes qu'il peut ensuite faire boucler (et en mélanger l'ordre).
//
// Toutes les photos de tous les projets y figurent, pas seulement les
// couvertures : on parcourt l'ensemble et l'on clique sur celle qui
// accroche l'œil. Quelle que soit la photo cliquée, on arrive en haut de
// la page projet, sur le titre et la fiche. Les quatre premières
// couvertures restent prioritaires au chargement (LCP).
const tilesHtml = projects
  .flatMap((p, pi) =>
    orderedViews(p).map((img, vi) => {
      const prefix = `images/projects/${p.slug}`;
      const eager = vi === 0 && pi < 4;
      return `<a class="tile" href="projets/${p.slug}.html" data-cursor-view data-name="${p.name}" data-project="${p.slug}">
  <figure style="--ratio: ${img.w} / ${img.h}; background-image: url('${img.lqip}');">
    <img src="${largest(prefix, img)}" srcset="${srcset(prefix, img)}" sizes="(max-width: 899px) 46vw, 30vw" alt="${altFor(p, img, vi, p.images.length)}" width="${img.w}" height="${img.h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>
  </figure>
</a>`;
    })
  )
  .join("\n");

const index = `${head({
  title: `${BRAND}, architecture &amp; design d'intérieur à Marrakech`,
  desc: DESC,
  root: "",
  home: true,
  preload: `<link rel="preload" as="image" imagesrcset="${srcset(
    `images/projects/${firstProject.slug}`,
    firstImg
  )}" imagesizes="(max-width: 899px) 46vw, 30vw" fetchpriority="high">`,
})}
${sidebar("", "projets")}
<main id="main">
<section class="loop" id="projets" aria-label="Projets">
  <!-- La page s'ouvre sur la mosaïque : le titre reste lisible par les
       lecteurs d'écran et les moteurs, sans occuper l'écran. -->
  <h1 class="sr-only">${BRAND}, cabinet d'architecture et de design d'intérieur à Marrakech</h1>
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
  title: `Studio, ${BRAND}`,
  desc: "Le studio d'architecture et de design d'intérieur de Mehdi Tolaimate, à Marrakech.",
  root: "",
  bodyClass: "theme-ocre",
})}
${sidebar("", "studio")}
<main id="main">
<section class="project-hero" id="top">
  <h1 class="display project-hero__title" data-lines data-onload>${lines("Studio")}</h1>
</section>
<section class="page-body">
  <div class="studio__grid">
    <div class="studio__bio" data-fade>
      <!-- Version anglaise d'abord, puis le texte original en français. -->
      <div class="studio__lang" lang="en">
        <span class="label">About</span>
        <p>Born in Marrakech, I shaped my identity between Rabat and Rome, two cities that have profoundly influenced my architectural vision. In 2017, I returned to the Ochre City to establish my practice there.</p>
        <p>Alongside Imaad Rahmouni, I worked on major residential and hospitality projects such as the Hyatt Regency Taghazout and the Jadali Hotel &amp; SPA, as well as several projects in Ibiza, Saint-Tropez, Cannes and Courchevel.</p>
        <p>In 2021, I founded <strong>OCHRA</strong>: a studio born from the ochre of Marrakech and the elegance of Rome.</p>
        <p>Here, I approach architecture as a field of exploration, a laboratory where residential and hospitality projects, as well as bespoke furniture pieces, take shape through a commitment to precision, materiality and light.</p>
      </div>
      <div class="studio__lang" lang="fr">
        <span class="label">À propos</span>
        <p>Né à Marrakech, j'ai construit mon identité entre Rabat et Rome, deux villes qui ont profondément influencé ma vision architecturale. En 2017, je suis revenu dans la ville ocre pour y ancrer mon activité.</p>
        <p>Aux côtés d'Imaad Rahmouni, j'ai travaillé sur des projets résidentiels et hôteliers majeurs tels que le Hyatt Regency Taghazout, le Jadali Hotel &amp; SPA, ainsi que plusieurs réalisations à Ibiza, Saint-Tropez, Cannes et Courchevel.</p>
        <p>En 2021, j'ai fondé <strong>OCHRA</strong> : un studio né de l'ocre de Marrakech et de l'élégance de Rome.</p>
        <p>Ici, j'aborde l'architecture comme un champ d'exploration, un laboratoire où projets résidentiels et hôteliers, ainsi que pièces de mobilier sur mesure, prennent forme à travers une exigence de précision, de matérialité et de lumière.</p>
      </div>
    </div>
    <div class="studio__aside" data-fade>
      <!-- Même ordre que la notice : anglais, puis français. -->
      <dl class="studio__details" lang="en">
        <div>
          <dt>Led by</dt>
          <dd>Mehdi Tolaimate, architect</dd>
        </div>
        <div>
          <dt>Fields</dt>
          <dd>Architecture, interior design</dd>
        </div>
        <div>
          <dt>Project types</dt>
          <dd>Hospitality, riads, villas, residential, other</dd>
        </div>
        <div>
          <dt>Founded</dt>
          <dd>2021</dd>
        </div>
        <div>
          <dt>Education</dt>
          <dd>ENA Rabat, La Sapienza Rome</dd>
        </div>
      </dl>
      <dl class="studio__details" lang="fr">
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
          <dd>Hôtellerie, riads, villas, résidentiel, divers</dd>
        </div>
        <div>
          <dt>Fondation</dt>
          <dd>2021</dd>
        </div>
        <div>
          <dt>Formation</dt>
          <dd>ENA Rabat, La Sapienza Rome</dd>
        </div>
      </dl>
    </div>
  </div>
</section>
</main>
${footer("", { minimal: true })}`;

await writeFile(path.join(SITE, "studio.html"), studioPage);

/* ---------------- Page Contact ---------------- */

const contactPage = `${head({
  title: `Contact, ${BRAND}`,
  desc: `Contacter le cabinet ${BRAND} à Marrakech, par email, téléphone, Instagram ou LinkedIn.`,
  root: "",
  bodyClass: "theme-terre",
})}
${sidebar("", "contact")}
<main id="main">
<section class="project-hero" id="top">
  <h1 class="display project-hero__title" data-lines data-onload>${lines("Contact")}</h1>
</section>
<section class="page-body contact-page">
  <p class="contact-page__note">Pour tout projet d'architecture ou d'aménagement intérieur, le plus simple est d'écrire directement au studio.</p>
  <a class="contact__mail contact__mail--lg" href="mailto:${EMAIL}">${EMAIL}</a>
  <dl class="contact-page__info">
    <div>
      <dt>Téléphone</dt>
      <dd><a href="${PHONE.href}">${PHONE.display}</a></dd>
    </div>
    <div>
      <dt>Studio</dt>
      <dd>${ADDRESS}</dd>
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
${footer("", { minimal: true })}`;

await writeFile(path.join(SITE, "contact.html"), contactPage);

/* ---------------- Pages typologie (Villas / Hôtels / Riads) ---------------- */

// Pas de mosaïque ici : une liste numérotée, un projet par ligne — numéro,
// nom, lieu et photo de couverture. Toute la ligne mène à la page projet.
// Ordre : celui du manifeste, comme partout ailleurs sur le site.
for (const [category, label, slug] of CATEGORY_PAGES) {
  const list = projects.filter((p) => p.category === category);
  const itemsHtml = list
    .map((p, i) => {
      const cover = p.images.find((im) => im.base === p.cover);
      const lieu = PROJECT_INFO[p.slug]?.lieu;
      return `  <li class="typo-item">
    <a class="typo-item__link" href="projets/${p.slug}.html" data-cursor-view>
      <span class="typo-item__num">${pad(i + 1)}</span>
      <span class="typo-item__text">
        <span class="display typo-item__name">${p.name}</span>${lieu ? `\n        <span class="label">${lieu}</span>` : ""}
      </span>
      <div class="typo-item__figure">
${figure({
        img: cover,
        imgPrefix: `images/projects/${p.slug}`,
        sizes: "(max-width: 899px) 100vw, 34vw",
        alt: altFor(p, cover, 0, p.images.length),
        parallax: false,
        cssRatio: false,
        eager: i === 0,
      })}
      </div>
    </a>
  </li>`;
    })
    .join("\n");

  const page = `${head({
    title: `${label}, ${BRAND}`,
    desc: `${label} : ${list.length} projets du cabinet ${BRAND}, architecture et design d'intérieur à Marrakech.`,
    root: "",
  })}
${sidebar("", slug)}
<main id="main">
<section class="project-hero" id="top">
  <div class="project-hero__meta">
    <span class="label">Projets</span>
    <span class="label">${pad(list.length)} projets</span>
  </div>
  <h1 class="display project-hero__title" data-lines data-onload>${lines(label)}</h1>
</section>
<section class="page-body">
<ol class="typo-list">
${itemsHtml}
</ol>
</section>
</main>
${footer("", { skipPromo: true })}`;

  await writeFile(path.join(SITE, `${slug}.html`), page);
}

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
    ["Maître d'ouvrage", info.maitreOuvrage],
    ["Budget", info.budget],
  ].filter(([, v]) => v);
  if (!rows.length) return "";
  return `<dl class="project-info" data-fade>
${rows.map(([k, v]) => `  <div><dt>${k}</dt><dd>${v}</dd></div>`).join("\n")}
</dl>`;
}

projects.forEach((p, pi) => {
  const [cover, ...rest] = orderedViews(p);
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
    title: `${p.name}, projet ${BRAND}`,
    desc: `${p.name}, projet ${p.category.toLowerCase()} du cabinet ${BRAND}, ${p.images.length} vues.`,
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

console.log(`galerie : index + ${CATEGORY_PAGES.length} pages typologie + ${projects.length} pages projet générées.`);
