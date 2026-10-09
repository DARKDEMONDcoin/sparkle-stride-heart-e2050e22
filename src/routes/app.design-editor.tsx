import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { DESIGN_DRAFT_KEY } from "@/lib/design-draft";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, Download, FileArchive, FileText, Layers3, Plus, Redo2, Save, Trash2, Undo2, Upload } from "lucide-react";

export const Route = createFileRoute("/app/design-editor")({
  head: () => ({ meta: [
    { title: "محرر التصاميم — زياد" },
    { name: "description", content: "حرّر تصاميم دانة بصريًا وصدّرها بالمقاس المناسب لكل منصة." },
    { property: "og:title", content: "محرر التصاميم — زياد" },
    { property: "og:description", content: "مساحة تحرير احترافية لتصاميمك داخل زياد." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: DesignEditorPage,
});

type FormatKey = "square" | "portrait" | "story" | "landscape";
type Slide = { id: string; title: string; subtitle: string; cta: string; image: string | null };
type DraftPayload = { body?: string; request?: string; imageUrl?: string | null };
type EditorSnapshot = { slides: Slide[]; active: number; format: FormatKey; imageZoom: number; imageX: number; imageY: number; overlay: number; align: "right" | "center" | "left"; palette: string };

const FORMATS: Record<FormatKey, { label: string; width: number; height: number }> = {
  square: { label: "منشور مربع", width: 1080, height: 1080 },
  portrait: { label: "منشور طولي", width: 1080, height: 1350 },
  story: { label: "قصة", width: 1080, height: 1920 },
  landscape: { label: "عرضي", width: 1200, height: 628 },
};
const PALETTES = [
  { id: "ink", label: "حبر وذهب", bg: "#171513", accent: "#d6a64b", text: "#fffaf0" },
  { id: "jade", label: "يشم", bg: "#123c3a", accent: "#e1ad53", text: "#fffdf6" },
  { id: "paper", label: "ورق", bg: "#f7f4ed", accent: "#9d512d", text: "#191715" },
  { id: "coral", label: "مرجان", bg: "#8d3f2a", accent: "#f4c76a", text: "#fff9ef" },
];

function id() { return Math.random().toString(36).slice(2, 10); }
function textFromBody(body = "") {
  const clean = body.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/https?:\/\/\S+/g, "").replace(/[*_#>`~-]/g, "").trim();
  const lines = clean.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return { title: (lines[0] || "فكرتك تستحق أن تُرى").slice(0, 90), subtitle: (lines.slice(1).join(" ") || "تصميم واضح، أنيق، وجاهز للنشر").slice(0, 180) };
}
function initialSlide(payload: DraftPayload | null): Slide {
  const copy = textFromBody(payload?.body);
  return { id: id(), title: copy.title, subtitle: copy.subtitle, cta: "اكتشف المزيد", image: payload?.imageUrl || null };
}

function DesignEditorPage() {
  const [slides, setSlides] = useState<Slide[]>([initialSlide(null)]);
  const [active, setActive] = useState(0);
  const [format, setFormat] = useState<FormatKey>("square");
  const [imageZoom, setImageZoom] = useState(100);
  const [imageX, setImageX] = useState(50);
  const [imageY, setImageY] = useState(50);
  const [overlay, setOverlay] = useState(42);
  const [align, setAlign] = useState<"right" | "center" | "left">("right");
  const [palette, setPalette] = useState("ink");
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [future, setFuture] = useState<EditorSnapshot[]>([]);
  const [notice, setNotice] = useState("محفوظ تلقائيًا");
  const hydrated = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const slide = slides[active] ?? slides[0];
  const scheme = PALETTES.find((item) => item.id === palette) ?? PALETTES[0]!;
  const size = FORMATS[format];
  const ratio = `${size.width} / ${size.height}`;

  const snapshot = (): EditorSnapshot => ({ slides, active, format, imageZoom, imageX, imageY, overlay, align, palette });
  const restore = (next: EditorSnapshot) => {
    setSlides(next.slides); setActive(next.active); setFormat(next.format); setImageZoom(next.imageZoom);
    setImageX(next.imageX); setImageY(next.imageY); setOverlay(next.overlay); setAlign(next.align); setPalette(next.palette);
  };
  const checkpoint = () => { setHistory((items) => [...items.slice(-29), snapshot()]); setFuture([]); };

  useEffect(() => {
    let payload: DraftPayload | null = null;
    try {
      const params = new URLSearchParams(window.location.search);
      const stored = sessionStorage.getItem(DESIGN_DRAFT_KEY);
      if (params.get("seed") === "chat" && stored) payload = JSON.parse(stored) as DraftPayload;
      const legacyImage = params.get("img");
      if (legacyImage) payload = { ...(payload ?? {}), imageUrl: legacyImage };
      if (!payload) {
        const saved = localStorage.getItem("sahl:design-editor:autosave");
        if (saved) { restore(JSON.parse(saved) as EditorSnapshot); hydrated.current = true; return; }
      }
    } catch { /* ابدأ بمسودة نظيفة عند منع التخزين أو تلفها. */ }
    setSlides([initialSlide(payload)]);
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const timer = window.setTimeout(() => {
      try { localStorage.setItem("sahl:design-editor:autosave", JSON.stringify(snapshot())); setNotice("محفوظ تلقائيًا"); }
      catch { setNotice("تعذّر الحفظ المحلي"); }
    }, 500);
    setNotice("جارٍ الحفظ…");
    return () => window.clearTimeout(timer);
  }, [slides, active, format, imageZoom, imageX, imageY, overlay, align, palette]);

  const updateSlide = (patch: Partial<Slide>) => setSlides((items) => items.map((item, index) => index === active ? { ...item, ...patch } : item));
  const addSlide = () => { checkpoint(); setSlides((items) => [...items, { ...initialSlide(null), title: `شريحة ${items.length + 1}` }]); setActive(slides.length); };
  const deleteSlide = () => { if (slides.length === 1) return; checkpoint(); setSlides((items) => items.filter((_, index) => index !== active)); setActive(Math.max(0, active - 1)); };
  const undo = () => { const previous = history.at(-1); if (!previous) return; setFuture((items) => [snapshot(), ...items]); setHistory((items) => items.slice(0, -1)); restore(previous); };
  const redo = () => { const next = future[0]; if (!next) return; setHistory((items) => [...items, snapshot()]); setFuture((items) => items.slice(1)); restore(next); };

  const drawSlide = async (item: Slide) => {
    const canvas = document.createElement("canvas"); canvas.width = size.width; canvas.height = size.height;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("تعذّر تجهيز ملف الصورة");
    ctx.fillStyle = scheme.bg; ctx.fillRect(0, 0, size.width, size.height);
    if (item.image) {
      const image = new Image(); image.crossOrigin = "anonymous"; image.src = item.image;
      await image.decode();
      const baseScale = Math.max(size.width / image.width, size.height / image.height) * imageZoom / 100;
      const dw = image.width * baseScale, dh = image.height * baseScale;
      const dx = (size.width - dw) * imageX / 100, dy = (size.height - dh) * imageY / 100;
      ctx.drawImage(image, dx, dy, dw, dh);
      ctx.fillStyle = `rgba(0,0,0,${overlay / 100})`; ctx.fillRect(0, 0, size.width, size.height);
    }
    const pad = size.width * 0.075; const center = align === "center";
    ctx.textAlign = center ? "center" : align === "left" ? "left" : "right";
    const x = center ? size.width / 2 : align === "left" ? pad : size.width - pad;
    ctx.direction = "rtl"; ctx.fillStyle = scheme.accent; ctx.font = `700 ${Math.round(size.width * .026)}px sans-serif`;
    ctx.fillText("زياد × دانة", x, size.height * .14);
    const wrap = (text: string, maxWidth: number, font: string, y: number, line: number) => {
      ctx.font = font; const words = text.split(/\s+/); const lines: string[] = []; let current = "";
      words.forEach((word) => { const test = `${current} ${word}`.trim(); if (ctx.measureText(test).width > maxWidth && current) { lines.push(current); current = word; } else current = test; });
      if (current) lines.push(current); lines.slice(0, 4).forEach((value, index) => ctx.fillText(value, x, y + index * line)); return lines.length;
    };
    ctx.fillStyle = scheme.text; const titleSize = Math.round(size.width * .072); const titleY = size.height * .48;
    const titleLines = wrap(item.title, size.width * .84, `800 ${titleSize}px sans-serif`, titleY, titleSize * 1.25);
    ctx.globalAlpha = .86; const subSize = Math.round(size.width * .03);
    wrap(item.subtitle, size.width * .76, `500 ${subSize}px sans-serif`, titleY + titleLines * titleSize * 1.25 + subSize, subSize * 1.55); ctx.globalAlpha = 1;
    ctx.fillStyle = scheme.accent; const buttonW = size.width * .3, buttonH = size.width * .07; const bx = center ? x - buttonW / 2 : align === "left" ? x : x - buttonW;
    ctx.beginPath(); ctx.roundRect(bx, size.height * .82, buttonW, buttonH, buttonH / 2); ctx.fill();
    ctx.fillStyle = scheme.bg; ctx.textAlign = "center"; ctx.font = `700 ${Math.round(size.width * .026)}px sans-serif`; ctx.fillText(item.cta, bx + buttonW / 2, size.height * .82 + buttonH * .64);
    return canvas;
  };
  const download = async (kind: "png" | "pdf" | "zip") => {
    setNotice("جارٍ تجهيز الملف…");
    try {
      if (kind === "png") {
        const canvas = await drawSlide(slide!); const link = document.createElement("a"); link.download = `sahl-design-${active + 1}.png`; link.href = canvas.toDataURL("image/png"); link.click();
      } else if (kind === "pdf") {
        const { jsPDF } = await import("jspdf"); const pdf = new jsPDF({ orientation: size.width > size.height ? "landscape" : "portrait", unit: "px", format: [size.width, size.height] });
        for (let index = 0; index < slides.length; index += 1) { if (index) pdf.addPage([size.width, size.height]); const canvas = await drawSlide(slides[index]!); pdf.addImage(canvas.toDataURL("image/jpeg", .94), "JPEG", 0, 0, size.width, size.height); }
        pdf.save("sahl-design.pdf");
      } else {
        const JSZip = (await import("jszip")).default; const zip = new JSZip();
        for (let index = 0; index < slides.length; index += 1) { const canvas = await drawSlide(slides[index]!); zip.file(`slide-${index + 1}.png`, canvas.toDataURL("image/png").split(",")[1]!, { base64: true }); }
        const blob = await zip.generateAsync({ type: "blob" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "sahl-carousel.zip"; link.click(); URL.revokeObjectURL(link.href);
      }
      setNotice("تم تجهيز الملف");
    } catch { setNotice("تعذّر التصدير؛ جرّب صورة من دون حماية خارجية"); }
  };
  const contrast = useMemo(() => overlay >= 35 || !slide?.image, [overlay, slide?.image]);
  if (!slide) return null;

  return <AppShell title="محرر دانة" lead="حرّر، راجع، وصدّر من مكان واحد" padded={false}>
    <div className="design-studio grid min-h-dvh grid-cols-[minmax(16rem,21rem)_minmax(0,1fr)_minmax(12rem,15rem)] grid-rows-[auto_minmax(0,1fr)] bg-muted max-[980px]:grid-cols-[minmax(15rem,18rem)_minmax(0,1fr)] max-[700px]:flex max-[700px]:flex-col" dir="rtl">
      <header className="design-studio-toolbar col-span-full flex min-h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 py-2">
        <div className="flex min-w-0 items-center gap-2"><Layers3 className="size-5 text-primary" /><div><strong className="block text-sm">مساحة التصميم</strong><span className="block text-xs text-muted-foreground">{notice}</span></div></div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={undo} disabled={!history.length} title="تراجع"><Undo2 /></Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={!future.length} title="إعادة"><Redo2 /></Button>
          <Button variant="outline" size="sm" onClick={() => download("png")}><Download /> PNG</Button>
        </div>
      </header>

      <aside className="design-studio-panel">
        <section><label className="design-label">المقاس</label><div className="design-segments">{Object.entries(FORMATS).map(([key, item]) => <Button key={key} variant={format === key ? "default" : "outline"} size="sm" onClick={() => { checkpoint(); setFormat(key as FormatKey); }}>{item.label}</Button>)}</div></section>
        <section><label className="design-label" htmlFor="design-title">العنوان</label><textarea id="design-title" value={slide.title} maxLength={90} onFocus={checkpoint} onChange={(event) => updateSlide({ title: event.target.value })} className="design-field min-h-24" /><span className="design-count">{slide.title.length}/90</span></section>
        <section><label className="design-label" htmlFor="design-subtitle">النص المساند</label><textarea id="design-subtitle" value={slide.subtitle} maxLength={180} onFocus={checkpoint} onChange={(event) => updateSlide({ subtitle: event.target.value })} className="design-field min-h-20" /><span className="design-count">{slide.subtitle.length}/180</span></section>
        <section><label className="design-label" htmlFor="design-cta">زر الدعوة</label><input id="design-cta" value={slide.cta} maxLength={28} onFocus={checkpoint} onChange={(event) => updateSlide({ cta: event.target.value })} className="design-field" /></section>
        <section><label className="design-label">الألوان</label><div className="design-palettes">{PALETTES.map((item) => <Button key={item.id} type="button" variant="ghost" size="icon" onClick={() => { checkpoint(); setPalette(item.id); }} className={cn("design-swatch", palette === item.id && "is-active")} style={{ background: `linear-gradient(135deg, ${item.bg} 50%, ${item.accent} 50%)` }} title={item.label}>{palette === item.id ? <Check /> : null}</Button>)}</div></section>
        <section><label className="design-label">محاذاة النص</label><div className="design-segments">{(["right", "center", "left"] as const).map((value) => <Button key={value} variant={align === value ? "default" : "outline"} size="sm" onClick={() => { checkpoint(); setAlign(value); }}>{value === "right" ? "يمين" : value === "center" ? "وسط" : "يسار"}</Button>)}</div></section>
        <section><div className="flex items-center justify-between"><label className="design-label">الصورة</label><Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload /> رفع</Button></div><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; checkpoint(); updateSlide({ image: URL.createObjectURL(file) }); }} />
          {slide.image ? <div className="mt-3 grid gap-3"><Range label="تكبير" value={imageZoom} min={100} max={220} setValue={setImageZoom} /><Range label="أفقي" value={imageX} min={0} max={100} setValue={setImageX} /><Range label="رأسي" value={imageY} min={0} max={100} setValue={setImageY} /><Range label="وضوح النص" value={overlay} min={0} max={80} setValue={setOverlay} /></div> : null}
        </section>
      </aside>

      <main className="design-studio-stage">
        <div className="design-stage-meta"><span>{size.width} × {size.height}</span><span className={cn("design-check", contrast && "is-good")}>{contrast ? "تباين ممتاز" : "ارفع وضوح النص"}</span></div>
        <div className="design-canvas-wrap"><article className="design-canvas" style={{ aspectRatio: ratio, backgroundColor: scheme.bg, color: scheme.text, textAlign: align }}>
          {slide.image ? <><img src={slide.image} alt="" style={{ objectPosition: `${imageX}% ${imageY}%`, transform: `scale(${imageZoom / 100})` }} /><div className="design-canvas-overlay" style={{ opacity: overlay / 100 }} /></> : null}
          <div className="design-safe-area"><span className="design-brand" style={{ color: scheme.accent }}>زياد × دانة</span><div className="design-copy"><h2 contentEditable suppressContentEditableWarning onBlur={(event) => updateSlide({ title: event.currentTarget.textContent || "" })}>{slide.title}</h2><p contentEditable suppressContentEditableWarning onBlur={(event) => updateSlide({ subtitle: event.currentTarget.textContent || "" })}>{slide.subtitle}</p></div><span className="design-cta" style={{ backgroundColor: scheme.accent, color: scheme.bg }}>{slide.cta}</span></div>
        </article></div>
        <div className="design-slide-nav"><Button variant="ghost" size="icon" onClick={() => setActive((value) => Math.max(0, value - 1))} disabled={active === 0}><ArrowRight /></Button><span>{active + 1} / {slides.length}</span><Button variant="ghost" size="icon" onClick={() => setActive((value) => Math.min(slides.length - 1, value + 1))} disabled={active === slides.length - 1}><ArrowLeft /></Button></div>
      </main>

      <aside className="design-studio-assets">
        <div className="flex items-center justify-between"><strong className="text-sm">الشرائح</strong><Button variant="outline" size="icon" onClick={addSlide} title="إضافة شريحة"><Plus /></Button></div>
        <div className="design-slide-list">{slides.map((item, index) => <Button key={item.id} variant="ghost" onClick={() => setActive(index)} className={cn("design-slide-item", active === index && "is-active")}><span>{index + 1}</span><span className="truncate">{item.title}</span></Button>)}</div>
        <Button variant="ghost" size="sm" onClick={deleteSlide} disabled={slides.length === 1} className="w-full text-destructive"><Trash2 /> حذف الشريحة</Button>
        <div className="mt-auto grid gap-2 border-t border-border pt-4"><Button variant="outline" onClick={() => download("pdf")}><FileText /> ملف PDF</Button><Button onClick={() => download("zip")}><FileArchive /> تصدير كل الشرائح</Button><div className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Save className="size-3" /> تُحفظ التعديلات تلقائيًا</div></div>
      </aside>
    </div>
  </AppShell>;
}

function Range({ label, value, min, max, setValue }: { label: string; value: number; min: number; max: number; setValue: (value: number) => void }) {
  return <label className="grid gap-1 text-xs font-bold"><span className="flex justify-between"><span>{label}</span><span>{value}%</span></span><input type="range" min={min} max={max} value={value} onChange={(event) => setValue(Number(event.target.value))} className="accent-primary" /></label>;
}
