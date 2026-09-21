import { formatarBRL } from "@/lib/dinheiro";

export function BarrasHorizontais({
  dados,
}: {
  dados: { rotulo: string; total: number }[];
}) {
  if (dados.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nenhum dado no período selecionado.
      </p>
    );
  }

  const maximo = Math.max(...dados.map((d) => d.total), 1);

  return (
    <div className="space-y-2">
      {dados.map((d) => (
        <div key={d.rotulo} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">{d.rotulo}</span>
            <span className="font-medium whitespace-nowrap">{formatarBRL(d.total)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.max((d.total / maximo) * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
