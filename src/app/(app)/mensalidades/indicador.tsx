import { cn } from "@/lib/utils";
import type { StatusExibicaoCobranca } from "@/lib/cobrancas";

const CONFIGURACAO: Record<
  StatusExibicaoCobranca,
  { simbolo: string; rotulo: string; classe: string }
> = {
  PAGA: {
    simbolo: "✓",
    rotulo: "Paga",
    classe: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400",
  },
  PARCIAL: {
    simbolo: "◐",
    rotulo: "Parcial",
    classe: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400",
  },
  ATRASADA: {
    simbolo: "!",
    rotulo: "Atrasada",
    classe: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400",
  },
  ABERTA: {
    simbolo: "○",
    rotulo: "Em aberto",
    classe: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400",
  },
  CANCELADA: {
    simbolo: "—",
    rotulo: "Cancelada",
    classe: "bg-transparent text-muted-foreground border-transparent",
  },
  SEM_COBRANCA: {
    simbolo: "—",
    rotulo: "Sem cobrança",
    classe: "bg-transparent text-muted-foreground border-transparent",
  },
};

export function IndicadorStatusCobranca({
  status,
  className,
  tamanho = "default",
}: {
  status: StatusExibicaoCobranca;
  className?: string;
  tamanho?: "default" | "sm";
}) {
  const config = CONFIGURACAO[status];
  return (
    <span
      role="img"
      aria-label={config.rotulo}
      title={config.rotulo}
      className={cn(
        "inline-flex items-center justify-center rounded-md border font-semibold",
        tamanho === "sm" ? "size-7 text-sm" : "size-9 text-base",
        config.classe,
        className
      )}
    >
      {config.simbolo}
    </span>
  );
}

export function legendaStatus() {
  return (Object.keys(CONFIGURACAO) as StatusExibicaoCobranca[])
    .filter((s) => s !== "CANCELADA")
    .map((status) => ({ status, ...CONFIGURACAO[status] }));
}
