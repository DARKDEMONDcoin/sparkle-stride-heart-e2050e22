import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";

import { PageShell, PageHero, CtaBand } from "@/components/site/PageShell";
import { AppRow } from "@/components/site/AppIcon";
import { Portrait, RegionPicker } from "@/components/site/Portrait";
import { Reveal } from "@/components/Reveal";
import { team } from "@/data/team";

export const Route = createFileRoute("/employees/")({
  head: () => ({
    meta: [
      { title: "الموظفون الرقميون | ستة تخصصات تعمل بالعربية 24/7 — زياد" },
      {
        name: "description",
        content:
          "تعرّف على فريق زياد: سِراج للسوشيال، أمَل للمساعدة التنفيذية، سالم للمبيعات، نور للمحتوى، دانة للتصميم، وآدم للتحليل.",
      },
      { property: "og:title", content: "الموظفون الرقميون في زياد" },
      {
        property: "og:description",
        content: "ستة موظفين بالذكاء الاصطناعي باشتراك واحد — كل واحد بتخصصه وأدواته.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="فريقك الكامل"
        title="ستة موظفين، تخصص واحد لكل منهم، واشتراك واحد لك"
        lead="لا تشتري «أداة». توظّف زملاء رقميين لهم أسماء وأدوار وحدود واضحة — تراقب عملهم، وتوافق قبل التنفيذ الحسّاس."
      />

      <section className="sahl-team-directory">
        <div className="sahl-team-directory-tools">
          <p className="text-sm font-semibold text-muted-foreground">
            يظهر فريقك بزيّ بلدك — غيّر البلد وقتما تشاء:
          </p>
          <RegionPicker />
        </div>

        <div className="sahl-team-directory-grid">
          {team.map((m, i) => (
            <Reveal key={m.id} delay={i * 70}>
              <article className="sahl-team-directory-card group">
                <div className="sahl-team-card-person">
                  <span className="sahl-team-card-index">{String(i + 1).padStart(2, "0")}</span>
                  <span className="sahl-team-card-photo">
                    <Portrait
                      memberId={m.id}
                      name={m.name}
                      className="size-full transition-transform duration-700 group-hover:scale-105"
                    />
                  </span>
                  <div className="sahl-team-card-title">
                    <p>{m.role}</p>
                    <h2>{m.name}</h2>
                    <strong>{m.title}</strong>
                  </div>
                </div>

                <p className="sahl-team-card-summary">{m.summary}</p>

                <ul className="sahl-team-card-tasks">
                  {m.tasks.slice(0, 3).map((t) => (
                    <li key={t}>
                      <Check />
                      {t}
                    </li>
                  ))}
                </ul>

                <div className="sahl-team-card-metrics">
                  {m.metrics.map((s) => (
                    <div key={s.k}>
                      <strong>{s.v}</strong>
                      <span>{s.k}</span>
                    </div>
                  ))}
                </div>

                <AppRow apps={m.apps.slice(0, 6)} className="sahl-team-card-apps" />

                <Link
                  to="/employees/$id"
                  params={{ id: m.id }}
                  className="sahl-team-card-link"
                >
                  ملف {m.name} الكامل
                  <ArrowLeft className="size-4" />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <CtaBand title="وظّف من تحتاجه فقط" lead="فعّل موظفاً واحداً اليوم، وأضف البقية حين تكبر." />
    </PageShell>
  );
}
