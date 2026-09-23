"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { atualizarConfigEmpresa, type EstadoFormulario } from "./acoes";

type ConfigExistente = {
  nomeEmpresa: string;
  percentualReserva: number;
  percentualImposto: number;
  regimePadrao: "CAIXA" | "COMPETENCIA";
  diaFechamento: number;
};

export function FormularioEmpresa({ config }: { config: ConfigExistente }) {
  const [estado, formAction, pendente] = useActionState<EstadoFormulario, FormData>(
    async (estadoAnterior, formData) => {
      const resultado = await atualizarConfigEmpresa(estadoAnterior, formData);
      if (resultado?.sucesso) toast.success("Configurações salvas.");
      return resultado;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nomeEmpresa">Nome da empresa</Label>
        <Input id="nomeEmpresa" name="nomeEmpresa" defaultValue={config.nomeEmpresa} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="percentualReservaTexto">Reserva da empresa (%)</Label>
          <Input
            id="percentualReservaTexto"
            name="percentualReservaTexto"
            defaultValue={String(config.percentualReserva)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Parcela do lucro mensal que fica no caixa antes de dividir entre os sócios.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="diaFechamentoTexto">Dia de fechamento do mês</Label>
          <Input
            id="diaFechamentoTexto"
            name="diaFechamentoTexto"
            type="number"
            min={1}
            max={28}
            defaultValue={config.diaFechamento}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="percentualImpostoTexto">Alíquota de imposto (Simples Nacional) (%)</Label>
        <Input
          id="percentualImpostoTexto"
          name="percentualImpostoTexto"
          defaultValue={String(config.percentualImposto)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Percentual informado pelo seu contador. Usado para calcular o DAS previsto de cada mês em Despesas recorrentes.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="regimePadrao">Regime padrão ao abrir o sistema</Label>
        <Select
          items={{ CAIXA: "Caixa", COMPETENCIA: "Competência" }}
          name="regimePadrao"
          defaultValue={config.regimePadrao}
        >
          <SelectTrigger id="regimePadrao" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CAIXA">Caixa</SelectItem>
            <SelectItem value="COMPETENCIA">Competência</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      <Button type="submit" disabled={pendente}>
        {pendente ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
