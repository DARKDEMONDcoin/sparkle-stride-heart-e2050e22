import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Info, ShieldCheck } from "lucide-react";

import { PageShell } from "@/components/site/PageShell";
import { AppIcon, appLabel } from "@/components/site/AppIcon";
import { Portrait } from "@/components/site/Portrait";
import { Button } from "@/components/ui/button";
import { skillsByCategory } from "@/data/skills";
import { EmployeeGuideContents, CopyEmployeeRequest } from "@/components/site/EmployeeGuideContents";
import "@/components/site/employee-guide.css";
import { getMember, team } from "@/data/team";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/employees/$id")({
  loader: ({ params }) => {
    const member = team.find((m) => m.id === params.id);
    if (!member) throw notFound();
    return { id: member.id, name: member.name, role: member.role, tagline: `${member.name}: دليل مفصل للمسؤوليات وطريقة العمل والمدخلات والمخرجات والأدوات والصلاحيات، مع أمثلة وأسئلة شائعة عن ${member.role}.` };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "الموظف غير موجود — زياد" }, { name: "robots", content: "noindex" }],
      };
    }
    const t = `${loaderData.name} — ${loaderData.role} | زياد`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.tagline },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.tagline },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: MemberNotFound,
  component: MemberPage,
});

function MemberNotFound() {
  return (
    <PageShell>
      <div className="mx-auto max-w-xl px-5 pt-40 pb-24 text-center">
        <h1 className="font-display text-3xl font-black">لم نجد هذا الموظف</h1>
        <p className="mt-3 text-muted-foreground">ربما تغيّر الرابط. تصفّح الفريق كاملاً.</p>
        <Link
          to="/employees"
          className="mt-7 inline-flex rounded-full bg-foreground px-6 py-3 font-bold text-background"
        >
          كل الموظفين
        </Link>
      </div>
    </PageShell>
  );
}

function MemberPage() {
  const { id } = Route.useParams();
  const m = getMember(id);
  if (!m) return null;
  const guide = m.guide;
  const groups = skillsByCategory(id);
  const totalSkills = groups.reduce((sum, [, skills]) => sum + skills.length, 0);
  const others = team.filter((member) => member.id !== id);
  const steps = [
    { title: "يفهم الطلب وما يلزم لتنفيذه", body: "تحدد الهدف والموعد والمواد والقيود. يوضح الموظف ما ينقص ويستخدم سياق نشاطك حين يكون مناسباً للطلب، دون افتراض معلومات أو أسعار لم تعطها له." },
    { title: "يبحث ويجهز المخرج", body: "يعتمد على موادك والأدوات المتاحة، ويبحث أو يتصفح عندما تتطلب المهمة أدلة حديثة. يفصل الحقائق الموثقة عن الافتراضات ويقدم العمل داخل المحادثة، لا مجرد وعد بتنفيذه لاحقاً." },
    { title: "تراجع وتطلب التعديل", body: "تراجع النص أو الملف أو تفاصيل الإجراء، وتطلب تغييراً محدداً في المحادثة نفسها. الإجراءات الحساسة تبقى خاضعة للموافقة والصلاحيات، ويمكنك رفض التنفيذ أو تعديل الطلب." },
    { title: "ينفذ المسموح ويوضح النتيجة", body: "ينفذ الإجراء عندما يكون متاحاً ومصرحاً به. لا تعني المسودة أن الإرسال أو النشر تم؛ تُراجع حالة النجاح أو سبب التعذر. العمل المتكرر يحتاج إلى إعداد مهمة فعلي، وليس مجرد طلب خطة." },
  ];
  const faqs = [
    ...m.faqs.map((faq) => ({ ...faq, answer: faq.answer + " يتحدد التنفيذ الفعلي وفق البيانات والأدوات المربوطة والصلاحيات وسياسة الموافقات. المسودة أو التوصية لا تُعدّ إجراءً منفذاً قبل تأكيد نجاحه." })),
    { question: "هل يمكن البدء دون ربط التطبيقات؟", answer: "نعم. يمكنك إرسال هدفك والمواد أو البيانات اللازمة للحصول على بحث أو خطة أو مسودة أو تحليل. الربط يصبح ضرورياً عندما تحتاج إلى قراءة حساب خاص أو تنفيذ إجراء داخله؛ ويمكن استخدام ملف مرفق بديلاً في كثير من مهام التحليل والكتابة." },
    { question: "كيف أطلب شرحاً أعمق أو بحثاً شاملاً؟", answer: "اذكر أنك تريد بحثاً عميقاً أو شرحاً شاملاً، وحدد السؤال والنطاق والمصادر والفترة إن كانت مهمة. اطلب الأدلة والافتراضات والنقاط التي لم تُحسم، بدلاً من الاكتفاء بملخص. البيانات الخاصة تحتاج إلى وصول مأذون ولا تُفترض من البحث العام." },
    { question: "هل ينفذ الموظف كل شيء من تلقاء نفسه؟", answer: "لا. يعمل ضمن طلبك والصلاحيات المتاحة، والإجراءات الحساسة تتطلب الموافقة. أي مهمة متكررة أو جدولة تحتاج إلى إعداد فعلي. توجد حدود للخدمات الخارجية والحسابات، ويُفصل إعداد المخرج عن تنفيذه حتى لا تخلط بين المسودة والنتيجة." },
    { question: "ماذا لو احتاج الطلب إلى أكثر من تخصص؟", answer: "يمكن للنظام الاستفادة من تخصص الزملاء خلف الكواليس مع إبقاء المحادثة نفسها، بدلاً من مطالبتك بإعادة الشرح في كل مرة. توضّح النتيجة ما تم تجهيزه وما يحتاج إلى بيانات أو مراجعة أو موافقة قبل التنفيذ." },
    { question: "هل أستطيع تعديل النتيجة بعد استلامها؟", answer: "نعم، اطلب ما تريد تغييره: النبرة أو البنية أو النص أو المعادلة أو التفاصيل البصرية. بعض الملفات تتيح تحريراً داخل المحادثة بحسب نوع المخرج. إن كان الإجراء قد نُفذ بالفعل، فقد يحتاج التعديل إلى إجراء جديد، وقد لا تتيح الخدمة الخارجية التراجع عنه." },
    { question: "هل أمثلة هذه الصفحة نتائج فعلية لعملاء؟", answer: "لا. الأمثلة توضيحية لتعرف شكل الطلب والمخرج وليست بيانات حسابك أو شهادات عملاء أو ضمانات أداء. النتيجة الفعلية تعتمد على المعلومات التي تقدمها والخدمة المتاحة ومراجعتك، وأي رقم أو استنتاج حي يحتاج إلى مصدر." },
    { question: "ماذا يحدث عندما تكون البيانات أو الأداة غير متاحة؟", answer: "يوضح الموظف الناقص وما يمكن تقديمه الآن: مسودة أو إطار عمل أو تحليل للبيانات المتاحة أو رحلة متصفح مناسبة. لا ينبغي أن تتحول محدودية الوصول إلى أرقام متخيلة أو ادعاء تنفيذ. وقد تتطلب بعض الخدمات الخارجية ربطاً أو اشتراكاً منفصلاً." },
  ];
  return (
    <PageShell className="employee-guide-page">
      <div className="employee-guide-layout" dir="rtl">
        <EmployeeGuideContents employeeId={id} />
        <div className="employee-guide-body">
          <header className="employee-guide-header">
            <Link to="/employees" className="employee-guide-back"><ArrowRight /> كل الموظفين</Link>
            <div className="employee-guide-identity">
              <span className="employee-guide-portrait"><Portrait memberId={id} name={m.name} className="size-full" eager /></span>
              <div><h1>{m.name}</h1><p>{m.role}</p></div>
            </div>
            <p className="employee-guide-lead">{guide.introduction[0]?.split(".")[0] ?? m.title}.</p>
            <div className="employee-guide-header-actions">
              <Button asChild className="employee-guide-cta"><Link to="/welcome">وظّف {m.name} الآن <ArrowLeft /></Link></Button>
              <Button asChild variant="outline" className="employee-guide-secondary"><Link to="/pricing">الأسعار</Link></Button>
            </div>
          </header>

          <section id="overview" className="employee-guide-section">
            <GuideHeading number="01" title={`لماذا تختار ${m.name}؟`} />
            <div className="employee-guide-prose">{guide.introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <div className="employee-guide-suitable"><h3>لمن يناسب هذا التخصص؟</h3><p>{guide.suitableFor}</p></div>
            </div>
          </section>

          <section id="capabilities" className="employee-guide-section">
            <GuideHeading number="02" title="المسؤوليات والخدمات بالتفصيل" description="ما الذي يفعله، وما يحتاجه منك، وما الذي تستلمه في كل نوع من العمل." />
            <div className="employee-guide-responsibilities">
              {guide.responsibilities.map((item, index) => <article className="employee-guide-responsibility" key={item.title}>
                <span className="employee-guide-responsibility-number">{String(index + 1).padStart(2, "0")} / {m.role}</span>
                <h3>{item.title}</h3><p>{item.description}</p>
                <dl><div><dt>ما يحتاجه منك</dt><dd>{item.input}</dd></div><div><dt>ما تستلمه</dt><dd>{item.output}</dd></div></dl>
                <div className="employee-guide-request"><span>مثال على طلب يمكنك إرساله</span><p>«{item.request}»</p></div>
              </article>)}
            </div>
          </section>

          <section id="workflow" className="employee-guide-section">
            <GuideHeading number="03" title="من الطلب إلى النتيجة" />
            <ol className="employee-guide-steps">{steps.map((step, i) => <li key={step.title}><span>{String(i + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol>
            <p className="employee-guide-note"><ShieldCheck /> لا يدخل المتصفح في إتمام الدفع تلقائياً، ولا تعني الموافقة على خطوة الإذن بكل الخطوات الحساسة التالية.</p>
          </section>

          <section id="preparation" className="employee-guide-section">
            <GuideHeading number="04" title="ما الذي يحتاجه منك ليعمل جيداً؟" />
            <ol className="employee-guide-steps">{guide.preparation.map((item, i) => <li key={item.title}><span>{String(i + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><p>{item.description}</p></div></li>)}</ol>
          </section>

          <section id="examples" className="employee-guide-section">
            <GuideHeading number="05" title="هكذا تبدو المخرجات" description="نماذج توضيحية فقط؛ ليست نتائج عملاء أو قراءة لحسابك أو إجراءات نُفذت بالفعل." />
            <div className="employee-guide-examples">{guide.deliverables.map((example) => <figure key={example.title}><figcaption>{example.title}<span>مثال توضيحي</span></figcaption><blockquote>{example.body}</blockquote></figure>)}</div>
          </section>

          <section id="skills" className="employee-guide-section">
            <GuideHeading number="06" title={`دليل كل القدرات · ${totalSkills}`} description="كل قدرة موضحة مع المعلومات التي تحتاجها. تفتح التفاصيل دون مغادرة الدليل؛ التنفيذ يتحدد بحسب الأدوات والبيانات المتاحة." />
            {groups.map(([category, skills]) => <div className="employee-guide-skill-group" key={category}><h3>{category} · {skills.length}</h3>
              <Accordion type="multiple">{skills.map((skill, i) => <AccordionItem key={skill.id} value={`${id}-${skill.id}`}>
                <AccordionTrigger className="employee-guide-skill-trigger"><span><small>{String(i + 1).padStart(2, "0")}</small>{skill.title}</span></AccordionTrigger>
                <AccordionContent><div className="employee-guide-skill-details"><p>{skill.summary}</p><h4>المعلومات التي تساعد على تنفيذها</h4><ul>{skill.fields.map((field) => <li key={field.name}><strong>{field.label}</strong>{field.required ? " — أساسي" : ""}{field.help ? `: ${field.help}` : ""}{field.placeholder ? ` — ${field.placeholder}` : ""}{field.options?.length ? `: ${field.options.join("، ")}` : ""}</li>)}</ul><h4>كيف تطلبها؟</h4><p>اذكر «{skill.title}» في محادثة {m.name}، ثم اشرح هدفك وأرسل المعلومات المناسبة. إن تطلب العمل بيانات حية أو إرسالاً أو نشراً، يلزم الوصول والصلاحية والموافقة الملائمة؛ وصف القدرة ليس ضمان تنفيذ كل إجراء خارجي.</p></div></AccordionContent>
              </AccordionItem>)}</Accordion>
            </div>)}
          </section>

          <section id="tools" className="employee-guide-section">
            <GuideHeading number="07" title="الأدوات والصلاحيات" description="نفرّق بين كتابة المخرج، وقراءة البيانات، وتنفيذ إجراء داخل تطبيق خارجي." />
            {guide.tools.map((tool) => <div className="employee-guide-tool" key={tool.purpose}><div className="employee-guide-tool-apps">{tool.apps.map((app) => <span key={app}><AppIcon name={app} />{appLabel(app)}</span>)}</div><p>{tool.purpose}</p><p>{tool.condition}</p></div>)}
            <p className="employee-guide-note"><Info /> البحث والمتصفح يساعدان في المهام المناسبة، لكنهما لا يتجاوزان قيود الموقع أو صلاحيات حسابك. وقد تتطلب بعض الخدمات الخارجية اشتراكاً منفصلاً.</p>
          </section>

          <section id="boundaries" className="employee-guide-section">
            <GuideHeading number="08" title="حدوده — وما تراجعه أنت" />
            <ul className="employee-guide-boundaries">{guide.boundaries.map((limit) => <li key={limit}><ShieldCheck />{limit}</li>)}</ul>
            <div className="employee-guide-review"><h3>قبل اعتماد النتيجة</h3>{guide.review.map((item) => <p key={item}><Check />{item}</p>)}</div>
          </section>

          <section id="faq" className="employee-guide-section">
            <GuideHeading number="09" title={`أسئلة وإجابات عن ${m.name}`} />
            <Accordion type="multiple">{faqs.map((faq, i) => <AccordionItem key={faq.question} value={`question-${i}`}><AccordionTrigger className="employee-guide-skill-trigger">{faq.question}</AccordionTrigger><AccordionContent><p className="employee-guide-prose">{faq.answer}</p></AccordionContent></AccordionItem>)}</Accordion>
          </section>

          <section id="start" className="employee-guide-section">
            <GuideHeading number="10" title="ابدأ بطلب واضح" description="صيغة بداية قابلة للتخصيص؛ استبدل الأجزاء بين الأقواس بمعلوماتك." />
            <p className="employee-guide-start-text">{guide.firstRequest}</p><CopyEmployeeRequest text={guide.firstRequest} />
            <div className="employee-guide-header-actions"><Button asChild className="employee-guide-cta"><Link to="/welcome">ابدأ مع {m.name} <ArrowLeft /></Link></Button><Button asChild variant="outline" className="employee-guide-secondary"><Link to="/pricing">شاهد الأسعار</Link></Button></div>
          </section>

          <section className="employee-guide-colleagues"><h2>تعرّف على بقية الفريق</h2><div className="employee-guide-colleague-list">{others.map((other) => <Link key={other.id} to="/employees/$id" params={{ id: other.id }} className="employee-guide-colleague"><Portrait memberId={other.id} name={other.name} /><div><strong>{other.name}</strong><span>{other.role}</span></div></Link>)}</div></section>
        </div>
      </div>
      <div className="employee-guide-mobile-action"><Button asChild className="employee-guide-cta"><Link to="/welcome">وظّف {m.name} الآن</Link></Button><Button asChild variant="outline" className="employee-guide-secondary"><Link to="/pricing">الأسعار</Link></Button></div>
    </PageShell>
  );
}

function GuideHeading({ number, title, description }: { number: string; title: string; description?: string }) {
  return <div className="employee-guide-section-heading"><span className="employee-guide-kicker">الفصل {number}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>;
}
