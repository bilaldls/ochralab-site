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

// Ordre éditorial : projets riches d'abord, catégories alternées.
const PROJECTS = [
  { dir: "HOT_BOULOKAT", slug: "boulokat", name: "Boulokat", category: "Hôtellerie" },
  { dir: "HOT_SIRAYANE", slug: "sirayane", name: "Sirayane", category: "Hôtellerie" },
  { dir: "VLA_KACTUS", slug: "kactus", name: "Kactus", category: "Villa" },
  { dir: "VLA_PERREAUX", slug: "perreaux", name: "Perreaux", category: "Villa" },
  { dir: "HOT_ILOT", slug: "ilot", name: "Ilot", category: "Hôtellerie" },
  { dir: "RIA_PAMUR", slug: "pamur", name: "Pamur", category: "Riad" },
  { dir: "HOT_DEVILS ROCK", slug: "devils-rock", name: "Devils Rock", category: "Hôtellerie" },
  { dir: "VLA_MBK", slug: "mbk", name: "MBK", category: "Villa" },
  { dir: "RIA_CHLOUH", slug: "chlouh", name: "Chlouh", category: "Riad" },
  { dir: "HOT_CASA", slug: "casa", name: "Casa", category: "Hôtellerie" },
  { dir: "VLA_CORTES", slug: "cortes", name: "Cortes", category: "Villa" },
  { dir: "RIA_HERMES", slug: "hermes", name: "Hermes", category: "Riad" },
];

const COVERS = {
  boulokat: "acimcom-320",
  sirayane: "AVS_OCR_HSIR_EXT_FACADE PRINCIPALE",
  kactus: "VKAC_MASTER_FINALE",
  perreaux: "VPER_PERS_OPTION A_4_PISCINE",
  ilot: "ILOT_PERS 2_FACADE PRINCIPALE",
  pamur: "SALON_01_CAM01_1",
  "devils-rock": "CHAMBRE_02_Cam01_1",
  mbk: "VMBK_FACADE PRINCIPALE",
  chlouh: "RCHL_SALON",
  casa: "HCAS_OPTD_6",
  cortes: "VCOR_TYPO 2_PERS 2",
  hermes: "WhatsApp Image 2025-07-01 at 10.51.39",
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

const manifest = { generated: new Date().toISOString(), projects: [] };

for (const p of PROJECTS) {
  const srcDir = path.join(SRC, p.dir);
  const outDir = path.join(OUT, p.slug);
  await mkdir(outDir, { recursive: true });

  const files = (await readdir(srcDir))
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort((a, b) => {
      const pa = isPhoneShot(a) ? 1 : 0;
      const pb = isPhoneShot(b) ? 1 : 0;
      return pa - pb || a.localeCompare(b, "en", { numeric: true });
    });

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
  const cover =
    images.find((i) => i.original.startsWith(coverKey)) ?? images[0];

  manifest.projects.push({ ...p, dir: undefined, cover: cover.base, images });
  console.log(`${p.slug}: ${images.length} images, cover=${cover.base}`);
}

await writeFile(
  path.resolve(import.meta.dirname, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);
console.log("manifest.json écrit.");
