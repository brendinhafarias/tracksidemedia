"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings2 } from "lucide-react";
import { ajustarSaldoInicialPoupanca, type EstadoSaldoInicial } from "./acoes";

export function FormularioSaldoInicial({ saldoInicialAtual }: { saldoInicialAtual: number }) {
  const [aberto, setAberto] = useState(false);
  const [estado, formAction, pendente] = useActionState<EstadoSaldoInicial, FormData>(
    ajustarSaldoInicialPoupanca,
    null
  );

  const [estadoProcessado, setEstadoProcessado] = useState(estado);
  if (estado !== estadoProcessado) {
    setEstadoProcessado(estado);
    if (estado?.sucesso) setAberto(false);
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <span className="contents" onClick={() => setAberto(true)}>
        <Button size="sm" variant="outline">
          <Settings2 className="size-4" />
          Saldo inicial
        </Button>
      </span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Saldo inicial da poupança</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="valorTexto">Quanto já existia na poupança antes de usar o sistema (R$)</Label>
            <Input
              id="valorTexto"
              name="valorTexto"
              placeholder="0,00"
              defaultValue={(saldoInicialAtual / 100).toFixed(2).replace(".", ",")}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Esse valor só entra no saldo total da poupança — ele não aparece como entrada ou saída em nenhum mês, então não afeta o lucro nem os relatórios.
            </p>
          </div>

          {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
          <Button type="submit" className="w-full" disabled={pendente}>
            {pendente ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
