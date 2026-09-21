"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type PontoPontualidade = {
  rotulo: string;
  diasAtraso: number;
};

export function GraficoPontualidade({ dados }: { dados: PontoPontualidade[] }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={30} />
          <Tooltip
            formatter={(valor) =>
              Number(valor) > 0 ? [`${valor} dia(s) de atraso`, ""] : ["Em dia", ""]
            }
          />
          <Bar
            dataKey="diasAtraso"
            radius={[3, 3, 0, 0]}
            fill="#16a34a"
            shape={(props: unknown) => {
              const p = props as { x: number; y: number; width: number; height: number; payload: PontoPontualidade };
              const cor = p.payload.diasAtraso > 0 ? "#dc2626" : "#16a34a";
              return <rect x={p.x} y={p.y} width={p.width} height={Math.max(p.height, 2)} fill={cor} rx={3} />;
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
