import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "./pwa/registerSW";

createRoot(document.getElementById("root")!).render(<App />);

// Register the service worker (guarded — no-op in dev/preview/iframe).
void registerSW();
