import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
}

export default function SEOHead({ title, description, path = "", ogImage }: SEOHeadProps) {
  const baseUrl = "https://flowo-ai.lovable.app";
  const fullUrl = `${baseUrl}${path}`;
  const defaultOgImage = "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/34bfa62f-1e42-45dd-8145-37e2003237fd";

  useEffect(() => {
    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", fullUrl);
    setMeta("property", "og:image", ogImage || defaultOgImage);
    setMeta("property", "og:type", "website");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage || defaultOgImage);
    setMeta("name", "twitter:card", "summary_large_image");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", fullUrl);
  }, [title, description, fullUrl, ogImage]);

  return null;
}
