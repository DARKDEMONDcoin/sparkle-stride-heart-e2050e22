/** خلفية فاخرة حيّة (ذهب على أسود) مستوحاة من أقسام الصفحة الرئيسية الداكنة. زخرفة فقط. */
export function LuxStage({ variant = "radar" }: { variant?: "radar" | "ledger" | "rise" }) {
  return <div className={`lux-stage lux-${variant}`} aria-hidden="true">
    <span className="lux-glow" />
    <span className="lux-grid" />
    {variant === "radar" ? <span className="lux-radar"><b /><i /><i /><i /></span> : null}
    {variant === "ledger" ? <span className="lux-ledger"><i /><i /><i /><i /><i /></span> : null}
    <span className="lux-sparks">{Array.from({ length: 14 }, (_, i) => <i key={i} />)}</span>
    <span className="lux-sheen" />
    <span className="lux-baseline" />
  </div>;
}
