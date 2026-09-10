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
    // Pas d'animation : le rideau ne doit pas rester à l'écran, et les
    // liens de navigation gardent leur comportement normal.
    var preFallback = document.querySelector(".preloader");
    if (preFallback) preFallback.remove();
    document.documentElement.classList.remove("is-entering");
    document.body.style.overflow = "";
    try {
      sessionStorage.removeItem("ochralab-transition");
      sessionStorage.removeItem("ochralab-transition-label");
    } catch (e) {}
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power3.out" });

  /* ---------- Rideau de chargement / transition entre pages ----------
     Un même élément (.preloader) sert dans les deux sens :
       • à l'arrivée : si on vient d'un clic de navigation (drapeau de
         session) ou de la toute première visite de l'accueil, il couvre
         déjà l'écran — classe is-entering posée avant rendu par le
         <head> — et se retire ;
       • au départ : un clic sur un lien [data-transition] le redéploie
         par-dessus la page avant de charger la suivante.
     Le mouvement est continu d'une page à l'autre : le rideau et le mot
     montent toujours vers le haut. Le mot affiché est « OCHRALAB » au
     lancement du site, puis le nom de la section cliquée (Projets,
     Studio, Contact, Villas…). */
  var pre = document.querySelector(".preloader");
  var letters = pre ? pre.querySelectorAll(".preloader__word span") : [];
  if (pre) pre.style.animation = "none"; // on coupe le filet CSS : main.js gère

  // Remplace le mot du rideau et réexpose ses lettres (une par <span>).
  function setWord(text) {
    var word = pre.querySelector(".preloader__word");
    word.innerHTML = String(text).toUpperCase().split("").map(function (c) {
      return "<span>" + (c === " " ? "&nbsp;" : c) + "</span>";
    }).join("");
    letters = word.querySelectorAll("span");
  }

  var firstVisit = false;
  try {
    firstVisit = sessionStorage.getItem("ochralab-seen") !== "1";
    sessionStorage.setItem("ochralab-seen", "1");
  } catch (e) {}
  var cameFromClick = false;
  try {
    cameFromClick = sessionStorage.getItem("ochralab-transition") === "1";
    sessionStorage.removeItem("ochralab-transition");
  } catch (e) {}

  var entering = document.documentElement.classList.contains("is-entering");
  var intro = gsap.timeline();

  function endEnter() {
    document.documentElement.classList.remove("is-entering");
    gsap.set(pre, { yPercent: -100, visibility: "hidden", pointerEvents: "none" });
    document.body.style.overflow = "";
    ScrollTrigger.refresh();
  }

  if (pre && entering) {
    document.body.style.overflow = "hidden";
    gsap.set(pre, { yPercent: 0, visibility: "visible" });
    if (firstVisit && !cameFromClick) {
      // Lancement du site : « OCHRALAB » se dévoile d'abord.
      setWord("Ochralab");
      gsap.set(letters, { y: "110%" });
      intro
        .to(letters, { y: 0, duration: 0.45, stagger: 0.035, ease: "power3.out" })
        .to(letters, { y: "-110%", duration: 0.34, stagger: 0.02, ease: "power3.in", delay: 0.15 })
        .to(pre, { yPercent: -100, duration: 0.5, ease: "power4.inOut", onComplete: endEnter });
    } else {
      // Transition : on reprend le nom de la section cliquée, déjà en
      // place (continuité avec la page précédente) ; il finit sa montée
      // et le rideau se retire.
      var enterWord = "Ochralab";
      try { enterWord = sessionStorage.getItem("ochralab-transition-label") || "Ochralab"; } catch (e) {}
      try { sessionStorage.removeItem("ochralab-transition-label"); } catch (e) {}
      setWord(enterWord);
      gsap.set(letters, { y: 0 });
      intro
        .to(letters, { y: "-110%", duration: 0.32, stagger: 0.022, ease: "power3.in" })
        .to(pre, { yPercent: -100, duration: 0.5, ease: "power4.inOut", onComplete: endEnter }, "-=0.14");
    }
    // Garde-fou : si la timeline se fige, on retire le rideau quand même.
    setTimeout(function () {
      if (pre && document.documentElement.classList.contains("is-entering")) endEnter();
    }, 1800);
  } else if (pre) {
    gsap.set(pre, { yPercent: -100, visibility: "hidden" });
  }

  /* ---------- Rideau au départ (clic sur un lien [data-transition]) ---------- */
  if (pre) {
    var leaving = false;
    var samePath = function (u) {
      return u.split("#")[0].split("?")[0].replace(/index\.html$/, "").replace(/\/$/, "");
    };
    document.querySelectorAll("a[data-transition]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (
          leaving || e.defaultPrevented || e.button !== 0 ||
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank"
        ) return;
        // Lien vers la page courante : navigation par défaut (aucun rideau).
        if (samePath(a.href) === samePath(location.href)) return;
        e.preventDefault();
        leaving = true;
        var href = a.href;
        var label = a.dataset.transitionLabel || a.textContent.trim() || "Ochralab";
        try {
          sessionStorage.setItem("ochralab-transition", "1");
          sessionStorage.setItem("ochralab-transition-label", label);
        } catch (err) {}
        document.body.style.overflow = "hidden";
        setWord(label);
        gsap.set(pre, { visibility: "visible", opacity: 1, yPercent: -100, pointerEvents: "auto" });
        gsap.set(letters, { y: "110%" });
        var gone = false;
        var go = function () {
          if (gone) return;
          gone = true;
          window.location.href = href;
        };
        gsap.timeline({ onComplete: go })
          .to(pre, { yPercent: 0, duration: 0.42, ease: "power2.inOut" })
          .to(letters, { y: 0, duration: 0.38, stagger: 0.028, ease: "power3.out" }, "-=0.26");
        // Garde-fou : la navigation part quoi qu'il arrive.
        setTimeout(go, 1100);
      });
    });
  }

  /* ---------- Révélations de lignes (héros / titres) ---------- */
  document.querySelectorAll("[data-lines]").forEach(function (el) {
    var inners = el.querySelectorAll(".line-inner");
    if (!inners.length) return;
    if (el.hasAttribute("data-onload")) {
      intro.to(inners, { y: 0, duration: 1, stagger: 0.12, ease: "power4.out" }, entering ? "-=0.35" : 0.1);
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
     Mosaïque infinie — ordre tiré au sort à chaque tour
     Le défilement reste natif : aucune interception de la molette.
     Les vignettes sont réparties en colonnes. Chaque colonne empile
     REPEATS exemplaires d'un même cycle, tous forcés à la même hauteur.
     Passé l'avant-dernier cycle, on retire d'un coup JUMP cycles à la
     position de défilement : le cycle d'arrivée et celui d'où l'on part
     sont identiques (« paire d'ancrage »), le saut ne se voit donc pas
     et la page ne finit jamais.

     Nouveau : entre deux coutures, les quatre cycles intermédiaires (ceux
     que l'œil parcourt vraiment) reçoivent chacun un ordre indépendant,
     tiré au sort pendant qu'ils sont hors de l'écran. La paire d'ancrage,
     elle, est rebattue elle aussi — d'un même tirage pour ses deux cycles,
     seule contrainte : le cycle d'où part le bond et celui où il retombe
     doivent rester identiques l'un à l'autre, sans quoi la couture se
     verrait — une fois remontée au-dessus de la ligne de flottaison.
     Résultat : chaque écran de mosaïque est un agencement neuf, la
     mosaïque ne se répète jamais, et chaque couture reste invisible.
     ============================================================ */
  (function setupLoop() {
    var section = document.querySelector(".loop");
    if (!section) return;
    var grid = section.querySelector(".loop__grid");
    var originals = Array.prototype.slice.call(grid.querySelectorAll(".tile"));
    if (!originals.length) return;

    // 8 cycles empilés : cycle 0 (au chargement), ancrage 1 et 6/7,
    // cycles indépendants rebattus 2, 3, 4 et 5. On recule de JUMP = 5
    // cycles à la couture (du cycle 6 au cycle 1, tous deux ancrés donc
    // identiques). Les quatre cycles du milieu, eux, sont tous distincts.
    var REPEATS = 8;
    var JUMP = REPEATS - 3;
    var ANCHOR = [0, 1, REPEATS - 2, REPEATS - 1]; // cycles maintenus identiques
    var MID = [];                                   // cycles rebattus à chaque tour
    for (var mi = 2; mi <= REPEATS - 3; mi++) MID.push(mi);

    var cols = [];        // { el, members:[tile…], baseH, sets:[loop__set…] }
    var cycle = 0;
    var loopTop = 0;
    var active = false;
    var anchorDone = false; // paire d'ancrage déjà rebattue pour ce tour ?
    var jumping = false;    // garde-fou de réentrance pendant le recalage

    // Sous-ensemble affiché, dans un ordre tiré au hasard une fois par
    // arrivée / changement de filtre (cache réutilisé au redimensionnement
    // pour ne pas rebattre les cartes sous les yeux de l'utilisateur).
    var shuffledPool = null;
    function reshufflePool() {
      var items = activeCategory
        ? originals.filter(function (t) { return t.dataset.category === activeCategory; })
        : originals;
      shuffledPool = shuffle(items);
    }
    function pool() {
      if (!shuffledPool) reshufflePool();
      return shuffledPool;
    }

    function teardown() {
      section.classList.remove("is-looping");
      grid.innerHTML = "";
      cols = [];
      active = false;
    }

    // Hauteur qu'une vignette occupera dans une colonne de largeur donnée,
    // lue depuis --ratio (posé en style inline par le générateur), marge
    // comprise. Sert à équilibrer les colonnes avant de les remplir.
    function tileHeight(tile, colWidth, gapPx) {
      var v = tile.querySelector("figure").style.getPropertyValue("--ratio");
      var parts = v.split("/").map(function (s) { return parseFloat(s); });
      var ratio = parts[0] && parts[1] ? parts[0] / parts[1] : 1.5;
      return colWidth / ratio + gapPx;
    }

    // Fabrique un cycle (un « loop__set ») pour une colonne, à partir des
    // vignettes d'origine dans l'ordre demandé. decorative : le cycle est
    // cloné (hors parcours clavier, hors lecteurs d'écran, images lazy) ;
    // sinon il porte les vignettes réelles (cycle 0, celui qui compte pour
    // le référencement et la première image).
    function makeSet(orderedOriginals, decorative) {
      var serie = document.createElement("div");
      serie.className = "loop__set";
      if (decorative) serie.setAttribute("aria-hidden", "true");
      var nodes = orderedOriginals.map(function (orig) {
        var t = decorative ? orig.cloneNode(true) : orig;
        t.style.marginBottom = "";
        if (decorative) {
          t.setAttribute("tabindex", "-1");
          var img = t.querySelector("img");
          if (img) { img.setAttribute("loading", "lazy"); img.removeAttribute("fetchpriority"); }
        }
        serie.appendChild(t);
        return t;
      });
      serie._src = orderedOriginals.slice(); // vignettes d'origine, pour l'identité
      serie._nodes = nodes;                  // nœuds réels de CE cycle, en parallèle
      return serie;
    }

    // Cran de compensation en fin de cycle : l'écart resté entre le contenu
    // et `cycle` est déposé en un seul point (à la couture, déjà invisible)
    // plutôt que réparti sur chaque marge, ce qui briserait l'effet
    // « photos jointives ». Hauteur du cycle ensuite imposée au pixel.
    function padSet(serie, fillH) {
      var old = serie.querySelector("[data-filler]");
      if (old) old.remove();
      if (fillH > 0.5) {
        var filler = document.createElement("div");
        filler.setAttribute("aria-hidden", "true");
        filler.setAttribute("data-filler", "1");
        filler.style.height = fillH + "px";
        serie.appendChild(filler);
      }
      serie.style.height = cycle + "px";
    }

    // Réordonne en place les vignettes d'un cycle déjà en DOM. La hauteur
    // totale ne bouge pas (mêmes vignettes, mêmes marges) : le cran de
    // compensation reste valable et repart simplement en dernier.
    function applyOrder(serie, orderedOriginals) {
      var bySrc = new Map();
      serie._src.forEach(function (o, i) { bySrc.set(o, serie._nodes[i]); });
      orderedOriginals.forEach(function (o) {
        var n = bySrc.get(o);
        if (n) serie.appendChild(n);
      });
      var filler = serie.querySelector("[data-filler]");
      if (filler) serie.appendChild(filler);
      serie._src = orderedOriginals.slice();
      serie._nodes = orderedOriginals.map(function (o) { return bySrc.get(o); });
    }

    // Un tirage qui évite de coller la même photo de part et d'autre d'une
    // couture inter-cycle : la première vignette diffère de `avoidFirst`
    // (dernière du cycle du dessus) et la dernière de `avoidLast` (première
    // du cycle du dessous). Quelques essais suffisent dès 3 vignettes ; en
    // dessous on renvoie le dernier tirage tel quel.
    function orderAvoiding(members, avoidFirst, avoidLast) {
      var cand = shuffle(members);
      for (var i = 0; i < 40; i++) {
        var okF = !avoidFirst || cand[0] !== avoidFirst;
        var okL = !avoidLast || cand[cand.length - 1] !== avoidLast;
        if (okF && okL) return cand;
        cand = shuffle(members);
      }
      return cand;
    }

    // Rebat les cycles `idxs` d'une colonne, dans l'ordre, chacun contraint
    // contre ses voisins actuels : pas de photo répétée à la jointure avec
    // le cycle du dessus, ni (si ce voisin n'est pas lui-même rebattu) avec
    // celui du dessous. Hors écran uniquement.
    function reshuffleRange(col, idxs) {
      idxs.slice().sort(function (a, b) { return a - b; }).forEach(function (k) {
        var s = col.sets[k];
        if (!s) return;
        var prev = col.sets[k - 1];
        var next = col.sets[k + 1];
        var avoidFirst = prev ? prev._src[prev._src.length - 1] : null;
        var avoidLast = next && idxs.indexOf(k + 1) === -1 ? next._src[0] : null;
        applyOrder(s, orderAvoiding(col.members, avoidFirst, avoidLast));
      });
    }
    function reshuffleSets(indices) {
      cols.forEach(function (col) { reshuffleRange(col, indices); });
    }

    // La paire d'ancrage doit rester identique membre à membre pour que la
    // couture ne se voie pas : un seul tirage, appliqué à tous ses cycles.
    // Puis on recale les cycles frais qui la bordent (2 et l'avant-dernier
    // du milieu) contre ce nouvel ordre, pour ne pas rouvrir de doublon.
    function reshuffleAnchor() {
      cols.forEach(function (col) {
        var order = shuffle(col.members);
        ANCHOR.forEach(function (k) {
          if (col.sets[k]) applyOrder(col.sets[k], order);
        });
        reshuffleRange(col, [MID[0], MID[MID.length - 1]]);
      });
    }

    function build() {
      teardown();
      var items = pool();
      if (!items.length) return; // catégorie vide : ne devrait pas arriver

      var colCount = window.matchMedia("(min-width: 900px)").matches ? 3 : 2;
      var gapPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--tile-gap")) || 3;
      var colWidth = (grid.getBoundingClientRect().width - gapPx * (colCount - 1)) / colCount;

      for (var c = 0; c < colCount; c++) {
        var el = document.createElement("div");
        el.className = "loop__col";
        cols.push({ el: el, members: [], estH: 0, sets: [] });
        grid.appendChild(el);
      }
      // Chaque vignette rejoint la colonne la plus courte (estimée depuis
      // son ratio) : les colonnes finissent à des hauteurs proches.
      items.forEach(function (tile) {
        var target = cols[0];
        cols.forEach(function (col) { if (col.estH < target.estH) target = col; });
        target.members.push(tile);
        target.estH += tileHeight(tile, colWidth, gapPx);
      });

      section.classList.add("is-looping");

      // Cycle 0 par colonne (vignettes réelles, ordre du pool), mesuré dans
      // son conteneur flex — marges non fusionnées — pour fixer `cycle`.
      cols.forEach(function (col) {
        var set0 = makeSet(col.members.slice(), false);
        col.el.appendChild(set0);
        col.sets.push(set0);
        col.baseH = set0.getBoundingClientRect().height;
      });
      cycle = Math.ceil(Math.max.apply(null, cols.map(function (c) { return c.baseH; })));

      // Empilement : cycle 0 réel (déjà en place), le reste cloné. La paire
      // d'ancrage part dans l'ordre du pool ; les cycles intermédiaires
      // partent déjà mélangés (ils le seront de nouveau à chaque couture).
      cols.forEach(function (col) {
        padSet(col.sets[0], cycle - col.baseH);
        for (var k = 1; k < REPEATS; k++) {
          var anchored = ANCHOR.indexOf(k) !== -1;
          var order = anchored ? col.members.slice() : shuffle(col.members);
          var serie = makeSet(order, true);
          padSet(serie, cycle - col.baseH);
          col.sets.push(serie);
          col.el.appendChild(serie);
        }
        // Les cycles frais sont partis d'un simple mélange : on repasse
        // pour écarter tout doublon de photo aux jointures inter-cycles.
        reshuffleRange(col, MID);
      });

      loopTop = section.getBoundingClientRect().top + window.scrollY;
      anchorDone = false;
      jumping = false;
      active = cycle > 0;
    }

    function onScroll() {
      if (!active || !cycle || jumping) return;
      var p = window.scrollY - loopTop;

      // Cycle 1 passé sous la ligne de flottaison (donc aussi le cycle 0,
      // et les cycles d'ancrage du bas sont loin devant) : on rebat la
      // paire d'ancrage pour le tour suivant, une seule fois par tour.
      if (!anchorDone && p > cycle * 2.4) {
        reshuffleAnchor();
        anchorDone = true;
      }

      // Couture : on entre dans le cycle d'où part le bond. Il est
      // identique au cycle d'arrivée : le recul de JUMP cycles ne se voit
      // pas. On en profite — les cycles intermédiaires sont alors tous
      // au-dessus de l'écran — pour les rebattre avant de reculer.
      if (p > cycle * (REPEATS - 2)) {
        jumping = true;
        reshuffleSets(MID);
        var root = document.documentElement;
        var memo = root.style.scrollBehavior;
        // scroll-behavior: smooth est déclaré en CSS ; sans cette
        // neutralisation le recalage s'animerait et se verrait.
        root.style.scrollBehavior = "auto";
        window.scrollTo(0, window.scrollY - cycle * JUMP);
        root.style.scrollBehavior = memo;
        anchorDone = false;
        requestAnimationFrame(function () { jumping = false; });
      }
    }

    // Sans mouvement : mosaïque ordinaire, finie, défilement normal
    // (l'ordre a déjà été mélangé une fois par reorderTilesInDom plus haut).
    if (reduced) return;

    function sync() { build(); }
    if (document.readyState === "complete") sync();
    else window.addEventListener("load", sync);

    window.addEventListener("scroll", onScroll, { passive: true });
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(sync, 250);
    });

    // Changer de filtre change la hauteur totale : l'ancienne position n'a
    // plus de sens, on revient en haut de la mosaïque. reshufflePool()
    // d'abord : un nouveau tirage à chaque changement.
    applyFilterToLoop = function () {
      reshufflePool();
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
