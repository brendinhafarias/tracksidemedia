"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatarBRL } from "@/lib/dinheiro";

export type FatiaRosca = { nome: string; total: number; cor: string };

export function GraficoRosca({ dados }: { dados: FatiaRosca[] }) {
  if (dados.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nenhuma despesa no período selecionado.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dados}
            dataKey="total"
            nameKey="nome"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
          >
            {dados.map((d) => (
              <Cell key={d.nome} fill={d.cor} />
            ))}
          </Pie>
          <Tooltip formatter={(valor) => formatarBRL(Number(valor))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
