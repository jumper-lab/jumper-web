import type { MouseEvent } from "react";

const prepareSection = (element: HTMLElement) => {
  if (element.childElementCount) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const finish = () => {
      observer.disconnect();
      window.clearTimeout(timeout);
      resolve();
    };
    const observer = new MutationObserver(() => {
      if (element.childElementCount) finish();
    });
    observer.observe(element, { childList: true });
    const timeout = window.setTimeout(finish, 4000);
    element.dispatchEvent(new Event("izi:load-section"));
  });
};

let latestNavigation = 0;

export const scrollToSection = async (
  event: MouseEvent<HTMLAnchorElement>,
  targetId: string,
) => {
  const target = document.getElementById(targetId);
  if (!target) return;
  event.preventDefault();
  const navigation = ++latestNavigation;

  // Settle lazy sections above the destination before measuring the scroll offset.
  const precedingSections = [...document.querySelectorAll<HTMLElement>("[data-deferred-section]")]
    .filter((section) => section === target ||
      Boolean(section.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING));
  await Promise.all(precedingSections.map(prepareSection));
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  await document.fonts.ready;
  if (!target.isConnected || navigation !== latestNavigation) return;

  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "start",
  });
};
