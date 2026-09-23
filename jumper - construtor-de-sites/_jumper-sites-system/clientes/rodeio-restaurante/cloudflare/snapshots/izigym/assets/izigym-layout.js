const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const mobile = matchMedia("(max-width: 979px)");
const header = document.querySelector(".header");
const toggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
const hero = document.querySelector(".hero");

function setMenu(open) {
  toggle?.setAttribute("aria-expanded", String(open));
  navigation?.classList.toggle("open", open);
  navigation.inert = mobile.matches && !open;
}
setMenu(false);
toggle?.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
mobile.addEventListener("change", () => setMenu(false));
document.querySelector("[data-scroll-to='planos']")?.addEventListener("click", () => {
  document.getElementById("planos")?.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth" });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigation?.classList.contains("open")) {
    setMenu(false);
    toggle.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".header")) setMenu(false);
});

function play(element, keyframes, duration = 760, delay = 0, mobileDuration = 560, mobileDelay = 180) {
  if (!element || reducedMotion.matches) return;
  const animation = element.animate(keyframes, {
    duration: mobile.matches ? Math.min(duration, mobileDuration) : duration,
    delay: mobile.matches ? Math.min(delay, mobileDelay) : delay,
    easing: "cubic-bezier(.22,1,.36,1)",
    fill: "both",
  });
  animation.finished.then(() => animation.cancel()).catch(() => {});
}

requestAnimationFrame(() => {
  play(header, [
    { opacity: 0, transform: "translate3d(0,-22px,0) scale(.985)" },
    { opacity: 1, transform: "translate3d(0,0,0) scale(1)" },
  ], 760, 40, 500, 120);
  if (!mobile.matches) document.querySelectorAll(".header nav a").forEach((link, index) => play(link, [
    { opacity: 0, transform: "translate3d(0,-12px,0)" },
    { opacity: 1, transform: "translate3d(0,0,0)" },
  ], 540, 130 + index * 65));
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

const navLinks = [...navigation.querySelectorAll('a[href^="#"]')];
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
  const sections = navLinks.map((link) => document.querySelector(link.hash));
  sections.filter(Boolean).forEach((section) => navObserver.observe(section));
}

const parallaxMedia = [...document.querySelectorAll(".manifesto > img, .location > img")];
let scrollFrame = 0;
function updateScroll() {
  scrollFrame = 0;
  const heroBottom = hero.getBoundingClientRect().bottom;
  header.classList.toggle("scrolled", heroBottom < 0);
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
let railFrame = 0;

function cloneSlide(slide) {
  const clone = slide.cloneNode(true);
  clone.dataset.clone = "true";
  clone.setAttribute("aria-hidden", "true");
  clone.classList.remove("motion-target", "motion-image");
  clone.classList.add("is-revealed");
  clone.querySelectorAll("img").forEach((image) => {
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
  });
  clone.querySelectorAll("button").forEach((button) => { button.tabIndex = -1; });
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
function jumpRail(left) {
  const behavior = rail.style.scrollBehavior;
  rail.style.scrollBehavior = "auto";
  rail.scrollLeft = left;
  rail.style.scrollBehavior = behavior;
}
function warmRailImages(logical) {
  for (let offset = -1; offset < 5; offset++) {
    const slide = rail.children[slideCount + logical + offset];
    slide?.querySelectorAll("img").forEach((image) => {
      image.loading = "eager";
      if (!image.complete) image.decode().catch(() => {});
    });
  }
}
function updateRail() {
  railFrame = 0;
  const { step, group } = railMetrics();
  if (!step || !group) return;
  if (rail.scrollLeft < group - step * .75) jumpRail(rail.scrollLeft + group);
  else if (rail.scrollLeft > group * 2 - step * .25) jumpRail(rail.scrollLeft - group);
  const logical = Math.round((rail.scrollLeft - group) / step);
  warmRailImages(logical);
  const current = ((logical % slideCount) + slideCount) % slideCount + 1;
  status.textContent = `${String(current).padStart(2, "0")} / ${String(slideCount).padStart(2, "0")}`;
}
rail.addEventListener("scroll", () => {
  if (!railFrame) railFrame = requestAnimationFrame(updateRail);
}, { passive: true });
function resetRail() {
  const { group } = railMetrics();
  if (group) jumpRail(group);
  updateRail();
}
if ("IntersectionObserver" in window) {
  const warmObserver = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    resetRail();
    warmObserver.disconnect();
  }, { rootMargin: "1600px 0px" });
  warmObserver.observe(rail);
} else requestAnimationFrame(resetRail);
addEventListener("resize", resetRail, { passive: true });
rail.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    const { step } = railMetrics();
    rail.scrollBy({ left: step * (event.key === "ArrowRight" ? 1 : -1), behavior: reducedMotion.matches ? "instant" : "smooth" });
  }
});

const videoDialog = document.querySelector(".gallery-video-dialog");
const videoPlayer = videoDialog?.querySelector(".gallery-video-player");
rail.addEventListener("click", (event) => {
  if (!event.target.closest(".gallery-video-play")) return;
  const video = document.createElement("video");
  // Keep the asset segment separate so the hoster staging rewrite cannot prefix it with /izigym.
  video.src = "https://site.jumper.dev.br/izigym-lp-vilaromana/" + "assets/izigym.mp4";
  video.poster = "images/gallery-05-fast.jpg";
  video.controls = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.setAttribute("aria-label", "Conheça a IZI Gym em vídeo");
  videoPlayer.replaceChildren(video);
  videoDialog.showModal();
  video.play().catch(() => {});
});
videoDialog?.querySelector(".gallery-video-close")?.addEventListener("click", () => videoDialog.close());
videoDialog?.addEventListener("click", (event) => {
  if (event.target === videoDialog) videoDialog.close();
});
videoDialog?.addEventListener("close", () => {
  videoPlayer.replaceChildren();
});
