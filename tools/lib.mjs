// Helpers partagés par les deux générateurs de sites.
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadManifest() {
  const raw = await readFile(
    path.resolve(import.meta.dirname, "manifest.json"),
    "utf8"
  );
  return JSON.parse(raw);
}

export function srcset(prefix, img) {
  return img.widths.map((w) => `${prefix}/${img.base}-${w}.webp ${w}w`).join(", ");
}

export function largest(prefix, img) {
  const w = img.widths[img.widths.length - 1];
  return `${prefix}/${img.base}-${w}.webp`;
}

// Alt text dérivé des noms de fichiers du studio (sans rien inventer).
const TOKENS = [
  [/FACADE PRINCIPALE/i, "façade principale"],
  [/FACADE/i, "façade"],
  [/CHAMBRE TEMOIN/i, "chambre témoin"],
  [/MASTER/i, "chambre principale"],
  [/CHAMBRE/i, "chambre"],
  [/SALON/i, "salon"],
  [/SDB/i, "salle de bain"],
  [/ROOFTOP/i, "rooftop"],
  [/PATIO/i, "patio"],
  [/LOBBY/i, "lobby"],
  [/PISCINE/i, "piscine"],
  [/ENTREE/i, "entrée"],
  [/CLOTURE/i, "clôture"],
  [/COULOIR/i, "couloir"],
  [/HALL/i, "hall"],
  [/CIRCULATION/i, "circulation"],
  [/BLOC NORD/i, "bloc nord"],
  [/EXT/i, "extérieur"],
];

export function altFor(project, img, i, total) {
  for (const [re, label] of TOKENS) {
    if (re.test(img.original)) return `${project.name}, ${label}`;
  }
  return `${project.name}, vue ${i + 1} sur ${total}`;
}

export function nextOf(projects, i) {
  return projects[(i + 1) % projects.length];
}

export const pad = (n) => String(n).padStart(2, "0");
