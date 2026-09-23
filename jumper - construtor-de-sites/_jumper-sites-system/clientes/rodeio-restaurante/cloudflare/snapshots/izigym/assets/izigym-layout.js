const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const mobile = matchMedia("(max-width: 700px)");
const header = document.querySelector(".header");
const toggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");
const hero = document.querySelector(".hero");

function setMenu(open) {
  toggle?.setAttribute("aria-expanded", String(open));
  mobileNav?.classList.toggle("open", open);
}
toggle?.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
mobileNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && toggle?.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    toggle.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".header")) setMenu(false);
});

function play(element, keyframes, duration = 760, delay = 0) {
  if (!element || reducedMotion.matches) return;
  const animation = element.animate(keyframes, {
    duration: mobile.matches ? Math.min(duration, 560) : duration,
    delay: mobile.matches ? Math.min(delay, 180) : delay,
    easing: "cubic-bezier(.22,1,.36,1)",
    fill: "both",
  });
  animation.finished.then(() => animation.cancel()).catch(() => {});
}

requestAnimationFrame(() => {
  play(header, [
    { opacity: 0, transform: "translate3d(0,-24px,0) scale(.985)" },
    { opacity: 1, transform: "translate3d(0,0,0) scale(1)" },
  ], 760, 30);
  play(document.querySelector(".hero-image"), [{ opacity: .55 }, { opacity: 1 }], 1100);
  document.querySelectorAll(".hero-content > .eyebrow, .hero h1, .hero-description, .hero-button, .hero-facts > div, .scroll-hint")
    .forEach((element, index) => play(element, [
      { opacity: 0, transform: "translate3d(0,28px,0)" },
      { opacity: 1, transform: "translate3d(0,0,0)" },
    ], 740, 140 + index * 105));
});

const revealTargets = document.querySelectorAll(
  ".section-label, .intro-grid h2, .intro-copy > *, .intro-facts > div, " +
  ".experience-grid h2, .experience-list article, .experience-photo, " +
  ".gallery-heading > *, .gallery-tour, .gallery-controls, " +
  ".manifesto-content > *, .plans-heading > *, .plan-card, " +
  ".faq > div:first-child > *, .faq details, .location > img, .location-copy > *, " +
  ".closing > *, .footer-follow, .footer-links > *, .footer-brand, .footer-legal"
);
if (!reducedMotion.matches && "IntersectionObserver" in window) {
  revealTargets.forEach((element) => {
    element.classList.add("motion-target");
    if (element.matches(".experience-photo, .gallery-tour, .location > img")) {
      element.classList.add("motion-image");
    }
    const position = [...element.parentElement.children].indexOf(element);
    element.style.setProperty("--motion-delay", `${Math.min(position % 4, 3) * 85}ms`);
  });
  document.documentElement.classList.add("motion-ready");
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .08, rootMargin: "0px 0px -7% 0px" });
  requestAnimationFrame(() => revealTargets.forEach((element) => revealObserver.observe(element)));
}

document.querySelectorAll(".faq details").forEach((details) => {
  details.addEventListener("toggle", () => {
    if (details.open) play(details.querySelector("p"), [
      { opacity: 0, transform: "translate3d(0,-8px,0)" },
      { opacity: 1, transform: "translate3d(0,0,0)" },
    ], 420);
  });
});

const navLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
if ("IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const active = link.hash === `#${entry.target.id}`;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-22% 0px -68% 0px" });
  navLinks.forEach((link) => {
    const section = document.querySelector(link.hash);
    if (section) navObserver.observe(section);
  });
}

const parallaxMedia = [...document.querySelectorAll(".manifesto > img, .location > img")];
let scrollFrame = 0;
function updateScroll() {
  scrollFrame = 0;
  const heroBottom = hero.getBoundingClientRect().bottom;
  header.classList.toggle("is-scrolled", scrollY > 50);
  document.querySelector(".mobile-cta")?.classList.toggle("is-visible", heroBottom < 0);
  if (reducedMotion.matches || mobile.matches) {
    document.querySelector(".hero-image")?.style.removeProperty("--hero-parallax");
    parallaxMedia.forEach((image) => image.style.removeProperty("--media-parallax"));
    return;
  }
  const heroImage = document.querySelector(".hero-image");
  if (heroBottom > 0) heroImage?.style.setProperty("--hero-parallax", `${Math.min(scrollY * .07, 65)}px`);
  parallaxMedia.forEach((image) => {
    const bounds = image.parentElement.getBoundingClientRect();
    if (bounds.bottom < -100 || bounds.top > innerHeight + 100) return;
    const progress = (innerHeight - bounds.top) / (innerHeight + bounds.height);
    image.style.setProperty("--media-parallax", `${(progress - .5) * 48}px`);
  });
}
function requestScroll() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}
addEventListener("scroll", requestScroll, { passive: true });
addEventListener("resize", requestScroll, { passive: true });
reducedMotion.addEventListener("change", requestScroll);
requestScroll();

const rail = document.querySelector(".gallery-rail");
const originalSlides = [...rail.children];
const slideCount = originalSlides.length;
const status = document.querySelector("[data-rail-status]");
let currentSlide = 0;
let motionFrame = 0;
let settleTimer = 0;
let queuedDirection = 0;
let correctingRail = false;
let autoTimer = 0;
let interactionTimer = 0;
let hovered = false;
let focused = false;
let interacting = false;
let railVisible = false;
let videoOpen = false;

function cloneSlide(slide) {
  const clone = slide.cloneNode(true);
  clone.dataset.clone = "true";
  clone.setAttribute("aria-hidden", "true");
  clone.setAttribute("inert", "");
  clone.classList.remove("motion-target", "motion-image");
  clone.classList.add("is-revealed");
  clone.querySelectorAll("img").forEach((image) => { image.alt = ""; });
  return clone;
}
originalSlides.forEach((slide) => rail.append(cloneSlide(slide)));
[...originalSlides].reverse().forEach((slide) => rail.prepend(cloneSlide(slide)));

function railMetrics() {
  const first = rail.children[slideCount];
  const second = rail.children[slideCount + 1];
  const nextGroup = rail.children[slideCount * 2];
  return { step: second.offsetLeft - first.offsetLeft, group: nextGroup.offsetLeft - first.offsetLeft };
}
function wrapSlide(index) {
  return ((index % slideCount) + slideCount) % slideCount;
}
function updateRailStatus() {
  status.textContent = `${String(currentSlide + 1).padStart(2, "0")} / ${String(slideCount).padStart(2, "0")}`;
}
function jumpRail(left) {
  correctingRail = true;
  rail.style.scrollSnapType = "none";
  rail.scrollLeft = left;
  requestAnimationFrame(() => {
    rail.style.removeProperty("scroll-snap-type");
    correctingRail = false;
  });
}
function settleRail() {
  clearTimeout(settleTimer);
  if (motionFrame || correctingRail) return;
  const { step, group } = railMetrics();
  if (!step || !group) return;
  const physical = slideCount + Math.round((rail.scrollLeft - group) / step);
  currentSlide = wrapSlide(physical - slideCount);
  updateRailStatus();
  if (physical < slideCount || physical >= slideCount * 2) {
    jumpRail(group + currentSlide * step);
  }
}
rail.addEventListener("scroll", () => {
  if (motionFrame || correctingRail) return;
  clearTimeout(settleTimer);
  settleTimer = setTimeout(settleRail, 130);
}, { passive: true });
rail.addEventListener("scrollend", settleRail);
function resetRail() {
  if (motionFrame) cancelAnimationFrame(motionFrame);
  motionFrame = 0;
  const { step, group } = railMetrics();
  if (step && group) jumpRail(group + currentSlide * step);
  updateRailStatus();
}
requestAnimationFrame(resetRail);
addEventListener("resize", () => requestAnimationFrame(resetRail), { passive: true });

function moveRail(direction) {
  if (motionFrame) {
    queuedDirection = direction;
    return;
  }
  const { step, group } = railMetrics();
  if (!step || !group) return;
  const from = rail.scrollLeft;
  const targetPhysical = currentSlide + direction;
  const to = group + targetPhysical * step;
  currentSlide = wrapSlide(targetPhysical);
  updateRailStatus();
  rail.style.scrollSnapType = "none";
  const finish = () => {
    motionFrame = 0;
    if (targetPhysical < 0 || targetPhysical >= slideCount) {
      // The matching clone is already on screen: reposition only after the motion ends.
      rail.scrollLeft = group + currentSlide * step;
    }
    requestAnimationFrame(() => rail.style.removeProperty("scroll-snap-type"));
    if (queuedDirection) {
      const next = queuedDirection;
      queuedDirection = 0;
      requestAnimationFrame(() => moveRail(next));
    }
  };
  if (reducedMotion.matches) {
    rail.scrollLeft = to;
    finish();
    return;
  }
  const duration = 380;
  const started = performance.now();
  const animate = (now) => {
    const progress = Math.min((now - started) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    rail.scrollLeft = from + (to - from) * eased;
    if (progress < 1) motionFrame = requestAnimationFrame(animate);
    else finish();
  };
  motionFrame = requestAnimationFrame(animate);
}
document.querySelector(".gallery-prev")?.addEventListener("click", () => { pauseInteraction(); moveRail(-1); });
document.querySelector(".gallery-next")?.addEventListener("click", () => { pauseInteraction(); moveRail(1); });
rail.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    pauseInteraction();
    moveRail(event.key === "ArrowRight" ? 1 : -1);
  }
});
function updateAutoplay() {
  clearInterval(autoTimer);
  autoTimer = 0;
  if (reducedMotion.matches || hovered || focused || interacting || videoOpen || !railVisible || document.hidden) return;
  autoTimer = setInterval(() => moveRail(1), 4200);
}
function pauseInteraction() {
  interacting = true;
  clearTimeout(interactionTimer);
  updateAutoplay();
  interactionTimer = setTimeout(() => { interacting = false; updateAutoplay(); }, 6000);
}
rail.addEventListener("mouseenter", () => { hovered = true; updateAutoplay(); });
rail.addEventListener("mouseleave", () => { hovered = false; updateAutoplay(); });
rail.addEventListener("focusin", () => { focused = true; updateAutoplay(); });
rail.addEventListener("focusout", () => { focused = false; updateAutoplay(); });
rail.addEventListener("pointerdown", () => {
  if (motionFrame) {
    cancelAnimationFrame(motionFrame);
    motionFrame = 0;
    queuedDirection = 0;
    rail.style.removeProperty("scroll-snap-type");
  }
  pauseInteraction();
});
document.addEventListener("visibilitychange", updateAutoplay);
reducedMotion.addEventListener("change", updateAutoplay);
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    railVisible = entry.isIntersecting;
    updateAutoplay();
  }, { threshold: .05 }).observe(rail);
}

const videoDialog = document.querySelector(".gallery-video-dialog");
const videoPlayer = videoDialog?.querySelector(".gallery-video-player");
rail.querySelector(".gallery-video:not([data-clone]) .gallery-video-play")?.addEventListener("click", () => {
  const video = document.createElement("video");
  // Keep the asset segment separate so the hoster staging rewrite cannot prefix it with /izigym.
  video.src = "https://site.jumper.dev.br/izigym-lp-vilaromana/" + "assets/izigym.mp4";
  video.poster = "images/gallery-05-fast.jpg";
  video.controls = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.setAttribute("aria-label", "Conheça a IZI Gym em vídeo");
  videoPlayer.replaceChildren(video);
  videoOpen = true;
  updateAutoplay();
  videoDialog.showModal();
  video.play().catch(() => {});
});
videoDialog?.querySelector(".gallery-video-close")?.addEventListener("click", () => videoDialog.close());
videoDialog?.addEventListener("click", (event) => {
  if (event.target === videoDialog) videoDialog.close();
});
videoDialog?.addEventListener("close", () => {
  videoPlayer.replaceChildren();
  videoOpen = false;
  updateAutoplay();
});
