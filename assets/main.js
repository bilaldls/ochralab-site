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

  /* Section courante mise en évidence dans le menu latéral.
     Choix déterministe : la dernière section dont le haut est passé au-dessus
     du tiers supérieur. Un IntersectionObserver retiendrait la dernière
     section entrée, pas la bonne quand deux se chevauchent. */
  var navLinks = document.querySelectorAll(".sidebar__nav a[data-nav]");
  if (navLinks.length) {
    var watched = [];
    navLinks.forEach(function (a) {
      var el = document.getElementById(a.dataset.nav);
      if (el) watched.push({ link: a, el: el });
    });

    var lastActive = null;
    function syncNav() {
      var line = window.innerHeight * 0.35;
      var current = watched.length ? watched[0] : null;
      watched.forEach(function (w) {
        if (w.el.getBoundingClientRect().top <= line) current = w;
      });
      // La dernière section est plus courte qu'un écran : son haut n'atteint
      // jamais la ligne de détection. Arrivé en bas, c'est elle qui est lue.
      var reste =
        document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      if (reste <= 4 && watched.length) current = watched[watched.length - 1];
      if (!current || current === lastActive) return;
      lastActive = current;
      watched.forEach(function (w) {
        // setAttribute et non toggleAttribute : ce dernier écrirait une
        // valeur vide, que le sélecteur [aria-current="true"] ignore.
        if (w === current) w.link.setAttribute("aria-current", "true");
        else w.link.removeAttribute("aria-current");
      });
    }
    syncNav();
    window.addEventListener("scroll", syncNav, { passive: true });
  }

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

  if (reduced || typeof gsap === "undefined") return;

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
        y: 0, duration: 0.7, stagger: 0.05, ease: "power4.out",
      })
      .to(pre.querySelectorAll(".preloader__word span"), {
        y: "-110%", duration: 0.5, stagger: 0.03, ease: "power4.in", delay: 0.25,
      })
      .to(pre, {
        yPercent: -100, duration: 0.7, ease: "power4.inOut",
        onComplete: function () {
          pre.remove();
          document.body.style.overflow = "";
        },
      });
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

    function teardown() {
      section.classList.remove("is-looping");
      grid.innerHTML = "";
      originals.forEach(function (t) {
        t.style.marginBottom = "";
        grid.appendChild(t);
      });
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
      originals.forEach(function (tile) {
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

    /* Un clic dans le menu vers Studio ou Contact traverse la bande de
       repositionnement pendant le défilement doux : on la suspend le temps
       de l'animation, sinon l'utilisateur serait ramené en arrière. */
    var suspendUntil = 0;
    document.querySelectorAll('a[href*="#studio"], a[href*="#contact"]').forEach(
      function (a) {
        a.addEventListener("click", function () {
          suspendUntil = Date.now() + 1800;
        });
      }
    );

    function onScroll() {
      if (!active || !cycle) return;
      if (Date.now() < suspendUntil) return;
      var p = window.scrollY - loopTop;
      // Bande haute bornée : au-delà, c'est une navigation volontaire vers
      // Studio ou Contact, qu'il ne faut pas contrarier.
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
  })();

  /* Recalage après chargement complet (images) */
  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
  });
})();
