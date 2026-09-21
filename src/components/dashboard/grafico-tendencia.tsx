"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatarBRL } from "@/lib/dinheiro";

export type PontoTendencia = {
  rotulo: string;
  entradas: number;
  saidas: number;
  lucro: number;
};

const RUS_SERIE: Record<string, string> = {
  entradas: "Entradas",
  saidas: "Saídas",
  lucro: "Lucro",
};

export function GraficoTendencia({ dados }: { dados: PontoTendencia[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="rotulo"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            width={44}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 100000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(valor, nome) => [formatarBRL(Number(valor)), RUS_SERIE[String(nome)] ?? String(nome)]}
            labelClassName="text-foreground"
            contentStyle={{
              borderRadius: 10,
              border: "1px solid var(--border)",
              backgroundColor: "var(--popover)",
              color: "var(--popover-foreground)",
              fontSize: 13,
            }}
          />
          <Legend
            formatter={(valor) => (
              <span className="text-xs text-muted-foreground">{RUS_SERIE[valor] ?? valor}</span>
            )}
            iconType="circle"
            iconSize={8}
          />
          <Bar dataKey="entradas" name="entradas" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="saidas" name="saidas" fill="var(--chart-3)" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Line
            dataKey="lucro"
            name="lucro"
            stroke="var(--chart-1)"
            strokeWidth={2}
            strokeLinecap="round"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
