import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "./pwa/registerSW";
import { hasLegacyData, migrateLegacyData } from "./lib/storage";

createRoot(document.getElementById("root")!).render(<App />);

// Register the service worker (guarded — no-op in dev/preview/iframe).
void registerSW();

// One-shot migration from legacy localStorage to IndexedDB.
if (hasLegacyData()) {
  void migrateLegacyData().catch((e) => console.error("legacy migration failed", e));
}
