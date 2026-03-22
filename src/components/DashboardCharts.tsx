import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

interface WeeklyChartProps {
  data: { day: string; visits: number }[];
}

export const WeeklyChart = ({ data }: WeeklyChartProps) => (
  <ResponsiveContainer width="100%" height={130}>
    <BarChart data={data} barSize={24}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
        </linearGradient>
      </defs>
      <Bar dataKey="visits" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: "12px", fontWeight: 700 }} />
    </BarChart>
  </ResponsiveContainer>
);

interface DeptChartProps {
  data: { name: string; value: number; fill: string }[];
}

export const DepartmentChart = ({ data }: DeptChartProps) => (
  <div className="flex items-center gap-4">
    <ResponsiveContainer width={110} height={110}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" paddingAngle={3} strokeWidth={0}>
          {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
    <div className="space-y-2.5 flex-1">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-md" style={{ backgroundColor: d.fill }} />
          <span className="text-sm font-semibold text-card-foreground flex-1">{d.name}</span>
          <span className="text-sm font-bold font-number" style={{ color: d.fill }}>{d.value}%</span>
        </div>
      ))}
    </div>
  </div>
);
