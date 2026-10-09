import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  BrainCircuit,
  ChevronDown,
  Globe2,
  Menu,
  MessageSquareText,
  ShieldCheck,
  Store,
  Utensils,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/site/LogoMark";
import { Portrait } from "@/components/site/Portrait";
import { Button } from "@/components/ui/button";
import { team } from "@/data/team";
import "@/components/site/navigation.css";

const groups = [
  {
    label: "المنتج",
    intro: "فريق رقمي يعمل كنظام واحد",
    links: [
      {
        label: "المزايا",
        desc: "من الطلب إلى التنفيذ والمراجعة",
        to: "/features",
        icon: BrainCircuit,
      },
      { label: "الأمان", desc: "تحكم وصلاحيات وسجل واضح", to: "/security", icon: ShieldCheck },
    ],
  },
  {
    label: "الحلول",
    intro: "تشغيل يتكيّف مع نشاطك",
    links: [
      {
        label: "المتاجر",
        desc: "محتوى وطلبات ومتابعة العملاء",
        to: "/use-cases/ecommerce",
        icon: Store,
      },
      {
        label: "المطاعم",
        desc: "عروض يومية وردود وقت الذروة",
        to: "/use-cases/restaurants",
        icon: Utensils,
      },
      {
        label: "كل القطاعات",
        desc: "حلول للعيادات والعقار والتعليم",
        to: "/use-cases",
        icon: Globe2,
      },
    ],
  },
  {
    label: "المصادر",
    intro: "اعرف كيف يعمل زياد",
    links: [
      { label: "قصص النجاح", desc: "نتائج من مشروعات عربية", to: "/stories", icon: BarChart3 },
      {
        label: "كيف يعمل",
        desc: "من أول إعداد إلى أول نتيجة",
        to: "/how-it-works",
        icon: BrainCircuit,
      },
      {
        label: "المدونة",
        desc: "أفكار عملية للنمو والتشغيل",
        to: "/blog",
        icon: MessageSquareText,
      },
    ],
  },
] as const;

type MenuPath = (typeof groups)[number]["links"][number]["to"];

/** رابط قائمة بتنقل فوري؛ صفحات حالات الاستخدام تمر عبر المسار الديناميكي. */
function NavLink({ to, ...rest }: { to: MenuPath; role?: string; onClick?: () => void; children?: React.ReactNode }) {
  const m = to.match(/^\/use-cases\/(.+)$/);
  const useCaseId = m?.[1];
  if (useCaseId) return <Link to="/use-cases/$id" params={{ id: useCaseId }} {...rest} />;
  return <Link to={to as Exclude<MenuPath, `/use-cases/${string}`>} {...rest} />;
}

export function Nav({ variant = "over" }: { variant?: "over" | "solid" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileWorkersOpen, setMobileWorkersOpen] = useState(true);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const scrollDistance = useRef(0);
  const scrollDirection = useRef<"up" | "down" | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1025px)");
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (frame.current !== null) return;

      frame.current = window.requestAnimationFrame(() => {
        const currentScrollY = Math.max(window.scrollY, 0);
        const delta = currentScrollY - lastScrollY.current;
        const nextDirection = delta > 0 ? "down" : delta < 0 ? "up" : scrollDirection.current;

        setScrolled(currentScrollY > 18);

        if (nextDirection !== scrollDirection.current) {
          scrollDistance.current = 0;
          scrollDirection.current = nextDirection;
        }
        scrollDistance.current += Math.abs(delta);

        if (currentScrollY <= 18) {
          setHidden(false);
          scrollDistance.current = 0;
        } else if (nextDirection === "up" && scrollDistance.current >= 18) {
          setHidden(false);
          scrollDistance.current = 0;
        } else if (
          nextDirection === "down" &&
          scrollDistance.current >= 28 &&
          currentScrollY > 96
        ) {
          setHidden(true);
          scrollDistance.current = 0;
        }

        lastScrollY.current = currentScrollY;
        frame.current = null;
      });
    };

    lastScrollY.current = Math.max(window.scrollY, 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, [variant]);

  const navHidden = hidden && !mobileOpen && active === null;

  return (
    <header
      className={`sahl-white-nav${scrolled ? " is-scrolled" : ""}${navHidden ? " is-hidden" : ""}`}
      dir="rtl"
      onMouseLeave={() => setActive(null)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setActive(null);
          setMobileOpen(false);
        }
      }}
    >
      <nav className="sahl-white-nav-inner" aria-label="التنقل الرئيسي">
        <Link to="/" className="sahl-white-brand">
          <LogoMark size={36} />
          <span>زياد</span>
        </Link>
        <div className="sahl-white-links">
          <div onMouseEnter={() => setActive("الموظفون")}>
            <Button
              type="button"
              variant="ghost"
              aria-expanded={active === "الموظفون"}
              aria-haspopup="menu"
              onClick={() => setActive(active === "الموظفون" ? null : "الموظفون")}
            >
              الموظفون
              <ChevronDown />
            </Button>
            {active === "الموظفون" && (
              <div className="sahl-mega sahl-workers-mega" role="menu">
                <div className="sahl-workers-heading">
                  <span>
                    <b>موظفو زياد</b>
                    <small>ستة تخصصات تعمل معاً كفريق واحد</small>
                  </span>
                  <Link to="/employees" onClick={() => setActive(null)}>كل الفريق ←</Link>
                </div>
                <div className="sahl-workers-grid">
                  {team.map((member) => (
                    <Link
                      key={member.id}
                      to="/employees/$id"
                      params={{ id: member.id }}
                      role="menuitem"
                      activeProps={{ className: "is-current" }}
                      onClick={() => setActive(null)}
                    >
                      <span className="sahl-worker-avatar">
                        <Portrait memberId={member.id} name={member.name} />
                      </span>
                      <span>
                        <b>{member.name}</b>
                        <small>{member.role}</small>
                      </span>
                      <i>←</i>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          {groups.map((group) => (
            <div key={group.label} onMouseEnter={() => setActive(group.label)}>
              <Button
                type="button"
                variant="ghost"
                aria-expanded={active === group.label}
                aria-haspopup="menu"
                onClick={() => setActive(active === group.label ? null : group.label)}
              >
                {group.label}
                <ChevronDown />
              </Button>
              {active === group.label && (
                <div className="sahl-mega" role="menu">
                  <p>{group.intro}</p>
                  <div>
                    {group.links.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        onClick={() => setActive(null)}
                      >
                        <item.icon />
                        <span>
                          <b>{item.label}</b>
                          <small>{item.desc}</small>
                        </span>
                        <i>←</i>
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <Link to="/integrations">التكاملات</Link>
          <Link to="/pricing" className="sahl-nav-pricing">
            الأسعار
          </Link>
        </div>
        <div className="sahl-white-nav-actions">
          <Link to="/auth" search={{ mode: "signin" as const }}>
            دخول
          </Link>
          <Button asChild>
            <Link to="/welcome">
              ابدأ الآن <span>←</span>
            </Link>
          </Button>
        </div>
        <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Trigger asChild><Button
          className="sahl-white-menu"
          type="button"
          variant="ghost"
          size="icon"
          aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
        >
          {mobileOpen ? <X /> : <Menu />}
        </Button></DialogPrimitive.Trigger>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="sahl-nav-backdrop" />
          <DialogPrimitive.Content className="sahl-nav-drawer" dir="rtl" aria-describedby={undefined}>
            <header className="sahl-nav-drawer-header">
              <DialogPrimitive.Title className="sahl-nav-drawer-brand"><LogoMark size={30} />زياد</DialogPrimitive.Title>
              <DialogPrimitive.Close asChild><Button variant="ghost" size="icon" aria-label="إغلاق القائمة"><X /></Button></DialogPrimitive.Close>
            </header>
            <nav className="sahl-nav-drawer-scroll" aria-label="قائمة الموقع">
              <section>
                <Button type="button" variant="ghost" className="sahl-nav-group-toggle" aria-expanded={mobileWorkersOpen} aria-controls="public-mobile-workers" onClick={() => setMobileWorkersOpen(value => !value)}>الموظفون<ChevronDown /></Button>
                {mobileWorkersOpen && <div className="sahl-nav-workers" id="public-mobile-workers">
                  {team.map(member => <Link key={member.id} to="/employees/$id" params={{ id:member.id }} activeProps={{ className:"is-current" }} onClick={() => setMobileOpen(false)}>
                    <span className="sahl-worker-avatar"><Portrait memberId={member.id} name={member.name} /></span>
                    <span><b>{member.name}</b><small>{member.role}</small></span><span>←</span>
                  </Link>)}
                  <Link to="/employees" onClick={() => setMobileOpen(false)}>تعرّف على الفريق كاملاً<span>←</span></Link>
                </div>}
              </section>
              {groups.map((group,index) => <section key={group.label}>
                <Button type="button" variant="ghost" className="sahl-nav-group-toggle" aria-expanded={mobileGroup === group.label} aria-controls={`public-mobile-group-${index}`} onClick={() => setMobileGroup(value => value === group.label ? null : group.label)}>{group.label}<ChevronDown /></Button>
                {mobileGroup === group.label && <div className="sahl-nav-group-links" id={`public-mobile-group-${index}`}>
                  {group.links.map(item => <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)}><item.icon />{item.label}<span>←</span></NavLink>)}
                </div>}
              </section>)}
              <Link className="sahl-nav-standalone" to="/integrations" onClick={() => setMobileOpen(false)}>التكاملات<span>←</span></Link>
              <Link className="sahl-nav-standalone" to="/pricing" onClick={() => setMobileOpen(false)}>الأسعار<span>←</span></Link>
            </nav>
            <footer className="sahl-nav-drawer-footer">
              <Button asChild><Link to="/welcome" onClick={() => setMobileOpen(false)}>ابدأ الآن ←</Link></Button>
              <Button asChild variant="outline"><Link to="/auth" search={{ mode:"signin" }} onClick={() => setMobileOpen(false)}>تسجيل الدخول</Link></Button>
            </footer>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </nav>
    </header>
  );
}
