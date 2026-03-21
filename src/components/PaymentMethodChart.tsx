import { Banknote, CreditCard, Building2, Landmark } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
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

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-card-foreground font-heading">Payment Methods</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Revenue by payment type</p>
        </div>
        <span className="text-sm font-bold text-card-foreground font-number">{formatDualPrice(total)}</span>
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        {data.map((d) => (
          <div key={d.name} className="relative overflow-hidden rounded-xl p-3 border border-border/50" style={{ background: `${d.color}08` }}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${d.color}18` }}>
                <d.icon className="w-3.5 h-3.5" style={{ color: d.color }} />
              </div>
              <span className="text-xs font-semibold text-card-foreground">{d.name}</span>
            </div>
            <p className="text-base font-extrabold text-card-foreground font-number">{formatPrice(d.amount)}</p>
            <p className="text-[10px] text-muted-foreground">{d.count} transactions</p>
            {/* Progress bar */}
            <div className="mt-2 h-1 rounded-full bg-muted/60 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(d.amount / total) * 100}%`, background: d.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" barSize={16}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatPrice(v)} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "0 8px 32px -4px rgba(0,0,0,0.1)" }}
            formatter={(value: number) => [formatDualPrice(value), "Amount"]}
          />
          <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PaymentMethodChart;
