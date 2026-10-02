"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
export function MonthlyBars({ data }: { data: { month: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}><defs><linearGradient id="zk-bar-now" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C86E0" /><stop offset="100%" stopColor="#B48AD6" /></linearGradient></defs><XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8B847A" }} axisLine={false} tickLine={false} /><YAxis hide />
        <Tooltip formatter={(v: number) => `R ${v.toLocaleString("en-ZA")}`} contentStyle={{ borderRadius: 12, border: "1px solid #E8E0D6" }} />
        <Bar dataKey="total" radius={[8, 8, 8, 8]}>{data.map((_, i) => <Cell key={i} fill={i === data.length - 1 ? "url(#zk-bar-now)" : "#D2D6F0"} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
