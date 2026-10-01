// Pipeline images Ochralab v3
// Lit ../../Images/, écrit des WebP responsive dans ../galerie/images/projects/
// et un manifest.json (dimensions, ratios, LQIP, couleur dominante) dans ./
import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Dossier des originaux, hors dépôt. Nommé `_sources` et non `Images` :
// sur un système de fichiers insensible à la casse, la règle d'exclusion
// aurait aussi masqué le dossier `images/` servi par le site.
const SRC = path.resolve(import.meta.dirname, "../_sources");
const OUT = path.resolve(import.meta.dirname, "../images/projects");
const WIDTHS = [480, 960, 1600, 2400];
const QUALITY = 80;

// Ordre éditorial : celui du document rempli par Mehdi (2026-10-01).
// Les noms sont ceux qu'il a donnés ; les slugs (URL, dossiers d'images)
// suivent ces noms, pas les noms de code des dossiers sources.
// Pamur retiré à sa demande (dossier photos « 06 - Pamur - A ANNULER »).
const PROJECTS = [
  { dir: "HOT_BOULOKAT", slug: "jamaa-el-fna", name: "Jamaa el Fna Suites & SPA", category: "Hôtellerie" },
  { dir: "HOT_SIRAYANE", slug: "sirayane", name: "Kimpton Marrakech by Sirayane", category: "Hôtellerie" },
  { dir: "VLA_KACTUS", slug: "kactus", name: "Villa Kactus", category: "Villa" },
  { dir: "VLA_PERREAUX", slug: "perreaux", name: "Maison Perreaux", category: "Villa" },
  { dir: "HOT_ILOT", slug: "ilot", name: "Ilot – Hotel 4* & SPA", category: "Hôtellerie" },
  { dir: "HOT_DEVILS ROCK", slug: "devils-rock", name: "Devils Rock Hotel", category: "Hôtellerie" },
  { dir: "VLA_MBK", slug: "villa-mb", name: "Villa MB", category: "Villa" },
  { dir: "RIA_CHLOUH", slug: "bab-hmer", name: "Riad Bab Hmer", category: "Riad" },
  { dir: "HOT_CASA", slug: "clucia", name: "Hotel Clucia 4*", category: "Hôtellerie" },
  { dir: "VLA_CORTES", slug: "cortes", name: "Villa Cortes", category: "Villa" },
  { dir: "RIA_HERMES", slug: "hermes", name: "Riad Hermes & SPA", category: "Riad" },
  { dir: "RIA_HIRONDELLES", slug: "hirondelles", name: "Riad des Hirondelles & SPA", category: "Riad" },
  { dir: "HOT_TRIANON", slug: "trianon", name: "Trianon", category: "Hôtellerie" },
  { dir: "VLA_MEDICIS", slug: "villa-medicis", name: "Villa Medicis", category: "Villa" },
  { dir: "VLA_CLIFF HOUSE", slug: "cliff-house", name: "Cliff House", category: "Villa" },
];

const COVERS = {
  "jamaa-el-fna": "acimcom-206",
  sirayane: "AVS_OCR_HSIR_EXT_FACADE PRINCIPALE",
  kactus: "VKAC_MASTER_FINALE",
  perreaux: "Gemini_Generated_Image_aajksoaajksoaajk",
  ilot: "ILOT_FACADE",
  "devils-rock": "CHAMBRE_02_Cam01_1",
  "villa-mb": "Gemini_Generated_Image_ylfpwtylfpwtylfp",
  "bab-hmer": "RCHL_SALON",
  clucia: "HCAS_OPTD_6",
  cortes: "Sketch-08",
  hermes: "RHER_PERS A_PATIO",
  hirondelles: "©ISMAILAFAIYSS  - OCHRA ARCHITECTS - RIAD LES HIRONDELLES-55",
  trianon: "Mo-7.",
  "villa-medicis": "VMED_Photo - 3",
  "cliff-house": "4.",
};

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

// Les photos de téléphone (horodatage / WhatsApp) passent en fin de galerie.
const isPhoneShot = (f) => /^20\d{6}_/.test(f) || /^WhatsApp/i.test(f);

// Projets dont la galerie se lit à l'envers de l'ordre naturel des fichiers.
// Jamaa el Fna (ex-Boulokat) : demandé par Bilal le 2026-09-03. Sans cette liste, retraiter
// les photos depuis _sources/ effacerait silencieusement ce choix.
const REVERSE_ORDER = ["jamaa-el-fna"];

const manifest = { generated: new Date().toISOString(), projects: [] };

for (const p of PROJECTS) {
  const srcDir = path.join(SRC, p.dir);
  const outDir = path.join(OUT, p.slug);
  await mkdir(outDir, { recursive: true });

  let files = (await readdir(srcDir))
    .filter((f) => /\.(jpe?g|jfif|png)$/i.test(f))
    .sort((a, b) => {
      const pa = isPhoneShot(a) ? 1 : 0;
      const pb = isPhoneShot(b) ? 1 : 0;
      return pa - pb || a.localeCompare(b, "en", { numeric: true });
    });
  if (REVERSE_ORDER.includes(p.slug)) files = files.reverse();

  const images = [];
  for (const f of files) {
    const srcPath = path.join(srcDir, f);
    const base = slugify(f);
    const img = sharp(srcPath).rotate();
    const meta = await img.metadata();
    const widths = WIDTHS.filter((w) => w <= meta.width);
    if (widths.length === 0) widths.push(meta.width);

    for (const w of widths) {
      await sharp(srcPath)
        .rotate()
        .resize({ width: w })
        .webp({ quality: QUALITY })
        .toFile(path.join(outDir, `${base}-${w}.webp`));
    }

    const lqipBuf = await sharp(srcPath)
      .rotate()
      .resize({ width: 24 })
      .webp({ quality: 40 })
      .toBuffer();
    const { dominant } = await sharp(srcPath).stats();
    const hex = `#${[dominant.r, dominant.g, dominant.b]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")}`;

    images.push({
      original: f,
      base,
      widths,
      w: meta.width,
      h: meta.height,
      ratio: +(meta.width / meta.height).toFixed(4),
      dominant: hex,
      lqip: `data:image/webp;base64,${lqipBuf.toString("base64")}`,
      phone: isPhoneShot(f),
    });
  }

  const coverKey = COVERS[p.slug];
  const cover = images.find((i) => i.original.startsWith(coverKey));
  if (!cover) throw new Error(`${p.slug} : couverture « ${coverKey} » introuvable`);

  manifest.projects.push({ ...p, dir: undefined, cover: cover.base, images });
  console.log(`${p.slug}: ${images.length} images, cover=${cover.base}`);
}

await writeFile(
  path.resolve(import.meta.dirname, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);
console.log("manifest.json écrit.");
