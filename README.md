# Ochralab

Site portfolio de **Mehdi Tolaïmate**, architecte et designer d'intérieur à
Marrakech. Douze projets — hôtellerie, riads, villas — et 80 photographies.

Site statique : pas de serveur applicatif, pas de base de données, pas de
dépendance à installer pour l'afficher. Le HTML est généré à partir des
photos par les scripts de `tools/`.

## Voir le site en local

```bash
python3 -m http.server 8741
```

Puis <http://localhost:8741>.

## Mettre en ligne

Le dépôt se déploie tel quel : la racine **est** le site.

| Hébergeur | Réglages |
| --- | --- |
| Netlify | Aucune commande de build. Publish directory : `.` |
| Vercel | Framework preset : *Other*. Aucune commande de build. Output : `.` |
| Cloudflare Pages | Aucune commande de build. Build output directory : `/` |
| GitHub Pages | Settings → Pages → Source : *Deploy from a branch*, branche `main`, dossier `/ (root)`. Nécessite un dépôt public sur un compte gratuit |

Netlify, Vercel et Cloudflare déploient depuis un dépôt privé sans
difficulté. Après avoir branché un nom de domaine, penser à renseigner
l'URL canonique dans les balises `og:` des pages générées.

## Structure

```
index.html            page d'accueil
projets/*.html        une page par projet (12)
assets/
  styles.css          feuille de style unique
  main.js             animations (GSAP)
  fonts/              Archivo, police variable auto-hébergée
  vendor/             GSAP + ScrollTrigger
images/projects/      WebP responsive, 4 largeurs par photo
tools/                pipeline d'images et générateur de pages
```

## Régénérer les pages

Le HTML est produit par script. **Ne pas modifier les `.html` à la main**,
ils seraient écrasés. Les changements se font dans `assets/styles.css`,
`assets/main.js` ou `tools/build-galerie.mjs`.

```bash
cd tools && npm install
```

```bash
node build-galerie.mjs
```

## Retraiter les photos

Les photos sources du studio ne sont pas versionnées : trop volumineuses
(~300 Mo de JPEG) et inutiles au déploiement. Seules les WebP
redimensionnées le sont.

Pour retraiter, placer les originaux dans un dossier `_sources/` à la
racine du dépôt (ignoré par git), en conservant les dossiers par projet
(`HOT_BOULOKAT`, `RIA_CHLOUH`, `VLA_KACTUS`…), puis :

```bash
cd tools && node process-images.mjs && node build-galerie.mjs
```

Le script réécrit `images/projects/` et `tools/manifest.json`, qui porte
pour chaque photo ses dimensions, son ratio, sa couleur dominante et son
aperçu flou.

### Ajouter un projet

1. Déposer les photos dans `_sources/<CODE>/` (préfixe `HOT_`, `RIA_` ou `VLA_`).
2. Ajouter une entrée à `PROJECTS` et à `COVERS` dans `tools/process-images.mjs`.
3. Relancer les deux commandes ci-dessus.

`VLA_KM8` est un projet à venir, volontairement absent du site.

## Contrôle qualité

Avec le serveur local lancé :

```bash
cd tools && node qa-check.mjs http://localhost:8741/index.html 1440
```

Vérifie que le préchargeur s'est retiré, que toutes les images sont
chargées et pourvues d'un texte alternatif, qu'il n'y a aucun débordement
horizontal, que les cibles tactiles sont assez grandes, qu'il y a un seul
`h1` et aucune erreur console.

`qa-scroll.mjs` rejoue un défilement rapide à la molette et signale toute
image restée masquée. `qa-shot.mjs` produit une capture pleine page.

## Performance

- 80 photos sources converties en WebP responsive sur 4 largeurs
  (480 / 960 / 1600 / 2400) : le navigateur ne télécharge que la largeur utile.
- Page d'accueil sur mobile : 240 Ko d'images pour les douze projets, et
  seule la première est chargée immédiatement.
- Chaque image porte ses dimensions et un aperçu flou intégré au HTML :
  aucun saut de mise en page pendant le chargement.
- Police variable auto-hébergée, sous-ensemble latin, préchargée. Aucun
  appel à Google Fonts : rien ne part vers un tiers.
- GSAP et le script sont différés, ils ne bloquent pas l'affichage.
- `prefers-reduced-motion` respecté : le site reste entièrement lisible
  sans aucune animation.

Contrastes vérifiés WCAG AA sur toute la palette, le plus faible à 4,71:1.

## Contenu à compléter

Rien n'a été inventé. Le site fonctionne sans, mais gagnerait beaucoup à
recevoir de Mehdi :

- **Textes de projet** — une phrase de résumé et deux ou trois paragraphes
  d'intention par projet. C'est ce qui sépare une galerie de photos d'un
  portfolio d'architecte.
- **Fiches techniques** — année, lieu, surface, statut, maîtrise d'ouvrage.
- **Crédits photo** — le photographe, ou « rendu du studio ».
- **Identité** — confirmer l'orthographe « Ochralab », l'adresse de contact
  publique, un téléphone, une adresse postale, les réseaux sociaux.
- **Nom de domaine** — nécessaire pour les URL canoniques et les aperçus
  de partage.

Deux arbitrages sur les images :

- **Boulokat** mélange des photos professionnelles (`acimcom-*`) et des
  prises de vue au téléphone. Les secondes sont reléguées en fin de galerie ;
  elles gagneraient à être retirées, un portfolio se jugeant sur sa photo
  la plus faible.
- **Hermes** n'a que 2 photos, **Chlouh** et **Cortes** 3, contre 23 pour
  Boulokat. Soit on complète, soit on assume le déséquilibre.

## Crédits

Photographies et projets : Ochralab / Mehdi Tolaïmate. Tous droits réservés.
