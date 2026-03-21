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
}

const StatCard = ({ title, value, change, changeType = "neutral", icon: Icon, iconBg, gradient }: StatCardProps) => {
  const changeColor = {
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-red-500 dark:text-red-400",
    neutral: "text-muted-foreground",
  }[changeType];

  const TrendIcon = changeType === "positive" ? TrendingUp : changeType === "negative" ? TrendingDown : Minus;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-card border border-border/50 hover:shadow-elevated transition-all duration-300 hover:-translate-y-0.5 group ${gradient || "bg-card"}`}>
      {/* Decorative background circle */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300" />
      <div className="absolute -right-1 -top-1 w-14 h-14 rounded-full bg-primary/5 group-hover:bg-primary/8 transition-colors duration-300" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{title}</p>
          <p className="text-2xl font-extrabold text-card-foreground font-number tracking-tight">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 ${changeColor}`}>
              <TrendIcon className="w-3 h-3" />
              <p className="text-[11px] font-semibold">{change}</p>
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${iconBg || "bg-primary/10 dark:bg-primary/20"}`}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
