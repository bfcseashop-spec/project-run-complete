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
];

const PaymentMethodChart = ({ data = defaultData }: PaymentMethodChartProps) => {
  const total = data.reduce((s, d) => s + d.amount, 0);
  const hasData = total > 0;

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-card-foreground font-heading">💳 Payment Methods</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Revenue by payment type</p>
        </div>
        <span className="text-base font-bold text-card-foreground font-number">{formatDualPrice(total)}</span>
      </div>

      <div className="flex gap-5 items-center">
        {/* Donut Chart */}
        <div className="flex-shrink-0 w-[130px] h-[130px] relative">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.filter(d => d.amount > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="amount"
                  strokeWidth={0}
                >
                  {data.filter(d => d.amount > 0).map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: "12px", boxShadow: "var(--shadow-elevated)" }}
                  formatter={(value: number) => [formatPrice(value), "Amount"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full rounded-full border-[12px] border-muted/40 flex items-center justify-center">
              <span className="text-xs text-muted-foreground font-medium">No data</span>
            </div>
          )}
          {hasData && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-sm font-black font-number text-card-foreground leading-none">{data.filter(d => d.amount > 0).length}</p>
                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">methods</p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Cards Grid */}
        <div className="flex-1 grid grid-cols-2 gap-2.5">
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.amount / total) * 100) : 0;
            return (
              <div key={d.name} className="rounded-xl p-3 border border-border/40 hover:shadow-sm transition-shadow" style={{ background: `${d.color}06` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${d.color}18` }}>
                    <d.icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                  </div>
                  <span className="text-xs font-semibold text-card-foreground">{d.name}</span>
                  {hasData && <span className="text-[10px] font-bold ml-auto font-number" style={{ color: d.color }}>{pct}%</span>}
                </div>
                <p className="text-sm font-extrabold text-card-foreground font-number">{formatPrice(d.amount)}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-muted-foreground">{d.count} txns</p>
                  <div className="w-12 h-1 rounded-full bg-muted/50 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: d.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodChart;
