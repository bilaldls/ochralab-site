/* OCHRALAB — Galerie : chorégraphie GSAP */
(function () {
  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) document.documentElement.classList.add("reduced-motion");

  var header = document.querySelector(".site-header");
  var onScroll = function () {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

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
    document.querySelectorAll("[data-cursor-view]").forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        cursor.classList.add("is-view");
        cursor.textContent = "Voir";
        gsap.to(cursor, { width: 72, height: 72, x: "-=0", duration: 0.3 });
        gsap.to(cursor, { marginLeft: -36, marginTop: -36, duration: 0.3 });
      });
      el.addEventListener("mouseleave", function () {
        cursor.classList.remove("is-view");
        cursor.textContent = "";
        gsap.to(cursor, { width: 12, height: 12, marginLeft: -6, marginTop: -6, duration: 0.3 });
      });
    });
    gsap.set(cursor, { marginLeft: -6, marginTop: -6 });
  }

  /* Recalage après chargement complet (images) */
  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
  });
})();
