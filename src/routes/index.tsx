import { createFileRoute } from "@tanstack/react-router";

import { Nav } from "@/components/site/Nav";
import { EditorialHomepage } from "@/components/site/EditorialHomepage";
import { faqs } from "@/components/site/Faq";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "زياد | فريق ذكاء اصطناعي يعمل بالعربية لمشروعك" },
      {
        name: "description",
        content:
          "زياد يجمع ستة موظفين رقميين بالعربية للمحتوى والتصميم والمبيعات والتنظيم والبحث والتحليل، في مساحة عمل واحدة، وتراجع أنت كل خطوة قبل التنفيذ.",
      },
      { property: "og:title", content: "زياد | فريق ذكاء اصطناعي يعمل بالعربية لمشروعك" },
      {
        property: "og:description",
        content: "زياد يجمع ستة موظفين رقميين بالعربية في مساحة عمل واحدة، وتراجع أنت كل خطوة قبل التنفيذ.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ar_SA" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "زياد",
              alternateName: "Ziad",
              url: "https://getziad.com",
              description:
                "منصة عربية تمنح أصحاب المشاريع فريق موظفين بالذكاء الاصطناعي ينشر ويصمّم ويردّ ويبيع على مدار الساعة.",
            },
            {
              "@type": "SoftwareApplication",
              name: "زياد",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              inLanguage: "ar",
              offers: {
                "@type": "Offer",
                price: "149",
                priceCurrency: "SAR",
                description: "باقة البداية — موظف رقمي واحد",
              },
            },
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ],
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <Nav variant="solid" />
      <EditorialHomepage />
    </main>
  );
}
