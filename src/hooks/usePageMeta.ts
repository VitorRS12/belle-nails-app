import { useEffect } from "react";

const SITE_URL = "https://bellenailsorigin.lovable.app";

type Meta = {
  title: string;
  description: string;
  path?: string; // route path, defaults to current pathname
  ogType?: "website" | "article";
};

function upsertMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Sets per-page title, description, canonical, and OG/Twitter metadata.
 * Crawlers that execute JS (Googlebot) read the updated tags.
 */
export function usePageMeta({ title, description, path, ogType = "website" }: Meta) {
  useEffect(() => {
    const resolvedPath = path ?? window.location.pathname;
    const url = `${SITE_URL}${resolvedPath}`;

    document.title = title;
    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertLink("canonical", url);

    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:url"]', "property", "og:url", url);
    upsertMeta('meta[property="og:type"]', "property", "og:type", ogType);

    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
  }, [title, description, path, ogType]);
}
