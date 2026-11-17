import type { MouseEvent } from "react";

export const scrollToPlans = (event: MouseEvent<HTMLAnchorElement>) => {
  const section = document.getElementById("planos");
  if (!section) return;

  event.preventDefault();
  section.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "start",
  });
};
