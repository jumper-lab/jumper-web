import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { setupPrincipalTracking } from "@/tracking/principal";

export const TrackingAttribution = () => {
  const { search } = useLocation();
  useEffect(() => { setupPrincipalTracking().refresh(); }, [search]);
  return null;
};
