import { Banknote, CreditCard, Building2, Landmark } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatDualPrice, formatPrice } from "@/lib/currency";

interface PaymentData {
  name: string;
  amount: number;
  count: number;
  color: string;
  icon: React.ElementType;
}

interface PaymentMethodChartProps {
  data: PaymentData[];
}

const defaultData: PaymentData[] = [
  { name: "Cash", amount: 12500, count: 34, color: "hsl(142, 71%, 45%)", icon: Banknote },
  { name: "ABA", amount: 8200, count: 18, color: "hsl(217, 91%, 60%)", icon: Building2 },
  { name: "ACleda", amount: 6800, count: 15, color: "hsl(38, 92%, 50%)", icon: Landmark },
  { name: "Card", amount: 4500, count: 10, color: "hsl(270, 60%, 55%)", icon: CreditCard },
  { name: "Wing", amount: 0, count: 0, color: "hsl(195, 80%, 45%)", icon: Banknote },
  { name: "Binance(USDT)", amount: 0, count: 0, color: "hsl(45, 90%, 48%)", icon: Banknote },
  { name: "True Money", amount: 0, count: 0, color: "hsl(15, 85%, 52%)", icon: Banknote },
  { name: "Bank Transfer", amount: 0, count: 0, color: "hsl(200, 50%, 40%)", icon: Banknote },
  { name: "Insurance", amount: 0, count: 0, color: "hsl(340, 60%, 50%)", icon: Banknote },
];

const PaymentMethodChart = ({ data = defaultData }: PaymentMethodChartProps) => {
  const total = data.reduce((s, d) => s + d.amount, 0);
  const hasData = total > 0;

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-card-foreground font-heading">Payment Methods</h3>
            <p className="text-[10px] text-muted-foreground">Revenue by payment type</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-card-foreground font-number">{formatDualPrice(total)}</p>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Donut Chart */}
          <div className="flex-shrink-0 w-[120px] h-[120px] relative">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.filter(d => d.amount > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={3}
                    dataKey="amount"
                    strokeWidth={0}
                  >
                    {data.filter(d => d.amount > 0).map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    formatter={(value: number) => [formatPrice(value), "Amount"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full rounded-full border-[10px] border-muted/30 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground font-medium">No data</span>
              </div>
            )}
            {hasData && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-sm font-black font-number text-card-foreground leading-none">{data.filter(d => d.amount > 0).length}</p>
                  <p className="text-[8px] text-muted-foreground font-semibold uppercase tracking-wider">active</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Grid */}
          <div className="flex-1 grid grid-cols-3 gap-x-6 gap-y-3">
            {data.map((d) => {
              const pct = total > 0 ? Math.round((d.amount / total) * 100) : 0;
              return (
                <div key={d.name} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ background: `${d.color}14` }}>
                    <d.icon className="w-4 h-4" style={{ color: d.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-card-foreground truncate">{d.name}</span>
                      {hasData && <span className="text-[10px] font-bold font-number flex-shrink-0" style={{ color: d.color }}>{pct}%</span>}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-sm font-extrabold text-card-foreground font-number">{formatPrice(d.amount)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{d.count} txns</span>
                      <div className="flex-1 h-1 rounded-full bg-muted/40 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 2)}%`, background: d.color }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodChart;
