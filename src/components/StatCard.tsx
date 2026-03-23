import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconBg?: string;
  gradient?: string;
  accentColor?: string;
  variant?: "default" | "gradient";
}

const StatCard = ({ title, value, change, changeType = "neutral", icon: Icon, accentColor, variant = "default" }: StatCardProps) => {
  const color = accentColor || "hsl(var(--primary))";

  if (variant === "gradient") {
    return (
      <div
        className="relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
      >
        <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/10" />
        <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">{title}</p>
            <p className="text-2xl font-black text-white font-number tracking-tight leading-none">{value}</p>
            {change && (
              <p className="text-xs text-white/60 mt-1">
                <span className="font-bold font-number text-white/80">{change}</span>
              </p>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/15 backdrop-blur-sm shadow-sm">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group bg-card border border-border/50"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div
        className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
        style={{ background: color }}
      />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{title}</p>
          <p className="text-2xl font-black text-card-foreground font-number tracking-tight leading-none">{value}</p>
          {change && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-bold font-number">{change}</span>
            </p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
          style={{ background: `${color}30` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
