import type { HtmlTagDescriptor } from "vite";

type TrackingConfig = {
  siteId: string;
  izi: { enabled: boolean; gtmId: string };
};

export function bootstrapPrincipalTracking(config: TrackingConfig): void;
export function principalTrackingTags(config: TrackingConfig): HtmlTagDescriptor[];
