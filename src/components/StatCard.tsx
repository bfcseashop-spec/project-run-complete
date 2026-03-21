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
}

const StatCard = ({ title, value, change, changeType = "neutral", icon: Icon, accentColor }: StatCardProps) => {
  const color = accentColor || "hsl(var(--primary))";

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group bg-card border border-border/50"
      style={{
        borderLeft: `3px solid ${color}`,
      }}
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
              Yesterday <span className="font-bold font-number">{change}</span>
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
