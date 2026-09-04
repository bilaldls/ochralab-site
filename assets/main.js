/* OCHRALAB — Galerie : chorégraphie GSAP */
(function () {
  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) document.documentElement.classList.add("reduced-motion");

  var topbar = document.querySelector(".topbar");
  var onScroll = function () {
    if (topbar) topbar.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* La page active du menu latéral est marquée à la génération
     (aria-current posé par sidebar() dans build-galerie.mjs) : Projets,
     Studio et Contact sont désormais trois pages, plus des ancres d'une
     mosaïque qui défile sans fin. Aucun repérage au scroll à faire ici. */

  /* Menu mobile */
  var overlay = document.querySelector(".menu-overlay");
  var openBtn = document.querySelector(".menu-btn");
  var closeBtn = document.querySelector(".menu-close");
  function setMenu(open) {
    overlay.classList.toggle("is-open", open);
    openBtn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) closeBtn.focus();
    else openBtn.focus();
  }
  if (openBtn) {
    openBtn.addEventListener("click", function () { setMenu(true); });
    closeBtn.addEventListener("click", function () { setMenu(false); });
    overlay.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) setMenu(false);
    });
  }

  /* Fondu des images au chargement (LQIP -> net) */
  document.querySelectorAll("figure > img").forEach(function (img) {
    var done = function () { img.style.opacity = 1; };
    if (img.complete) return;
    img.style.opacity = 0;
    img.style.transition = "opacity 0.5s ease";
    img.addEventListener("load", done);
    img.addEventListener("error", done);
  });

  /* ---------- Filtre par typologie (Villas / Hôtels / Riads) ----------
     Indépendant de GSAP : les vignettes qui ne correspondent pas à la
     catégorie choisie sont masquées via l'attribut natif `hidden`. Quand
     la mosaïque boucle (plus bas), applyFilterToLoop — assignée par
     setupLoop — reconstruit les colonnes avec les seules vignettes
     visibles ; sinon la mise en page CSS (`columns`) se recompose seule
     autour des vignettes masquées. L'état vit dans le hash de l'URL
     (#villas, #hotels, #riads) et non en session : revenir sur l'accueil
     sans hash montre toujours la galerie complète. */
  var CATEGORY_BY_HASH = { villas: "Villa", hotels: "Hôtellerie", riads: "Riad" };
  var HASH_BY_CATEGORY = { Villa: "villas", "Hôtellerie": "hotels", Riad: "riads" };
  var activeCategory = null;
  var applyFilterToLoop = null;
  // Capturées une fois pour toutes, avant tout filtrage : la mosaïque en
  // boucle détache du DOM les vignettes écartées (voir setupLoop plus
  // bas), document.querySelectorAll ne les retrouverait plus ensuite.
  var allTiles = Array.prototype.slice.call(document.querySelectorAll(".tile[data-category]"));

  // Fisher-Yates : un nouvel ordre à chaque arrivée sur la galerie et à
  // chaque changement de filtre (voir applyFilter et setupLoop plus bas).
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function setTilesVisibility() {
    allTiles.forEach(function (t) {
      t.hidden = !!activeCategory && t.dataset.category !== activeCategory;
    });
  }
  function markActiveFilters() {
    document.querySelectorAll("[data-filter]").forEach(function (a) {
      a.setAttribute("aria-current", a.dataset.filter === activeCategory ? "true" : "false");
    });
    document.querySelectorAll("[data-filter-clear]").forEach(function (a) {
      a.setAttribute("aria-current", activeCategory ? "false" : "true");
    });
  }
  // Repli sans mosaïque en boucle (mouvement réduit ou GSAP absent) :
  // les vignettes vivent à plat dans .loop__grid, la mise en page CSS
  // (`columns`) suit leur ordre DOM. On le mélange nous-mêmes ici. Avec
  // la boucle active, setupLoop s'en charge à sa façon (voir plus bas) ;
  // ce repli ne s'exécute donc que tant qu'applyFilterToLoop est vide.
  function reorderTilesInDom() {
    var grid = document.querySelector(".loop__grid");
    if (!grid) return;
    shuffle(allTiles).forEach(function (t) { grid.appendChild(t); });
  }
  function applyFilter(category) {
    activeCategory = category || null;
    setTilesVisibility();
    markActiveFilters();
    if (applyFilterToLoop) applyFilterToLoop();
    else reorderTilesInDom();
  }

  // Sur les autres pages (Studio, Contact, projet…), ces mêmes liens
  // pointent vers l'accueil : navigation ordinaire, pas d'interception.
  var onGallery = !!document.querySelector(".loop");
  document.querySelectorAll("[data-filter], [data-filter-clear]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (!onGallery) return;
      e.preventDefault();
      if (a.hasAttribute("data-filter-clear")) {
        applyFilter(null);
      } else {
        var cat = a.dataset.filter;
        applyFilter(activeCategory === cat ? null : cat);
      }
      // Reflète l'état réel après bascule (pas l'URL statique du lien
      // cliqué) : un second clic sur le même filtre l'annule et doit
      // retirer le hash, pas le remettre.
      var newHash = activeCategory ? HASH_BY_CATEGORY[activeCategory] : "";
      history.replaceState(null, "", newHash ? "#" + newHash : location.pathname + location.search);
    });
  });
  if (onGallery) {
    applyFilter(CATEGORY_BY_HASH[location.hash.replace("#", "")] || null);
  }

  if (reduced || typeof gsap === "undefined") {
    // Pas d'animation : le préchargeur ne doit pas rester à l'écran.
    var preFallback = document.querySelector(".preloader");
    if (preFallback) preFallback.remove();
    document.body.style.overflow = "";
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power3.out" });

  /* ---------- Preloader (index, première visite seulement) ---------- */
  var pre = document.querySelector(".preloader");
  var seen = false;
  try { seen = sessionStorage.getItem("ochralab-seen") === "1"; } catch (e) {}
  var intro = gsap.timeline();
  if (pre && !seen) {
    try { sessionStorage.setItem("ochralab-seen", "1"); } catch (e) {}
    document.body.style.overflow = "hidden";
    intro
      .to(pre.querySelectorAll(".preloader__word span"), {
        y: 0, duration: 0.45, stagger: 0.035, ease: "power3.out",
      })
      .to(pre.querySelectorAll(".preloader__word span"), {
        y: "-110%", duration: 0.34, stagger: 0.02, ease: "power3.in", delay: 0.15,
      })
      .to(pre, {
        yPercent: -100, duration: 0.5, ease: "power4.inOut",
        onComplete: function () {
          pre.remove();
          document.body.style.overflow = "";
        },
      });
    // Garde-fou : si la timeline se fige (onglet en arrière-plan, rAF
    // gelé…), le préchargeur s'efface quand même et libère le défilement.
    setTimeout(function () {
      if (pre && pre.isConnected) {
        pre.remove();
        document.body.style.overflow = "";
      }
    }, 2200);
  } else if (pre) {
    pre.remove();
  }

  /* ---------- Révélations de lignes (héros / titres) ---------- */
  document.querySelectorAll("[data-lines]").forEach(function (el) {
    var inners = el.querySelectorAll(".line-inner");
    if (!inners.length) return;
    if (el.hasAttribute("data-onload")) {
      intro.to(inners, { y: 0, duration: 1, stagger: 0.12, ease: "power4.out" }, pre && !seen ? "-=0.35" : 0.1);
    } else {
      gsap.to(inners, {
        y: 0, duration: 1, stagger: 0.12, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    }
  });

  /* ---------- Fondus au scroll ---------- */
  document.querySelectorAll("[data-fade]").forEach(function (el) {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9,
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  /* ---------- Révélation des images (rideau + dézoom) ---------- */
  document.querySelectorAll("figure[data-reveal]").forEach(function (fig) {
    var img = fig.querySelector("img");
    var tl = gsap.timeline({
      scrollTrigger: { trigger: fig, start: "top 85%" },
    });
    tl.to(fig, { clipPath: "inset(0 0 0% 0)", duration: 1.1, ease: "power4.inOut" });
    if (img) tl.to(img, { scale: 1, duration: 1.4, ease: "power3.out" }, "<");
  });

  /* ---------- Parallax doux (desktop) ----------
     matchMedia plutôt qu'un test unique : la rotation d'une tablette
     franchit le seuil et l'animation se recompose proprement. */
  gsap.matchMedia().add("(min-width: 900px)", function () {
    document.querySelectorAll("[data-parallax] img").forEach(function (img) {
      gsap.fromTo(
        img,
        { yPercent: -6 },
        {
          yPercent: 6, ease: "none",
          scrollTrigger: { trigger: img.closest("figure"), scrub: 0.6 },
        }
      );
    });
  });

  /* ---------- Curseur personnalisé ---------- */
  var cursor = document.querySelector(".cursor");
  if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    cursor.style.opacity = 0;
    var xTo = gsap.quickTo(cursor, "x", { duration: 0.18, ease: "power3.out" });
    var yTo = gsap.quickTo(cursor, "y", { duration: 0.18, ease: "power3.out" });
    window.addEventListener("mousemove", function (e) {
      cursor.style.opacity = 1;
      xTo(e.clientX);
      yTo(e.clientY);
    });
    // 92px et non 72 : les noms de projet composés de deux mots
    // (« Devils Rock ») ont besoin d'un peu plus de place que « Voir ».
    document.querySelectorAll("[data-cursor-view]").forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        cursor.classList.add("is-view");
        cursor.textContent = el.dataset.name || "Voir";
        gsap.to(cursor, { width: 92, height: 92, x: "-=0", duration: 0.3 });
        gsap.to(cursor, { marginLeft: -46, marginTop: -46, duration: 0.3 });
      });
      el.addEventListener("mouseleave", function () {
        cursor.classList.remove("is-view");
        cursor.textContent = "";
        gsap.to(cursor, { width: 12, height: 12, marginLeft: -6, marginTop: -6, duration: 0.3 });
      });
    });
    gsap.set(cursor, { marginLeft: -6, marginTop: -6 });
  }

  /* ============================================================
     Mosaïque infinie
     Le défilement reste natif : aucune interception de la molette.
     Les vignettes sont réparties en colonnes, dont on égalise la hauteur
     de cycle en répartissant l'écart sur les marges. Chaque colonne est
     ensuite répétée quatre fois. Passé deux cycles, on retire exactement
     un cycle à la position de défilement : le contenu étant identique,
     le saut est invisible et la page ne finit jamais.
     ============================================================ */
  (function setupLoop() {
    var section = document.querySelector(".loop");
    if (!section) return;
    var grid = section.querySelector(".loop__grid");
    var originals = Array.prototype.slice.call(grid.querySelectorAll(".tile"));
    if (!originals.length) return;

    var REPEATS = 4;
    var cycle = 0;
    var loopTop = 0;
    var active = false;

    // Sous-ensemble réellement affiché, dans un ordre tiré au hasard une
    // fois par arrivée / par changement de filtre : `shuffledPool` est mis
    // en cache et réutilisé tel quel par les reconstructions internes
    // (redimensionnement) pour ne pas rebattre les cartes sous les yeux
    // de quelqu'un qui n'a fait que redimensionner sa fenêtre. Seul un
    // vrai changement de filtre (reshuffle(), plus bas) en tire un nouveau.
    // Les vignettes écartées restent référencées par `originals`, juste
    // détachées du DOM le temps que le filtre change.
    var shuffledPool = null;
    function reshuffle() {
      var items = activeCategory
        ? originals.filter(function (t) { return t.dataset.category === activeCategory; })
        : originals;
      shuffledPool = shuffle(items);
    }
    function pool() {
      if (!shuffledPool) reshuffle();
      return shuffledPool;
    }

    function teardown() {
      section.classList.remove("is-looping");
      grid.innerHTML = "";
      active = false;
    }

    // Hauteur qu'une vignette occupera dans une colonne de largeur donnée,
    // lue depuis --ratio (posé en style inline par le générateur), sa marge
    // propre comprise. Sert à équilibrer les colonnes avant même de les
    // remplir, plutôt que de corriger après coup.
    function tileHeight(tile, colWidth, gapPx) {
      var v = tile.querySelector("figure").style.getPropertyValue("--ratio");
      var parts = v.split("/").map(function (s) { return parseFloat(s); });
      var ratio = parts[0] && parts[1] ? parts[0] / parts[1] : 1.5;
      return colWidth / ratio + gapPx;
    }

    function build() {
      teardown();
      var items = pool();
      if (!items.length) return; // catégorie vide : ne devrait pas arriver

      var colCount = window.matchMedia("(min-width: 900px)").matches ? 3 : 2;
      var gapPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--tile-gap")) || 3;
      var colWidth = (grid.getBoundingClientRect().width - gapPx * (colCount - 1)) / colCount;

      var cols = [];
      for (var c = 0; c < colCount; c++) {
        var el = document.createElement("div");
        el.className = "loop__col";
        cols.push({ el: el, tiles: [], estH: 0 });
        grid.appendChild(el);
      }
      // Chaque vignette rejoint la colonne actuellement la plus courte
      // (estimée depuis son ratio, pas mesurée après coup) : les colonnes
      // finissent à des hauteurs proches, sans avoir à les rattraper ensuite.
      items.forEach(function (tile) {
        tile.style.marginBottom = "";
        var target = cols[0];
        cols.forEach(function (c) { if (c.estH < target.estH) target = c; });
        target.el.appendChild(tile);
        target.tiles.push(tile);
        target.estH += tileHeight(tile, colWidth, gapPx);
      });

      section.classList.add("is-looping");

      // Chaque série vit dans un conteneur flex : à l'intérieur, les marges
      // ne fusionnent pas. Mesurée en bloc ordinaire, la hauteur excluait la
      // marge basse de la dernière vignette et faussait le cycle.
      cols.forEach(function (col) {
        var serie = document.createElement("div");
        serie.className = "loop__set";
        col.tiles.forEach(function (t) { serie.appendChild(t); });
        col.el.appendChild(serie);
        col.serie = serie;
      });

      cols.forEach(function (col) {
        col.h = col.serie.getBoundingClientRect().height;
      });
      var maxH = Math.max.apply(null, cols.map(function (c) { return c.h; }));
      cycle = Math.ceil(maxH);

      cols.forEach(function (col) {
        // Le reliquat est déposé en un seul point, en fin de série, plutôt
        // que réparti sur chaque vignette : avec un écart aussi resserré
        // (--tile-gap), gonfler chaque marge briserait l'effet photos
        // jointives. Un point de compensation unique ne se voit qu'à la
        // couture, déjà invisible puisqu'elle est identique à chaque tour.
        var reste = cycle - col.h;
        if (reste > 0.5) {
          var filler = document.createElement("div");
          filler.setAttribute("aria-hidden", "true");
          filler.style.height = reste + "px";
          col.serie.appendChild(filler);
        }
        // Hauteur imposée : l'intervalle entre deux séries vaut exactement
        // `cycle`, sans dérive possible au sous-pixel.
        col.serie.style.height = cycle + "px";

        for (var k = 1; k < REPEATS; k++) {
          var copie = col.serie.cloneNode(true);
          // Décoratif : hors lecteurs d'écran et hors parcours clavier.
          copie.setAttribute("aria-hidden", "true");
          copie.querySelectorAll(".tile").forEach(function (t) {
            t.setAttribute("tabindex", "-1");
            var img = t.querySelector("img");
            if (img) {
              img.setAttribute("loading", "lazy");
              img.removeAttribute("fetchpriority");
            }
          });
          col.el.appendChild(copie);
        }
      });

      loopTop = section.getBoundingClientRect().top + window.scrollY;
      active = cycle > 0;
    }

    function onScroll() {
      if (!active || !cycle) return;
      var p = window.scrollY - loopTop;
      // Fenêtre bornée à un seul cycle : un défilement très rapide (molette
      // à fond, touche Fin) peut dépasser directement cycle*3 en un saut,
      // et reculer d'un cycle à cet endroit-là déplacerait la vue à un
      // endroit qui n'a plus rien à voir avec ce que l'utilisateur regarde.
      if (p > cycle * 2 && p < cycle * 3) {
        // La feuille de style déclare scroll-behavior: smooth ; sans cette
        // neutralisation le repositionnement s'animerait et la page
        // remonterait visiblement au lieu de sauter.
        var root = document.documentElement;
        var memo = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        window.scrollTo(0, window.scrollY - cycle);
        root.style.scrollBehavior = memo;
      }
    }

    // Sans mouvement : mosaïque ordinaire, finie, défilement normal.
    if (reduced) return;

    function sync() {
      build();
    }
    if (document.readyState === "complete") sync();
    else window.addEventListener("load", sync);

    window.addEventListener("scroll", onScroll, { passive: true });
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(sync, 250);
    });

    // Changer de filtre change la hauteur totale : l'ancienne position de
    // défilement n'a plus de sens, on revient en haut de la mosaïque.
    // reshuffle() d'abord : un nouveau tirage à chaque changement, pas
    // seulement au premier chargement.
    applyFilterToLoop = function () {
      reshuffle();
      var top = section.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > top) {
        var root = document.documentElement;
        var memo = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        window.scrollTo(0, top);
        root.style.scrollBehavior = memo;
      }
      sync();
    };
  })();

  /* Recalage après chargement complet (images) */
  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
  });
})();
