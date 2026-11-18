import type { MouseEvent } from "react";
import { scrollToSection } from "./scroll-to-section";

export const scrollToPlans = (event: MouseEvent<HTMLAnchorElement>) => {
  void scrollToSection(event, "plano-izi-prime");
};
