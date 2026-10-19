import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/settings", "/auth/", "/sign-in", "/sign-up", "/forgot-password", "/reset-password"] }, sitemap: "https://juscad.com/sitemap.xml", host: "https://juscad.com" };
}
