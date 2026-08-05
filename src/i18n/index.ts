import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptCommon from "./locales/pt/common.json";
import ptLanding from "./locales/pt/landing.json";
import ptAuth from "./locales/pt/auth.json";
import ptBooking from "./locales/pt/booking.json";
import ptApp from "./locales/pt/app.json";
import ptBilling from "./locales/pt/billing.json";
import ptLegal from "./locales/pt/legal.json";
import ptAdmin from "./locales/pt/admin.json";

import enCommon from "./locales/en/common.json";
import enLanding from "./locales/en/landing.json";
import enAuth from "./locales/en/auth.json";
import enBooking from "./locales/en/booking.json";
import enApp from "./locales/en/app.json";
import enBilling from "./locales/en/billing.json";
import enLegal from "./locales/en/legal.json";
import enAdmin from "./locales/en/admin.json";

export const SUPPORTED_LANGUAGES = [
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
] as const;

export const resources = {
  pt: {
    common: ptCommon,
    landing: ptLanding,
    auth: ptAuth,
    booking: ptBooking,
    app: ptApp,
    billing: ptBilling,
    legal: ptLegal,
    admin: ptAdmin,
  },
  en: {
    common: enCommon,
    landing: enLanding,
    auth: enAuth,
    booking: enBooking,
    app: enApp,
    billing: enBilling,
    legal: enLegal,
    admin: enAdmin,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "pt",
    supportedLngs: ["pt", "en"],
    nonExplicitSupportedLngs: true,
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "belle-nails-lang",
      caches: ["localStorage"],
    },
  });

i18n.on("languageChanged", (lng) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng === "en" ? "en" : "pt-BR";
  }
});

export default i18n;
