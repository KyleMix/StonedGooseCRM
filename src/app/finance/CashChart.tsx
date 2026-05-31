"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface CashDatum {
  name: string;
  value: number;
  color: string;
}

export function CashChart({ data }: { data: CashDatum[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#2e2e2e" />
          <YAxis
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            stroke="#2e2e2e"
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "#1A1A1A",
              border: "1px solid #2e2e2e",
              borderRadius: 8,
              color: "#ededed",
            }}
            formatter={(v: number) => [
              v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
              "Amount",
            ]}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
