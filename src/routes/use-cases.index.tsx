import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageShell, PageHero, CtaBand } from "@/components/site/PageShell";
import { Reveal } from "@/components/Reveal";
import { AppRow } from "@/components/site/AppIcon";
import { useCases } from "@/data/use-cases";

export const Route = createFileRoute("/use-cases/")({
  head: () => ({
    meta: [
      { title: "الحلول حسب نشاطك | متاجر ومطاعم وعيادات وعقار — زياد" },
      {
        name: "description",
        content:
          "خطة تشغيل جاهزة لكل قطاع: متاجر إلكترونية، مطاعم، عيادات، عقار، دورات، وخدمات. شاهد ماذا ينفّذ فريق زياد في أسبوعك ولماذا.",
      },
      { property: "og:title", content: "الحلول حسب نشاطك — زياد" },
      {
        property: "og:description",
        content: "خطة تشغيل أسبوعية جاهزة لكل قطاع، ينفّذها فريق موظفين بالذكاء الاصطناعي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UseCasesPage,
});

function UseCasesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="حلول جاهزة"
        title={
          <>
            نشاطك له خطة تشغيل
            <br />
            جاهزة من اليوم الأول
          </>
        }
        lead="لا نعطيك أداة فارغة تبدأ من الصفر. اختر قطاعك وستجد ماذا يُنشر، ومتى، ومن يردّ، وما الرقم الذي نقيسه لك كل سبت."
      />

      <section className="px-5 pb-6">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map((u, i) => (
            <Reveal key={u.id} delay={i * 60}>
              <Link
                to="/use-cases/$id"
                params={{ id: u.id }}
                className="group flex h-full flex-col rounded-[1.75rem] border border-border bg-card p-6 shadow-card transition-transform duration-300 hover:-translate-y-1"
              >
                <span
                  className="grid size-12 place-items-center rounded-2xl"
                  style={{ background: u.tintSoft, color: u.tint }}
                >
                  <u.icon className="size-6" strokeWidth={2.2} />
                </span>
                <h2 className="mt-5 font-display text-xl font-black">{u.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{u.short}</p>
                <AppRow apps={u.apps.slice(0, 5)} className="mt-5" />
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">
                  اعرف كيف يعمل الفريق
                  <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <CtaBand />
    </PageShell>
  );
}
