import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatarBRL } from "@/lib/dinheiro";
import { cn } from "@/lib/utils";

const TONS = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  primary: "bg-primary/10 text-primary",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
} as const;

export function CartaoMetrica({
  titulo,
  valor,
  variacao,
  corValor,
  invertervariacao = false,
  icone: Icone,
  tom = "primary",
}: {
  titulo: string;
  valor: number;
  variacao?: number | null;
  corValor?: string;
  /** Para métricas onde subir é ruim (ex.: em atraso), inverte as cores da variação. */
  invertervariacao?: boolean;
  icone?: LucideIcon;
  tom?: keyof typeof TONS;
}) {
  const subiu = (variacao ?? 0) > 0;
  const desceu = (variacao ?? 0) < 0;
  const corBoa = invertervariacao ? desceu : subiu;
  const corRuim = invertervariacao ? subiu : desceu;

  return (
    <Card>
      <CardContent className="py-3 px-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{titulo}</p>
          {Icone && (
            <span className={cn("flex size-6 items-center justify-center rounded-lg", TONS[tom])}>
              <Icone className="size-3.5" />
            </span>
          )}
        </div>
        <p className={cn("text-lg font-semibold whitespace-nowrap", corValor)}>
          {formatarBRL(valor)}
        </p>
        {variacao != null && (
          <p
            className={cn(
              "flex items-center gap-0.5 text-xs",
              corBoa && "text-emerald-600 dark:text-emerald-400",
              corRuim && "text-red-600 dark:text-red-400",
              !corBoa && !corRuim && "text-muted-foreground"
            )}
          >
            {subiu && <ArrowUp className="size-3" />}
            {desceu && <ArrowDown className="size-3" />}
            {!subiu && !desceu && <Minus className="size-3" />}
            {Math.abs(variacao).toFixed(0)}% vs. mês anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}
