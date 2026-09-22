const toggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");
toggle?.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  mobileNav?.classList.toggle("open", open);
});
mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
  });
});
