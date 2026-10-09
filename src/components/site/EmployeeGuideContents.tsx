import { useEffect, useRef, useState } from "react";
import { BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const guideSections = [
  { id: "overview", label: "نظرة عامة" },
  { id: "capabilities", label: "المسؤوليات بالتفصيل" },
  { id: "workflow", label: "آلية العمل" },
  { id: "preparation", label: "ما يحتاجه منك" },
  { id: "examples", label: "نماذج المخرجات" },
  { id: "skills", label: "دليل كل القدرات" },
  { id: "tools", label: "الأدوات والصلاحيات" },
  { id: "boundaries", label: "الحدود والمراجعة" },
  { id: "faq", label: "أسئلة وإجابات" },
  { id: "start", label: "ابدأ بطلب واضح" },
];

export function EmployeeGuideContents({ employeeId }: { employeeId: string }) {
  const [active, setActive] = useState("overview");
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setActive("overview");
    const update = () => {
      let current = "overview";
      const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      for (const section of guideSections) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        const scrollMargin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
        if (el.getBoundingClientRect().top <= scrollPadding + scrollMargin + 12) current = section.id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [employeeId]);

  useEffect(() => {
    const nav = navRef.current;
    const link = nav?.querySelector<HTMLAnchorElement>(`[href="#${active}"]`);
    if (nav && link && nav.scrollWidth > nav.clientWidth) {
      const navRect = nav.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      nav.scrollBy({ left: linkRect.left - navRect.left - (nav.clientWidth - linkRect.width) / 2 });
    }
  }, [active]);

  return (
    <aside className="employee-guide-contents">
      <p className="employee-guide-contents-title"><BookOpen aria-hidden="true" /> في هذا الدليل</p>
      <nav ref={navRef} aria-label="فهرس دليل الموظف">
        {guideSections.map((section, index) => (
          <a key={section.id} href={`#${section.id}`} aria-current={active === section.id ? "location" : undefined}>
            <span>{String(index + 1).padStart(2, "0")}</span>{section.label}
          </a>
        ))}
      </nav>
      <p className="employee-guide-contents-note">مسؤوليات واضحة.<br />مخرجات تراجعها.<br />قرار التنفيذ بيدك.</p>
    </aside>
  );
}

export function CopyEmployeeRequest({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFailed(false);
      timer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setFailed(true);
    }
  }
  return <div className="employee-guide-copy">
    <Button variant="outline" onClick={copy}>{copied ? <><Check /> تم النسخ</> : "انسخ صيغة الطلب"}</Button>
    {failed && <p role="status">تعذر النسخ؛ يمكنك تحديد النص ونسخه مباشرةً.</p>}
    <span className="sr-only" role="status">{copied ? "تم نسخ الطلب" : ""}</span>
  </div>;
}