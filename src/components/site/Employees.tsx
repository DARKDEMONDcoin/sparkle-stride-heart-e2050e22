import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Reveal } from "@/components/Reveal";
import { Portrait } from "@/components/site/Portrait";
import { team } from "@/data/team";
import { cn } from "@/lib/utils";

export function Employees() {
  const [active, setActive] = useState(team[0]?.id ?? "sonny");
  return (
    <section id="employees" className="employees-stage scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
        <Reveal>
          <div className="max-w-3xl">
            <p className="section-kicker">ليسوا أدوات. هذا فريقك.</p>
            <h2 className="section-title">كل موظف يعرف دوره، وكلهم يعرفون مشروعك</h2>
            <p className="section-lead">
              اختر الشخص المناسب للمهمة، أو كلّف الفريق كاملًا بهدف واحد. السياق ينتقل بينهم والعمل
              يعود إليك جاهزًا للمراجعة.
            </p>
          </div>
        </Reveal>

        <div className="employee-editorial-grid">
          {team.map((member, index) => {
            const on = active === member.id;
            return (
              <Reveal key={member.id} delay={index * 55}>
                <article
                  className={cn("employee-editorial-card liquid-glass", on && "is-active")}
                  onMouseEnter={() => setActive(member.id)}
                  onFocus={() => setActive(member.id)}
                  tabIndex={0}
                  style={{ "--employee-tone": member.tint } as React.CSSProperties}
                >
                  <div className="employee-photo-wrap">
                    <Portrait
                      memberId={member.id}
                      name={member.name}
                      className="size-full"
                      eager={index < 3}
                    />
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="employee-editorial-copy">
                    <p>{member.role}</p>
                    <h3>{member.name}</h3>
                    <strong>{member.title}</strong>
                    <ul>
                      {member.tasks.slice(0, 3).map((task) => (
                        <li key={task}>{task}</li>
                      ))}
                    </ul>
                    <div className="employee-proof">{member.metrics[0]?.v} {member.metrics[0]?.k}</div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="employee-closing">
            <p>ابدأ بموظف واحد، ووسّع فريقك عندما تحتاج.</p>
            <Link to="/welcome">
              قابل فريقك الآن
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
