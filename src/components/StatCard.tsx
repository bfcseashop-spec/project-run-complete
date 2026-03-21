import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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
  const changeColor = {
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-red-500 dark:text-red-400",
    neutral: "text-muted-foreground",
  }[changeType];

  const TrendIcon = changeType === "positive" ? TrendingUp : changeType === "negative" ? TrendingDown : Minus;

  return (
    <div className={`relative overflow-hidden rounded-xl p-4 shadow-sm border border-border/40 hover:shadow-md transition-all duration-200 group ${gradient || "bg-card"}`}>
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: accentColor || "hsl(var(--primary))" }}
      />

      <div className="relative flex items-center gap-3.5 pl-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accentColor || "hsl(var(--primary))"}15` }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: accentColor || "hsl(var(--primary))" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold leading-none mb-1">{title}</p>
          <p className="text-xl font-extrabold text-card-foreground font-number tracking-tight leading-none">{value}</p>
        </div>
        {change && (
          <div className={`flex items-center gap-0.5 ${changeColor} flex-shrink-0`}>
            <TrendIcon className="w-3 h-3" />
            <p className="text-[10px] font-semibold whitespace-nowrap">{change}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
