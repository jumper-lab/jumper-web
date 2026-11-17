import { createRoot } from "react-dom/client";
import "./assets/fonts/brand-fonts.css";
import "@fontsource/outfit/latin-500.css";
import "@fontsource/outfit/latin-700.css";
import App from "./App.tsx";
import "./globals.css";
import { setupPrincipalTracking } from "@/tracking/principal";

setupPrincipalTracking();

createRoot(document.getElementById("root")!).render(<App />);
