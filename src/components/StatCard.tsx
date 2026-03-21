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

const StatCard = ({ title, value, change, changeType = "neutral", icon: Icon, iconBg, gradient, accentColor }: StatCardProps) => {
  const color = accentColor || "hsl(var(--primary))";

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 border border-transparent transition-all duration-200 hover:shadow-md group"
      style={{ background: `linear-gradient(135deg, ${color}08, ${color}15)`, borderColor: `${color}20` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-extrabold text-card-foreground font-number tracking-tight">{value}</p>
          {change && (
            <p className="text-[11px] text-muted-foreground">
              Yesterday <span className="font-semibold font-number text-card-foreground/70">{change}</span>
            </p>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
