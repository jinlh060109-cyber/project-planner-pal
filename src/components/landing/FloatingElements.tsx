import { Bell, CheckCircle, Zap, TrendingUp, Shield, Target, AlertTriangle, Sparkles } from "lucide-react";

const CARD_BG = "#1A1D27";
const BORDER_DARK = "#2A2D3A";
const INDIGO = "#6366F1";
const INDIGO_LIGHT = "#818CF8";
const SWOT = {
  s: "hsl(var(--strength))",
  w: "hsl(var(--weakness))",
  o: "hsl(var(--opportunity))",
  t: "hsl(var(--threat))",
};

/* ─── Donut Chart (SVG) ─── */
const BalanceDonut = () => {
  const r = 28, cx = 36, cy = 36, stroke = 10;
  const C = 2 * Math.PI * r;
  const seg = C / 4;
  const colors = [SWOT.s, SWOT.w, SWOT.o, SWOT.t];
  return (
    <div className="flex flex-col items-center gap-1.5 p-3" style={{ background: CARD_BG, borderRadius: 12 }}>
      <svg width={72} height={72} viewBox="0 0 72 72">
        {colors.map((c, i) => (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={c} strokeWidth={stroke}
            strokeDasharray={`${seg} ${C - seg}`}
            strokeDashoffset={-seg * i + C / 4}
          />
        ))}
      </svg>
      <span style={{ fontSize: 10 }} className="text-muted-foreground">Quadrant Balance</span>
    </div>
  );
};

/* ─── Streak Calendar ─── */
const StreakChip = () => (
  <div className="flex flex-col gap-1.5" style={{ background: CARD_BG, borderRadius: 999, padding: "12px 24px" }}>
    <span style={{ fontSize: 10 }} className="text-muted-foreground">Week streak</span>
    <div className="flex gap-[6px]">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 10, height: 10,
            backgroundColor: i < 5 ? SWOT.s : BORDER_DARK,
          }}
        />
      ))}
    </div>
  </div>
);

/* ─── AI Nudge Toast ─── */
const AiNudgeToast = () => (
  <div
    className="flex items-start gap-2.5 p-3"
    style={{
      background: CARD_BG, borderRadius: 12, width: 240,
      borderLeft: `3px solid ${SWOT.o}`,
      boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
    }}
  >
    <Bell size={16} color={INDIGO} className="shrink-0 mt-0.5" />
    <span style={{ fontSize: 13 }} className="text-foreground leading-tight">
      Rebalance · 0 Opportunity tasks this week
    </span>
  </div>
);

/* ─── Persona Chip ─── */
const PersonaChip = () => (
  <div
    className="flex items-center gap-2.5"
    style={{ background: CARD_BG, borderRadius: 12, padding: "10px 16px", width: 180 }}
  >
    <div
      className="shrink-0 rounded-full"
      style={{
        width: 32, height: 32,
        background: `linear-gradient(135deg, ${INDIGO}, ${INDIGO_LIGHT})`,
      }}
    />
    <div className="flex flex-col">
      <span style={{ fontSize: 13, fontWeight: 600 }} className="text-foreground">Entrepreneur</span>
      <span style={{ fontSize: 11 }} className="text-muted-foreground">Week 12</span>
    </div>
  </div>
);

/* ─── AI Reasoning Snippet ─── */
const AiReasoningSnippet = () => (
  <div className="flex flex-col gap-2 p-3" style={{ background: CARD_BG, borderRadius: 12, width: 220 }}>
    <div className="flex items-start gap-2">
      <Sparkles size={14} color={INDIGO} className="shrink-0 mt-0.5" />
      <span style={{ fontSize: 12 }} className="text-foreground leading-tight">
        Classified as Strength · builds your leadership
      </span>
    </div>
    <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: BORDER_DARK }}>
      <div className="h-full rounded-full" style={{ width: "60%", background: SWOT.s }} />
    </div>
  </div>
);

/* ─── Credibility Pill ─── */
const CredPill = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div
    className="flex items-center gap-2"
    style={{
      background: CARD_BG, borderRadius: 999, padding: "8px 14px",
      border: `1px solid ${BORDER_DARK}`,
    }}
  >
    {icon}
    <span style={{ fontSize: 12, fontWeight: 500 }} className="text-foreground whitespace-nowrap">{text}</span>
  </div>
);

/* ─── Floating SWOT Icon ─── */
const SwotIcon = ({ icon: Icon, color, size, opacity, blur = 0 }: {
  icon: React.ElementType; color: string; size: number; opacity: number; blur?: number;
}) => (
  <div style={{ opacity, filter: blur ? `blur(${blur}px)` : undefined }}>
    <Icon size={size} color={color} />
  </div>
);

/* ─── Q Logomark ─── */
const QLogomark = () => (
  <div
    className="flex items-center justify-center font-serif font-bold text-foreground"
    style={{
      width: 48, height: 48, borderRadius: 10,
      background: "hsl(var(--foreground))", color: "hsl(var(--background))",
      fontSize: 28, opacity: 0.15,
    }}
  >
    Q
  </div>
);

/* ─── Position wrapper ─── */
interface FloatingItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  index: number;
  hoverable?: boolean;
}

const FloatingItem = ({ children, className = "", style, index, hoverable = true }: FloatingItemProps) => (
  <div
    className={`absolute pointer-events-none select-none ${hoverable ? "transition-all duration-200 hover:-translate-y-1 hover:shadow-xl" : ""} ${className}`}
    style={{
      ...style,
      animation: `floatElementIn 400ms ease-out ${index * 80}ms both, floatIdle 6s ease-in-out ${index * 300}ms infinite`,
    }}
  >
    {children}
  </div>
);

/* ─── Main component ─── */
const FloatingElements = () => (
  <>
    {/* Group A — Feature Previews */}
    <FloatingItem index={0} className="top-[6%] left-[4%] hidden md:block">
      <BalanceDonut />
    </FloatingItem>
    <FloatingItem index={1} className="top-[8%] right-[6%] hidden md:block">
      <StreakChip />
    </FloatingItem>
    <FloatingItem index={2} className="top-[28%] left-[2%] hidden lg:block">
      <AiNudgeToast />
    </FloatingItem>
    <FloatingItem index={3} className="bottom-[28%] right-[3%] hidden lg:block">
      <PersonaChip />
    </FloatingItem>
    <FloatingItem index={4} className="bottom-[10%] left-[5%] hidden md:block">
      <AiReasoningSnippet />
    </FloatingItem>

    {/* Group B — Credibility Badges */}
    <FloatingItem index={5} className="bottom-[8%] right-[8%] hidden md:block">
      <CredPill icon={<CheckCircle size={14} color={SWOT.s} />} text="847 tasks classified" />
    </FloatingItem>
    <FloatingItem index={6} className="top-[42%] left-[6%] hidden lg:block">
      <CredPill icon={<Zap size={14} color={SWOT.w} />} text="Classified in 1.2s" />
    </FloatingItem>
    <FloatingItem index={7} className="top-[18%] left-[22%] hidden lg:block">
      <CredPill icon={<TrendingUp size={14} color={SWOT.s} />} text="Strengths +12% this week" />
    </FloatingItem>

    {/* Group C — Visual Texture (hidden on mobile) */}
    <FloatingItem index={8} className="top-[15%] left-[42%] hidden lg:block" hoverable={false}>
      <SwotIcon icon={Shield} color={SWOT.s} size={20} opacity={0.3} />
    </FloatingItem>
    <FloatingItem index={9} className="bottom-[22%] left-[38%] hidden lg:block" hoverable={false}>
      <SwotIcon icon={Target} color={SWOT.w} size={24} opacity={0.25} blur={1} />
    </FloatingItem>
    <FloatingItem index={10} className="top-[60%] right-[18%] hidden lg:block" hoverable={false}>
      <SwotIcon icon={TrendingUp} color={SWOT.o} size={16} opacity={0.35} />
    </FloatingItem>
    <FloatingItem index={11} className="bottom-[38%] left-[18%] hidden lg:block" hoverable={false}>
      <SwotIcon icon={AlertTriangle} color={SWOT.t} size={28} opacity={0.25} blur={0.5} />
    </FloatingItem>
    <FloatingItem index={12} className="bottom-[45%] right-[12%] hidden lg:block" hoverable={false}>
      <QLogomark />
    </FloatingItem>
  </>
);

export default FloatingElements;
