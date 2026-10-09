import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * صفحة قديمة للوحة التحكم — مساحة العمل الحقيقية صارت في /app.
 * نحتفظ بالرابط عاملاً ونحوّله حتى لا ينكسر أي رابط قديم.
 */
export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/app", replace: true });
  },
  head: () => ({
    meta: [
      { title: "لوحة التحكم | زياد" },
      { name: "description", content: "مساحة عملك في زياد." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => null,
});
