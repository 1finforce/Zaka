"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
export function MonthlyBars({ data }: { data: { month: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}><XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8B847A" }} axisLine={false} tickLine={false} /><YAxis hide />
        <Tooltip formatter={(v: number) => `R ${v.toLocaleString("en-ZA")}`} contentStyle={{ borderRadius: 12, border: "1px solid #E8E0D6" }} />
        <Bar dataKey="total" radius={[8, 8, 8, 8]}>{data.map((_, i) => <Cell key={i} fill={i === data.length - 1 ? "#3C4589" : "#CFE2EE"} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
